#!/usr/bin/env bash
# Mechanical checks for Q1, Q2, Q4, Q6 against local Miniflux fed a KTN-shaped fixture feed.
# Needs: MINIFLUX_TOKEN, FIXTURES (jsonl of {id,date,subject,htmlBody}), FIXTURE_WWW (dir served to Miniflux), WORK (scratch dir).
set -euo pipefail
cd "$(dirname "$0")"
: "${MINIFLUX_TOKEN:?}" "${FIXTURES:?}" "${FIXTURE_WWW:?}" "${WORK:?}"
export MINIFLUX_URL="${MINIFLUX_URL:-http://localhost:8080}"
api() { curl -sS -m 30 -H "X-Auth-Token: $MINIFLUX_TOKEN" -H 'Content-Type: application/json' "$@"; }
count() { api "$MINIFLUX_URL/v1/feeds/$FEED/entries?limit=1&status=$1" | python3 -c 'import json,sys; print(json.load(sys.stdin)["total"])'; }
refresh() { api -X PUT "$MINIFLUX_URL/v1/feeds/$FEED/refresh" >/dev/null; sleep "${1:-5}"; }
mkdir -p "$WORK" "$FIXTURE_WWW"
: > "$WORK/jobs.jsonl"

python3 make_feed.py "$FIXTURES" "$FIXTURE_WWW/feed.xml"
FIXTURE_WWW="$FIXTURE_WWW" docker compose -p ktnspike up -d fixtures >/dev/null
sleep 2

FEED="$(api "$MINIFLUX_URL/v1/feeds" | python3 -c 'import json,sys; print(next((str(f["id"]) for f in json.load(sys.stdin) if f["feed_url"].startswith("http://fixtures")), ""))')"
if [ -z "$FEED" ]; then
  FEED="$(api -X POST -d '{"feed_url":"http://fixtures:8000/feed.xml","category_id":1}' "$MINIFLUX_URL/v1/feeds" | python3 -c 'import json,sys; print(json.load(sys.stdin)["feed_id"])')"
fi
refresh
N="$(wc -l < "$FIXTURES" | tr -d ' ')"
echo "== Q1 capture: fixtures=$N entries_total=$(count unread)"
api "$MINIFLUX_URL/v1/feeds/$FEED/entries?limit=1" | python3 -c '
import json,sys; e=json.load(sys.stdin)["entries"][0]; c=e["content"]
print("   content_bytes=%d anchors=%d has_jobListingId=%s has_utm_content=%s" % (len(c), c.count("<a "), "jobListingId" in c, "utm_content" in c))'

echo "== Q2a same feed re-polled"
refresh
echo "   entries_total=$(( $(count unread) + $(count read) ))"

echo "== Q4 cursor"
PULL_CRASH_BEFORE_MARK=1 python3 pull.py --out "$WORK/jobs.jsonl" 2>&1 | sed 's/^/   crash-run: /' || true
echo "   unread_after_crash=$(count unread) lines=$(wc -l < "$WORK/jobs.jsonl" | tr -d ' ')"
python3 pull.py --out "$WORK/jobs.jsonl" 2>&1 | sed 's/^/   run1: /'
echo "   unread_after_run1=$(count unread) lines=$(wc -l < "$WORK/jobs.jsonl" | tr -d ' ')"
python3 pull.py --out "$WORK/jobs.jsonl" 2>&1 | sed 's/^/   run2: /'
echo "   lines_after_run2=$(wc -l < "$WORK/jobs.jsonl" | tr -d ' ')"

echo "== Q2b re-delivery (same emails, new KTN entry ids)"
python3 make_feed.py "$FIXTURES" "$FIXTURE_WWW/feed.xml" --redeliver
refresh
echo "   entries_total=$(( $(count unread) + $(count read) )) unread=$(count unread)"
python3 pull.py --out "$WORK/jobs.jsonl" 2>&1 | sed 's/^/   run3: /'

echo "== Q3 job-level repeats across all pulled entries"
python3 dedup_report.py "$WORK/jobs.jsonl" | sed 's/^/   /'

echo "== Q6 headless: token-only env"
env -i PATH=/usr/bin:/bin MINIFLUX_URL="$MINIFLUX_URL" MINIFLUX_TOKEN="$MINIFLUX_TOKEN" /usr/bin/python3 pull.py --no-mark 2>&1 | tail -1 | sed 's/^/   /'
