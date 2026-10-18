# Ishmael — local travel agent (plugin)

A local, in-project Claude Code plugin that plans trips: taste-aware discovery,
weather-adaptive itineraries, calendar conflict-check + blocking, advance-booking and
must-install-app alerts, and per-trip memory so re-planning stays cheap. See `DESIGN.md`
for the full spec and `PLAN.md` for the build.

## Layout

    .claude/plugins/ishmael/            # plugin code (this dir, git-tracked)
      .claude-plugin/plugin.json
      skills/plan/SKILL.md              # ishmael:plan  (orchestrator)
      skills/discover/SKILL.md          # ishmael:discover
      skills/discover/references/*.md   # site playbooks (gog maps/calendar, GYG, TripAdvisor, booking, airbnb, trains)
      skills/weather/SKILL.md           # ishmael:weather
      skills/check/SKILL.md             # ishmael:check
      skills/plan/references/trip-schema.md
      agents/travel-scout.md            # ishmael:travel-scout
      commands/plan.md, commands/check.md   # /ishmael:plan, /ishmael:check
      scripts/forecast.ts (+ .test.ts)  # open-meteo wrapper (bun)

    .claude/ishmael/                    # runtime DATA (kept out of the plugin)
      profile.json                      # global traveler preferences
      trips/<slug>.json                 # one per trip (git-ignored)

Scripts are referenced as `${CLAUDE_PLUGIN_ROOT:-.claude/plugins/ishmael}/scripts/...`;
data is read/written under the project's `.claude/ishmael/`.

## Enable (in-project marketplace)

The plugin ships with a local marketplace at `.claude/plugins/.claude-plugin/marketplace.json`.

    /plugin marketplace add .claude/plugins
    /plugin install ishmael@scratchpad-local

(Then reload if prompted.)

## Use

- `/ishmael:plan <city + dates>` — build/refine a trip, weather + discovery + calendar
  conflict-check, draft calendar events (dry-run → confirm), booking/app checklist.
- `/ishmael:check` — on-the-day cheap re-plan (weather shift, deadlines, calendar sync).

## Safety

Ishmael surfaces and drafts; the human books/pays/installs. The only write it performs is
creating/updating calendar events — always dry-run first, explicit confirm, Kristian's
`primary` calendar only, never inviting others, never managing Claudia's calendar.

## Requirements

`bun`, `gog` CLI (Google Maps Places + Calendar), network for open-meteo.
Note: `gog maps` is Places-only (no directions) — commute times come from WebSearch/browser.
