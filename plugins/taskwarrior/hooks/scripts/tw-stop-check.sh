#!/usr/bin/env bash
# Stop hook — if a Taskwarrior task is still ACTIVE when the agent tries to stop,
# nudge once to close/annotate it (per the task-workflow mandatory-update rule).
#
# Loop-safe: blocks at most ONCE per session via a /tmp sentinel keyed by session_id.
# Falls through (allows stop) when taskwarrior is absent or no task is active.
set -uo pipefail

command -v task >/dev/null 2>&1 || exit 0

INPUT="$(cat)"
SESSION_ID="$(printf '%s' "$INPUT" | /usr/bin/python3 -c 'import sys,json
try: print(json.load(sys.stdin).get("session_id",""))
except Exception: print("")' 2>/dev/null)"

ACTIVE_COUNT="$(task +ACTIVE count 2>/dev/null || echo 0)"
[ "${ACTIVE_COUNT:-0}" -gt 0 ] || exit 0

SENTINEL="/tmp/tw-stop-nudge-${SESSION_ID:-nosession}"
if [ -f "$SENTINEL" ]; then
  exit 0   # already nudged this session — don't loop
fi
touch "$SENTINEL"

ACTIVE_LIST="$(task rc.verbose=nothing +ACTIVE list 2>/dev/null | sed '/^$/d' | head -10)"

/usr/bin/python3 -c '
import json, sys
n = sys.argv[1]; lst = sys.argv[2]
print(json.dumps({
  "decision": "block",
  "reason": f"{n} Taskwarrior task(s) are still ACTIVE. Per the task-workflow lifecycle, before finishing you must either close them (task <id> done), or stop + annotate remaining work (task <id> stop; task <id> annotate \"...\"). Active:\n{lst}\nIf this work is genuinely incomplete and you are intentionally pausing, annotate the reason then stop the timer."
}))
' "$ACTIVE_COUNT" "$ACTIVE_LIST"
exit 0
