---
name: hgb-closing-flow
description: Use for assembling or reviewing an HGB Jahresabschluss workflow from trial balance data into Bilanz and GuV outputs, including tie-out checks between §266 and §275 HGB. Trigger on balance sheet, income statement, trial balance, closing, Jahresabschluss, Saldenliste, GuV, or Bilanz preparation requests.
---

# HGB Closing Flow

Use this skill when the task is no longer a single booking, but a statement-preparation or statement-review flow.

## Input expectation

Prefer one of these inputs:
- a trial balance or Summen- und Saldenliste
- an account list with year-end balances
- a draft Bilanz or GuV that needs structural review
- a closing memo explaining adjustments and the target reporting date

If the user does not provide enough data for a final statement, say what is missing and continue with a draft structure instead of blocking early.

For a guided end-to-end close from trial balance to Bilanz and GuV, also use:
- `${CLAUDE_PLUGIN_ROOT}/skills/hgb-closing-flow/references/trial-balance-to-statements.md`
- `${CLAUDE_PLUGIN_ROOT}/skills/hgb-closing-flow/references/skr04-hgb-starter-mapping.md`

## Working method

1. Confirm the reporting date or reporting period.
2. Determine whether the task is:
   - Bilanz only
   - GuV only
   - both statements as a closing package
3. Use `skr04-kontenrahmen` when an account class or line-item mapping is unclear.
4. Use `bilanz-guv-format` for the statutory structure and preserve the ordering from the templates.
5. Use the starter SKR04-to-HGB mapping reference for common closing lines before falling back to ad hoc classification.
6. Make the tie-outs explicit:
   - Bilanz: Aktiva = Passiva
   - GuV: subtotals add up correctly
   - Jahresueberschuss/Jahresfehlbetrag flows consistently into equity
7. Surface unresolved items separately from finalized mappings.
8. When the task starts from a trial balance, follow the staged checklist from the reference file instead of jumping straight to final statements.

## Typical checks

- Distinguish Anlagevermoegen, Umlaufvermoegen, RAP, equity, provisions, and liabilities cleanly.
- Use the starter mapping for common bank, receivables, payables, VAT, revenue, and operating expense balances, but mark edge cases explicitly.
- Flag when provisions, accruals, and simple payables appear to be mixed.
- Flag when the result shown in the GuV does not reconcile to the balance-sheet equity movement.
- Keep statutory headings even when individual amounts are zero, omitted, or still open in the source draft.

## Guardrails

- Do not invent source balances, account numbers, or year-end adjustments.
- Separate HGB presentation logic from tax-law discussion and from VAT treatment.
- When line-item classification depends on management intent or maturity profile, state the assumption.
- Treat the templates as presentation scaffolds, not as permission to fabricate content.
