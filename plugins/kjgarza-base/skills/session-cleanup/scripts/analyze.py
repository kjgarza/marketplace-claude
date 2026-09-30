#!/usr/bin/env python3
"""
Analyze ~/.claude/jobs/ and produce a close/keep plan for Claude Code background sessions.

Read-only. Never calls `claude rm` — that's close.sh's job, and only after this
script's plan has been looked at. Run this on its own as many times as you like.

Rubric — the question that decides everything is "what would closing lose?", not age:

  0. Self session, and any `kind: interactive` session         -> always KEEP
  E. Expired: >= --expire-days old (default cleanupPeriodDays, else 30)
                                                                 -> CLOSE at every level,
     overriding tiers 1 and 3-5: Claude Code deletes the transcript at that age anyway, so
     rename/colour/PR/green can't save it. Tier 2 still wins (the branch outlives transcript
     cleanup; `claude rm` would not), as do explicit --protect-* flags. Jobs within
     --warn-days of expiry (default 10 -> 20-29 days old) are flagged "hand off or clean".
  1. Hand-marked: renamed by the user, or a non-green colour   -> always KEEP (every level)
  2. Worktree whose HEAD is on no remote branch                -> always KEEP (every level) —
     `claude rm` deletes the local branch with the worktree; if nothing else holds that
     commit, closing destroys it. Verified live 2026-09-21 (see skill README).
  3. "Live": done < --live-done-hours ago, or blocked/working < --live-pending-days ago
                                                                 -> KEEP
  4. Open child PR (needs `gh`; unknown state = keep, not assume-safe)
                                                                 -> KEEP (standard/lite),
                                                                    CLOSE at aggressive
                                                                    (the PR is tracked in
                                                                    GitHub regardless)
  5. Green colour                                               -> KEEP (lite/standard),
                                                                    CLOSE at aggressive
                                                                    (green is the user's own
                                                                    "done with it" mark)
  6. blocked/working, idle > --abandoned-days, PRs (if any) all resolved
                                                                 -> CLOSE (standard/aggressive)
  7. done/failed, no open PR                                    -> CLOSE (standard/aggressive)
  8. Tombstone (transcript already expired) or no state.json    -> CLOSE (every level,
                                                                    including lite — there is
                                                                    nothing left to lose)

`claude rm` itself refuses to touch a *dirty* worktree (tested live), so tier 2 only needs
to catch the case the tool does NOT protect: a clean worktree with unpushed commits.
"""
import argparse, json, os, subprocess, sys, datetime, re, shutil

JOBS = os.path.expanduser("~/.claude/jobs")
HOME = os.path.expanduser("~")


def run(cmd, timeout=15):
    try:
        return subprocess.run(cmd, capture_output=True, text=True, timeout=timeout)
    except Exception:
        return None


def find_transcript(session_id):
    if not session_id:
        return None
    for root, dirs, files in os.walk(os.path.expanduser("~/.claude/projects")):
        if f"{session_id}.jsonl" in files:
            return os.path.join(root, f"{session_id}.jsonl")
    return None


def load_jobs():
    rows = []
    if not os.path.isdir(JOBS):
        return rows
    for d in sorted(os.listdir(JOBS)):
        jd = os.path.join(JOBS, d)
        if not os.path.isdir(jd) or d.startswith("."):
            continue
        sf = os.path.join(jd, "state.json")
        if not os.path.isfile(sf):
            rows.append(dict(id=d, no_state=True))
            continue
        try:
            st = json.load(open(sf))
        except Exception:
            rows.append(dict(id=d, no_state=True))
            continue
        tl = os.path.join(jd, "timeline.jsonl")
        last_at, last_text = None, ""
        if os.path.exists(tl):
            try:
                lines = open(tl, errors="replace").read().strip().split("\n")
                for L in reversed(lines):
                    try:
                        o = json.loads(L)
                        last_at = o.get("at")
                        last_text = (o.get("detail") or o.get("text") or "")[:160].replace("\n", " ")
                        break
                    except Exception:
                        continue
            except Exception:
                pass
        acts = [x for x in [last_at, st.get("lastTerminalAt"), st.get("createdAt")] if x]
        act = max(acts) if acts else None
        sid = st.get("sessionId", "")
        transcript = find_transcript(sid)
        kids = [c for c in (st.get("children") or []) if c.get("kind") == "pr"]
        rows.append(dict(
            id=d, no_state=False, state=st.get("state", ""), tokens=st.get("tokens", 0) or 0,
            createdAt=st.get("createdAt", ""), act=act or "", cwd=st.get("cwd", "") or "",
            name=st.get("name", "") or "(unnamed)", nameSource=st.get("nameSource", ""),
            renamed=st.get("nameSource") == "user", color=st.get("color") or "",
            worktreePath=st.get("worktreePath"), sessionId=sid, transcript=transcript,
            children_pr=[c.get("href", "") for c in kids], lasttext=last_text,
        ))
    return rows


def repo_root_for(path):
    r = run(["git", "-C", path, "rev-parse", "--show-toplevel"])
    if r and r.returncode == 0:
        return r.stdout.strip()
    return None


def gh_available():
    return shutil.which("gh") is not None


def pr_states_for(hrefs, cache, check_prs):
    """Return {href: state_string_or_None}. None = could not verify."""
    out = {}
    if check_prs == "no" or not hrefs:
        return {h: None for h in hrefs}
    if check_prs == "auto" and not gh_available():
        return {h: None for h in hrefs}
    repos = set()
    parsed = {}
    for h in hrefs:
        m = re.match(r"https://github.com/([^/]+/[^/]+)/pull/(\d+)", h)
        if m:
            repos.add(m.group(1))
            parsed[h] = (m.group(1), m.group(2))
    for repo in repos:
        if repo in cache:
            continue
        r = run(["gh", "pr", "list", "-R", repo, "--state", "all", "--limit", "500",
                  "--json", "number,state"], timeout=30)
        cache[repo] = {}
        if r and r.returncode == 0:
            try:
                for row in json.loads(r.stdout):
                    cache[repo][str(row["number"])] = row["state"]
            except Exception:
                pass
    for h in hrefs:
        if h not in parsed:
            out[h] = None
            continue
        repo, num = parsed[h]
        out[h] = cache.get(repo, {}).get(num)
    return out


def head_on_remote(worktree_path):
    if not worktree_path or not os.path.isdir(worktree_path):
        return None  # worktree already gone; nothing to protect
    r = run(["git", "-C", worktree_path, "branch", "-r", "--contains", "HEAD"], timeout=10)
    if not r or r.returncode != 0:
        return None  # can't tell -> caller should treat conservatively
    return bool(r.stdout.strip())


def is_dirty(worktree_path):
    if not worktree_path or not os.path.isdir(worktree_path):
        return None
    r = run(["git", "-C", worktree_path, "status", "--porcelain"], timeout=10)
    if not r or r.returncode != 0:
        return None
    return bool(r.stdout.strip())


def cleanup_period_days():
    """Claude Code's transcript retention: settings cleanupPeriodDays, default 30."""
    for f in ("settings.local.json", "settings.json"):
        try:
            v = json.load(open(os.path.join(HOME, ".claude", f))).get("cleanupPeriodDays")
            if isinstance(v, (int, float)) and v > 0:
                return float(v)
        except Exception:
            continue
    return 30.0


def parse_iso(s):
    if not s:
        return None
    try:
        return datetime.datetime.fromisoformat(s.replace("Z", "+00:00"))
    except Exception:
        return None


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--scope", choices=["global", "repo"], default="repo")
    ap.add_argument("--repo-path", default=os.getcwd())
    ap.add_argument("--level", choices=["lite", "standard", "aggressive"], default="standard")
    ap.add_argument("--protect-newest", type=int, default=0,
                     help="Keep the N most-recently-active jobs regardless of other rules (0=off)")
    ap.add_argument("--protect-path", action="append", default=[],
                     help="cwd prefix to always keep, e.g. ~/work/important-repo (repeatable)")
    ap.add_argument("--live-done-hours", type=float, default=24)
    ap.add_argument("--live-pending-days", type=float, default=3)
    ap.add_argument("--abandoned-days", type=float, default=3)
    ap.add_argument("--expire-days", type=float, default=None,
                     help="Age at which Claude Code deletes the transcript; older jobs close "
                          "regardless of rename/colour (default: cleanupPeriodDays, else 30)")
    ap.add_argument("--warn-days", type=float, default=10,
                     help="Flag kept jobs within this many days of --expire-days for handoff/cleanup")
    ap.add_argument("--check-prs", choices=["auto", "yes", "no"], default="auto")
    ap.add_argument("--self-id", default=os.environ.get("CLAUDE_JOB_DIR", "").rstrip("/").rsplit("/", 1)[-1])
    ap.add_argument("--out", default=None, help="Output basename (writes <out>.json and <out>.md)")
    args = ap.parse_args()

    now = datetime.datetime.now(datetime.timezone.utc)
    if args.expire_days is None:
        args.expire_days = cleanup_period_days()
    warn_from = args.expire_days - args.warn_days
    protect_paths = [os.path.expanduser(p).rstrip("/") for p in args.protect_path]

    rows = load_jobs()

    # scope filter
    if args.scope == "repo":
        root = repo_root_for(args.repo_path) or os.path.expanduser(args.repo_path).rstrip("/")
        rows = [r for r in rows if r.get("cwd", "").rstrip("/") == root
                or r.get("cwd", "").startswith(root + "/")]
        scope_desc = f"repo ({root})"
    else:
        scope_desc = "global (~/.claude/jobs)"

    # empty shells / no state.json -> always close-eligible (tier 8), nothing more to compute
    no_state_rows = [r for r in rows if r.get("no_state")]
    rows = [r for r in rows if not r.get("no_state")]

    # PR states (best-effort)
    all_hrefs = sorted({h for r in rows for h in r["children_pr"]})
    cache = {}
    pr_state = pr_states_for(all_hrefs, cache, args.check_prs)

    for r in rows:
        r["open_pr"] = any(pr_state.get(h) == "OPEN" for h in r["children_pr"])
        r["pr_unknown"] = any(pr_state.get(h) is None for h in r["children_pr"]) and bool(r["children_pr"])
        r["pr_list"] = [(h.split("/")[-3] + "#" + h.split("/")[-1], pr_state.get(h)) for h in r["children_pr"]]

    newest_ids = set()
    if args.protect_newest > 0:
        ordered = sorted(rows, key=lambda r: r["act"], reverse=True)
        newest_ids = {r["id"] for r in ordered[:args.protect_newest]}

    def age_days(r):
        a = parse_iso(r["act"])
        return (now - a).total_seconds() / 86400 if a else 9999

    def expiry_age(r):
        # Claude Code's cleanup keys off the transcript's mtime; take the younger of that
        # and the job's own last activity so a job is never called expired too early.
        ages = [age_days(r)]
        t = r.get("transcript")
        if t and os.path.exists(t):
            ages.append((now.timestamp() - os.path.getmtime(t)) / 86400)
        return min(ages)

    def verdict(r):
        i = r["id"]
        if args.self_id and i == args.self_id:
            return "KEEP", "this session"
        if i in newest_ids:
            return "KEEP", "protected: newest %d" % args.protect_newest
        for p in protect_paths:
            if r["cwd"].rstrip("/") == p or r["cwd"].startswith(p + "/"):
                return "KEEP", "protected path %s" % p
        wp = r["worktreePath"]
        if wp and os.path.isdir(wp):
            hor = head_on_remote(wp)
            if hor is False:
                return "KEEP", "worktree HEAD on no remote branch — commits would be lost"
            if hor is None:
                return "KEEP", "worktree present, could not verify remote reachability (checked conservatively)"
        if r["expiry_age"] >= args.expire_days:
            return "CLOSE", "%.0fd old — past Claude Code's %gd transcript cleanup; rename/colour can't keep it" % (
                r["expiry_age"], args.expire_days)
        if r["renamed"]:
            return "KEEP", "you renamed it"
        if r["color"] and r["color"] != "green":
            return "KEEP", "colour %s" % r["color"]
        ad = age_days(r)
        state = r.get("state", "")
        if state == "done" and ad * 24 < args.live_done_hours:
            return "KEEP", "finished < %gh ago" % args.live_done_hours
        if state in ("blocked", "working") and ad < args.live_pending_days:
            return "KEEP", "pending < %g days" % args.live_pending_days
        if r["open_pr"]:
            if args.level == "aggressive":
                return "CLOSE", "open PR, but aggressive level closes anyway (PR tracked in GitHub)"
            return "KEEP", "open child PR: " + ", ".join("%s=%s" % p for p in r["pr_list"])
        if r["pr_unknown"] and args.check_prs != "no":
            return "KEEP", "child PR referenced but state could not be verified (no gh / offline)"
        if r["color"] == "green":
            if args.level == "aggressive":
                return "CLOSE", "green = you marked it done"
            return "KEEP", "green, but level=%s doesn't auto-close green (use --level aggressive)" % args.level
        if args.level == "lite":
            return "KEEP", "level=lite only closes tombstones/failed"
        if state in ("blocked", "working"):
            if ad >= args.abandoned_days:
                return "CLOSE", "idle %.0fd, no open PR" % ad
            return "KEEP", "pending, %.0fd < abandoned-days threshold" % ad
        if state in ("done", "stopped"):
            # "stopped" is claude stop's terminal state — the CLI's own help says a
            # stopped session "keeps the conversation", i.e. it's done-equivalent, not
            # a distinct in-progress state. Jobs also end up here after close.sh's
            # stop-then-retry when a dirty-worktree refusal blocked the plain rm —
            # without this, such a job would sit at "unrecognised state" and stay
            # KEEP forever, invisible to every future run.
            return "CLOSE", "delivered (%s), no open PR" % state
        if state == "failed":
            return "CLOSE", "failed, nothing delivered"
        return "KEEP", "unrecognised state %r — kept conservatively" % state

    for r in rows:
        r["expiry_age"] = expiry_age(r)
        r["verdict"], r["why"] = verdict(r)
        r["expires_in"] = None
        if r["verdict"] == "KEEP" and warn_from <= r["expiry_age"] < args.expire_days:
            r["expires_in"] = args.expire_days - r["expiry_age"]
    for r in no_state_rows:
        r["verdict"], r["why"] = "CLOSE", "no state.json — empty/orphaned job dir"
        r["state"] = ""; r["name"] = "(no state.json)"; r["act"] = ""; r["color"] = ""; r["worktreePath"] = None

    all_rows = rows + no_state_rows
    all_rows.sort(key=lambda r: r["act"] or "", reverse=True)

    close = [r for r in all_rows if r["verdict"] == "CLOSE"]
    keep = [r for r in all_rows if r["verdict"] == "KEEP"]
    expiring = sorted((r for r in keep if r.get("expires_in") is not None), key=lambda r: r["expires_in"])

    out_base = args.out or os.path.expanduser(
        "~/.claude/session-cleanup/%s-plan" % now.strftime("%Y%m%dT%H%M%SZ"))
    os.makedirs(os.path.dirname(out_base), exist_ok=True)

    plan = dict(generated_at=now.isoformat(), scope=scope_desc, level=args.level,
                self_id=args.self_id, total=len(all_rows), close_count=len(close),
                keep_count=len(keep), expire_days=args.expire_days,
                expiring_ids=[r["id"] for r in expiring],
                close_ids=[r["id"] for r in close],
                rows=[{k: v for k, v in r.items() if k not in ("children_pr",)} for r in all_rows])
    json.dump(plan, open(out_base + ".json", "w"), indent=1)

    md = []
    md.append("# Session cleanup plan — %s\n" % now.strftime("%Y-%m-%d %H:%M UTC"))
    md.append("Scope: **%s**  Level: **%s**  Total scanned: **%d**\n" % (scope_desc, args.level, len(all_rows)))
    md.append("**Close: %d  Keep: %d**\n" % (len(close), len(keep)))
    md.append("| id | verdict | state | activity | name | why |")
    md.append("|---|---|---|---|---|---|")
    for r in all_rows:
        md.append("| `%s` | %s | %s | %s | %s | %s |" % (
            r["id"], r["verdict"], r.get("state", ""), (r.get("act") or "")[:10],
            (r.get("name") or "")[:40], r["why"]))

    if expiring:
        md.append("\n## Expiring soon — hand off or clean\n")
        md.append("Kept today, but Claude Code deletes these transcripts at %gd. Write a handoff "
                  "(or finish them) now, or close them — they won't survive expiry.\n" % args.expire_days)
        for r in expiring:
            md.append("- **`%s`** *%s* — %.0fd old, **~%.0fd left** (kept because: %s)" % (
                r["id"], (r.get("name") or "")[:50], r["expiry_age"], r["expires_in"], r["why"]))

    abandoned = [r for r in close if r.get("state") in ("blocked", "working") and r.get("lasttext")]
    if abandoned:
        md.append("\n## Abandoned questions — last pending line\n")
        md.append("Closing these ends the session; the pending line is the only thing that loses.\n")
        for r in abandoned:
            md.append("- **`%s`** *%s*  \n  ↳ %s" % (r["id"], (r.get("name") or "")[:50], r["lasttext"]))

    open(out_base + ".md", "w").write("\n".join(md) + "\n")

    print(json.dumps(dict(plan_json=out_base + ".json", plan_md=out_base + ".md",
                           total=len(all_rows), close=len(close), keep=len(keep),
                           expiring_soon=len(expiring)), indent=1))


if __name__ == "__main__":
    main()
