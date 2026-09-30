# session-cleanup — gotchas found while building this

Everything here was discovered by running the process live against a real, large
`~/.claude/jobs/` directory before it was turned into this skill.
Read it before running `close.sh --go` for the first time in a new context.

## `claude rm` deletes the worktree's local branch, not just the directory

Tested directly: `claude rm <id>` on a job with a clean, pushed worktree prints

```
removed 5fdffc0a
  worktree: "/path/to/worktree"
```

and then the worktree directory is gone, deregistered from `git worktree list`, **and
the local branch is deleted too**. The commit only survived because it had been pushed —
`git branch -a --contains <commit>` afterwards showed it as `remote-only`.

**Consequence:** before closing any job with a live worktree, `analyze.py` checks
`git branch -r --contains HEAD` in that worktree. If HEAD isn't reachable from any
remote ref, the job is held back — at every level, unconditionally. This is the one
protection in this skill that isn't a rubric preference, it's a data-loss guard.

## `claude rm` refuses a dirty worktree on its own — you don't need to pre-filter for it

Tested directly, four times, against worktrees with anything from a single untracked
`.commitmsg` file to nine untracked files:

```
kept d622d6b3 — its worktree is still at ".../gh-416-tool-run"
  The worktree has uncommitted changes. Deleting it would lose them.
  commit or stash them and run 'claude rm d622d6b3' again, or delete the
  session from 'claude agents' (ctrl+x twice) to discard them
```

The tool's own refusal is the reason `analyze.py` doesn't need to distinguish "dirty" from
"clean" when checking a worktree — only "HEAD on a remote or not". A dirty-but-pushed
worktree is safe to attempt: it'll either succeed (nothing to lose) or get refused
(nothing lost). Only dirty-and-unpushed would be a genuine gap, and that's covered by the
same `git branch -r --contains HEAD` check, since dirty files don't change what HEAD
points at.

### Clearing a refusal

A refusal isn't a failure state — it's the tool asking you to make a call:

```bash
git -C <worktree-path> stash -u      # then re-run claude rm <id>
```

This is genuinely reversible even after the worktree is deleted:
`git -C <worktree-path> rev-parse --git-common-dir` returns the *main* repo's `.git`, not
a per-worktree directory — so `refs/stash` lives in the shared ref store and survives the
worktree being removed. `git stash list` from the main checkout will still show it.

Before stashing, check for anything you'd actually want back — in practice this was
almost always `.playwright-mcp/` screenshots, `cov.log`/`watch.log` scratch, or PR-body
drafts. One recurring case is worth knowing by name:

## The `next dev` auto-generated block isn't real work

Several worktrees showed a tracked-file modification to `AGENTS.md` or `CLAUDE.md` that
looked like uncommitted human edits. It wasn't — the diff itself says so:

```diff
+This block is written and re-added by `next dev` — verify at
+`node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a
+diff only re-creates the uncommitted change; committing it with your work
+keeps the tree clean.
```

If you see this exact block as the only tracked modification in a worktree that `rm`
refused, it's safe to `git checkout -- <that file>` before retrying — there's nothing to
lose. Don't assume every tracked-file diff is this, though; check the content once.

## The shell alias trap

`claude rm <id>` typed straight into an interactive shell that aliases `claude` to
`claude --permission-mode auto` (or any alias that inserts flags before the subcommand)
gets parsed as a **prompt**, not the `rm` subcommand. The CLI replies conversationally
("what did you want removed?") and exits 0 having removed nothing — silent, no error, and
easy to mistake for "it worked" if you're not checking the actual output text.

Confirmed harmless for `close.sh` specifically: a non-interactive bash script does not
inherit interactive shell aliases (`bash -c 'type claude'` resolves straight to the real
binary even when the parent shell has the alias). `close.sh` still resolves
`$CLAUDE_BIN` explicitly and documents this, in case any of it is copied into something
that *does* run interactively.

If you're ever running `claude rm` by hand rather than through this skill, watch for a
conversational reply where you expected a one-line `removed <id>` — that's the tell.

## `updatedAt` in `state.json` is not a recency signal

It gets bumped by daemon housekeeping, not only by real activity — a cluster of jobs can
share an identical `updatedAt` timestamp days after their last real work. `analyze.py`
uses the last `timeline.jsonl` event (falling back to `lastTerminalAt`, then
`createdAt`) as "activity" instead, and only uses `updatedAt`-adjacent ordering for
display, never for the lite/standard/aggressive decision.

## What's genuinely irreversible here

- `claude rm` on a job: the `~/.claude/jobs/<id>` directory (state, timeline, any scratch
  files under its `tmp/`) is gone. The **conversation transcript is not** — it lives
  separately under `~/.claude/projects/` and survives, resumable with
  `claude --resume <sessionId>`, until Claude Code's own 30-day cleanup expires it. This
  was verified directly, repeatedly, across every close in the process this skill
  encodes — zero transcripts lost out of ~100 closes.
- `claude rm` on a job with a worktree whose HEAD is on no remote: the branch, and with
  it any commit that exists nowhere else. This is the one case `analyze.py` refuses to
  let through at any level.
