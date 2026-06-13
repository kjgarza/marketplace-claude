#!/usr/bin/env bash
# ============================================================================
# notify-telegram.sh — send a message to the user's Telegram via the bot.
#
# Reads the bot token from ~/.claude/channels/telegram/.env (TELEGRAM_BOT_TOKEN)
# and the destination chat id from the first entry of "allowFrom" in
# ~/.claude/channels/telegram/access.json.
#
# Usage:
#   notify-telegram.sh "message text"
#   echo "message text" | notify-telegram.sh
#   notify-telegram.sh --silent-fail "message"   # never exit non-zero
#   notify-telegram.sh --title "Berlin Flats" "message"  # bold title prefix
#
# Dependencies: bash, curl, sed/grep (all in /usr/bin). No jq required.
# Designed to be safe under launchd's minimal environment.
# ============================================================================

set -uo pipefail

TELEGRAM_DIR="${TELEGRAM_DIR:-$HOME/.claude/channels/telegram}"
ENV_FILE="$TELEGRAM_DIR/.env"
ACCESS_FILE="$TELEGRAM_DIR/access.json"

SILENT_FAIL=0
TITLE=""

# --- parse flags ---
while [ $# -gt 0 ]; do
  case "$1" in
    --silent-fail) SILENT_FAIL=1; shift ;;
    --title) TITLE="${2:-}"; shift 2 ;;
    --) shift; break ;;
    *) break ;;
  esac
done

fail() {
  echo "notify-telegram: $1" >&2
  [ "$SILENT_FAIL" -eq 1 ] && exit 0
  exit 1
}

# --- message body: positional arg or stdin ---
if [ $# -gt 0 ] && [ -n "${1:-}" ]; then
  MESSAGE="$1"
else
  MESSAGE="$(cat)"
fi
[ -n "$MESSAGE" ] || fail "empty message"

[ -f "$ENV_FILE" ] || fail "missing $ENV_FILE"
# shellcheck disable=SC1090
TELEGRAM_BOT_TOKEN="$(grep -E '^TELEGRAM_BOT_TOKEN=' "$ENV_FILE" | head -1 | cut -d= -f2- | tr -d '"'"'"' \r\n')"
[ -n "$TELEGRAM_BOT_TOKEN" ] || fail "TELEGRAM_BOT_TOKEN not set in $ENV_FILE"

[ -f "$ACCESS_FILE" ] || fail "missing $ACCESS_FILE"
# Extract first string inside the "allowFrom": [ ... ] array. No jq.
CHAT_ID="$(tr -d '\n' < "$ACCESS_FILE" \
  | sed -n 's/.*"allowFrom"[[:space:]]*:[[:space:]]*\[[[:space:]]*"\([0-9][0-9]*\)".*/\1/p')"
[ -n "$CHAT_ID" ] || fail "could not read allowFrom[0] chat id from $ACCESS_FILE"

# Telegram hard limit is 4096 chars; truncate with a marker.
if [ "${#MESSAGE}" -gt 3900 ]; then
  MESSAGE="${MESSAGE:0:3900}"$'\n\n…(truncated)'
fi

if [ -n "$TITLE" ]; then
  MESSAGE="*${TITLE}*"$'\n'"$MESSAGE"
fi

HTTP_CODE="$(curl -sS -o /tmp/notify-telegram.out -w '%{http_code}' \
  -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" \
  --data-urlencode "chat_id=${CHAT_ID}" \
  --data-urlencode "text=${MESSAGE}" \
  --data-urlencode "parse_mode=Markdown" \
  --data-urlencode "disable_web_page_preview=true" 2>/dev/null)" || fail "curl failed"

if [ "$HTTP_CODE" != "200" ]; then
  # Retry once without Markdown (a stray * or _ can 400 the request).
  HTTP_CODE="$(curl -sS -o /tmp/notify-telegram.out -w '%{http_code}' \
    -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" \
    --data-urlencode "chat_id=${CHAT_ID}" \
    --data-urlencode "text=${MESSAGE}" \
    --data-urlencode "disable_web_page_preview=true" 2>/dev/null)" || fail "curl failed"
fi

[ "$HTTP_CODE" = "200" ] || fail "telegram API returned $HTTP_CODE: $(cat /tmp/notify-telegram.out 2>/dev/null)"
exit 0
