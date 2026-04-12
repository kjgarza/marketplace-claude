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

## Stop conditions

Pause before expanding into:

- full VAT automation
- giant SKR04 coverage work
- bookkeeping ingestion/parsing pipelines
- broad personal-finance refactors unrelated to HGB close flows

The goal remains: small, coherent increments that improve HGB statement usefulness without turning the plugin into a full accounting system.
