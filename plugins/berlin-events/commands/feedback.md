---
name: feedback
description: Record taste feedback (went/skip) on a Berlin event previously surfaced by find-events, to bias future ranking
argument-hint: "[went|skip] [event title or hash] [notes...]"
allowed-tools: Read, Bash
---

# Record Berlin Event Feedback

Capture whether the user actually went to (or skipped) an event that `find-events` previously
showed. Feedback is keyed by the event `hash` stored in the `shown` table and is read back by
`find-events` Step 7.5 to bias ranking toward venues/categories the user likes.

## Steps

1. Resolve paths:

   ```bash
   BUN=$(command -v bun 2>/dev/null || echo "$HOME/.bun/bin/bun")
   PLUGIN_ROOT="${CLAUDE_PLUGIN_ROOT:-plugins/berlin-events}"
   $BUN run "$PLUGIN_ROOT/scripts/events-db.ts" init
   ```

2. Parse `$ARGUMENTS`:
   - **verdict** — `went` or `skip` (required). Ask if missing.
   - **target** — an event hash (hex string) or a fragment of the event title.
   - **notes** — optional free text (why they went/skipped, what they thought).

3. **Resolve the hash.** If the target is not already a hash, list recently shown events and
   match the title fragment to find its `hash`:

   ```bash
   $BUN run "$PLUGIN_ROOT/scripts/events-db.ts" recent-feedback --limit 50
   ```

   The `shown` table holds `hash, title, date, venue`. If the title fragment matches exactly one
   shown event, use its hash. If it matches several, show the candidates and ask the user to pick.
   If it matches none, tell the user the event was never recorded by a `find-events` run (only
   shown events can receive feedback).

4. Record it:

   ```bash
   $BUN run "$PLUGIN_ROOT/scripts/events-db.ts" feedback \
     --hash <resolved-hash> --verdict <went|skip> --notes "<notes>"
   ```

5. Confirm: echo the resolved title, verdict, and that future `find-events` runs will weight
   ranking accordingly.

## Notes

- `went` biases future ranking toward that venue/category; `skip` biases away.
- Only events surfaced by a prior `find-events` run exist in the `shown` table and can be rated.
- This uses the `qurl`/`events-db.ts` state DB — not `qmd`.
