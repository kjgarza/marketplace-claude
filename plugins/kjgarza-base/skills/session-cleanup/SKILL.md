---
name: session-cleanup
description: This skill should be used when the user wants to analyze and close stale Claude Code background sessions (the entries in `claude agents` / the agents view) so the view stops accumulating cruft. Builds a close/keep plan against a rubric based on what closing would actually lose (sessions past Claude Code's 30-day transcript cleanup close regardless of rename/colour; 20–29-day-old ones are flagged for handoff), then executes it with `claude rm` behind a dry-run-by-default, canary-first safety process. Triggers when the agents view is cluttered, wants to "clean up sessions", "close old background jobs", "free up disk in ~/.claude/jobs", or asks which sessions are safe to close. Supports scoping to one repo or globally, and a lite/standard/aggressive cleaning level.
allowed-tools: ["Bash", "Read"]
argument-hint: "[--scope global|repo] [--level lite|standard|aggressive] [--go]"
---

# Session cleanup

Cleans up `~/.claude/jobs/` — the background-session directory that backs both the agents
view and `claude agents --json --all`. This is disk and clutter housekeeping, not code
work: no repo needs to be dirty, no branch needs to exist, for this skill to be useful.

Two scripts do the work; this file is the process around them.

- `scripts/analyze.py` — read-only. Scans every job, applies the rubric, writes a plan
  (`<out>.json` + `<out>.md`). Safe to run as many times as you like.
- `scripts/close.sh` — reads a plan and calls `claude rm <id>` on the close list. Dry-run
  unless you pass `--go`. Never invents its own close list — it only ever acts on what
  `analyze.py` decided.

**Invoke both scripts by absolute path, from the user's current working directory —
never `cd` into the skill's own directory first.** The default scope is `repo`, which
resolves against `os.getcwd()` / `$(pwd)`; `cd`-ing into the skill folder to make the
relative script path shorter would silently make that skill folder the scope instead of
the user's actual project. The base directory given to you above is where the scripts
*live*, not where you should stand to run them:

```bash
python3 ${CLAUDE_PLUGIN_ROOT}/skills/session-cleanup/scripts/analyze.py --scope repo --level standard
```

## The rubric: what would closing lose?

Mostly not age — age only predicts the answer — with one exception: Claude Code deletes
transcripts older than `cleanupPeriodDays` (default 30), so past that age the session is
lost whether or not you close it. In order, first match wins:

1. **This session**, and any `interactive` session — never touched (interactive sessions
   don't even have a `~/.claude/jobs/<id>` entry, so this is automatic). `--protect-newest`
   / `--protect-path` also match here.
2. **A worktree whose HEAD is on no remote branch.** `claude rm` deletes the worktree's
   *local branch* along with the worktree — verified live: a clean, unpushed branch loses
   its only copy of its commits. `claude rm` itself refuses a **dirty** worktree (tested
   live, message below), so this check only needs to catch the case the tool doesn't
   already protect: clean but unpushed. Held back at every level, always — the branch
   outlives transcript cleanup, so this ranks above expiry.
3. **Expired** — idle ≥ `--expire-days` (default `cleanupPeriodDays`, else 30), measured
   from the younger of last activity and transcript mtime (for a resumed job, the
   `resumeSessionId` transcript — a stale-looking card can front a live conversation). Closed at **every** level,
   *regardless of rename or colour*: the transcript is deleted by Claude Code anyway.
   Kept jobs within `--warn-days` (default 10, i.e. 20–29 days old) are listed under
   **"Expiring soon — hand off or clean"** in the report: tell the user to write a
   handoff (or finish the work) now, or close them.
4. **You marked it** — renamed it, or gave it a colour other than green. This is the one
   signal in `state.json` that records *your* judgement rather than the daemon's, so it
   outranks every remaining tier, at every level.
5. **Live** — finished within `--live-done-hours` (default 24), or pending within
   `--live-pending-days` (default 3). You're probably still reading it.
6. **Open child PR** — kept at `lite`/`standard`; closed at `aggressive` (the PR is
   tracked in GitHub regardless of whether the job card exists). If PR state can't be
   verified (`gh` missing, offline, rate-limited), the job is kept, not assumed safe.
7. **Green** — kept at `lite`/`standard`; closed at `aggressive`. Green is not the
   default colour, it's something you apply, so treat it as "I'm done with this" — but
   only once you've asked for that level of aggressiveness.
8. **Abandoned question** — `blocked`/`working`, idle past `--abandoned-days` (default
   3), with any referenced PRs resolved (not `OPEN`). Closed at `standard`/`aggressive`.
   The plan's markdown report reproduces the job's last pending line, since that's the
   one thing closing destroys.
9. **Discharged** — `done`/`failed`, no open PR. Closed at `standard`/`aggressive`.
10. **Tombstone / empty shell** — transcript already deleted by Claude Code, or
   no `state.json` at all. Closed at **every** level, including `lite` — there is
   nothing left to lose.

`lite` only ever reaches tiers 3 and 10. `standard` (the default) reaches tier 9. `aggressive`
also takes tiers 6 and 7. Tiers 1–4 are never overridden by level (tier 3 closes at every level).

## Process

**1. Analyze first, always.** Even for a trivial cleanup, run `analyze.py` and look at
the `.md` report before running `close.sh --go`. This isn't optional caution — it's
also how you catch a rubric that doesn't fit the situation (see "Tuning" below) before
anything is deleted.

```bash
python3 ${CLAUDE_PLUGIN_ROOT}/skills/session-cleanup/scripts/analyze.py --scope repo --level standard
# or, cleaning everything regardless of where you're standing:
python3 ${CLAUDE_PLUGIN_ROOT}/skills/session-cleanup/scripts/analyze.py --scope global --level standard
```

Scope `repo` (the default) walks up from the current directory to its git root and keeps
only jobs whose `cwd` is under it; if the current directory isn't a git repo, it falls
back to an exact match on the directory itself — this skill has no requirement that you
be inside a repo to use it.

Read the printed `plan_md` path. It has the rubric table, the full job list with verdicts
and reasons, and — for abandoned-question closes — the reproduced pending line.

**2. Ask about anything the report doesn't resolve cleanly**, rather than guessing:
- A close candidate you recognise as something you still care about, even though nothing
  in the rubric caught it (a fourth-tier reason not yet encoded — e.g. "the newest N
  sessions in this repo" or "everything under this other directory" — use
  `--protect-newest` / `--protect-path` for exactly this, rather than hand-editing the
  plan).
- Two rules disagreeing (e.g. a job is both green *and* protected by `--protect-newest`)
  — the plan applies first-match-wins in the rubric order above; say so if that's not
  what's wanted here, and re-run with tighter flags rather than editing the JSON by hand.

**3. Execute with the canary pattern on a new scope.** The first time this skill runs
against a given repo (or globally), use `--canary`: it closes up to 3 representative jobs
first (preferring ones that still have a transcript), verifies each transcript survived, then
continues automatically. A canary whose transcript had already expired is reported and
skipped, not counted as a failure. Skip `--canary` on repeat runs against a scope you've
already validated.

```bash
bash ${CLAUDE_PLUGIN_ROOT}/skills/session-cleanup/scripts/close.sh --plan <plan.json> --canary --go
```

If `close.sh` reports a worktree refusal, that's the tool protecting a dirty tree — not a
bug. Read `README.md`'s stash note before clearing it by hand.

**4. Report back** what closed, what's held and why (worktree refusals, PR-state
unknowns, unpushed-commit holds), every job in the report's **Expiring soon** section
with its days left and a prompt to hand off or close it, and the before/after count from
`claude agents --json --all`.

## Tuning

| Flag | Default | What it changes |
|---|---|---|
| `--scope` | `repo` | `repo` (git root, or exact cwd if not a repo) or `global` (all of `~/.claude/jobs`) |
| `--level` | `standard` | `lite` / `standard` / `aggressive` — see rubric above |
| `--protect-newest N` | `0` (off) | Always keep the N most-recently-active jobs *in scope* — under `--scope global` this is N overall, not N per repo. To reproduce a per-repo "keep the newest 10 in this one repo" rule, run with `--scope repo --repo-path <that repo>` and `--protect-newest 10` as its own invocation, rather than expecting global scope to group by repo |
| `--protect-path PATH` | none, repeatable | Always keep jobs whose `cwd` is under this path |
| `--live-done-hours` | `24` | How long a finished job stays protected as "still fresh" |
| `--live-pending-days` | `3` | How long a blocked/working job stays protected before counting as "abandoned" |
| `--expire-days` | `cleanupPeriodDays`, else `30` | Age at which a job closes regardless of rename/colour (tier 3) — match it to Claude Code's transcript retention |
| `--warn-days` | `10` | Kept jobs within this many days of expiry get the "hand off or clean" warning |
| `--abandoned-days` | `3` | Same threshold, named for tier 8 specifically |
| `--check-prs` | `auto` | `auto` uses `gh` if present; `no` skips PR checks entirely (any job with a PR reference is then kept, not assumed closeable) |
| `--self-id` | `$CLAUDE_JOB_DIR`'s basename | Override if running outside a background job context |

`close.sh` takes `--plan <path>` (required), `--go` (default off = dry run), `--limit N`
(cap the batch), `--canary` (see above).

## Read next

`README.md` in this skill's directory has the failure modes discovered building this —
the shell-alias trap, why `claude rm` deletes branches, why untracked scratch files
looked like risk but weren't, and how to recover a job the plan held back for review.
