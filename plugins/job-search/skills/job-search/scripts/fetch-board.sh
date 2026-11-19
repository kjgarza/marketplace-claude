#!/usr/bin/env bash
# fetch-board.sh — List every open role on a company job board in one call.
#
# Usage:
#   ./scripts/fetch-board.sh ashby      <board>            # e.g. elicit
#   ./scripts/fetch-board.sh greenhouse <board>            # e.g. anthropic
#   ./scripts/fetch-board.sh lever      <company>
#   ./scripts/fetch-board.sh google     "<query>" ["<location>"]
#
# Output: JSON to stdout
#   { "ats": "...", "board": "...", "count": N, "jobs": [
#       { "title": "...", "location": "...", "posted_date": "YYYY-MM-DD|unknown",
#         "url": "...", "apply_url": "...", "remote": true|false|null,
#         "listed": true|false|null, "department": "..." } ] }
#
# Why this exists: scraping a career page in a browser costs a page fetch from the
# skill's budget and usually loses the posted date. Ashby/Greenhouse/Lever all expose
# unauthenticated listing APIs that return every role WITH a real published date, for
# the price of one curl. Google has no such API — its results page is client-rendered —
# so the google mode renders it through Jina Reader and harvests the posting links.
#
# Ashby is the highest-quality source: publishedAt is the true publish timestamp
# (Greenhouse only exposes updated_at) and isListed distinguishes live roles from
# zombie postings that are still reachable by URL.
#
# Requires: curl, jq — plus grep, sed and awk, which the google mode uses to harvest
# posting links out of the rendered page. Optional: JINA_API_KEY (required for google
# mode; the other modes are pure curl + jq).

set -uo pipefail

ATS="${1:-}"
BOARD="${2:-}"
EXTRA="${3:-}"

if [[ -z "$ATS" || -z "$BOARD" ]]; then
  echo '{"error": "Usage: fetch-board.sh <ashby|greenhouse|lever|google> <board|query> [location]"}' >&2
  exit 1
fi

JINA_KEY="${JINA_API_KEY:-}"
TIMEOUT=25
UA="Mozilla/5.0 (compatible; job-board-fetch/1.0)"

emit() {
  local ats="$1" board="$2" jobs="$3"
  jq -n --arg ats "$ats" --arg board "$board" --argjson jobs "$jobs" \
    '{ats: $ats, board: $board, count: ($jobs | length), jobs: $jobs}'
}

fail() {
  # Build with jq, not string interpolation: board can be a Google query string
  # containing quotes or backslashes, which would emit invalid JSON.
  jq -n --arg ats "$1" --arg board "$2" --arg error "$3" \
    '{ats: $ats, board: $board, count: 0, jobs: [], error: $error}'
  exit 0
}

case "$ATS" in

  # ── Ashby ──────────────────────────────────────────────────────────────────
  # https://api.ashbyhq.com/posting-api/job-board/{board}
  # Returns every posting with publishedAt, isListed, location, apply URL and the
  # full plain-text description — no auth, no pagination.
  ashby)
    RESPONSE=$(curl -sf --max-time "$TIMEOUT" -A "$UA" \
      "https://api.ashbyhq.com/posting-api/job-board/${BOARD}?includeCompensation=true" 2>/dev/null || echo "")

    if [[ -z "$RESPONSE" ]] || ! jq -e '.jobs' <<<"$RESPONSE" >/dev/null 2>&1; then
      fail ashby "$BOARD" "board not found or API unreachable"
    fi

    JOBS=$(jq -c '[.jobs[] | {
      title:       .title,
      location:    (.location // ""),
      posted_date: ((.publishedAt // "") | if . == "" then "unknown" else .[0:10] end),
      url:         .jobUrl,
      apply_url:   (.applyUrl // .jobUrl),
      remote:      (if .workplaceType == "Remote" then true elif .isRemote == true then true else .isRemote end),
      listed:      .isListed,
      department:  ((.department // "") + (if (.team // "") == "" then "" else " / " + .team end))
    }]' <<<"$RESPONSE")
    emit ashby "$BOARD" "$JOBS"
    ;;

  # ── Greenhouse ─────────────────────────────────────────────────────────────
  # https://boards-api.greenhouse.io/v1/boards/{board}/jobs
  # No true publish date — updated_at is the closest proxy, so posted_date here is
  # softer evidence than Ashby's. Treat it as "not older than".
  greenhouse)
    RESPONSE=$(curl -sf --max-time "$TIMEOUT" -A "$UA" \
      "https://boards-api.greenhouse.io/v1/boards/${BOARD}/jobs" 2>/dev/null || echo "")

    if [[ -z "$RESPONSE" ]] || ! jq -e '.jobs' <<<"$RESPONSE" >/dev/null 2>&1; then
      fail greenhouse "$BOARD" "board not found or API unreachable"
    fi

    JOBS=$(jq -c '[.jobs[] | {
      title:       .title,
      location:    (.location.name // ""),
      posted_date: ((.updated_at // "") | if . == "" then "unknown" else .[0:10] end),
      url:         .absolute_url,
      apply_url:   .absolute_url,
      remote:      null,
      listed:      true,
      department:  ""
    }]' <<<"$RESPONSE")
    emit greenhouse "$BOARD" "$JOBS"
    ;;

  # ── Lever ──────────────────────────────────────────────────────────────────
  # https://api.lever.co/v0/postings/{company}?mode=json
  # createdAt is Unix milliseconds.
  lever)
    RESPONSE=$(curl -sf --max-time "$TIMEOUT" -A "$UA" \
      "https://api.lever.co/v0/postings/${BOARD}?mode=json" 2>/dev/null || echo "")

    if [[ -z "$RESPONSE" ]] || ! jq -e 'type == "array"' <<<"$RESPONSE" >/dev/null 2>&1; then
      fail lever "$BOARD" "board not found or API unreachable"
    fi

    JOBS=$(jq -c '[.[] | {
      title:       .text,
      location:    (.categories.location // ""),
      posted_date: ((.createdAt // 0) | if . == 0 then "unknown"
                    else (. / 1000 | floor | strftime("%Y-%m-%d")) end),
      url:         .hostedUrl,
      apply_url:   (.applyUrl // .hostedUrl),
      remote:      null,
      listed:      true,
      department:  (.categories.team // "")
    }]' <<<"$RESPONSE")
    emit lever "$BOARD" "$JOBS"
    ;;

  # ── Google ─────────────────────────────────────────────────────────────────
  # No public API: /api/v3/search/ and careers.google.com/api/v3/ both 404, and the
  # results page is a client-rendered JS app whose raw HTML carries no listings.
  # Jina Reader executes the page and returns the rendered result, from which the
  # posting links can be harvested. Google publishes NO posted date anywhere, so
  # posted_date is always "unknown" — sort_by=date ordering is the freshness proxy
  # and job order in `jobs` is preserved (most recent first).
  #
  #   fetch-board.sh google "machine learning" "Berlin Germany"
  google)
    [[ -z "$JINA_KEY" ]] && fail google "$BOARD" "JINA_API_KEY required for google mode"

    urlencode() { jq -rn --arg v "$1" '$v|@uri'; }
    Q=$(urlencode "$BOARD")
    TARGET="https://www.google.com/about/careers/applications/jobs/results/?q=${Q}&sort_by=date"
    if [[ -n "$EXTRA" ]]; then
      TARGET="${TARGET}&location=$(urlencode "$EXTRA")"
    fi

    RENDERED=$(curl -sf --max-time 60 \
      -H "Authorization: Bearer ${JINA_KEY}" \
      -H "X-Return-Format: markdown" \
      "https://r.jina.ai/${TARGET}" 2>/dev/null || echo "")

    [[ -z "$RENDERED" ]] && fail google "$BOARD" "Jina Reader returned nothing"

    # Links look like: .../jobs/results/{numeric-id}-{slug-words}
    SLUGS=$(grep -oE 'jobs/results/[0-9]+-[a-z0-9-]+' <<<"$RENDERED" | sed 's|jobs/results/||' | awk '!seen[$0]++')

    [[ -z "$SLUGS" ]] && fail google "$BOARD" "no postings matched (or page layout changed)"

    JOBS=$(while IFS= read -r slug; do
      [[ -z "$slug" ]] && continue
      # Title = slug with the leading numeric id stripped, dashes to spaces
      title=$(sed -E 's/^[0-9]+-//; s/-/ /g' <<<"$slug")
      jq -n --arg title "$title" \
            --arg url "https://www.google.com/about/careers/applications/jobs/results/${slug}" \
            --arg loc "${EXTRA:-}" \
        '{title: $title, location: $loc, posted_date: "unknown",
          url: $url, apply_url: $url, remote: null, listed: true, department: ""}'
    done <<<"$SLUGS" | jq -sc '.')

    emit google "$BOARD" "$JOBS"
    ;;

  *)
    echo "{\"error\": \"unknown ats '$ATS' — use ashby|greenhouse|lever|google\"}" >&2
    exit 1
    ;;
esac
