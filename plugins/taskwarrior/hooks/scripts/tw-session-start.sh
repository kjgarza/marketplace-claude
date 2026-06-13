#!/usr/bin/env bash
# SessionStart hook — inject the top pending Taskwarrior items as context.
# Non-blocking, fast (local CLI). Silent if taskwarrior is not installed.
set -uo pipefail

command -v task >/dev/null 2>&1 || exit 0

# Top 3 by urgency. `task next` is the user's configured planning report.
TOP="$(task rc.verbose=nothing rc.confirmation=off limit:3 next 2>/dev/null | sed '/^$/d')"
ACTIVE_COUNT="$(task +ACTIVE count 2>/dev/null || echo 0)"

[ -z "$TOP" ] && exit 0

{
  echo "Taskwarrior — top pending (by urgency):"
  echo "$TOP"
  [ "${ACTIVE_COUNT:-0}" -gt 0 ] && echo "($ACTIVE_COUNT task(s) already started/active — see \`task +ACTIVE list\`.)"
}
exit 0
