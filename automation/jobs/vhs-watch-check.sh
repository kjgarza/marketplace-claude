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
( cd "$PLUGIN" && [ -d node_modules ] || "$BUN" install ) >>"$LOG" 2>&1
[ -f "$DB" ] || ( cd "$PLUGIN" && "$BUN" run scripts/init-db.ts --db-path "$DB" ) >>"$LOG" 2>&1

OUT="$(cd "$PLUGIN" && "$BUN" run scripts/watch.ts check --db-path "$DB" 2>>"$LOG")"
echo "$OUT" >> "$LOG"

SUMMARY="$(printf '%s' "$OUT" | /usr/bin/python3 -c '
import sys, json
try:
    d = json.load(sys.stdin)
except Exception:
    sys.exit(0)
changes = d.get("changes") or d.get("events") or []
if isinstance(d, dict) and d.get("total_changes", 0) == 0:
    sys.exit(0)
if not changes:
    sys.exit(0)
lines = [f"\U0001F4DA VHS Berlin: {len(changes)} change(s)"]
for c in changes[:15]:
    lines.append(f"• {c.get(\"label\") or c.get(\"event_type\") or \"\"}: {c.get(\"detail\") or c.get(\"title\") or \"\"}")
print("\n".join(lines))
')"

if [ -n "$SUMMARY" ]; then
  printf '%s' "$SUMMARY" | "$NOTIFY" --silent-fail --title "VHS Berlin"
fi
echo "$JOB: done"
