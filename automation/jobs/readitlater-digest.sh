#!/usr/bin/env bash
# readitlater-digest — weekly themed digest via headless Claude, then notify with the path.
set -uo pipefail
source "$(dirname "$0")/../lib/headless-claude.sh"

JOB="readitlater-digest"
export CLAUDE_MODEL="sonnet"

LOGF="$(run_claude "$JOB" "Run the /readitlater-digest:digest skill. After it completes, print a line 'DIGEST_FILE: <path>' with the digest file path." | tail -1)"
CODE=$?

# Find the digest path the run reported (or fall back to a generic message).
DIGEST_PATH=""
if [ -f "$LOGF" ]; then
  DIGEST_PATH="$(grep -oE 'DIGEST_FILE: .*' "$LOGF" | tail -1 | sed 's/DIGEST_FILE: //')"
fi

if [ "$CODE" -eq 0 ]; then
  MSG="📰 ReadItLater weekly digest ready."
  [ -n "$DIGEST_PATH" ] && MSG="$MSG
$DIGEST_PATH"
  "$NOTIFY" --silent-fail --title "ReadItLater" "$MSG"
else
  "$NOTIFY" --silent-fail --title "ReadItLater" "⚠️ digest job failed (exit $CODE). See $LOGF"
fi
exit "$CODE"
