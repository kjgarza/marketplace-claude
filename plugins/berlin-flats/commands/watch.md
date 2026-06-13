---
name: watch
description: Explains continuous flat monitoring. Continuous polling runs as a scheduled background job; this command runs a single ad-hoc hunt and points you at the scheduler.
argument-hint: ""
allowed-tools: Bash, Read
---

Continuous watching is **not** an in-session loop — a `while(true)` inside one tool call dies at the tool timeout and stops notifying. Use the scheduled background job instead.

## Continuous monitoring (recommended)

The `berlin-flats-hunt` launchd job polls the portals every 30 minutes (07:00–22:00 Berlin time, quiet hours respected) and sends new `pending`/`review` listings to Telegram. Install it from the repo automation layer:

```bash
bash <marketplace-root>/automation/install.sh
```

Then review the queue any time with `/berlin-flats:triage`. The job logs to `~/Logs/berlin-flats-hunt/`.

## Ad-hoc single hunt (this session)

To run one hunt right now:

```bash
BUN_BIN="$(command -v bun 2>/dev/null || true)"
for c in "${HOME:-}/.bun/bin/bun" /opt/homebrew/bin/bun /usr/local/bin/bun; do
  [ -n "$BUN_BIN" ] && break; [ -x "$c" ] && BUN_BIN="$c"
done
: "${BUN_BIN:=bun}"
cd $CLAUDE_PLUGIN_ROOT && "$BUN_BIN" scripts/hunt.ts 2>&1
```

New listings are saved to the SQLite DB with their verdict. Run `/berlin-flats:triage` to act on them.

**Quiet hours:** if it is between 22:00 and 07:00 Berlin time, warn the user before running — notifications during these hours may be intrusive.
