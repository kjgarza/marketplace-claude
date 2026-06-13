#!/usr/bin/env bash
# vhs-watch-check — re-run saved VHS watches, notify only when changes. Pure bun, no LLM.
set -uo pipefail
source "$(dirname "$0")/../lib/headless-claude.sh"

JOB="vhs-watch-check"
PLUGIN="$PLUGIN_CACHE/plugins/vhs-berlin-agent"
require_paths "$PLUGIN/scripts/watch.ts"

BUN="$(command -v bun 2>/dev/null || echo "$HOME/.bun/bin/bun")"
DB="${VHS_BERLIN_DB:-$HOME/.local/share/vhs-berlin/vhs.db}"
LD="$(log_dir "$JOB")"; LOG="$LD/$(date +%Y-%m-%d_%H%M%S).log"

# Ensure deps + DB exist (idempotent).
( cd "$PLUGIN" && { [ -d node_modules ] || "$BUN" install; } ) >>"$LOG" 2>&1
[ -f "$DB" ] || ( cd "$PLUGIN" && "$BUN" run scripts/init-db.ts --db-path "$DB" ) >>"$LOG" 2>&1

OUT="$(cd "$PLUGIN" && "$BUN" run scripts/watch.ts check --db-path "$DB" 2>>"$LOG")"
echo "$OUT" >> "$LOG"

SUMMARY="$(printf '%s' "$OUT" | /usr/bin/python3 "$(dirname "$0")/vhs-watch-summary.py")"

if [ -n "$SUMMARY" ]; then
  printf '%s' "$SUMMARY" | "$NOTIFY" --silent-fail --title "VHS Berlin"
fi
echo "$JOB: done"
