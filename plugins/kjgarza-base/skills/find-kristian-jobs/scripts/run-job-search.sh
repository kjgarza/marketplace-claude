#!/usr/bin/env bash
set -euo pipefail

REPO_DIR="/home/node/.openclaw/workspace/aves/kjgarza.github.io"
cd "$REPO_DIR"

STAMP="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
LOG_DIR="$REPO_DIR/.cron-logs"
mkdir -p "$LOG_DIR"
LOG_FILE="$LOG_DIR/job-search-$STAMP.log"

{
  echo "[$STAMP] Starting scheduled job search"

  claude --permission-mode bypassPermissions --print '
Use the local skill `find-kristian-jobs` from this repository to run a full Kristian job search.

Requirements:
- Read and follow the skill and its reference files.
- Save the results to the repository exactly as the skill specifies.
- Do not ask interactive questions.
- Stay within the skill search budget.
- Focus on currently open roles only.

When completely finished, run this command to notify me:
openclaw system event --text "Done: completed scheduled Kristian job search in kjgarza.github.io" --mode now
'

  echo "[$(date -u +"%Y-%m-%dT%H:%M:%SZ")] Finished scheduled job search"
} >> "$LOG_FILE" 2>&1
