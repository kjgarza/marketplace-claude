---
name: evaluate-pension
description: Evaluate current pension plan for cost-efficiency, projected returns, and alternatives in the German pension system
argument-hint: <focus area or pension type, e.g., 'fees', 'alternatives', 'Riester', 'retirement readiness', 'all pensions'>
---

# Evaluate Pension

Evaluate pension situation for: **$ARGUMENTS**

## Workflow

1. If the argument mentions "retirement readiness", "all pensions", "three pillars", "Rentenlücke", "Versorgungslücke", or "pension gap", use the `retirement-readiness` skill to produce a cross-pillar retirement projection.
2. Otherwise, use the `evaluate-pension` skill to analyze the specific pension product for cost-efficiency, projected returns, and comparison against alternatives.
3. Both skills read data from `finance/data/pension.md` and `finance/data/employment.md`. If either file is missing, tell the user to populate it using the template at `${CLAUDE_PLUGIN_ROOT}/templates/pension-data-template.md` and `${CLAUDE_PLUGIN_ROOT}/templates/employment-data-template.md`.
4. If the argument specifies a focus area (e.g., "fees", "tax treatment", "alternatives", "Wohn-Riester"), pass it through to the skill for a deep dive on that section.

## Output

The skill generates a report at `finance/reports/pension-evaluation-YYYY-MM.md` or `finance/reports/retirement-readiness-YYYY-MM.md` depending on the scope.
