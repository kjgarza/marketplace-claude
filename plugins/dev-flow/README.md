# dev-flow

One development flow for any code change, plus the three skills that enforce its ends.

| Skill | Role |
|---|---|
| `dev-flow` | The spine. Feature path (premise → plan → isolate → build → verify → ship) or bugfix path (reproduce → root-cause → TDD fix → ship). Names which skill owns each step rather than reimplementing them. |
| `falsify` | Two modes. **Mode 1** red-teams a *design* before code exists — enumerate assumptions, rank by blast radius, probe the load-bearing ones. **Mode 2** red-teams a *fix* before it merges. |
| `ship` | Drives a branch to a mergeable PR: creates it, loops CI, classifies flaky vs real failures, keeps an audit log. Never merges — stops at a merge-readiness report. |
| `babysit-pr` | The monitor/fix loop `ship` composes with. Freshness preflight every iteration, review-comment triage, conflict handling. |

## The idea

Two gates, at the two points where a mistake is most expensive.

**At the start**, a design that rests on an unverified claim about an external system costs a PR cycle to discover. `falsify` Mode 1 finds it for the price of one live probe.

**At the end**, the failure is subtler: a change passes local verification completely — tests green, build exit 0, CI green, review comments resolved — and still breaks, because every one of those signals is *local* evidence about code, not evidence about the system the code will run in. An IaC tree that typechecks can be rejected by the provider that applies it. A CSS wrapper that renders in isolation can become a containing block in the page. `falsify` Mode 2 closes that gap, and `ship` / `babysit-pr` refuse to report READY TO MERGE without it on diffs that touch infrastructure, deployed config or rendered layout.

Grade every claim, and only the third counts:

1. *I reasoned it works.*
2. *A schema or type says it works.*
3. **I observed it working in the running system.**

## Requires

`dev-flow` orchestrates skills from other plugins — see the `## Requires` table in `skills/dev-flow/SKILL.md`. The flow degrades gracefully without them (every step can be done by hand); you lose the enforcement, not the structure.
