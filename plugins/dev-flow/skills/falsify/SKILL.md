---
name: falsify
description: Red-team a design before any code exists, or a fix before it merges. Enumerates every factual assumption the work depends on, ranks by blast radius, and proves or disproves each with live probes. Use before implementing integration tickets, before merging a change to infrastructure, IaC, deployed config or rendered layout, when the user says "falsify this", "red-team this design", "falsify the fix", "check the assumptions", or before writing an ADR for work touching external APIs.
---

# Falsify

Run a falsification phase BEFORE writing any implementation code. The goal is to find the one live probe or measurement that would invalidate the design — before the design costs a PR cycle.

## When to run

- Any ticket integrating with an external API (Google Docs/Drive/Calendar, Coda, BigQuery, CloudFront, AWS, OAuth flows)
- Any design resting on claimed system behaviour (query-planner pruning, header forwarding, export formats, ordering guarantees)
- Before writing an ADR for such work

## Workflow

### Step 1: Enumerate assumptions

List every factual assumption the design depends on. Sources of assumptions:

- API response shapes and export formats
- Ordering / concatenation / pagination guarantees
- Auth scopes and token permissions actually granted
- What a code comment or doc claims vs what the current code does
- Query planner / performance behaviour ("partitioning will prune this")
- Header/metadata forwarding through proxies and CDNs

### Step 2: Rank by blast radius

For each assumption: how much work is wasted if it is false? Rank descending. Top 3–5 are "load-bearing".

### Step 3: Probe each load-bearing assumption

For each, launch parallel subagents (Agent tool) — one per assumption — tasked to PROVE or DISPROVE it with real evidence:

- A live API call with real credentials (smallest possible: 1 doc, 1 row, dry-run)
- An actual byte/latency/bytes-scanned measurement, not an EXPLAIN guess where a real run is cheap
- Reading the current source code, not comments or docs

**Documentation is not proof where a live probe is possible.** A probe that can't run (no access, cost) → mark assumption UNVERIFIED, do not silently downgrade to "probably fine".

### Step 4: Report

Produce a table:

| Assumption | Verdict | Evidence | Blast radius if wrong |
|---|---|---|---|
| ... | CONFIRMED / DISPROVED / UNVERIFIED | raw probe output ref | ... |

- Any DISPROVED load-bearing assumption → stop; redesign before code.
- Any UNVERIFIED load-bearing assumption → surface to user; do not implement without explicit go-ahead.
- All CONFIRMED → write the ADR, then implement.

## Mode 2 — falsify a fix before merge

Everything above probes the **design**. This probes the **implementation of it**, one boundary later. Run it when the diff touches IaC/provider config, deployed env vars, rendered layout, or anything whose behaviour only exists in a running system. One probe inline is fine here — the parallel fan-out in Step 3 is for the design case.

This does not replace `verification-before-completion`; it sits on top of it. That skill certifies local evidence (tests, lint, build). This one certifies that the change works where it will actually run.

Grade every claim. Only the third counts as verified:

1. *I reasoned this is true.*
2. *A schema, type or doc says this is true.*
3. **I observed this being true in the running system.**

| Diff touches | Probe |
|---|---|
| IaC / provider config | Apply through the actual provider (`pulumi preview`, `terraform plan`). Provider constraints are stricter than the cloud API schema your types validate against — a tree that typechecks can still be rejected at deploy |
| A localhost health check | Resolve the listening PID and confirm it belongs to this session's process tree; an orphaned server from another worktree is a false green |
| Data / query paths | Query the real DB or API for the records touched, and paste the rows |
| Rendered layout | Drive the real UI with the chrome tools, screenshot before/after, and assert the specific computed property you changed |
| "These are/aren't duplicates" | Diff them and report line/byte similarity — never assert equivalence from reading |

Report the Step 4 table, plus an explicit list of anything unprovable here and the access it would need.

## Rules

- No implementation code until every load-bearing assumption is CONFIRMED or the user explicitly accepts the risk
- Show raw probe output, not paraphrases
- Probes must be minimal and read-only where possible; never probe with destructive writes against shared/prod resources
- Keep probe scripts in the repo (e.g. `scripts/probes/` or ticket branch) so they can be re-run when the API changes
