#!/usr/bin/env bash
# berlin-flats-hunt — single hunt, notify on new pending/review listings. Pure node, no LLM.
set -uo pipefail
source "$(dirname "$0")/../lib/headless-claude.sh"

JOB="berlin-flats-hunt"
PLUGIN="$PLUGIN_CACHE/plugins/berlin-flats"
require_paths "$PLUGIN/scripts/hunt.js"

# Quiet hours: skip the run entirely (no scraping, no notify) 22:00–07:00 Berlin.
if berlin_quiet_hours; then echo "$JOB: quiet hours, skipping"; exit 0; fi

NODE="$(command -v node 2>/dev/null || echo /opt/homebrew/bin/node)"
LD="$(log_dir "$JOB")"; LOG="$LD/$(date +%Y-%m-%d_%H%M%S).log"

OUT="$(cd "$PLUGIN" && "$NODE" --experimental-sqlite scripts/hunt.js --json 2>>"$LOG")"
echo "$OUT" >> "$LOG"

# Count new pending/review listings and build a notification (parser kept in a
# helper script per the repo's no-multiline-python-c rule).
SUMMARY="$(printf '%s' "$OUT" | /usr/bin/python3 "$(dirname "$0")/berlin-flats-summary.py")"

if [ -n "$SUMMARY" ]; then
  printf '%s' "$SUMMARY" | "$NOTIFY" --silent-fail --title "Berlin Flats"
fi
echo "$JOB: done"
