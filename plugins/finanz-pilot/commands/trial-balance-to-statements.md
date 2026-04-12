---
name: trial-balance-to-statements
description: Turn a trial balance or Summen- und Saldenliste into an HGB balance sheet and income statement with explicit mapping and tie-out checks
argument-hint: <trial balance, saldenliste, or closing data>
---

# Trial Balance To Statements

Convert this trial balance or closing data into HGB statements: **$ARGUMENTS**

## Workflow

1. Use the `hgb-closing-flow` skill as the base workflow.
2. Load `${CLAUDE_PLUGIN_ROOT}/skills/hgb-closing-flow/references/trial-balance-to-statements.md` and follow its sequence.
3. Confirm:
   - reporting date or reporting period
   - whether the source is a true trial balance, a raw account export, or a draft close
   - whether the GuV should be GKV or UKV; if unspecified, default to GKV and say so
4. Group the source balances into:
   - Bilanz buckets under §266 HGB
   - GuV lines under §275 HGB
5. Surface uncertainties before the final output:
   - missing accounts or unsupported SKR04 mappings
   - balances that could belong to multiple HGB line items
   - open closing adjustments that affect equity or profit/loss
6. Produce both statements and a reconciliation section instead of answering with only one side.

## Output Format

Use this structure:

```text
Input basis:
- reporting date / period
- source type
- assumptions

Mapping summary:
- key account groups mapped to Bilanz and GuV
- unresolved classifications

Balance sheet (§266 HGB):
[structured balance sheet]

Income statement (§275 HGB):
[structured GuV]

Reconciliation checks:
- assets equal liabilities/equity: yes/no
- annual profit/loss ties into equity: yes/no
- open close items still blocking a final statement set
```

## Guardrails

- Do not fabricate balances, net off positions without basis, or assume missing closing entries.
- If the source clearly cannot support a final Bilanz and GuV, return a draft plus the exact missing inputs.
- Keep HGB headings recognizable from the plugin templates.
