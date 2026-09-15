#!/usr/bin/env python3
"""Serverless variant: read a KTN Atom feed directly, emit only jobs not seen before, remember state.

No Miniflux, no daemon. Stdlib only; run daily from launchd.
State is one JSON file: seen entry ids (skip re-parsing) and seen job keys (cross-email dedup).
Order is output-then-state, so a crash between the two re-emits jobs on the next run (at-least-once).

  ktn_pull.py --feed https://kill-the-newsletter.com/feeds/<id>.xml --state state.json --out jobs.jsonl
  ktn_pull.py --feed ./feed.xml ...   # local file for offline checks
"""
import argparse, json, os, sys, tempfile, urllib.request
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from extract import extract_jobs

A = "{http://www.w3.org/2005/Atom}"
KTN_FEED_CAP = 2 ** 19  # KTN prunes a feed to 512 KiB of title+content (application.mts)

def read_feed(src):
    if src.startswith("http"):
        with urllib.request.urlopen(src, timeout=30) as r:
            return r.read()
    with open(src, "rb") as f:
        return f.read()

def load_state(path):
    try:
        with open(path) as f:
            return json.load(f)
    except FileNotFoundError:
        return {"entries": {}, "jobs": {}, "last_run": None}

def save_state(path, state):
    fd, tmp = tempfile.mkstemp(dir=os.path.dirname(os.path.abspath(path)))
    with os.fdopen(fd, "w") as f:
        json.dump(state, f)
        f.flush()
        os.fsync(f.fileno())
    os.replace(tmp, path)  # atomic: state is either old or new, never half-written

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--feed", action="append", required=True, help="KTN feed URL or file; repeatable")
    ap.add_argument("--state", required=True)
    ap.add_argument("--out", required=True)
    a = ap.parse_args()

    state = load_state(a.state)
    now = datetime.now(timezone.utc).isoformat()
    new_jobs, new_entries, feed_bytes = [], 0, 0
    for src in a.feed:
        entries = ET.fromstring(read_feed(src)).findall(f"{A}entry")
        overlap = any(e.findtext(f"{A}id") in state["entries"] for e in entries)
        for e in entries:
            eid = e.findtext(f"{A}id")
            title, content = e.findtext(f"{A}title") or "", e.findtext(f"{A}content") or ""
            feed_bytes += len(title) + len(content)
            if eid in state["entries"]:
                continue
            new_entries += 1
            state["entries"][eid] = now
            for job in extract_jobs(content):
                if job["job_key"] in state["jobs"]:
                    continue
                state["jobs"][job["job_key"]] = now
                new_jobs.append({"entry_id": eid, "feed": src.rsplit("/", 1)[-1], "subject": title,
                                 "published_at": e.findtext(f"{A}updated"), **job})
        # No overlap with last run and a feed near the cap means older mail may already be pruned.
        # 0.8: one ~70 KB alert of headroom below 512 KiB.
        if entries and not overlap and state["last_run"] and feed_bytes > 0.8 * KTN_FEED_CAP:
            print(f"warning: {src} near KTN cap with no overlap since last run; entries may be lost", file=sys.stderr)

    with open(a.out, "a") as out:
        for j in new_jobs:
            out.write(json.dumps(j) + "\n")
        out.flush()
        os.fsync(out.fileno())
    print(f"entries_new={new_entries} jobs_new={len(new_jobs)} jobs_known={len(state['jobs'])}", file=sys.stderr)

    if os.environ.get("PULL_CRASH_BEFORE_STATE"):  # spike hook for the Q4 kill test
        sys.exit("simulated crash before state save")
    state["last_run"] = now
    save_state(a.state, state)

if __name__ == "__main__":
    main()
