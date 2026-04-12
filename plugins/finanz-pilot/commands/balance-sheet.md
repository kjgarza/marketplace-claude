---
name: balance-sheet
description: Prepare or review an HGB balance sheet using the §266 HGB structure and existing plugin templates
argument-hint: <trial balance, account list, or closing context>
---

# Balance Sheet

Prepare or review an HGB balance sheet for: **$ARGUMENTS**

## Workflow

1. Use the `hgb-closing-flow` skill to determine the required inputs, validation checks, and statement assembly order.
2. Use the `bilanz-guv-format` skill and the `${CLAUDE_PLUGIN_ROOT}/templates/bilanz-266-hgb.md` template as the default structure.
3. Map balances into the correct §266 HGB line items, keeping headings and ordering intact.
4. If account mapping is unclear, use `skr04-kontenrahmen` for the closest supported SKR04 account class and state what still needs confirmation.
5. Reconcile the balance sheet:
   - Aktiva = Passiva
   - current-period result is reflected consistently in equity
   - provisions, accruals, and debt classification are not mixed up
6. If source data is incomplete, produce a draft with explicit gaps instead of inventing balances.

## Output Format

Use this structure:

```text
Balance sheet basis:
- reporting date
- source basis (trial balance, account list, draft close, etc.)
- major assumptions or missing data

Balance sheet (§266 HGB):
[structured balance sheet]

Checks:
- assets equal liabilities/equity: yes/no
- open mapping questions
- HGB references for non-trivial classification or measurement issues
```

## Guardrails

- Preserve recognizable HGB headings and order from the template.
- Cite §266 HGB when the structure itself matters, and cite §246, §249, §250, or §253 HGB when recognition or measurement drives the answer.
- Separate a formatting issue from an accounting issue when both exist.
- If the user provides only partial data, explicitly identify what is missing for a final balance sheet.
