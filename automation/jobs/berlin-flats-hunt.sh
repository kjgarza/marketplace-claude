#!/usr/bin/env bash
# berlin-flats-hunt — single hunt, notify on new pending/review listings. Pure Bun, no LLM.
set -uo pipefail
source "$(dirname "$0")/../lib/headless-claude.sh"

JOB="berlin-flats-hunt"
PLUGIN="$PLUGIN_CACHE/plugins/berlin-flats"
SUMMARY_TS="$(dirname "$0")/../lib/berlin-flats-summary.ts"
require_paths "$PLUGIN/scripts/hunt.ts" "$SUMMARY_TS"

# Quiet hours: skip the run entirely (no scraping, no notify) 22:00–07:00 Berlin.
if berlin_quiet_hours; then echo "$JOB: quiet hours, skipping"; exit 0; fi

BUN_BIN="$(command -v bun 2>/dev/null || echo /opt/homebrew/bin/bun)"
LD="$(log_dir "$JOB")"; LOG="$LD/$(date +%Y-%m-%d_%H%M%S).log"

OUT="$(cd "$PLUGIN" && "$BUN_BIN" scripts/hunt.ts --json 2>>"$LOG")"
echo "$OUT" >> "$LOG"

SUMMARY="$(printf '%s' "$OUT" | "$BUN_BIN" "$SUMMARY_TS")"

if [ -n "$SUMMARY" ]; then
  printf '%s' "$SUMMARY" | "$NOTIFY" --silent-fail --title "Berlin Flats"
fi
echo "$JOB: done"
