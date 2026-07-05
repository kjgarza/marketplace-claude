#!/usr/bin/env bash
# fetch-job.sh — Fetch a job posting and extract metadata (URL, content, posted_date, status)
#
# Usage:
#   ./scripts/fetch-job.sh <job-url>
#
# Output: JSON to stdout
#   { "url": "...", "posted_date": "YYYY-MM-DD|unknown", "status": "open|closed|unknown",
#     "content": "...", "questions": [{"label": "...", "required": true, "type": "..."}] }
#
# "questions" is the application form's fields when the ATS exposes them
# (currently Greenhouse only); empty array otherwise.
#
# Fetch chain:
#   1. Greenhouse public API (if URL matches greenhouse.io pattern) — best for dates
#   2. Jina Reader (r.jina.ai) — clean markdown for all other URLs
#   3. WebFetch via curl — plain HTML fallback
#
# Requires: curl, jq, JINA_API_KEY env var (for Jina Reader)

set -euo pipefail

URL="${1:-}"
if [[ -z "$URL" ]]; then
  echo '{"error": "Usage: fetch-job.sh <job-url>"}' >&2
  exit 1
fi

JINA_KEY="${JINA_API_KEY:-}"
TIMEOUT=20

# ── helpers ──────────────────────────────────────────────────────────────────

extract_date_from_text() {
  local text="$1"
  # Patterns: "Posted April 6, 2026", "Date posted: 2026-04-06", "Listed: Mar 2026", etc.
  echo "$text" | grep -oiE \
    '(posted|listed|date posted|published|updated)[^0-9]{0,20}(20[0-9]{2}-[0-9]{2}-[0-9]{2}|[A-Za-z]+ [0-9]{1,2},? 20[0-9]{2}|[0-9]{1,2} [A-Za-z]+ 20[0-9]{2})' \
    | head -1 \
    | grep -oE '(20[0-9]{2}-[0-9]{2}-[0-9]{2}|[A-Za-z]+ [0-9]{1,2},? 20[0-9]{2}|[0-9]{1,2} [A-Za-z]+ 20[0-9]{2})' \
    | head -1 || echo ""
}

detect_closed() {
  local text="$1"
  if echo "$text" | grep -qiE \
    'no longer (accepting|available)|position (filled|closed)|job (closed|no longer)|this (role|position) (has been|is) (filled|closed|removed)'; then
    echo "closed"
  else
    echo "open"
  fi
}

emit_json() {
  local url="$1" posted_date="$2" status="$3" content="$4" questions="${5:-[]}"
  jq -n \
    --arg url "$url" \
    --arg posted_date "$posted_date" \
    --arg status "$status" \
    --arg content "$content" \
    --argjson questions "$questions" \
    '{url: $url, posted_date: $posted_date, status: $status, content: $content, questions: $questions}'
}

# ── Greenhouse public API ─────────────────────────────────────────────────────
# Greenhouse exposes a public jobs API — no auth needed.
# URL pattern: https://job-boards.greenhouse.io/{board}/jobs/{id}
#           or https://boards.greenhouse.io/{board}/jobs/{id}

if echo "$URL" | grep -qE 'greenhouse\.io/([^/]+)/jobs/([0-9]+)'; then
  BOARD=$(echo "$URL" | grep -oE 'greenhouse\.io/([^/]+)/jobs' | cut -d'/' -f2)
  JOB_ID=$(echo "$URL" | grep -oE '/jobs/([0-9]+)' | grep -oE '[0-9]+')

  API_URL="https://api.greenhouse.io/v1/boards/${BOARD}/jobs/${JOB_ID}?questions=true"
  RESPONSE=$(curl -sf --max-time "$TIMEOUT" "$API_URL" 2>/dev/null || echo "")

  if [[ -n "$RESPONSE" ]] && echo "$RESPONSE" | jq -e '.id' >/dev/null 2>&1; then
    TITLE=$(echo "$RESPONSE" | jq -r '.title // ""')
    LOCATION=$(echo "$RESPONSE" | jq -r '.location.name // ""')
    # Greenhouse API returns updated_at (ISO8601) — closest proxy to posted date
    UPDATED=$(echo "$RESPONSE" | jq -r '.updated_at // ""')
    POSTED_DATE=$(echo "$UPDATED" | grep -oE '20[0-9]{2}-[0-9]{2}-[0-9]{2}' | head -1 || echo "unknown")
    CONTENT="# ${TITLE}\nLocation: ${LOCATION}\nUpdated: ${UPDATED}\n\n$(echo "$RESPONSE" | jq -r '.content // ""' | sed 's/<[^>]*>//g')"
    STATUS="open"  # If the API returns a job, it's live
    # Application form fields (label, required, type, select options if any)
    QUESTIONS=$(echo "$RESPONSE" | jq -c '[.questions[]? | {
      label: .label,
      required: .required,
      type: (.fields[0].type // "unknown"),
      options: ([.fields[0].values[]?.label] | if length > 0 then . else null end)
    }]' 2>/dev/null || echo "[]")
    emit_json "$URL" "$POSTED_DATE" "$STATUS" "$CONTENT" "$QUESTIONS"
    exit 0
  fi
fi

# ── Lever public API ──────────────────────────────────────────────────────────
# URL pattern: https://jobs.lever.co/{company}/{uuid}

if echo "$URL" | grep -qE 'jobs\.lever\.co/([^/]+)/([a-f0-9-]+)'; then
  COMPANY=$(echo "$URL" | grep -oE 'lever\.co/([^/]+)/' | cut -d'/' -f2)
  JOB_UUID=$(echo "$URL" | grep -oE '/([a-f0-9]{8}-[a-f0-9-]+)' | head -1 | tr -d '/')

  API_URL="https://api.lever.co/v0/postings/${COMPANY}/${JOB_UUID}"
  RESPONSE=$(curl -sf --max-time "$TIMEOUT" "$API_URL" 2>/dev/null || echo "")

  if [[ -n "$RESPONSE" ]] && echo "$RESPONSE" | jq -e '.text' >/dev/null 2>&1; then
    TITLE=$(echo "$RESPONSE" | jq -r '.text // ""')
    LOCATION=$(echo "$RESPONSE" | jq -r '.categories.location // ""')
    # Lever returns createdAt as Unix ms
    CREATED_MS=$(echo "$RESPONSE" | jq -r '.createdAt // 0')
    if [[ "$CREATED_MS" -gt 0 ]]; then
      POSTED_DATE=$(date -d "@$((CREATED_MS / 1000))" +"%Y-%m-%d" 2>/dev/null || echo "unknown")
    else
      POSTED_DATE="unknown"
    fi
    CONTENT="# ${TITLE}\nLocation: ${LOCATION}\n\n$(echo "$RESPONSE" | jq -r '.descriptionPlain // .description // ""' | sed 's/<[^>]*>//g')"
    STATUS=$(detect_closed "$CONTENT")
    emit_json "$URL" "$POSTED_DATE" "$STATUS" "$CONTENT"
    exit 0
  fi
fi

# ── Jina Reader ───────────────────────────────────────────────────────────────

if [[ -n "$JINA_KEY" ]]; then
  JINA_RESPONSE=$(curl -sf --max-time "$TIMEOUT" \
    -H "Authorization: Bearer ${JINA_KEY}" \
    -H "X-Return-Format: markdown" \
    "https://r.jina.ai/${URL}" 2>/dev/null || echo "")

  if [[ -n "$JINA_RESPONSE" ]] && ! echo "$JINA_RESPONSE" | grep -qi "error\|not found\|403\|429"; then
    POSTED_DATE=$(extract_date_from_text "$JINA_RESPONSE")
    [[ -z "$POSTED_DATE" ]] && POSTED_DATE="unknown"
    STATUS=$(detect_closed "$JINA_RESPONSE")
    emit_json "$URL" "$POSTED_DATE" "$STATUS" "$JINA_RESPONSE"
    exit 0
  fi
fi

# ── Plain curl fallback ───────────────────────────────────────────────────────

PLAIN=$(curl -sfL --max-time "$TIMEOUT" \
  -A "Mozilla/5.0 (compatible; job-fetch/1.0)" \
  "$URL" 2>/dev/null | sed 's/<[^>]*>//g; /^[[:space:]]*$/d' || echo "")

if [[ -n "$PLAIN" ]]; then
  POSTED_DATE=$(extract_date_from_text "$PLAIN")
  [[ -z "$POSTED_DATE" ]] && POSTED_DATE="unknown"
  STATUS=$(detect_closed "$PLAIN")
  emit_json "$URL" "$POSTED_DATE" "$STATUS" "$PLAIN"
  exit 0
fi

# ── All methods failed ────────────────────────────────────────────────────────

emit_json "$URL" "unknown" "unknown" ""
