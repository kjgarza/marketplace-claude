---
name: dev-flow
description: Standard development flow for any code change — feature path (design interrogation, falsify, plan, worktree, build, verify, ship) or bugfix path (reproduce, root-cause, TDD fix, ship). Use when starting work on a new feature, enhancement, ticket, issue, bug, regression, or any request to implement or fix something in a codebase.
---

# Dev Flow

Standard flow for code changes. Two paths sharing one spine: **verify premise → plan → isolate → build → verify → ship autonomous**. Human attention concentrates at two points: premise validation (start) and merge decision (end).

Steps reference other skills — invoke them via the Skill tool, don't reimplement their content.

## Requires

This skill orchestrates other skills. Installing it alone leaves dangling references — the flow degrades gracefully (each step can be done by hand) but you lose the enforcement. Install alongside:

| Skill / agent | Ships in |
|---|---|
| `brainstorming`, `writing-plans`, `executing-plans`, `using-git-worktrees`, `subagent-driven-development`, `test-driven-development`, `systematic-debugging`, `verification-before-completion` | `superpowers` (claude-plugins-official) |
| `code-simplifier` (the `/simplify` agent) | `code-simplifier` (claude-plugins-official) |
| `code-review`, `security-review` | `code-review` (claude-plugins-official) |
| `architecture` | `knowledge-work-plugins` |
| `grill-me`, `ticket-swarm`, `handoff` | personal / project skills — optional, referenced only on named branches of the flow |

`falsify`, `ship` and `babysit-pr` ship in this plugin.

## Path selection

- New capability, enhancement, integration, refactor → **Feature path**
- Broken existing behaviour, regression, failing test, error report → **Bugfix path**
- One-line mechanical change (typo, config value) → skip flow; edit, verify, commit

## Feature path

### 1. Validate the premise (interactive — user in the loop)

- Ambiguous scope or design freedom → `brainstorming` skill; user wants stress-test → `grill-me`
- Touches external API/system behaviour (Google APIs, Coda, BigQuery, CloudFront, AWS, OAuth, query planner) → **`falsify` skill is mandatory before any design commitment**. No implementation until load-bearing assumptions are CONFIRMED
- Significant design decision → `architecture` skill for an ADR; open the ADR/requirements as its own PR for team discussion before implementation

### 2. Plan

- Multi-step work → `writing-plans` skill from the ADR/requirements
- Plan should identify independent tasks (enables parallel build below)

### 3. Isolate

- `using-git-worktrees` skill — worktree off latest origin/main, one per ticket
- Resuming an existing PR instead → freshness preflight first (global CLAUDE.md Git/PR rule)

### 4. Build (pick by shape)

| Shape | Mechanism |
|---|---|
| Small/medium, sequential | `executing-plans` + `test-driven-development` inline |
| Plan with independent tasks | `subagent-driven-development` |
| Batch of related GitHub issues | `ticket-swarm` |
| Very wide/audit-grade, user opted into token cost | Workflow tool (multi-agent orchestration) |

TDD applies in all cases: failing test before implementation code.

### 5. Verify

1. `verification-before-completion` — run the actual commands, evidence before claims. This certifies **local** evidence only (tests, lint, build, diff); step 4 certifies the running system. Both must pass
2. `/simplify` — launch the `code-simplifier` plugin agent on the ticket diff **before** review, so reviewers see the cleaned tree
3. `code-review` skill on the post-simplify diff; security-relevant changes (auth, RLS, secrets, input handling) → `security-review` as well
4. **Probe the fix in the system that will run it** — `falsify` skill, Mode 2. Mandatory when the diff touches IaC/provider config (`infra/`, Pulumi/Terraform, WAF, IAM), a deployed env var, or rendered layout. A green typecheck proves the shape compiles, not that the provider accepts it or the page renders

### 6. Ship

- `ship` skill — creates PR, drives to green via babysit loop, classifies flaky CI, stops at merge-readiness report. Never merges; the user decides
- End with the Run Output Contract sections (global CLAUDE.md)

## Bugfix path

### 1. Diagnose — no fix until root cause proven

- `systematic-debugging` skill. **Reproduce first** — the reproduction is the live probe; a fix without one is an unverified assumption
- Unknown location / cross-cutting → cavecrew-investigator or Explore agent to locate, keep findings not file dumps in context

### 2. Isolate

- Worktree if the fix is non-trivial or the main checkout is busy; skip for one-liners

### 3. Fix, test-first

- Write the failing test that captures the bug BEFORE the fix (`test-driven-development`). The test is the permanent regression probe
- Fix minimally; resist adjacent refactors (separate ticket)

### 4. Verify + ship

- `verification-before-completion` (local evidence), then **`falsify` Mode 2 when the diff touches infra, deployed config or rendered layout** (running-system evidence), then `/simplify` (`code-simplifier` plugin) on the fix diff only, then `ship`
- Tiny diffs: cavecrew-reviewer on the post-simplify diff instead of full `code-review`

## Delegation (context hygiene + independence)

Default rule: **delegate to a subagent when raw tool output vastly exceeds the conclusions needed; stay inline when accumulated conversation context is the asset.** Subagents give two things: main context stays clean (cavecrew agents also compress output), and independent judgment (a reviewer who didn't write the code has no confirmation bias).

| Step | Where it runs | Why |
|---|---|---|
| Brainstorm / grill / plan | Inline | User dialogue + accumulated understanding is the value; a subagent starts blind |
| Falsify probes | Parallel subagents | Raw probe output pollutes; only the verdict table matters |
| Code location / diagnosis sweeps | cavecrew-investigator or Explore | Want a file:line table, not 40 file reads in context |
| Build — independent tasks | Subagents (`subagent-driven-development`) | Tasks are self-contained by design. **State each agent's done explicitly: branch pushed, CI green, review findings addressed, and every call site of the thing it changed checked — never "PR opened"** |
| Build — small sequential + TDD | Inline | Handoff cost exceeds pollution; TDD needs tight edit-test iteration |
| `/simplify` | `code-simplifier` plugin agent on the ticket/fix diff | Independence: author doesn't grade own cleanup |
| Review / verify pass | cavecrew-reviewer or code-review agent on the **post-simplify** diff | Independence: fresh eyes, author never reviews own work |
| Ship loop | Background job | Long CI polling shouldn't occupy the interactive session |

Never delegate a decision the user must see reasoning for (design trade-offs, scope calls) — subagent reports summarize, and the user loses the why.

## Context budget (avoid the 50% degradation zone)

Long flows degrade when context grows. The fix is structural, not compaction: **every phase writes its output to a file, and phase transitions are session boundaries.**

Phase artifacts (mandatory — the artifact IS the phase's deliverable):

| Phase | Artifact on disk |
|---|---|
| Premise validation | ADR / requirements doc + falsify verdict table |
| Plan | Plan file (per `writing-plans`) |
| Build | Commits + updated plan checkboxes |
| Verify | `code-simplifier` result + review findings appended to plan or PR comments |
| Ship | PR + audit log |

At each phase boundary, when context is above ~40%:

1. Confirm the phase artifact is written and self-contained (a fresh reader needs NO conversation history to continue)
2. Tell the user: "Phase done, artifact at `<path>`. Recommend `/clear`; resume with `dev-flow` + that path." A fresh session reading a 2-page plan outperforms a 60%-full session that remembers writing it
3. The plan → build boundary is the highest-value break: `executing-plans` is explicitly designed to run in a separate session from planning

Mid-phase (no clean artifact yet) and context already heavy → invoke the `handoff` skill: it writes a handoff doc capturing decisions-not-yet-in-artifacts, then the user clears and resumes from the doc.

Do not rely on auto-compact — it triggers after the degradation zone and does not choose what survives.

## Rules

- Skipping a step is allowed but must be stated explicitly with the reason ("skipping worktree: one-line fix")
- Never skip: falsify-on-external-API (feature), **falsify-the-fix on infra/IaC/deployed-config/layout diffs (both paths)**, reproduce-first (bugfix), verification-before-completion (both)
- **Closing a PR without merging? Harvest its review findings first** — copy unresolved bot and human findings onto the successor branch or issue. Otherwise they re-surface verbatim in the rewrite weeks later
- Skip `/simplify` only for one-line mechanical edits (state the reason). Invoke the `code-simplifier` plugin; do not reimplement it
- Long-running ship loops can run as background jobs; recurring runs via `/loop` or `/schedule`
