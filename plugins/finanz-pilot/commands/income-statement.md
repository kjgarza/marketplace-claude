---
name: income-statement
description: Prepare or review an HGB income statement using §275 HGB in GKV or UKV form
argument-hint: <trial balance, account list, or closing context>
---

# Income Statement

Prepare or review an HGB income statement for: **$ARGUMENTS**

## Workflow

1. Use the `hgb-closing-flow` skill to determine the required inputs, statement logic, and reconciliation checks.
2. Use the `bilanz-guv-format` skill and the `${CLAUDE_PLUGIN_ROOT}/templates/guv-gkv-275.md` or `${CLAUDE_PLUGIN_ROOT}/templates/guv-ukv-275.md` template.
3. Determine whether GKV or UKV is required. If the user does not specify, default to GKV and say so.
4. Map balances into the correct §275 HGB lines while keeping the statutory ordering intact.
5. Reconcile subtotals and confirm that the annual result ties to the equity movement used in the balance sheet or closing narrative.
6. If source data is incomplete, produce a draft with explicit gaps rather than guessed values.

## Output Format

Use this structure:

```text
Income statement basis:
- reporting period
- format used: GKV or UKV
- source basis and assumptions

Income statement (§275 HGB):
[structured GuV]

Checks:
- subtotal consistency
- annual profit/loss tie-out
- open classification questions
- HGB references for non-trivial issues
```

## Guardrails

- Keep line names recognizable from the HGB templates even if the surrounding explanation is in English.
- Cite §275 HGB when the line structure matters, and cite other HGB sections when recognition or valuation affects the presentation.
- If GKV vs. UKV is genuinely unclear from the source data, say what assumption was made and why.
- Do not collapse line items into custom management-reporting buckets.
