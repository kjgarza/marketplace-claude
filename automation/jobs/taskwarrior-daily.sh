#!/usr/bin/env bash
# taskwarrior-daily — overdue/active/stale summary to Telegram. Pure shell, no LLM.
set -uo pipefail
source "$(dirname "$0")/../lib/headless-claude.sh"

JOB="taskwarrior-daily"
TW="$PLUGIN_CACHE/plugins/taskwarrior/skills/task-workflow/scripts/tw-summary.sh"

# Prefer the plugin's summary script; require `task` to exist.
if ! command -v task >/dev/null 2>&1; then
  echo "$JOB: taskwarrior not installed, skipping"; exit 0
fi

if [ -x "$TW" ]; then
  SUMMARY="$(bash "$TW" --telegram 2>/dev/null || bash "$TW" 2>/dev/null)"
else
  # Fallback inline summary.
  SUMMARY="$(
    echo "🗒️ Tasks"
    echo "Overdue:"; task +OVERDUE minimal 2>/dev/null | head -10
    echo "Active:";  task +ACTIVE  minimal 2>/dev/null | head -10
  )"
fi

# Only notify if there is something actionable. Gate on real Taskwarrior counts,
# not on header words — the fallback summary always prints "Overdue:"/"Active:"
# headers even with zero tasks, which would otherwise spam an empty digest daily.
OVERDUE_N="$(task +OVERDUE count 2>/dev/null || echo 0)"
ACTIVE_N="$(task +ACTIVE count 2>/dev/null || echo 0)"
if [ "$(( ${OVERDUE_N:-0} + ${ACTIVE_N:-0} ))" -gt 0 ]; then
  printf '%s' "$SUMMARY" | "$NOTIFY" --silent-fail --title "Taskwarrior"
fi
echo "$JOB: done"
