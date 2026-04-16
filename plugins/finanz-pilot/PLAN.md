# finanz-pilot plan

## Current state

Recent HGB-focused work completed on `feat/finanz-pilot-hgb-foundation`:

- `0eeba57` added the HGB accounting foundation.
- `ca9a690` added English-first statement commands plus German aliases:
  - primary commands: `journal-entry`, `balance-sheet`, `income-statement`
  - German aliases: `buchungssatz`, `bilanz`, `guv`
- `93024fe` added the guided `trial-balance-to-statements` flow and German alias `saldenliste-abschluss`.
- `67ae5fb` added a starter SKR04-to-HGB mapping reference for common statement lines.
- `535c5d1` added a small worked `Saldenliste -> Bilanz/GuV` fixture for regression-style prompt guidance.

## Naming and product direction

- German accounting language in prompts, templates, legal references, and generated output is fine.
- Execution names should stay intuitive and maintainable.
- Prefer clear primary execution names in English when possible.
- Keep German aliases only where they improve discoverability for expected users.

## What is intentionally done

- HGB statutory framing exists for journal entries, Bilanz, GuV, and trial-balance-driven statement assembly.
- Existing templates for `§266 HGB` Bilanz and `§275 HGB` GKV/UKV are wired into the relevant skills and commands.
- The plugin now has a lean close-flow path:
  - command surface
  - closing workflow skill
  - starter mapping reference
  - one worked fixture

## What is intentionally not done yet

- No full VAT workflow layer beyond existing booking/treatment guidance.
- No giant SKR04 import or exhaustive DATEV taxonomy.
- No computed statement engine, parser, or deterministic transformation from raw Saldenliste to final statements.
- No full equity, provision, RAP, depreciation, or tax-expense mapping coverage.
- No second fixture yet for edge cases such as RAP, provisions, or UKV.

## Known caveats

- The shipped mapping is starter-level and meant to guide likely defaults, not to provide complete statutory coverage.
- The worked Saldenliste fixture is intentionally simple:
  - grouped opening equity
  - no income-tax line
  - no RAP, provisions, fixed assets, or depreciation schedule
  - GKV only
- Command quality still depends on user-provided balances and model judgment for unmapped or ambiguous accounts.

## Best next steps

Pick only one small increment next, not a broad rewrite.

1. Add one second worked fixture for a common edge case:
   - either RAP
   - or provisions
   - or a small UKV example
2. Extend `skr04-accounts.json` with a handful of common equity and close-relevant accounts already needed by the fixtures.
3. Add one compact validation-oriented checklist or example output contract for `trial-balance-to-statements` if prompt consistency starts drifting.

## Stop conditions (HGB domain)

Pause before expanding into:

- full VAT automation
- giant SKR04 coverage work
- bookkeeping ingestion/parsing pipelines

The goal remains: small, coherent increments that improve HGB statement usefulness without turning the plugin into a full accounting system.

---

## Personal finance advisory layer (v1.5.0)

### What was added

A complete personal finance advisory domain alongside the existing HGB accounting domain:

**New skills:**
- `retirement-readiness` — three-pillar pension projection (GRV + bAV + private), Versorgungslücke analysis, Wohn-Riester modeling, capital redirection scenarios
- `capital-allocation` — orchestrator skill that reads reports from `evaluate-pension`, `real-estate-readiness`, and `retirement-readiness` to produce integrated pension-vs-property recommendations with four scenarios (pension priority, property priority, balanced, Wohn-Riester hybrid), scoring matrix, and sensitivity analysis

**New agent:**
- `finanzberater` — conversational personal finance advisor that triages questions, delegates to appropriate skills, fills data gaps interactively, and reviews generated reports

**New commands:**
- `/evaluate-pension` (alias: `/rente-pruefen`) — entry point for pension evaluation or retirement readiness
- `/real-estate-check` (alias: `/immobilien-check`) — entry point for property purchase assessment
- `/financial-plan` (alias: `/finanzplan`) — entry point for integrated capital allocation

**New data templates** (in `templates/`):
- `pension-data-template.md`, `employment-data-template.md`, `bank-accounts-data-template.md`, `monthly-budget-data-template.md`, `property-goals-data-template.md`

**Extended existing skill:**
- `real-estate-readiness` — added house support (Einfamilienhaus, Doppelhaushälfte, Reihenhaus), Neubau vs. Bestand analysis, Sanierungskosten modeling, house-specific running costs. New reference: `references/house-vs-apartment.md`.

### Interaction model

```
/financial-plan → capital-allocation skill
  ├── reads finance/reports/pension-evaluation-*.md (from evaluate-pension)
  ├── reads finance/reports/real-estate-readiness-*.md (from real-estate-readiness)
  ├── reads finance/reports/retirement-readiness-*.md (from retirement-readiness)
  └── reads finance/data/* directly

finanzberater agent → triages to appropriate skill(s)
```

### What is intentionally not done yet (personal finance)

- No automated data ingestion from bank exports or DATEV
- No portfolio rebalancing or ETF selection skill
- No cross-border tax analysis (Progressionsvorbehalt, DBA)
- No insurance review skill (BU, Haftpflicht, PKV vs. GKV)
- No inheritance or estate planning

### Stop conditions (personal finance domain)

Pause before expanding into:

- automated bank statement parsing or CSV import
- real-time portfolio tracking or market data feeds
- insurance product comparison or selection
- cross-border or multi-jurisdiction tax planning
- estate or inheritance planning

The goal: enable informed pension-vs-property capital allocation decisions using user-provided data, not build a full robo-advisor.
