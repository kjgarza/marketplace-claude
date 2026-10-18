# Ishmael — Travel Agent (Design Spec)

Date: 2026-07-24
Status: Approved design → pending implementation plan
Owner: Kristian

## Purpose

Minimize time spent planning and figuring out what to do in a foreign city. Ishmael
researches things to do, watches weather and adapts plans/outfits, alerts for
advance-booking and app-download needs, and remembers per-trip research so re-planning
on the day is cheap (few tokens). Local to the scratchpad vault, not global.

## Non-goals (Phase 1)

- No cron / proactive background watchers (on-demand only).
- No deep automated train-ticket purchasing (playbook + app-install alert only).
- No Wanderlog write-back mirror.
- Ishmael never books, pays, or sends anything. It surfaces + drafts; the human acts.

## Layout (in-project plugin + separate data dir)

Ishmael is packaged as a local Claude Code plugin. Code lives in the plugin dir; runtime
data lives in a sibling project-root data dir (same split berlin-events uses).

```
.claude/plugins/
  .claude-plugin/marketplace.json    # local marketplace "scratchpad-local"
  ishmael/
    .claude-plugin/plugin.json
    skills/
      plan/SKILL.md                  # ishmael:plan (orchestrator)
      plan/references/trip-schema.md
      discover/SKILL.md              # ishmael:discover
      discover/references/gogcli-maps.md
      discover/references/gogcli-calendar.md
      discover/references/getyourguide.md
      discover/references/tripadvisor.md
      discover/references/booking.md
      discover/references/airbnb.md
      discover/references/trains.md
      weather/SKILL.md               # ishmael:weather
      check/SKILL.md                 # ishmael:check
    agents/travel-scout.md           # ishmael:travel-scout
    commands/plan.md                 # /ishmael:plan
    commands/check.md                # /ishmael:check
    scripts/forecast.ts (+ .test.ts) # open-meteo, no API key
    README.md  DESIGN.md  PLAN.md

.claude/ishmael/                     # runtime DATA (not part of the plugin)
    profile.json                     # global traveler prefs (seeded)
    trips/<slug>.json                # one per trip (git-ignored)
```

Skills are namespaced by the plugin: `ishmael:plan`, `ishmael:discover`,
`ishmael:weather`, `ishmael:check`; agent `ishmael:travel-scout`; commands
`/ishmael:plan`, `/ishmael:check`. Scripts are referenced as
`${CLAUDE_PLUGIN_ROOT:-.claude/plugins/ishmael}/scripts/...`; data is read/written under
the project's `.claude/ishmael/`. Enable via
`/plugin marketplace add .claude/plugins` then `/plugin install ishmael@scratchpad-local`.

## Data model

### profile.json — global, persists across ALL trips

```json
{
  "food": {
    "wants": ["fresh ingredients", "complex flavours", "aperitivo culture"],
    "avoid": ["tourist traps", "bland set menus"]
  },
  "pace": {
    "morning_run": true,
    "midday_siesta_when_hot": true,
    "transport_default": "public",
    "occasional_late_taxi": true,
    "commute_tolerance_min": 45
  },
  "gear": {
    "heat_averse": true,
    "fan_essential_when_hot": true,
    "cap_and_sunglasses_default": true,
    "umbrella_when_rain": true
  },
  "interests": ["art", "architecture", "food", "live music"]
}
```

Seeded once from known prefs; `ishmael-plan` can refine it when the user states a new
standing preference.

### trips/<slug>.json — one per trip

```json
{
  "slug": "milan-2026-07",
  "city": "Milan",
  "country": "IT",
  "dates": { "start": "2026-07-17", "end": "2026-07-20" },
  "lodging": { "name": "...", "address": "...", "checkin": "...", "checkout": "..." },
  "flights": [ { "code": "U2 5425", "from": "BER", "to": "LIN", "dep": "...", "arr": "..." } ],
  "days": [
    { "date": "2026-07-17", "blocks": [
        { "time": "afternoon", "place": "Duomo", "note": "...", "cal_event_id": null } ] }
  ],
  "bookings": [
    { "item": "GetYourGuide X", "needs_advance": true, "deadline": "2026-07-15",
      "url": "...", "booked": false }
  ],
  "apps": [
    { "name": "Trenord", "why": "buy regional rail, avoid slow S7", "installed": false }
  ],
  "research": {
    "como_daytrip": { "researched_at": "2026-07-16", "findings": "..." },
    "concert_logistics": { "researched_at": "2026-07-18", "findings": "..." }
  },
  "changes_log": [ { "at": "2026-07-19", "what": "rain shifted Brera to AM" } ]
}
```

`research{}` is the token-saver: skills read it first and only re-research when stale
(> a few days old) or the user explicitly asks for fresh data.

## Skills (Phase 1)

### ishmael-plan (orchestrator)
- Create or refine `trips/<slug>.json`; read `profile.json`.
- Gather flights/lodging/dates from the user or an existing plan.
- **Calendar conflict-check** (`gog calendar`): before scheduling day blocks, pull
  existing events across the trip window; surface clashes (Kristian's own events, plus
  *awareness* of Claudia's — never treat hers as movable/manageable).
- Build/adjust day-by-day, honoring pace + transport prefs + calendar gaps.
- **Calendar event creation** (`gog calendar create`): after the user approves the plan,
  draft events for flights, lodging check-in/out, concert/anchor blocks, and
  booking-deadline reminders → **present the draft list, create only on explicit yes**,
  one confirmation for the batch. Kristian's calendar only; never invite others.
  Write created event IDs back into the trip file so `ishmael-check` can update/move them.
- Run the **alerts pass**: scan `bookings[]` for advance-booking items near/past
  `deadline` and `apps[]` not installed → emit a dated checklist.
- Delegate heavy discovery to `ishmael-discover` / the scout agent.

### ishmael-discover (things to do)
- Respect taste profile (food: fresh ingredients, complex flavours; interests; pace).
- Use site playbooks (references/) via `gog maps`, claude-in-chrome browser, or
  WebSearch fallback.
- Flag advance-booking-required activities into `bookings[]`.
- Write candidate finds into trip `research{}` so they persist.

### ishmael-weather
- `scripts/forecast.ts` → open-meteo daily+hourly for city+dates.
- Per-day **outfit/gear** callouts: umbrella if rain prob high; **fan** if hot
  (heat_averse); cap+sunglasses if sunny; layers if swing.
- **Plan-shift** suggestions: move outdoor/walking blocks off rainy or peak-heat slots;
  record moves in `changes_log`.

### ishmael-check (on-demand re-plan)
- Re-read weather + trip memory; diff against current plan.
- Surface *what changed* and propose minimal adjustments.
- **Calendar sync**: when a block moves, update the matching event via
  `gog calendar update` (using stored event IDs) — drafted then confirmed, same rule.
- Cheap: reads `research{}` instead of re-researching. Append to `changes_log`.

## Site playbooks (skills/discover/references/)

Each doc = how to query the site, what to extract, how to flag advance-booking:
- `gogcli-maps.md` — `gog maps` for spots, ratings/reviews, commute times between points.
- `gogcli-calendar.md` — `gog calendar` list/events (conflict-check), `create`/`update`
  (draft-then-confirm), Kristian's calendar only, Claudia's = read-only awareness.
- `getyourguide.md`, `tripadvisor.md` — tours/tickets via claude-in-chrome; detect
  "book in advance / sells out".
- `booking.md`, `airbnb.md` — lodging search/compare.
- `trains.md` — rail booking sites (Trenitalia/Trenord/DB) + the **install-app-now**
  rule (Italy regional rail classic: buy via Trenord app, avoid slow suburban routes).

## Agent

`ishmael-travel-scout` — subagent for noisy browser/discovery research; returns
structured candidate JSON, keeps browsing out of main context. Mirrors berlin-events
`event-scout`.

## Commands

- `/ishmael-plan` — start/refine a trip.
- `/ishmael-check` — on-demand re-plan for the active trip.

## Tools

- Maps/reviews/commute → `gog maps …` (gogcli installed at /opt/homebrew/bin/gog).
- Calendar conflict-check + event create/update → `gog calendar …`.
- Weather → `scripts/forecast.ts` (open-meteo, no key).
- Tours/stays → claude-in-chrome browser playbooks.
- Fallback → WebSearch / WebFetch.

## Safety

Ishmael surfaces and drafts only. It never books, pays, submits forms, sends invites,
or installs apps. Advance-booking and app-install items are presented as checklists for
the human to action. **Calendar events are the one write Ishmael performs** — and only
after showing the draft batch and getting an explicit yes, on Kristian's own calendar,
never inviting others; Claudia's calendar is read-only awareness (per vault memory).

## Storage / git

Trip JSON lives in the vault (already private GitLab). Committing is consistent with the
vault; `.claude/ishmael/trips/` may be gitignored if the user prefers trip data untracked.

## Phase 2 (deferred)

Cron proactive watchers (morning weather + ticket-deadline alerts), deep train
automation, Wanderlog mirror, promotion to a real marketplace plugin.
