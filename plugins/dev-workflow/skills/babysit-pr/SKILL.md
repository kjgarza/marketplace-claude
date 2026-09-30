---

name: babysit-pr

description: Monitors a pull request until it is ready to merge. Checks CI status, reviews PR comments, and automatically fixes issues. Use when someone says "babysit this PR", "watch this PR", "monitor PR", "fix PR issues", or "get this PR ready to merge".

---

  

# Babysit PR

  

Continuously monitors a pull request, identifies failures or requested changes, fixes them, and pushes updates until the PR is green and review-clean.

  

## Usage

  

```

/babysit-pr [PR number or URL]

```

  

If no PR number is provided, detect it from the current branch.

  

## Workflow

  

Run this loop until the PR is ready to merge (all checks pass, no unresolved comments):

  

### Step 1: Identify the PR

  

```bash

# If PR number provided, use it directly

# Otherwise, detect from current branch:

gh pr view --json number,url,headRefName,state

```

  

### Step 2: Check PR Status

  

Gather all status signals in parallel.

  

```bash

# CI check status

gh pr checks <PR_NUMBER>

  

# Review status (approved, changes requested, etc.)

gh pr view <PR_NUMBER> --json reviews,reviewDecision

  

# PR merge status

gh pr view <PR_NUMBER> --json mergeStateStatus,mergeable

```

  

**Gather ALL comment sources** — a single endpoint is not enough. Reviewers leave feedback in three distinct places, and the default page size is 30, so always `--paginate`:

  

```bash

# 1. Inline review comments — anchored to a file + line. These carry the

# metadata you need to act: path, line, the diff_hunk they reference, and

# in_reply_to_id (so you can reconstruct threads). Keep this metadata.

gh api --paginate repos/{owner}/{repo}/pulls/<PR_NUMBER>/comments \

--jq '.[] | {id, user: .user.login, path, line, diff_hunk, in_reply_to_id, body}'

  

# 2. Review summary bodies — the top-level text a reviewer writes when they

# "Request changes" / "Approve". NOT returned by the inline endpoint.

gh api --paginate repos/{owner}/{repo}/pulls/<PR_NUMBER>/reviews \

--jq '.[] | {user: .user.login, state, body}'

  

# 3. Issue-level conversation — general PR comments not tied to any line.

gh api --paginate repos/{owner}/{repo}/issues/<PR_NUMBER>/comments \

--jq '.[] | {user: .user.login, body}'

```

  

### Step 2b: Load Branch + Working-Tree Context

  

Reviewers reason about the **whole change**, not one line. A comment like "this duplicates the helper above" or "you renamed this everywhere else but not here" only makes sense with the full diff in view. And you may already have an in-progress fix on disk that isn't pushed yet — loading it prevents redoing or clobbering it.

  

```bash

# Full branch diff (every file the PR touches) — the context most comments assume

gh pr diff <PR_NUMBER>

  

# Branch commit history — what's already been done and why

git log --oneline origin/main..HEAD

  

# Uncommitted local work — staged + unstaged + untracked.

# These changes are NOT on the PR yet; a reviewer can't see them and CI hasn't run them.

git status --porcelain

git diff # unstaged

git diff --staged # staged but not committed

```

  

**Reconcile before acting:** if `git status` shows local changes, decide whether they already address a comment (then commit/push them) or are unrelated scratch work (leave them alone — never blindly `git add .`). When in doubt about uncommitted work you didn't create, surface it to the user rather than committing or discarding it.

  

### Step 3: Triage Issues

  

Categorize what needs attention, in priority order:

  

1. **CI Failures** — Tests, lint, build, or type-check failures

2. **Review Comments** — Unresolved feedback across all three sources from Step 2: inline comments, review summary bodies, and issue-level conversation

3. **Merge Conflicts** — Branch is out of date or has conflicts

  

Cross-check against the branch + working-tree context from Step 2b before deciding an item is unaddressed — a fix may already exist uncommitted locally.

  

### Step 4: Fix CI Failures

  

For each failing check:

  

```bash

# Get the failed job logs

gh run view <RUN_ID> --log-failed

```

  

Then:

- **Test failures**: Read the failing test, understand the error, fix the code or test

- **Lint failures**: Run the linter locally, apply fixes

- **Build failures**: Read the error, fix the source

- **Type errors**: Fix type issues in the flagged files

  

After fixing, commit and push:

```bash

git add <files>

git commit -m "fix: <describe what was fixed>"

git push

```

  

### Step 5: Address Review Comments

  

You collected three comment sources in Step 2 and the full branch + working-tree context in Step 2b. **Read the comment against that context — never in isolation.** Most ambiguous feedback resolves once you look at the surrounding diff.

  

For each unresolved comment:

  

1. **Locate it.** Inline comment → open `path:line` and read the `diff_hunk` it references. General/review comment → it's about the PR as a whole; use the full `gh pr diff` to find what it points at.

2. **Reconstruct the thread.** Follow `in_reply_to_id` to read the whole exchange. A later reply may already resolve, retract, or narrow the original ask — don't action a comment that a follow-up withdrew.

3. **Resolve references to elsewhere.** Phrases like "same as above", "match the other handler", "you missed one" mean the reviewer is pointing at *other* code. Grep the branch diff for the pattern before deciding what to change.

4. **Check uncommitted work first.** If `git status` showed local changes, check whether they already satisfy this comment. If so, commit + push them instead of writing the change again.

5. **Triage actionability:**

- Actionable code feedback → make the change, commit, push.

- Question → answer it (reply on the PR if useful); only change code if the answer implies one.

- Acknowledgment / praise / `nit:` already addressed → skip.

- Subjective or architectural → flag for the user (per Rules), don't silently rewrite.

- **Push back** when the suggested change is unneeded, misses the point, or conflicts with best practices. Reply on the PR explaining why — cite the language spec, framework docs, or project convention as appropriate. Don't make the change just to close the comment. Example triggers:
  - Reviewer asks to add error handling for a code path that can't fail
  - Suggestion would introduce a known anti-pattern (e.g. `any` cast, suppressing a lint rule, premature abstraction)
  - Feedback contradicts the project's own CLAUDE.md or established conventions
  - Bot reviewer (Copilot, etc.) flags something that is intentional and correct in context

  When pushing back: be direct, not defensive. One sentence stating what the code does and why it's correct is enough. Offer an alternative only if one genuinely exists.

6. **If still unclear** after using all the context: summarize what you found — including the surrounding diff — and ask the user for guidance.

  

### Step 5b: Re-request Review After Code Changes

  

**Only when you pushed code changes that address review feedback** (not for answered questions or skipped nits), re-request review so the reviewers — especially Copilot — re-read the updated diff instead of leaving stale comments standing.

  

```bash

# Re-request Copilot. Preferred:

gh pr edit <PR_NUMBER> --add-reviewer "copilot-pull-request-reviewer[bot]"

  

# Fallback if gh rejects the bot login — POST the requested_reviewers endpoint.

# Re-requesting a reviewer who already reviewed flips them back to "review requested",

# which is what re-triggers the pass.

gh api repos/{owner}/{repo}/pulls/<PR_NUMBER>/requested_reviewers \

-X POST -f 'reviewers[]=copilot-pull-request-reviewer[bot]'

```

  

Also re-request any **human** reviewer who previously left "changes requested" on a comment you just addressed, using the same commands with their login. Don't re-request reviewers whose feedback you skipped or only answered.

  

### Step 6: Handle Merge Conflicts

  

```bash

# Check if branch is behind

gh pr view <PR_NUMBER> --json mergeStateStatus

  

# If behind, rebase

git fetch origin main

git rebase origin/main

git push --force-with-lease

```

  

**IMPORTANT**: Only rebase if there are actual conflicts. Do not force-push unnecessarily.

  

### Step 7: Verify and Report

  

After pushing fixes, wait for CI to start, then check status again.

  

Report a summary to the user:

  

```

PR #<number> Status:

- CI: [passing/failing] (X/Y checks passed)

- Comments: [X unresolved]

- Merge: [ready/blocked]

- Action taken: <what was fixed>

- Review re-requested: [yes/no — who]

```

  

### Step 8: Loop or Complete

  

- If all checks pass and no unresolved comments: **Done** — report that the PR is ready to merge

- If issues remain: go back to Step 2

- If stuck on something that requires user input: stop and explain what needs manual attention

- **Max iterations**: 5. If not resolved after 5 rounds, stop and report remaining issues

  

## Rules

  

- **Never force-push to main/master**

- **Never skip pre-commit hooks** (no `--no-verify`)

- **Create new commits** for fixes (don't amend unless the user asks)

- **Don't auto-merge** — just report when the PR is ready. The user decides when to merge

- **Don't dismiss reviews** — only address the feedback

- If a CI failure is clearly pre-existing (fails on main too), note it and move on

- If a review comment is subjective or architectural, flag it for the user instead of making changes

- Respect the project's CLAUDE.md rules (test requirements, code style, etc.)

  

## Common Mistakes

  

| Mistake | Why it bites | Fix |

|---|---|---|

| Fetching only `/pulls/<n>/comments` | Misses review summary bodies and issue-level conversation — you act on a third of the feedback | Fetch all three sources (Step 2) |

| Dropping `--paginate` | Comments past the first 30 silently vanish on busy PRs | Always `--paginate` |

| Reading a comment in isolation | "Same as above" / "you missed one" is unactionable without the surrounding diff | Load `gh pr diff` + reconstruct threads via `in_reply_to_id` (Step 5) |

| Ignoring uncommitted local work | You redo a fix that's already on disk, or `git add .` sweeps in unrelated scratch work | Run `git status`/`git diff` in Step 2b; reconcile deliberately |

| Actioning a withdrawn comment | A follow-up reply may have retracted or narrowed the original ask | Follow the reply thread before changing code |

| Pushing a fix but not re-requesting review | Copilot/human keeps showing stale "changes requested"; PR looks blocked | Re-request review after pushing code fixes (Step 5b) |
| Complying with every comment | Wrong changes ship; reviewer may be mistaken or bot-hallucinating | Push back with a reason when the suggestion is wrong or harmful (Step 5) |

  

## Detecting the PR

  

Priority order for finding which PR to babysit:

  

1. Explicit argument: `/babysit-pr 806`

2. Explicit URL: `/babysit-pr https://github.com/owner/repo/pull/806`

3. Current branch: `gh pr view --json number` (uses the PR associated with HEAD)
