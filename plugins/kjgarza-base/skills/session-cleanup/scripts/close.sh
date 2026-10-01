#!/usr/bin/env bash
# Execute a plan produced by analyze.py. Dry-run by default; --go executes.
#
# Usage:
#   close.sh --plan <path-to-plan.json> [--go] [--limit N] [--canary]
#
# --canary: before touching the rest of the list, close up to 3 representative
#   jobs first (a plain done job, a working/blocked zombie, a done job with a
#   clean pushed worktree — whichever are present in the plan, preferring ones that
#   still have a transcript) and verify each one's transcript survives before
#   continuing. A canary whose transcript had already expired before the close is
#   reported and skipped, not treated as a failure. This is how the rubric this
#   skill encodes was originally validated (see README.md) — recommended for
#   the first run against any new scope, optional after that.
#
# Resolves the `claude` binary directly rather than trusting $PATH/aliases:
# an interactive shell alias like `claude='claude --permission-mode auto'`
# turns `claude rm <id>` into a PROMPT instead of the rm subcommand — the CLI
# silently answers "what did you want removed?" and removes nothing, exit 0.
# This bit us running the process this skill is based on. A non-interactive
# bash script does not inherit shell aliases, so this is theoretical here,
# but the guard costs nothing and documents the gotcha for anyone adapting
# this script into something that could run in an interactive shell.
set -uo pipefail

CLAUDE_BIN="${CLAUDE_BIN:-$(command -v claude || true)}"
if [ -z "$CLAUDE_BIN" ]; then
  echo "claude CLI not found on PATH; set CLAUDE_BIN=/path/to/claude" >&2
  exit 1
fi

PLAN=""; GO=0; LIMIT=0; CANARY=0
while [ $# -gt 0 ]; do
  case "$1" in
    --plan) PLAN="$2"; shift 2 ;;
    --go) GO=1; shift ;;
    --limit) LIMIT="$2"; shift 2 ;;
    --canary) CANARY=1; shift ;;
    *) echo "unknown arg: $1" >&2; exit 1 ;;
  esac
done
[ -z "$PLAN" ] && { echo "usage: close.sh --plan <plan.json> [--go] [--limit N] [--canary]" >&2; exit 1; }
[ -f "$PLAN" ] || { echo "plan not found: $PLAN" >&2; exit 1; }

LOG="$HOME/.claude/session-cleanup/close.log"
mkdir -p "$(dirname "$LOG")"

# Portable read (not `mapfile` — macOS ships bash 3.2, no mapfile builtin)
IDS=()
while IFS= read -r line; do
  [ -n "$line" ] && IDS+=("$line")
done < <(python3 -c "
import json
p=json.load(open('$PLAN'))
for i in p['close_ids']:
    print(i)
")

if [ "$LIMIT" -gt 0 ] && [ "$LIMIT" -lt "${#IDS[@]}" ]; then
  IDS=("${IDS[@]:0:$LIMIT}")
fi

echo "plan: $PLAN"
echo "${#IDS[@]} jobs queued. GO=$GO CANARY=$CANARY"

# Empty plan: stop here. Expanding an empty "${IDS[@]}" under `set -u` aborts on bash 3.2 (macOS).
if [ "${#IDS[@]}" -eq 0 ]; then
  echo "-- nothing to close --"
  exit 0
fi

if [ "$GO" -eq 0 ]; then
  printf "%s\n" "${IDS[@]}"
  echo "-- dry run — pass --go to execute --"
  exit 0
fi

close_one() {
  local id="$1" out out2
  if out=$("$CLAUDE_BIN" rm "$id" 2>&1); then
    echo "ok   $id $out" >> "$LOG"
    echo "0"
    return
  fi
  "$CLAUDE_BIN" stop "$id" >/dev/null 2>&1
  if out2=$("$CLAUDE_BIN" rm "$id" 2>&1); then
    echo "ok*  $id (after stop) $out2" >> "$LOG"
    echo "1"
    return
  fi
  echo "FAIL $id $out2" >> "$LOG"
  echo "FAIL $id: $out2" >&2
  echo "2"
}

# The canary checks the transcript path analyze.py recorded (which already follows
# resumeSessionId for resumed jobs), not a fresh lookup by sessionId — a resumed job's own
# sessionId has no transcript of its own, and would read as a false "missing".
has_transcript() {
  local path="$1"
  [ -n "$path" ] && [ -f "$path" ]
}

echo "=== close run $(date -u +%FT%TZ) ===" >> "$LOG"
ok=0; fail=0; stopped=0

RUN_IDS=("${IDS[@]}")
if [ "$CANARY" -eq 1 ] && [ "${#IDS[@]}" -gt 0 ]; then
  echo "-- canary pass --"
  # Pick up to 3 representative ids by type, not just the first 3: a plain done
  # job with no worktree, a blocked/working zombie with no worktree, and a done
  # job that does own a worktree. Falls back to "first N available" for any
  # type not present in this plan. De-duped and capped at 3. Jobs that still have a
  # transcript are preferred: an expired job (transcript already deleted by Claude
  # Code's cleanup) can't show whether `claude rm` preserves one.
  canary_ids=($(python3 -c "
import json
p=json.load(open('$PLAN'))
close_set=set(p['close_ids'])
rows={r['id']: r for r in p['rows'] if r['id'] in close_set}
order=[i for i in p['close_ids'] if rows[i].get('transcript')]
order+=[i for i in p['close_ids'] if not rows[i].get('transcript')]
picks=[]
def want(pred):
    for i in order:
        r=rows[i]
        if pred(r) and i not in picks:
            picks.append(i); return
want(lambda r: r.get('state')=='done' and not r.get('worktreePath'))
want(lambda r: r.get('state') in ('blocked','working') and not r.get('worktreePath'))
want(lambda r: r.get('worktreePath'))
for i in order:
    if len(picks)>=3: break
    if i not in picks: picks.append(i)
print(' '.join(picks[:3]))
"))
  tested=0
  for id in "${canary_ids[@]}"; do
    tpath=$(python3 -c "
import json
p=json.load(open('$PLAN'))
for r in p['rows']:
    if r['id']=='$id': print(r.get('transcript') or ''); break
")
    # Only a transcript that exists before the close can prove anything after it.
    had=0
    has_transcript "$tpath" && had=1
    r=$(close_one "$id")
    [ "$r" = "0" ] && ok=$((ok+1))
    [ "$r" = "1" ] && { ok=$((ok+1)); stopped=$((stopped+1)); }
    [ "$r" = "2" ] && fail=$((fail+1))
    if [ "$had" -eq 0 ]; then
      echo "  canary $id: no transcript before close (already expired) — nothing to verify"
    elif has_transcript "$tpath"; then
      echo "  canary $id: transcript OK"
      tested=$((tested+1))
    else
      echo "  canary $id: TRANSCRIPT MISSING — stopping before touching the rest" >&2
      echo "closed=$ok failed=$fail  log: $LOG"
      exit 1
    fi
  done
  [ "$tested" -eq 0 ] && echo "  note: no canary had a transcript to check — survival not verified on this run"
  RUN_IDS=()
  for id in "${IDS[@]}"; do
    skip=0
    for c in "${canary_ids[@]}"; do [ "$id" = "$c" ] && skip=1 && break; done
    [ "$skip" -eq 0 ] && RUN_IDS+=("$id")
  done
fi

# The canary pass may have taken every id (plans of 3 or fewer); same bash 3.2 empty-array trap as above.
if [ "${#RUN_IDS[@]}" -gt 0 ]; then
  for id in "${RUN_IDS[@]}"; do
    r=$(close_one "$id")
    [ "$r" = "0" ] && ok=$((ok+1))
    [ "$r" = "1" ] && { ok=$((ok+1)); stopped=$((stopped+1)); }
    [ "$r" = "2" ] && fail=$((fail+1))
  done
fi

echo "closed=$ok (of which $stopped needed a stop first) failed=$fail  log: $LOG"
echo -n "entries left in agents view: "
"$CLAUDE_BIN" agents --json --all | python3 -c 'import json,sys; print(len(json.load(sys.stdin)))'
