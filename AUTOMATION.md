# Automation Layer

Scheduled, hands-off runs of the productivity plugins, with results delivered to **Telegram**.
The pieces live in [`automation/`](automation/) and install as macOS **launchd** agents.

## How it fits together

```
automation/
  notify-telegram.sh      shared Telegram sender (token/chat from ~/.claude/channels/telegram)
  lib/headless-claude.sh   resolve `claude`, plugin-dir flags, logging, quiet-hours, run_claude
  jobs/<job>.sh            one script per scheduled job
  install.sh               generates plists, copies the runnable layer, launchctl bootstrap
```

Jobs run against the **installed plugin cache** (`~/.claude/plugins/cache/marketplace-claude`),
not this repo. Install/refresh the marketplace in Claude Code first, then run the installer.

## Jobs

| Job | Schedule | Type | What it does |
|-----|----------|------|--------------|
| `berlin-flats-hunt` | every 30 min (quiet 22–07) | pure node | hunt portals; Telegram on new pending/review listings |
| `readitlater-digest` | Mon 06:00 | headless claude | weekly themed digest; Telegram with path |
| `berlin-events-weekly` | Fri 10:00 | headless claude | weekend art/food picks → Telegram |
| `vhs-watch-check` | daily 08:00 | pure bun | re-run saved VHS watches; Telegram only on changes |
| `bookclub-dispatch` | daily 09:00 | headless claude | send today's due book-club messages to Telegram |
| `taskwarrior-daily` | daily 08:30 | pure shell | overdue/active/stale task summary → Telegram |
| `finanz-quarterly` | 1st of Jan/Apr/Jul/Oct 09:00 | headless claude | re-projection + data-staleness check → Telegram |

"Pure" jobs cost no tokens (deterministic scripts). "Headless claude" jobs run `claude -p`.

## Install

```bash
bash automation/install.sh --dry-run   # preview the plan
bash automation/install.sh             # install (asks once to confirm)
bash automation/install.sh --uninstall # remove all agents
```

The installer copies the runnable layer to `~/Scripts/claude-jobs/`, writes plists to
`~/Library/LaunchAgents/com.kristiangarza.<job>.plist`, and `launchctl bootstrap`s them. It is
idempotent and supersedes the old standalone `com.kristiangarza.readitlater-digest` agent.

## Notifications

`notify-telegram.sh` reads `TELEGRAM_BOT_TOKEN` from `~/.claude/channels/telegram/.env` and the
destination chat id from the first `allowFrom` entry in `~/.claude/channels/telegram/access.json`.
Test it:

```bash
bash automation/notify-telegram.sh "test from automation layer"
```

## Test a job manually

```bash
bash ~/Scripts/claude-jobs/<job>.sh      # after install
# or, before install, against the repo:
CLAUDE_PLUGIN_CACHE="$(pwd)" bash automation/jobs/<job>.sh
```

Logs: `~/Logs/<job>/` (per-run logs + launchd stdout/stderr).

## Notes & limitations

- **vhs-watch-check** depends on live VHS course extraction, which is currently blocked by the
  site's JS/postback rendering (see `plugins/vhs-berlin-agent/PLUGIN.md`). The job runs and
  reports honestly but will not surface changes until that recon is done.
- **bookclub-dispatch** runs from `$HOME`; if your book folders live elsewhere, point the job's
  working directory or `output_root` (in `.claude/bookclub.local.md`) at them.
- Headless jobs need either a cached `claude auth login` token or `ANTHROPIC_API_KEY` in the
  job environment.
