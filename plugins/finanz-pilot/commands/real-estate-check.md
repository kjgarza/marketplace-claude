---
name: real-estate-check
description: Assess financial readiness to purchase property in Berlin/Brandenburg with buy-to-live and buy-to-let analysis
argument-hint: <price, area, or property type, e.g., '€400,000', 'Pankow', 'Einfamilienhaus', 'buy-to-let'>
---

# Real Estate Check

Assess real estate readiness for: **$ARGUMENTS**

## Workflow

1. Use the `real-estate-readiness` skill to run the full property purchase assessment.
2. The skill reads data from `finance/data/bank-accounts.md`, `finance/data/employment.md`, `finance/data/monthly-budget.md`, and `finance/data/property-goals.md`. If any file is missing, tell the user to populate it using the templates in `${CLAUDE_PLUGIN_ROOT}/templates/`.
3. If the argument specifies a property price, area, or type (e.g., "Einfamilienhaus", "Neubau"), pass it through to the skill to focus the analysis.
4. The skill handles apartments (Eigentumswohnung), houses (Einfamilienhaus, Doppelhaushälfte, Reihenhaus), and both Neubau and Bestand properties.

## Output

The skill generates a report at `finance/reports/real-estate-readiness-YYYY-MM.md` with a readiness score (Ready / Almost Ready / Not Yet Ready) and full scenario analysis.
