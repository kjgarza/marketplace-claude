#!/usr/bin/env bash
# ============================================================================
# headless-claude.sh — shared helpers for scheduled Claude Code jobs.
#
# Source this from a job script:
#   source "$(dirname "$0")/../lib/headless-claude.sh"
#
# Provides:
#   AUTOMATION_DIR, REPO_ROOT, PLUGIN_CACHE, NOTIFY
#   resolve_claude        -> echoes the claude binary path
#   run_claude <job> <prompt> [extra claude args...]   -> runs headless, logs, returns exit code
#   log_dir <job>         -> echoes (and creates) the per-job log dir
#   require_paths <p...>  -> notifies + exits if any path is missing
#   berlin_quiet_hours    -> returns 0 (true) if 22:00–07:00 Europe/Berlin
# ============================================================================

set -uo pipefail

AUTOMATION_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
NOTIFY="$AUTOMATION_DIR/notify-telegram.sh"

# Repo root = two levels up from automation/ (works whether run from the repo or the cache copy).
REPO_ROOT="$(cd "$AUTOMATION_DIR/.." && pwd)"

# Plugin cache the headless `claude` should load plugins from.
PLUGIN_CACHE="${CLAUDE_PLUGIN_CACHE:-$HOME/.claude/plugins/cache/marketplace-claude}"

resolve_claude() {
  if [ -n "${CLAUDE_BIN:-}" ] && [ -x "$CLAUDE_BIN" ]; then echo "$CLAUDE_BIN"; return; fi
  command -v claude 2>/dev/null && return
  for c in "$HOME/.local/bin/claude" /usr/local/bin/claude /opt/homebrew/bin/claude; do
    [ -x "$c" ] && { echo "$c"; return; }
  done
  echo ""  # caller checks for empty
}

log_dir() {
  local job="$1"
  local d="$HOME/Logs/$job"
  mkdir -p "$d"
  echo "$d"
}

require_paths() {
  local missing=()
  for p in "$@"; do [ -e "$p" ] || missing+=("$p"); done
  if [ "${#missing[@]}" -gt 0 ]; then
    "$NOTIFY" --silent-fail --title "Claude job error" \
      "Missing required path(s): ${missing[*]}" >/dev/null 2>&1
    echo "ERROR: missing paths: ${missing[*]}" >&2
    exit 1
  fi
}

berlin_quiet_hours() {
  local h
  h="$(TZ='Europe/Berlin' date +%H)"
  # 22, 23, 00..06 are quiet
  if [ "$h" -ge 22 ] || [ "$h" -lt 7 ]; then return 0; fi
  return 1
}

# run_claude <job-name> <prompt> [extra args...]
run_claude() {
  local job="$1"; shift
  local prompt="$1"; shift
  local claude; claude="$(resolve_claude)"
  if [ -z "$claude" ]; then
    "$NOTIFY" --silent-fail --title "Claude job error" "$job: claude binary not found" >/dev/null 2>&1
    echo "ERROR: claude not found" >&2
    return 127
  fi

  local ld; ld="$(log_dir "$job")"
  local ts; ts="$(date +%Y-%m-%d_%H%M%S)"
  local logf="$ld/$ts.log"

  local plugin_flags=()
  [ -d "$PLUGIN_CACHE" ] && plugin_flags+=(--plugin-dir "$PLUGIN_CACHE")

  echo "=== $job — $(date) ===" | tee "$logf"
  "$claude" -p "$prompt" \
    --model "${CLAUDE_MODEL:-sonnet}" \
    --output-format text \
    --allowedTools "${CLAUDE_ALLOWED_TOOLS:-Bash,Read,Glob,Grep,Write,Edit,WebFetch,WebSearch,Agent,Skill}" \
    "${plugin_flags[@]}" \
    2>&1 | tee -a "$logf"
  local code=${PIPESTATUS[0]}
  echo "=== $job finished $(date) — exit $code ===" | tee -a "$logf"
  echo "$logf"  # last line = log path (for caller); separate from return code
  return $code
}
