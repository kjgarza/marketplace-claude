---
name: skr04-kontenrahmen
description: Use for SKR04 account lookup, DATEV account mapping, chart-of-accounts questions, and when a German bookkeeping task needs the likely account number for revenue, expense, asset, liability, equity, tax, payroll, or closing entries. Trigger on terms like SKR04, Konto, Kontenrahmen, DATEV, Gegenkonto, Kontonummer, buchen auf welches Konto, and account-mapping requests.
portable: false
---

> `<plugin_dir>` = this plugin's root directory (two levels above this SKILL.md).

# SKR04 Account Lookup

Use this skill to ground bookkeeping answers in plausible SKR04 account numbers instead of freeform guesses.

## Data source

Read `<plugin_dir>/templates/skr04-accounts.json` before proposing account mappings.

For Bilanz/GuV preparation flows, also consult:
- `<plugin_dir>/skills/hgb-closing-flow/references/skr04-hgb-starter-mapping.md`

## Working method

1. Identify the business event.
2. Find the closest matching account in `skr04-accounts.json`.
3. Prefer the most specific account that matches VAT treatment and statement classification.
4. If multiple accounts are plausible, list the top options and explain the deciding factor.
5. Return both account number and account name.
6. If the task is statement preparation rather than a single booking, add the likely HGB destination line from the starter mapping reference when available.

## Output format

When used inside a booking answer, format accounts like:
- `Soll 6815 Bueroaufwand`
- `Haben 1200 Bank`

When used as a lookup answer, format like:
- `6815 Bueroaufwand` - common choice for office supplies and consumables

## Guardrails

- Treat `skr04-accounts.json` as the source of truth for this plugin.
- Treat the starter HGB mapping reference as a pragmatic aid for close flows, not as a complete DATEV or statutory taxonomy.
- Do not claim certainty when several common practice mappings exist.
- Flag when account selection depends on whether the item is operating expense, fixed asset, private withdrawal, or payroll.
- If the needed account is missing from the JSON, say so and suggest the nearest available class.
