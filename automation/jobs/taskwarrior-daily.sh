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

# Only notify if there is something actionable (overdue or active present).
if printf '%s' "$SUMMARY" | grep -qiE 'overdue|active|due|stale' ; then
  printf '%s' "$SUMMARY" | "$NOTIFY" --silent-fail --title "Taskwarrior"
fi
echo "$JOB: done"
