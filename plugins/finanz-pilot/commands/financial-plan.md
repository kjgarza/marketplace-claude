---
name: financial-plan
description: Generate an integrated capital allocation plan comparing pension optimization vs. property purchase vs. balanced approach
argument-hint: <constraint or preference, e.g., 'buy within 2 years', 'maximize pension', 'prioritize liquidity'>
---

# Financial Plan

Generate an integrated capital allocation plan for: **$ARGUMENTS**

## Workflow

1. Use the `capital-allocation` skill to produce an integrated financial plan.
2. The skill requires existing reports from prior analyses. Before running, check for:
   - `finance/reports/pension-evaluation-*.md` — run `/evaluate-pension` if missing
   - `finance/reports/real-estate-readiness-*.md` — run `/real-estate-check` if missing
   - `finance/reports/retirement-readiness-*.md` — run `/evaluate-pension retirement readiness` if missing
3. If prerequisite reports are missing or older than 3 months, inform the user which commands to run first and do not proceed with stale data.
4. The skill also reads all data files from `finance/data/`. If any are missing, direct the user to the templates in `${CLAUDE_PLUGIN_ROOT}/templates/`.
5. If the argument specifies a constraint (e.g., "buy within 2 years", "maximize tax efficiency"), pass it through to the skill to weight the scenario scoring accordingly.

## Output

The skill generates a report at `finance/reports/capital-allocation-YYYY-MM.md` with four scenarios (pension priority, property priority, balanced, Wohn-Riester hybrid), a scoring matrix, sensitivity analysis, and a phased action plan.
