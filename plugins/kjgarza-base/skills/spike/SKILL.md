---
name: spike
description: This skill should be used when more than one plausible approach exists and a throwaway prototype should settle which one to take. Runs prototypes to settle which approach to take, before any production code exists. Compares 2-4 candidate approaches in a disposable workspace and reports VALIDATED / PARTIAL / INVALIDATED with the evidence that decided it. Triggers when you cannot name the files that will change, when comparing A/B implementations, or when the user says "spike this", "quick prototype", "is this possible", "before we build".
---

# Spike

Settle **which approach** before building it for real. This is not `falsify`: `falsify` probes a system
you do not control (does the provider accept this shape, does the API behave this way). A spike probes
**your own codebase's tolerance for an approach** — and produces throwaway code that is deleted, never
merged.


## When to run — objective triggers, not a request

Run a spike when **either** is true, whether or not anyone asked for one:

- **More than one plausible approach exists**, and choosing between them requires seeing one work.
- **You cannot name the files that will change.** If the file list is guesswork, so is the estimate.

Do **not** run a spike when reading the docs or the source genuinely answers the question, or when the
user asked for production implementation. But note the failure mode: reading the code often *feels*
sufficient. When the objective triggers above are met, they outrank that feeling.

## Loop

1. **Question** — state the concrete feasibility question in one sentence. Not "how should the rail
   work" but "can a conversation-centric rail read its entries from the existing conversation store
   without a new endpoint?"
2. **Research** — read enough docs and source to pick credible candidates. Stop when you can name them.
3. **Build** — the smallest runnable artifact that validates or invalidates the idea. Runnable CLI,
   tiny HTML, one endpoint, one focused test. No package sprawl, no Docker, no env files, no app
   framework, no production cleanup.
4. **Stress** — try one edge case or failure mode. An approach that works only on the happy path has
   not been validated.
5. **Verdict** — `VALIDATED`, `PARTIAL` or `INVALIDATED`, written to disk (below).

**Run the riskiest question first, sequentially.** One `INVALIDATED` on the riskiest question kills the
direction and saves every other spike. Fanning all of them out at once pays for five answers to learn
what the first one would have told you.

## Where the work goes

| What | Where |
|---|---|
| Throwaway code | `.claude/spikes/<slug>/` |
| The verdict | `.claude/plans/<ticket>-spike.md` |

The verdict sits beside `<ticket>-falsify.md` on purpose: same phase, same reader, same fate at the
next `/clear`. Anything a reviewer must see belongs in the ADR or the PR body, which are committed.

## Verdict format

```markdown
## Verdict: VALIDATED | PARTIAL | INVALIDATED

Question: <the one-sentence feasibility question>
Approaches compared: <A, B, …>
Evidence: <exact command, exact output, exact measurement — per approach>
What worked:
What failed or surprised us:
Recommendation: ship / adjust / avoid, and the next production step.
```

**Only an observation counts as evidence.** A green typecheck, a passing CI run or a schema reading is
reasoning, not observation. Say which one you have.

## The verdict feeds the ADR — before implementation

A spike is not finished when the prototype runs. Its output is the input to the ADR at
`docs/decisions/NNN-<slug>.md`, and **the ADR is written before the
implementation, not after it.** An ADR that arrives after the approach has been built three times is a
record of what happened, not a decision.

## Comparing approaches with subagents

**A/B comparison is the one part of a spike worth parallelising.** One subagent per candidate approach,
identical inputs, identical measurements. Independence is the point: an agent that has not seen
approach A will not rationalise approach B toward it. The parent keeps the verdicts, not the
transcripts.

Do **not** fan out the risk-ordered spikes of a multi-question split; that discards the early stop that
makes spikes cheap. And do not hand a spike to a peer session (a teammate): a spike is minutes to an
hour, and its value is that the *user* sees the evidence and changes their mind.

Ask before building all variants if the work is more than a small prototype.

## Rules

- **An `INVALIDATED` spike is a success.** It ruled out a path with evidence, for the cost of a
  prototype instead of the cost of a pull request.
- **Never merge spike code.** If an approach wins, rewrite it normally in the build step. The spike
  workspace is deleted, not promoted.
- Splitting into 2–5 independent questions is fine. Run the riskiest first.
- Evaluating an external dependency? Check its health too: recent release or commit, real docs,
  licence, install friction.
