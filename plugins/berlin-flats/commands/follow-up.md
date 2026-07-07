---
description: Review the contact pipeline (contacted/viewing/applied/offer), draft nudges for stale contacts and next-step messages via scribe.
allowed-tools: Bash, Read, Agent
---

Resolve Bun once:

```bash
BUN_BIN="$(command -v bun 2>/dev/null || true)"
for c in "${HOME:-}/.bun/bin/bun" /opt/homebrew/bin/bun /usr/local/bin/bun; do
  [ -n "$BUN_BIN" ] && break; [ -x "$c" ] && BUN_BIN="$c"
done
: "${BUN_BIN:=bun}"
```

## Step 1 — Load the pipeline

```bash
cd $CLAUDE_PLUGIN_ROOT && "$BUN_BIN" scripts/queue.ts pipeline
```

Present a table: id | title | verdict | days_in_state | warm_rent | URL.

## Step 2 — Per-listing actions

Walk the listings oldest-first and suggest per state (thresholds: Berlin landlords answer within a few days or not at all, so nudge once after 4+ days; a viewing without an application within 2 days loses the flat):

- **contacted, days_in_state ≥ 4** → offer a nudge: invoke `scribe` with `mode: nudge`. On send, keep verdict `contacted` (a nudge is not a state change).
- **contacted, got a viewing invitation** (ask the user) → `set-verdict.ts --id <id> --verdict viewing`, then offer `scribe` `mode: viewing_confirm`.
- **viewing, days_in_state ≥ 1** → recommend running `/berlin-flats:prepare-application <id>` to submit the application; on confirmation set verdict `applied`.
- **applied, days_in_state ≥ 7** → offer a polite status inquiry (`scribe` `mode: nudge`).
- **offer** → congratulate; remind about the Kaution cap (max 3 cold rents, § 551 BGB) and contract checks from `skills/berlin-context`.
- Dead-end (landlord declined / flat gone) → `set-verdict.ts --id <id> --verdict dead --reason "<why>"`.

Apply state changes only after the user confirms each one:

```bash
cd $CLAUDE_PLUGIN_ROOT && "$BUN_BIN" scripts/set-verdict.ts --id <id> --verdict <verdict> [--reason "..."]
```

## Step 3 — Summary

Show counts per state and the single most urgent action.
