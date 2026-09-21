---
name: ship
description: Drive a branch all the way to a mergeable PR autonomously — create the PR if needed, then loop CI, review comments, and rebases until green, classifying flaky vs real failures and logging every iteration. Use when someone says "ship this", "ship this branch", "take this to mergeable", or "open a PR and get it green".
---

# Ship

Autonomously drive the current branch (or given PR) to mergeable. Composes with `/babysit-pr` — that skill owns the monitor/fix loop; this skill adds PR creation, failure classification, and an audit trail. **Never merges** — stops at a merge-readiness report.

## Usage

```
/ship            # current branch: create PR if none, then drive to green
/ship 250        # existing PR number
```

## Workflow

### Step 0: Preconditions

- Refuse to run on `main`/`master` — branch first.
- Working tree must be clean or contain only changes belonging to this ticket. Unrelated dirty files → stop and ask.
- Start an audit log at `$CLAUDE_JOB_DIR/tmp/ship-<branch>.log` (or `/tmp/ship-<branch>.log` if unset). Append one line per iteration: timestamp, action taken, CI state, comments outstanding.

### Step 1: Ensure a PR exists

```bash
gh pr view --json number,state 2>/dev/null
```

- No PR → push branch (`git push -u origin HEAD`) and create one:
  - Title from the branch's primary commit; body summarizing the change, linking the issue (`Closes #N`) when the branch name or commits reference one.
  - End body with the project's PR footer if CLAUDE.md defines one.
- PR exists but closed → stop, report.

### Step 2: Run the babysit loop

Invoke the `babysit-pr` skill on the PR number. Follow it fully — including its Step 1b freshness preflight on **every** iteration. The additions below extend its Step 4 (CI failures).

### Step 3 (extends babysit Step 4): Classify each CI failure before fixing

For every failing check, decide **flaky-infrastructure** vs **real** before touching code:

Flaky-infrastructure signals — re-run, don't "fix":
- Failure not reproducible locally on the same commit
- Missing optional native/npm binaries (e.g. platform-specific biome/esbuild packages)
- Container/port/DB contention, OOM on runner, network timeouts to registries
- Same job passed on an identical diff earlier

```bash
gh run rerun <RUN_ID> --failed
```

Real-failure signals — fix per babysit-pr Step 4:
- Reproducible locally
- Error names code this PR touched
- Deterministic lint/type/test assertion

Rules:
- Max **2 re-runs** per check per session. Third failure = treat as real or stop and report.
- Log the classification + evidence in the audit log. Never re-run a failure you haven't classified.

### Step 4: Merge-readiness report

When babysit-pr reports done (or max iterations hit), print:

```
SHIP REPORT — PR #<n>
- CI: X/Y green (re-runs used: N, flaky checks: [...])
- Comments: X resolved, Y replied, Z flagged for user
- Base: up to date / rebased N times
- Audit log: <path>
- Live probe: <what was observed in the running system, or NONE>
- Verdict: READY TO MERGE / BLOCKED ON <thing>
```

Then end with the Run Output Contract sections (Completed / Skipped or degraded / Unverified claims) per global CLAUDE.md.

## Rules

- **READY TO MERGE requires a Live-probe line that is not NONE** when the diff touches `infra/`, IaC, deployed config or rendered layout. CI green plus resolved comments is not evidence that the provider accepts the change or that the page renders — invoke `falsify` (Mode 2) and record what was observed
- **Closing this PR without merging? Harvest its review findings first** — copy unresolved bot and human findings onto the successor branch or issue before closing, or they re-surface verbatim in the rewrite
- All `babysit-pr` rules apply (no force-push to main, no `--no-verify`, no auto-merge, no dismissing reviews)
- Never `git push --force`; `--force-with-lease` only after a rebase, per babysit-pr Step 6
- Stop and ask the user when: base moved invalidating conflict resolution, a review comment is architectural, a check fails 3× after re-runs, or auth/permissions block an action (report exact remediation command, don't work around)
- If the GitHub token is read-only or lacks scopes, stop immediately with the exact `gh auth refresh -s <scope>` needed
