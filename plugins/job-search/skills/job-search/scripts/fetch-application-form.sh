#!/usr/bin/env bash
# fetch-application-form.sh — Discover a job posting's application form deep link
# and extract the questions a candidate must answer to submit a FULL application.
#
# A job ad is not the application. Most ATSs put the real form (screening
# questions, essay prompts, salary/visa/notice fields, required attachments)
# on a separate apply URL. This script finds that deep link and pulls the
# questions, structured where the ATS exposes them publicly.
#
# Usage:
#   ./scripts/fetch-application-form.sh <job-url>
#
# Output: JSON to stdout
#   {
#     "url": "...",          input job posting URL
#     "ats": "greenhouse|lever|ashby|workable|smartrecruiters|factorial|generic",
#     "apply_url": "...",    deep link to the application form (falls back to the job URL if not found; check source)
#     "source": "api|apply-page|none",
#     "needs_browser": true|false,  true when the form wasn't captured (source apply-page/none AND questions empty)
#     "questions": [ {"label": "...", "type": "...", "required": true|false|null, "options": [...]|null} ],
#     "form_text": "..."     raw apply-page text when questions could not be fully structured
#   }
#
# needs_browser is the handoff signal: when true, the returned questions are empty
# and form_text is at best a thin JD blob, so the calling agent MUST open apply_url
# with browser tools (mcp__claude-in-chrome__navigate + mcp__claude-in-chrome__get_page_text)
# to read the real form instead of trusting this output. When false, questions[] is
# authoritative and no browser step is needed.
#
# Strategy per ATS:
#   greenhouse       → public boards API with ?questions=true (full structured form)
#   workable         → public form API (v3, then v1)
#   lever            → fetch {url}/apply HTML (server-rendered) and extract field labels
#   smartrecruiters  → postings API for applyUrl, then Jina Reader on the apply page
#   ashby            → public GraphQL posting API (full structured form); Jina Reader fallback
#   factorial        → detect factorialhr.com, surface apply_url, hand off to browser
#   generic          → scan job page HTML for an apply link, fetch it, extract labels
#
# The script never fails hard: each strategy degrades to the next, ending with an
# empty questions list, source "none", and needs_browser true so the calling agent
# knows to open apply_url in a browser instead.
#
# Requires: curl, jq. Optional: JINA_API_KEY (for JS-rendered apply pages).

set -uo pipefail

URL="${1:-}"
if [[ -z "$URL" ]]; then
  echo '{"error": "Usage: fetch-application-form.sh <job-url>"}' >&2
  exit 1
fi

JINA_KEY="${JINA_API_KEY:-}"
TIMEOUT=25
UA="Mozilla/5.0 (compatible; job-application-fetch/1.0)"
MAX_TEXT=20000

# ── helpers ──────────────────────────────────────────────────────────────────

fetch() {
  curl -sfL --max-time "$TIMEOUT" -A "$UA" "$@" 2>/dev/null || true
}

jina_fetch() {
  local target="$1"
  [[ -z "$JINA_KEY" ]] && return 0
  curl -sf --max-time 45 \
    -H "Authorization: Bearer ${JINA_KEY}" \
    -H "X-Return-Format: markdown" \
    "https://r.jina.ai/${target}" 2>/dev/null || true
}

strip_html() {
  perl -0777 -pe 's{<script\b[^>]*>.*?</script>}{}gis; s{<style\b[^>]*>.*?</style>}{}gis; s{<[^>]*>}{ }g' \
    | sed -E 's/&amp;/\&/g; s/&#x27;/'\''/g; s/&#39;/'\''/g; s/&quot;/"/g; s/&nbsp;/ /g' \
    | sed -E 's/[[:space:]]+/ /g' \
    | sed '/^[[:space:]]*$/d'
}

# stdin: raw HTML → candidate form-field labels, one per line
extract_labels_from_html() {
  {
    grep -oE '<label[^>]*>[^<]{3,200}' | sed -E 's/<label[^>]*>//'
  } <<<"$1" || true
  {
    grep -oE '<legend[^>]*>[^<]{3,200}' | sed -E 's/<legend[^>]*>//'
  } <<<"$1" || true
  {
    grep -oE 'aria-label="[^"]{3,200}"' | sed -E 's/^aria-label="//; s/"$//'
  } <<<"$1" || true
  {
    grep -oE 'placeholder="[^"]{3,200}"' | sed -E 's/^placeholder="//; s/"$//'
  } <<<"$1" || true
}

# stdin: one label per line → JSON array of question objects
labels_to_questions_json() {
  sed -E 's/&amp;/\&/g; s/&#x27;/'\''/g; s/&#39;/'\''/g; s/&quot;/"/g' \
    | jq -R -s '
        split("\n")
        | map(gsub("^\\s+|\\s+$"; ""))
        | map(select(length > 2 and length < 300))
        | unique
        | map({label: ., type: "unknown", required: null, options: null})' 2>/dev/null \
    || echo "[]"
}

emit() {
  local ats="$1" apply_url="$2" source="$3" questions="$4" form_text="$5"
  [[ -z "$questions" ]] && questions="[]"
  jq -n \
    --arg url "$URL" \
    --arg ats "$ats" \
    --arg apply_url "$apply_url" \
    --arg source "$source" \
    --argjson questions "$questions" \
    --arg form_text "$form_text" \
    '{
       url: $url,
       ats: $ats,
       apply_url: $apply_url,
       source: $source,
       needs_browser: (($source == "apply-page" or $source == "none") and ($questions | length) == 0),
       questions: $questions,
       form_text: $form_text
     }'
}

# fetch an apply page and emit best-effort results for a known ATS
emit_from_apply_page() {
  local ats="$1" apply_url="$2"
  local html md
  html=$(fetch "$apply_url")
  if [[ -n "$html" ]]; then
    local labels questions text
    labels=$(extract_labels_from_html "$html")
    questions=$(labels_to_questions_json <<<"$labels")
    text=$(strip_html <<<"$html" | head -c "$MAX_TEXT")
    emit "$ats" "$apply_url" "apply-page" "$questions" "$text"
    return 0
  fi
  md=$(jina_fetch "$apply_url")
  if [[ -n "$md" ]]; then
    emit "$ats" "$apply_url" "apply-page" "[]" "$(head -c "$MAX_TEXT" <<<"$md")"
    return 0
  fi
  emit "$ats" "$apply_url" "none" "[]" ""
}

# ── Greenhouse ────────────────────────────────────────────────────────────────
# Public boards API returns the FULL application form via ?questions=true:
# labels, required flags, field types, and dropdown options — no auth needed.
# URL patterns: (job-)boards.greenhouse.io/{board}/jobs/{id}, incl. eu. hosts.

if grep -qE 'greenhouse\.io/[^/]+/jobs/[0-9]+' <<<"$URL"; then
  BOARD=$(grep -oE 'greenhouse\.io/([^/]+)/jobs' <<<"$URL" | cut -d'/' -f2)
  JOB_ID=$(grep -oE '/jobs/[0-9]+' <<<"$URL" | grep -oE '[0-9]+')

  HOSTS="boards-api.greenhouse.io api.greenhouse.io"
  grep -q 'eu\.greenhouse\.io' <<<"$URL" && HOSTS="boards-api.eu.greenhouse.io $HOSTS"

  for HOST in $HOSTS; do
    RESPONSE=$(fetch "https://${HOST}/v1/boards/${BOARD}/jobs/${JOB_ID}?questions=true")
    if [[ -n "$RESPONSE" ]] && jq -e '.id' <<<"$RESPONSE" >/dev/null 2>&1; then
      APPLY_URL=$(jq -r '.absolute_url // ""' <<<"$RESPONSE")
      [[ -z "$APPLY_URL" ]] && APPLY_URL="$URL"
      APPLY_URL="${APPLY_URL}#app"
      QUESTIONS=$(jq '
        [ (.questions // [])[],
          ((.compliance // [])[] | (.questions // [])[]),
          ((.demographic_questions.questions // [])[]) ]
        | map({
            label: (.label // ""),
            type: (.fields[0].type // .type // "unknown"),
            required: (.required // null),
            options: ((.fields[0].values // .answer_options // [])
                      | map(.label // .name // tostring)
                      | if length == 0 then null else . end)
          })
        | map(select(.label != ""))' <<<"$RESPONSE" 2>/dev/null)
      emit "greenhouse" "$APPLY_URL" "api" "${QUESTIONS:-[]}" ""
      exit 0
    fi
  done

  # API unreachable — fall back to reading the posting page itself
  emit_from_apply_page "greenhouse" "${URL}#app"
  exit 0
fi

# ── Workable ─────────────────────────────────────────────────────────────────
# apply.workable.com exposes the application form definition as JSON.
# URL pattern: apply.workable.com/{account}/j/{SHORTCODE}

if grep -qE 'apply\.workable\.com/[^/]+/j/[A-Za-z0-9]+' <<<"$URL"; then
  ACCOUNT=$(sed -E 's|.*apply\.workable\.com/([^/]+)/j/.*|\1|' <<<"$URL")
  SHORTCODE=$(sed -E 's|.*/j/([A-Za-z0-9]+).*|\1|' <<<"$URL")
  APPLY_URL="https://apply.workable.com/${ACCOUNT}/j/${SHORTCODE}/apply/"

  for V in v3 v1; do
    RESPONSE=$(fetch "https://apply.workable.com/api/${V}/accounts/${ACCOUNT}/jobs/${SHORTCODE}/form")
    if [[ -n "$RESPONSE" ]] && jq -e 'type == "object"' <<<"$RESPONSE" >/dev/null 2>&1; then
      QUESTIONS=$(jq '
        [ ((.fields // [])[]), ((.questions // [])[]) ]
        | map({
            label: (.label // .body // .key // ""),
            type: (.type // "unknown"),
            required: (.required // null),
            options: ((.options // .choices // [])
                      | map(.body // .value // .label // tostring)
                      | if length == 0 then null else . end)
          })
        | map(select(.label != ""))' <<<"$RESPONSE" 2>/dev/null)
      if [[ -n "${QUESTIONS:-}" && "$QUESTIONS" != "[]" ]]; then
        emit "workable" "$APPLY_URL" "api" "$QUESTIONS" ""
        exit 0
      fi
    fi
  done

  emit_from_apply_page "workable" "$APPLY_URL"
  exit 0
fi

# ── Lever ────────────────────────────────────────────────────────────────────
# The apply form lives at {posting-url}/apply and is server-rendered, so custom
# questions appear directly in the HTML. URL: jobs.(eu.)lever.co/{company}/{uuid}

if grep -qE 'jobs\.(eu\.)?lever\.co/[^/]+/[a-f0-9-]+' <<<"$URL"; then
  BASE="${URL%%\?*}"
  BASE="${BASE%/}"
  BASE="${BASE%/apply}"
  emit_from_apply_page "lever" "${BASE}/apply"
  exit 0
fi

# ── Ashby ────────────────────────────────────────────────────────────────────
# Ashby exposes a public GraphQL endpoint (non-user-graphql, ApiJobPosting) that
# returns the FULL application form — sections → fieldEntries → field — structured
# and unauthenticated, just like Greenhouse. The apply page itself is client-
# rendered JS, so Jina Reader is only a text fallback when the API path fails.
# URL: jobs.ashbyhq.com/{org}/{jobPostingId}[/application]

if grep -qE 'jobs\.ashbyhq\.com/[^/]+/[A-Za-z0-9-]+' <<<"$URL"; then
  BASE="${URL%%\?*}"
  BASE="${BASE%/}"
  BASE="${BASE%/application}"
  APPLY_URL="${BASE}/application"
  ORG=$(sed -E 's|.*jobs\.ashbyhq\.com/([^/]+)/.*|\1|' <<<"$BASE")
  JOB_ID=$(sed -E 's|.*/([A-Za-z0-9-]+)$|\1|' <<<"$BASE")

  GQL=$(jq -n --arg org "$ORG" --arg jid "$JOB_ID" '{
    operationName: "ApiJobPosting",
    variables: {organizationHostedJobsPageName: $org, jobPostingId: $jid},
    query: "query ApiJobPosting($organizationHostedJobsPageName: String!, $jobPostingId: String!) { jobPosting(organizationHostedJobsPageName: $organizationHostedJobsPageName, jobPostingId: $jobPostingId) { applicationForm { sections { title fieldEntries { isRequired field } } } } }"
  }')
  RESPONSE=$(curl -sf --max-time "$TIMEOUT" -A "$UA" \
    -H "Content-Type: application/json" \
    -H "Origin: https://jobs.ashbyhq.com" \
    --data-raw "$GQL" \
    "https://jobs.ashbyhq.com/api/non-user-graphql?op=ApiJobPosting" 2>/dev/null || true)

  if [[ -n "$RESPONSE" ]] && jq -e '.data.jobPosting.applicationForm.sections' <<<"$RESPONSE" >/dev/null 2>&1; then
    # field is a JSON scalar carrying {title, type, selectableValues, ...}
    QUESTIONS=$(jq '
      [ (.data.jobPosting.applicationForm.sections // [])[]
        | (.fieldEntries // [])[]
        | {
            label: (.field.title // ""),
            type: (.field.type // "unknown"),
            required: (.isRequired // null),
            options: ((.field.selectableValues // [])
                      | map(.label // .value // tostring)
                      | if length == 0 then null else . end)
          } ]
      | map(select(.label != ""))' <<<"$RESPONSE" 2>/dev/null)
    if [[ -n "${QUESTIONS:-}" && "$QUESTIONS" != "[]" ]]; then
      emit "ashby" "$APPLY_URL" "api" "$QUESTIONS" ""
      exit 0
    fi
  fi

  # API path failed — degrade to Jina Reader text, then to a bare browser handoff.
  MD=$(jina_fetch "$APPLY_URL")
  if [[ -n "$MD" ]]; then
    emit "ashby" "$APPLY_URL" "apply-page" "[]" "$(head -c "$MAX_TEXT" <<<"$MD")"
  else
    emit "ashby" "$APPLY_URL" "none" "[]" ""
  fi
  exit 0
fi

# ── SmartRecruiters ──────────────────────────────────────────────────────────
# Public postings API gives the canonical applyUrl; the form itself is JS-heavy.

if grep -qE 'jobs\.smartrecruiters\.com/' <<<"$URL"; then
  COMPANY=$(sed -E 's|.*jobs\.smartrecruiters\.com/([^/]+).*|\1|' <<<"$URL")
  POSTING_ID=$(grep -oE '/[0-9]{9,}' <<<"$URL" | grep -oE '[0-9]+' | head -1 || true)
  APPLY_URL=""
  if [[ -n "${POSTING_ID:-}" ]]; then
    RESPONSE=$(fetch "https://api.smartrecruiters.com/v1/companies/${COMPANY}/postings/${POSTING_ID}")
    APPLY_URL=$(jq -r '.applyUrl // ""' <<<"$RESPONSE" 2>/dev/null || true)
  fi
  [[ -z "$APPLY_URL" ]] && APPLY_URL="$URL"
  MD=$(jina_fetch "$APPLY_URL")
  if [[ -n "$MD" ]]; then
    emit "smartrecruiters" "$APPLY_URL" "apply-page" "[]" "$(head -c "$MAX_TEXT" <<<"$MD")"
  else
    emit "smartrecruiters" "$APPLY_URL" "none" "[]" ""
  fi
  exit 0
fi

# ── Factorial ────────────────────────────────────────────────────────────────
# Factorial self-hosts job boards on {company}.factorialhr.com. The apply form is
# client-rendered with no known public form endpoint, so surface a sensible
# apply_url plus the job-page text and hand the form off to a browser.
# URL: {company}.factorialhr.com/job_posting/{slug}  (or /jobs/...)

if grep -qE 'factorialhr\.com' <<<"$URL"; then
  BASE="${URL%%\?*}"
  BASE="${BASE%/}"
  APPLY_URL="$BASE"
  HTML=$(fetch "$URL")
  if [[ -n "$HTML" ]]; then
    emit "factorial" "$APPLY_URL" "none" "[]" "$(strip_html <<<"$HTML" | head -c "$MAX_TEXT")"
  else
    MD=$(jina_fetch "$URL")
    emit "factorial" "$APPLY_URL" "none" "[]" "$(head -c "$MAX_TEXT" <<<"${MD:-}")"
  fi
  exit 0
fi

# ── Generic ──────────────────────────────────────────────────────────────────
# Fetch the job page, look for an apply/application link, follow it, and
# extract whatever field labels are visible.

HTML=$(fetch "$URL")
APPLY_URL=""
if [[ -n "$HTML" ]]; then
  CAND=$(grep -oiE 'href="[^"]*(apply|application)[^"]*"' <<<"$HTML" \
    | sed -E 's/^[Hh][Rr][Ee][Ff]="//; s/"$//' \
    | grep -viE '^(mailto:|tel:|javascript:)' \
    | grep -viE '\.(css|js|png|jpg|svg)([?#]|$)' \
    | head -1 || true)
  if [[ -n "${CAND:-}" ]]; then
    case "$CAND" in
      http*)  APPLY_URL="$CAND" ;;
      //*)    APPLY_URL="https:${CAND}" ;;
      /*)     ORIGIN=$(sed -E 's|^(https?://[^/]+).*|\1|' <<<"$URL"); APPLY_URL="${ORIGIN}${CAND}" ;;
      *)      APPLY_URL="${URL%/}/${CAND}" ;;
    esac
  fi
fi

if [[ -n "$APPLY_URL" ]]; then
  emit_from_apply_page "generic" "$APPLY_URL"
  exit 0
fi

# No apply link found — return the job page text so the agent can look for
# embedded questions, and signal that a browser is needed for the form.
if [[ -n "$HTML" ]]; then
  emit "generic" "$URL" "none" "[]" "$(strip_html <<<"$HTML" | head -c "$MAX_TEXT")"
else
  MD=$(jina_fetch "$URL")
  emit "generic" "$URL" "none" "[]" "$(head -c "$MAX_TEXT" <<<"${MD:-}")"
fi
