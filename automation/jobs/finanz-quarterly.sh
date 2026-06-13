#!/usr/bin/env bash
# finanz-quarterly — quarterly financial re-projection + data-staleness check via headless Claude.
set -uo pipefail
source "$(dirname "$0")/../lib/headless-claude.sh"

JOB="finanz-quarterly"
export CLAUDE_MODEL="sonnet"

PROMPT='Use the finanz-pilot finanzberater agent to: (1) check which finance/data files are stale (>90 days), (2) run financial-analysis and compare against the most recent prior report, (3) summarize key deltas and any data that needs refreshing. Output a concise summary between "TELEGRAM_BEGIN" and "TELEGRAM_END" markers, phone-friendly.'

LOGF="$(run_claude "$JOB" "$PROMPT" | tail -1)"
CODE=$?

SUMMARY=""
if [ -f "$LOGF" ]; then
  SUMMARY="$(awk '/TELEGRAM_BEGIN/{f=1;next}/TELEGRAM_END/{f=0}f' "$LOGF")"
fi

if [ "$CODE" -eq 0 ] && [ -n "$SUMMARY" ]; then
  printf '%s' "$SUMMARY" | "$NOTIFY" --silent-fail --title "Finanz-Pilot (quarterly)"
elif [ "$CODE" -ne 0 ]; then
  "$NOTIFY" --silent-fail --title "Finanz-Pilot" "⚠️ quarterly job failed (exit $CODE). See $LOGF"
fi
exit "$CODE"
