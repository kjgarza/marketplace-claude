#!/usr/bin/env bash
# bookclub-dispatch — generate any book-club messages due today and send to Telegram to paste.
set -uo pipefail
source "$(dirname "$0")/../lib/headless-claude.sh"

JOB="bookclub-dispatch"
export CLAUDE_MODEL="sonnet"

# The /bookclub:dispatch command scans timelines for due+unsent entries, generates them,
# sends each via notify-telegram.sh itself, and marks them sent. This job just triggers it.
LOGF="$(run_claude "$JOB" "Run the /bookclub:dispatch command. Working directory holds the book-club folders." | tail -1)"
CODE=$?

if [ "$CODE" -ne 0 ]; then
  "$NOTIFY" --silent-fail --title "Book Club" "⚠️ dispatch failed (exit $CODE). See $LOGF"
fi
exit "$CODE"
