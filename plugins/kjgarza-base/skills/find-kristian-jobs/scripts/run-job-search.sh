#!/usr/bin/env bash
# Unattended full job search (cron / launchd). Deployment glue, not skill logic.
# Usage: run-job-search.sh <repo-dir>
#   <repo-dir>  directory the session runs in; it must contain
#               .claude/find-kristian-jobs.local.md (profile + leads_dir config).
set -euo pipefail

REPO_DIR="${1:?usage: run-job-search.sh <repo-dir>}"
cd "$REPO_DIR"

STAMP="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
LOG_DIR="$REPO_DIR/.cron-logs"
mkdir -p "$LOG_DIR"
LOG_FILE="$LOG_DIR/job-search-$STAMP.log"

# Untrusted web content is read here, so no bypassPermissions: edits are
# auto-accepted, everything else must match the explicit allowlist below.
# Set NOTIFY_CMD to your own notifier; if unset, no notification is sent.
ALLOWED='WebSearch WebFetch Read Glob Grep ToolSearch Write(leads/**) Bash(bash *fetch-job.sh:*) Bash(qurl:*) Bash(mkdir:*) mcp__chrome-devtools__navigate_page mcp__chrome-devtools__take_snapshot'

{
  echo "[$STAMP] Starting scheduled job search"

  claude --permission-mode acceptEdits --allowedTools "$ALLOWED" --print '
Run the `/kjgarza-base:find-kristian-jobs` skill: a full Kristian job search.

Requirements:
- Read and follow the skill and its reference files.
- Save the results exactly as the skill specifies.
- Do not ask interactive questions.
- Stay within the skill search budget.
- Focus on currently open roles only.
'

  if [[ -n "${NOTIFY_CMD:-}" ]]; then
    bash -c "$NOTIFY_CMD" || echo "notify command failed"
  fi

  echo "[$(date -u +"%Y-%m-%dT%H:%M:%SZ")] Finished scheduled job search"
} >> "$LOG_FILE" 2>&1
