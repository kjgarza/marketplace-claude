#!/usr/bin/env bash
# Print a quick task summary: overdue, due today, active, stale (>14d untouched), and next up.
#
# Flags:
#   --telegram   Emit a compact phone-friendly summary and pipe it to the shared
#                automation/notify-telegram.sh (no-op send if there is nothing actionable).

set -uo pipefail

TELEGRAM=0
[ "${1:-}" = "--telegram" ] && TELEGRAM=1

if ! command -v task >/dev/null 2>&1; then
  echo "taskwarrior not installed" >&2
  exit 0
fi

OVERDUE="$(task rc.verbose=nothing +OVERDUE list 2>/dev/null || true)"
TODAY="$(task rc.verbose=nothing +TODAY list 2>/dev/null || true)"
ACTIVE="$(task rc.verbose=nothing +ACTIVE list 2>/dev/null || true)"
# Stale: pending, not active, not yet due, untouched for >14 days (by entry/modified).
STALE="$(task rc.verbose=nothing status:pending -ACTIVE modified.before:now-14d list 2>/dev/null || true)"
NEXT="$(task rc.verbose=nothing limit:5 next 2>/dev/null || true)"

if [ "$TELEGRAM" -eq 1 ]; then
  # Compact form for a phone. Only include sections that have content.
  OUT=""
  add() { local title="$1" body="$2"; [ -n "$(printf '%s' "$body" | sed '/^$/d')" ] && OUT="${OUT}${title}\n${body}\n\n"; }
  add "⏰ Overdue:" "$(printf '%s' "$OVERDUE" | sed '/^$/d' | head -8)"
  add "📅 Due today:" "$(printf '%s' "$TODAY" | sed '/^$/d' | head -8)"
  add "▶️ Active:" "$(printf '%s' "$ACTIVE" | sed '/^$/d' | head -8)"
  add "🕸️ Stale (>14d):" "$(printf '%s' "$STALE" | sed '/^$/d' | head -8)"

  if [ -z "$OUT" ]; then
    echo "(nothing actionable)"
    exit 0
  fi

  # Locate the shared notifier (scripts/ -> task-workflow -> skills -> taskwarrior -> plugins -> root).
  HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
  NOTIFY="$(cd "$HERE/../../../../.." 2>/dev/null && pwd)/automation/notify-telegram.sh"
  if [ -x "$NOTIFY" ]; then
    printf '%b' "$OUT" | "$NOTIFY" --silent-fail --title "Taskwarrior"
  fi
  printf '%b' "$OUT"
  exit 0
fi

echo "=== Task Summary ==="
echo ""
echo "--- By Project ---"
task summary 2>/dev/null || task projects 2>/dev/null || echo "(no projects)"
echo ""
echo "--- Overdue ---"
printf '%s\n' "${OVERDUE:-(none)}"
echo ""
echo "--- Due Today ---"
printf '%s\n' "${TODAY:-(none)}"
echo ""
echo "--- Active (started) ---"
printf '%s\n' "${ACTIVE:-(none)}"
echo ""
echo "--- Stale (pending, untouched >14d) ---"
printf '%s\n' "${STALE:-(none)}"
echo ""
echo "--- Next Up ---"
printf '%s\n' "${NEXT:-(none)}"
