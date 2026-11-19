#!/usr/bin/env bash
# fetch-job.sh — Fetch a job posting and extract metadata (URL, content, posted_date, status)
#
# Usage:
#   ./scripts/fetch-job.sh <job-url>                  # one posting  → JSON object
#   ./scripts/fetch-job.sh <url> <url> <url> ...      # many         → JSON array
#   ./scripts/fetch-job.sh --jobs 8 <url> ...         # set parallelism (default 6)
#
# Output: JSON to stdout
#   { "url": "...", "posted_date": "YYYY-MM-DD|unknown", "status": "open|closed|unknown",
#     "content": "...",
#     "questions": [{"label": "...", "required": true, "type": "...", "options": ["..."]}] }
#
# "questions" is the application form's fields when the ATS exposes them
#
# Passing several URLs fetches them CONCURRENTLY and emits a JSON array in the same
# order as the arguments. Scoring a shortlist is the normal case, so prefer one batch
# call over a shell loop: the loop is serial and pays every network round-trip end to
# end, while a batch of 15 postings completes in roughly the time of the slowest one.
#
# Fetch chain:
#   1. Greenhouse public API (if URL matches greenhouse.io pattern) — best for dates
#   2. Lever public API
#   3. Ashby single-posting GraphQL (one posting, ~12KB — never the whole board)
#   4. Jina Reader (r.jina.ai) — clean markdown for all other URLs
#   5. WebFetch via curl — plain HTML fallback
#
# Requires: curl, jq, grep, sed, and perl (used to convert Ashby descriptionHtml to
# text). Optional: JINA_API_KEY (for Jina Reader).
# Bash 3.2 compatible — batch mode avoids `wait -n` for macOS's default /bin/bash.

set -euo pipefail

JOBS=6
if [[ "${1:-}" == "--jobs" ]]; then
  JOBS="${2:-6}"
  shift 2
  # Validate before use: an unvalidated value reaches an arithmetic comparison
  # below, where a non-numeric string is treated as a variable name and aborts
  # the script under `set -u` ("abc: unbound variable"), and 0 would throttle on
  # every iteration — silently turning the batch back into a serial loop.
  if ! [[ "$JOBS" =~ ^[1-9][0-9]*$ ]]; then
    echo "{\"error\": \"--jobs must be a positive integer, got: $JOBS\"}" >&2
    exit 1
  fi
fi

if [[ $# -eq 0 ]]; then
  echo '{"error": "Usage: fetch-job.sh [--jobs N] <job-url> [<job-url> ...]"}' >&2
  exit 1
fi

# ── batch mode: re-enter this script once per URL, bounded concurrency ────────
# Each child writes to its own temp file so partial writes can't interleave on
# stdout; results are then concatenated in argument order.

if [[ $# -gt 1 ]]; then
  SELF="${BASH_SOURCE[0]}"
  BATCH_DIR=$(mktemp -d "${TMPDIR:-/tmp}/fetch-job-batch.XXXXXX")
  trap 'rm -rf "$BATCH_DIR"' EXIT

  # Throttle by waiting on the OLDEST pid once $JOBS are in flight. `wait -n`
  # would be the obvious choice but does not exist in Bash 3.2 — the default
  # /bin/bash on macOS — where it fails silently and lets the batch fan out
  # unbounded. This form works on 3.2 and up.
  idx=0
  PIDS=()
  for u in "$@"; do
    idx=$((idx + 1))
    printf -v padded '%04d' "$idx"
    ( bash "$SELF" "$u" > "$BATCH_DIR/$padded.json" 2>/dev/null \
      || jq -n --arg url "$u" '{url:$url,posted_date:"unknown",status:"unknown",content:"",questions:[]}' \
         > "$BATCH_DIR/$padded.json" ) &
    PIDS+=($!)
    if [[ ${#PIDS[@]} -ge $JOBS ]]; then
      wait "${PIDS[0]}" 2>/dev/null || true
      PIDS=("${PIDS[@]:1}")
    fi
  done
  wait

  jq -s '.' "$BATCH_DIR"/*.json
  exit 0
fi

URL="$1"

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
      options: ([.fields[0].values[]?.label])
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

# ── Ashby single-posting API ──────────────────────────────────────────────────
# URL pattern: https://jobs.ashbyhq.com/{board}/{uuid}[/application]
#
# Resolve ONE posting with the public non-user-graphql ApiJobPosting query. The
# obvious alternative — GET posting-api/job-board/{board} and filter client-side —
# downloads the entire board to answer a question about a single job: OpenAI's board
# is 12.5 MB, so scoring a 15-role shortlist that way would pull ~190 MB and risk
# timeouts. The GraphQL query returns ~12 KB regardless of board size.
#
# publishedDate is already YYYY-MM-DD (a true publish date, unlike Greenhouse's
# updated_at) and isListed detects a delisted-but-still-reachable posting.
# Board-wide listing still belongs in fetch-board.sh — that's when you want the board.

if echo "$URL" | grep -qE 'jobs\.ashbyhq\.com/[^/]+/[A-Za-z0-9-]+'; then
  BASE="${URL%%\?*}"; BASE="${BASE%/}"; BASE="${BASE%/application}"
  BOARD=$(echo "$BASE" | sed -E 's|.*jobs\.ashbyhq\.com/([^/]+)/.*|\1|')
  JOB_ID=$(echo "$BASE" | sed -E 's|.*/([A-Za-z0-9-]+)$|\1|')

  GQL=$(jq -n --arg org "$BOARD" --arg jid "$JOB_ID" '{
    operationName: "ApiJobPosting",
    variables: {organizationHostedJobsPageName: $org, jobPostingId: $jid},
    query: "query ApiJobPosting($organizationHostedJobsPageName: String!, $jobPostingId: String!) { jobPosting(organizationHostedJobsPageName: $organizationHostedJobsPageName, jobPostingId: $jobPostingId) { id title departmentName locationName employmentType publishedDate isListed compensationTierSummary descriptionHtml } }"
  }')

  RESPONSE=$(curl -sf --max-time "$TIMEOUT" \
    -H "Content-Type: application/json" \
    -H "Origin: https://jobs.ashbyhq.com" \
    --data-raw "$GQL" \
    "https://jobs.ashbyhq.com/api/non-user-graphql?op=ApiJobPosting" 2>/dev/null || echo "")

  if [[ -n "$RESPONSE" ]] && echo "$RESPONSE" | jq -e '.data.jobPosting.id' >/dev/null 2>&1; then
    POSTING=$(echo "$RESPONSE" | jq -c '.data.jobPosting')
    TITLE=$(echo "$POSTING"    | jq -r '.title // ""')
    LOCATION=$(echo "$POSTING" | jq -r '.locationName // ""')
    DEPT=$(echo "$POSTING"     | jq -r '.departmentName // ""')
    PUBLISHED=$(echo "$POSTING" | jq -r '.publishedDate // ""')
    POSTED_DATE="${PUBLISHED:0:10}"
    [[ -z "$POSTED_DATE" ]] && POSTED_DATE="unknown"
    # isListed false = pulled from the board but the URL still resolves
    LISTED=$(echo "$POSTING" | jq -r '.isListed // false')
    if [[ "$LISTED" == "true" ]]; then STATUS="open"; else STATUS="closed"; fi
    COMP=$(echo "$POSTING" | jq -r '.compensationTierSummary // ""')
    # perl, not sed: BSD sed lacks portable in-replacement newlines, and an
    # alternation group collides with sed's s||| delimiter.
    BODY=$(echo "$POSTING" | jq -r '.descriptionHtml // ""' \
      | perl -0777 -pe '
          s{<li[^>]*>}{\n- }gis;
          s{<br[^>]*/?>}{\n}gis;
          s{</(?:p|div|li|ul|ol|h[1-6])>}{\n}gis;
          s{<[^>]*>}{}gs;
          s/&amp;/&/g; s/&lt;/</g; s/&gt;/>/g; s/&quot;/"/g;
          s/&#x27;/'"'"'/g; s/&#39;/'"'"'/g; s/&nbsp;/ /g;
          s/\n{3,}/\n\n/g;')
    CONTENT="# ${TITLE}
Location: ${LOCATION}${DEPT:+
Department: ${DEPT}}
Published: ${PUBLISHED}${COMP:+
Compensation: ${COMP}}

${BODY}"
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
