#!/usr/bin/env bash
# berlin-events-weekly — Friday weekend events digest via headless Claude, sent to Telegram.
set -uo pipefail
source "$(dirname "$0")/../lib/headless-claude.sh"

JOB="berlin-events-weekly"
export CLAUDE_MODEL="sonnet"

PROMPT='Run the /berlin-events:find-events skill for this coming weekend. Then output ONLY the final curated event list as plain text suitable for a phone message (no preamble), prefixed with a line "TELEGRAM_BEGIN" and ending with "TELEGRAM_END".'

LOGF="$(run_claude "$JOB" "$PROMPT" | tail -1)"
CODE=$?

DIGEST=""
if [ -f "$LOGF" ]; then
  DIGEST="$(awk '/TELEGRAM_BEGIN/{f=1;next}/TELEGRAM_END/{f=0}f' "$LOGF")"
fi

if [ "$CODE" -eq 0 ] && [ -n "$DIGEST" ]; then
  printf '%s' "$DIGEST" | "$NOTIFY" --silent-fail --title "Berlin This Weekend"
elif [ "$CODE" -eq 0 ]; then
  "$NOTIFY" --silent-fail --title "Berlin Events" "Weekend events run finished but produced no list. See $LOGF"
else
  "$NOTIFY" --silent-fail --title "Berlin Events" "⚠️ events job failed (exit $CODE). See $LOGF"
fi
exit "$CODE"
