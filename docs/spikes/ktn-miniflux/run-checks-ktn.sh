#!/usr/bin/env bash
# Checks for the serverless variant (ktn_pull.py reading a KTN-shaped Atom file directly).
# Needs: FIXTURES (clean jsonl of {id,date,subject,htmlBody}), WORK (scratch dir). Optional: KTN_FEED_URL for a live fetch.
set -euo pipefail
cd "$(dirname "$0")"
: "${FIXTURES:?}" "${WORK:?}"
rm -rf "$WORK" && mkdir -p "$WORK"
S="$WORK/state.json"; O="$WORK/jobs.jsonl"; F="$WORK/feed.xml"
lines() { [ -f "$O" ] && wc -l < "$O" | tr -d ' ' || echo 0; }
run() { python3 ktn_pull.py --feed "$F" --state "$S" --out "$O" 2>&1 | sed "s/^/   $1: /"; }

python3 make_feed.py "$FIXTURES" "$F" >/dev/null
echo "== Q1 capture + Q5 links (first run)"
run run1
python3 -c 'import json,sys; r=[json.loads(l) for l in open(sys.argv[1])]; print("   sources=%s generic=%d" % (sorted({x["source"] for x in r}), sum(x["source"]=="generic" for x in r)))' "$O"

echo "== Q4 cursor: re-run on unchanged feed"
run run2
echo "   lines=$(lines)"

echo "== Q2 re-delivery (same emails, new KTN ids)"
python3 make_feed.py "$FIXTURES" "$F" --redeliver >/dev/null
run run3
echo "   lines=$(lines)"

echo "== Q4 crash before state save"
rm -f "$S" "$O"
python3 make_feed.py "$FIXTURES" "$F" >/dev/null
PULL_CRASH_BEFORE_STATE=1 python3 ktn_pull.py --feed "$F" --state "$S" --out "$O" 2>&1 | sed 's/^/   crash: /' || true
echo "   state_exists=$([ -f "$S" ] && echo yes || echo no) lines=$(lines)"
run recover
echo "   lines=$(lines) (at-least-once: crash output + re-emit)"
run after
echo "   lines=$(lines)"

echo "== Q3 repeats absorbed by job-key state"
python3 -c 'import json,sys; s=json.load(open(sys.argv[1])); print("   entries_seen=%d unique_jobs=%d" % (len(s["entries"]), len(s["jobs"])))' "$S"

echo "== Q6 headless: empty env, system python"
env -i PATH=/usr/bin:/bin /usr/bin/python3 ktn_pull.py --feed "$F" --state "$S" --out "$O" 2>&1 | sed 's/^/   /'

if [ -n "${KTN_FEED_URL:-}" ]; then
  echo "== live KTN fetch"
  env -i PATH=/usr/bin:/bin /usr/bin/python3 ktn_pull.py --feed "$KTN_FEED_URL" --state "$WORK/live-state.json" --out "$WORK/live.jsonl" 2>&1 | sed 's/^/   /'
fi
