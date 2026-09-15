#!/usr/bin/env python3
"""Pull unread Miniflux entries, extract job links as JSONL, then mark entries read.

Stdlib only, so it runs under launchd with nothing but MINIFLUX_URL + MINIFLUX_TOKEN.
Delivery is at-least-once: JSONL is written and fsynced before entries are marked read,
so a crash in between re-emits those entries on the next run (dedup downstream on job_key).

  pull.py --out jobs.jsonl            # normal run
  pull.py --no-mark                   # peek without advancing the cursor
  pull.py --fixture thread.jsonl      # offline: extract from {id,date,subject,htmlBody} lines
"""
import argparse, json, os, sys, urllib.request
from extract import extract_jobs

def api(method, path, body=None):
    req = urllib.request.Request(
        os.environ.get("MINIFLUX_URL", "http://localhost:8080").rstrip("/") + path,
        method=method,
        data=json.dumps(body).encode() if body is not None else None,
        headers={"X-Auth-Token": os.environ["MINIFLUX_TOKEN"], "Content-Type": "application/json"},
    )
    with urllib.request.urlopen(req, timeout=30) as r:
        raw = r.read()
        return json.loads(raw) if raw else None

def unread_entries():
    offset, page = 0, 100  # Miniflux caps a page at whatever limit we ask; 100 keeps responses small.
    while True:
        res = api("GET", f"/v1/entries?status=unread&direction=asc&order=id&limit={page}&offset={offset}")
        yield from res["entries"]
        offset += page
        if offset >= res["total"]:
            return

def fixture_entries(path):
    with open(path) as f:
        for line in f:
            m = json.loads(line)
            yield {"id": m["id"], "title": m.get("subject", ""), "published_at": m.get("date"),
                   "content": m["htmlBody"], "feed": {"title": "fixture"}}

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", help="append JSONL here (default stdout)")
    ap.add_argument("--no-mark", action="store_true")
    ap.add_argument("--fixture")
    a = ap.parse_args()

    entries = list(fixture_entries(a.fixture) if a.fixture else unread_entries())
    out = open(a.out, "a") if a.out else sys.stdout
    for e in entries:
        for job in extract_jobs(e["content"]):
            out.write(json.dumps({"entry_id": e["id"], "feed": e["feed"]["title"], "subject": e["title"],
                                  "published_at": e["published_at"], **job}) + "\n")
    out.flush()
    if a.out:
        os.fsync(out.fileno())
    print(f"entries={len(entries)}", file=sys.stderr)

    if os.environ.get("PULL_CRASH_BEFORE_MARK"):  # spike hook for the Q4 kill test
        sys.exit("simulated crash before mark-read")
    if entries and not (a.no_mark or a.fixture):
        api("PUT", "/v1/entries", {"entry_ids": [e["id"] for e in entries], "status": "read"})
        print(f"marked_read={len(entries)}", file=sys.stderr)

if __name__ == "__main__":
    main()
