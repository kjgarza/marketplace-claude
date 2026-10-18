# Ishmael Travel Agent — Implementation Plan

> **HISTORICAL:** This plan built the components as loose files under `.claude/{skills,agents,commands}`. After the build they were restructured into an in-project plugin at `.claude/plugins/ishmael/` (skills namespaced `ishmael:*`, scripts referenced via `${CLAUDE_PLUGIN_ROOT}`, data kept at `.claude/ishmael/`). The old paths and bare skill names in the tasks below reflect the original layout — see `DESIGN.md` and `README.md` for the current plugin structure.

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a local, on-demand travel-planning agent ("Ishmael") in the scratchpad vault that researches things to do, adapts plans to weather, alerts on advance-booking / app-install needs, checks & writes the calendar, and remembers per-trip research to keep re-planning cheap.

**Architecture:** Local Claude Code components under `.claude/` (auto-discovered skills/agents/commands — no marketplace plumbing). Persistent state in `.claude/ishmael/` as JSON: one global `profile.json` + one `trips/<slug>.json` per trip. One `bun` script (`forecast.ts`) wraps open-meteo. Everything else is markdown skills/agents/commands that call `gog` (maps/calendar), `forecast.ts`, claude-in-chrome (browser playbooks), and WebSearch/WebFetch fallback. Ishmael only writes calendar events, and only after an explicit confirm.

**Tech Stack:** Markdown skills/agents/commands; `bun` + TypeScript for `forecast.ts`; `gog` CLI (Google Maps Places + Calendar); open-meteo HTTP API (no key); claude-in-chrome MCP.

## Global Constraints

- All files live under `/Volumes/Verbatim-Vi560-Media/Development/notes/scratchpad/.claude/`. Nothing global (`~/.claude/`).
- Persistent data root: `.claude/ishmael/` (`profile.json`, `trips/<slug>.json`, `scripts/`).
- Skills are invoked by bare name: `ishmael-plan`, `ishmael-discover`, `ishmael-weather`, `ishmael-check` (no `plugin:` prefix).
- `forecast.ts` shebang: `#!/usr/bin/env bun`. Run with `bun run <path>`.
- Weather source: open-meteo. Geocode: `https://geocoding-api.open-meteo.com/v1/search`. Forecast: `https://api.open-meteo.com/v1/forecast`. No API key. Never put personal data in query strings (cities only).
- `gog` calendar writes ALWAYS use `--dry-run` first to show intent; real write only after explicit user "yes". Kristian's `primary` calendar only; never `--attendees`; never manage Claudia's calendar (read-only awareness).
- `gog` Maps exposes Places only (`search`, `details`) — NO directions/commute endpoint. Commute times come from WebSearch/browser, not `gog`.
- Ishmael never books, pays, submits forms, sends invites, or installs apps. Those are surfaced as checklists.
- Preserve the vault's existing style; do not restructure unrelated files. Do not commit unless the user asks.
- Spec of record: `.claude/ishmael/DESIGN.md`.

---

### Task 1: State store scaffolding (profile + trips dir + gitignore)

**Files:**
- Create: `.claude/ishmael/profile.json`
- Create: `.claude/ishmael/trips/.gitkeep`
- Create: `.claude/ishmael/README.md`
- Modify: `.claude/.gitignore` (create if absent)

**Interfaces:**
- Produces: `profile.json` schema (keys `food`, `pace`, `gear`, `interests`) consumed by every skill; `trips/` directory as the per-trip store.

- [ ] **Step 1: Write `profile.json` seed**

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

- [ ] **Step 2: Create `trips/.gitkeep`** (empty file, so the dir exists in git).

- [ ] **Step 3: Write `.claude/ishmael/README.md`**

```markdown
# Ishmael — local travel agent

State store for the Ishmael skills. See `DESIGN.md` for the full spec.

- `profile.json` — global traveler preferences (persists across all trips).
- `trips/<slug>.json` — one file per trip (itinerary + booking/app alerts + research memory + calendar event IDs).
- `scripts/forecast.ts` — open-meteo weather wrapper (run with `bun run`).

Skills: `ishmael-plan`, `ishmael-discover`, `ishmael-weather`, `ishmael-check`.
Ishmael surfaces and drafts; the human books/pays/installs. The only write it performs
is creating/updating calendar events, and only after an explicit confirm.
```

- [ ] **Step 4: Write `.claude/.gitignore`** — decision: trip data stays untracked by default (personal, changes often). Append these lines (create the file if it does not exist):

```
# Ishmael trip data (personal; untrack by default)
ishmael/trips/*.json
```

- [ ] **Step 5: Verify JSON + structure**

Run: `cd /Volumes/Verbatim-Vi560-Media/Development/notes/scratchpad && python3 -m json.tool .claude/ishmael/profile.json > /dev/null && echo OK && ls .claude/ishmael/trips/.gitkeep && git check-ignore .claude/ishmael/trips/foo.json`
Expected: `OK`, the `.gitkeep` path prints, and `git check-ignore` echoes `.claude/ishmael/trips/foo.json` (proving trip files are ignored).

---

### Task 2: `forecast.ts` — open-meteo wrapper with gear flags (TDD)

**Files:**
- Create: `.claude/ishmael/scripts/forecast.ts`
- Create: `.claude/ishmael/scripts/forecast.test.ts`

**Interfaces:**
- Produces: CLI `bun run forecast.ts "<City>" <start-YYYY-MM-DD> <end-YYYY-MM-DD>` printing JSON:
  `{ city, latitude, longitude, days: [ { date, t_max, t_min, precip_prob_max, gear: { umbrella, fan, cap_sunglasses, layers } } ] }`.
- Produces: exported pure function `deriveGear(day)` used by both the CLI and the test, signature:
  `deriveGear({ t_max:number, t_min:number, precip_prob_max:number }) => { umbrella:boolean, fan:boolean, cap_sunglasses:boolean, layers:boolean }`.
- Consumes: nothing from earlier tasks.

- [ ] **Step 1: Write the failing test** (`forecast.test.ts`)

```ts
import { expect, test } from "bun:test";
import { deriveGear } from "./forecast.ts";

test("hot dry day → fan + cap, no umbrella", () => {
  expect(deriveGear({ t_max: 34, t_min: 22, precip_prob_max: 10 }))
    .toEqual({ umbrella: false, fan: true, cap_sunglasses: true, layers: false });
});

test("rainy day → umbrella, no cap", () => {
  expect(deriveGear({ t_max: 19, t_min: 14, precip_prob_max: 70 }))
    .toEqual({ umbrella: true, fan: false, cap_sunglasses: false, layers: false });
});

test("big swing cool morning → layers", () => {
  expect(deriveGear({ t_max: 24, t_min: 9, precip_prob_max: 15 }))
    .toEqual({ umbrella: false, fan: false, cap_sunglasses: true, layers: true });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd .claude/ishmael/scripts && bun test forecast.test.ts`
Expected: FAIL — cannot resolve `deriveGear` from `./forecast.ts`.

- [ ] **Step 3: Write `forecast.ts`**

```ts
#!/usr/bin/env bun
// Open-meteo weather wrapper for Ishmael.
// Usage: bun run forecast.ts "<City>" <start-YYYY-MM-DD> <end-YYYY-MM-DD>

export interface DayRaw { t_max: number; t_min: number; precip_prob_max: number }
export interface Gear { umbrella: boolean; fan: boolean; cap_sunglasses: boolean; layers: boolean }

export function deriveGear(d: DayRaw): Gear {
  const umbrella = d.precip_prob_max >= 40;
  const fan = d.t_max >= 30;
  const cap_sunglasses = d.precip_prob_max < 40 && d.t_max >= 22;
  const layers = d.t_max - d.t_min >= 12 && d.t_min < 15;
  return { umbrella, fan, cap_sunglasses, layers };
}

async function geocode(city: string): Promise<{ latitude: number; longitude: number; name: string }> {
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`;
  const r = await fetch(url);
  if (!r.ok) throw new Error(`geocode HTTP ${r.status}`);
  const j = await r.json() as any;
  if (!j.results?.length) throw new Error(`no geocode match for "${city}"`);
  const g = j.results[0];
  return { latitude: g.latitude, longitude: g.longitude, name: g.name };
}

async function main() {
  const [city, start, end] = process.argv.slice(2);
  if (!city || !start || !end) {
    console.error('Usage: bun run forecast.ts "<City>" <start-YYYY-MM-DD> <end-YYYY-MM-DD>');
    process.exit(2);
  }
  const g = await geocode(city);
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${g.latitude}&longitude=${g.longitude}`
    + `&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max`
    + `&timezone=auto&start_date=${start}&end_date=${end}`;
  const r = await fetch(url);
  if (!r.ok) throw new Error(`forecast HTTP ${r.status}`);
  const j = await r.json() as any;
  const d = j.daily;
  const days = (d?.time ?? []).map((date: string, i: number) => {
    const raw: DayRaw = {
      t_max: d.temperature_2m_max[i],
      t_min: d.temperature_2m_min[i],
      precip_prob_max: d.precipitation_probability_max?.[i] ?? 0,
    };
    return { date, ...raw, gear: deriveGear(raw) };
  });
  console.log(JSON.stringify({ city: g.name, latitude: g.latitude, longitude: g.longitude, days }, null, 2));
}

if (import.meta.main) main().catch((e) => { console.error(String(e)); process.exit(1); });
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd .claude/ishmael/scripts && bun test forecast.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Live smoke (network)**

Run: `cd .claude/ishmael/scripts && bun run forecast.ts "Milan" 2026-07-25 2026-07-27`
Expected: JSON with `city` ≈ "Milan", `days[]` length 3, each day carrying `gear`. (If offline, note it and skip — logic is covered by the unit test.)

- [ ] **Step 6: Commit** (only if the user has asked for commits; otherwise skip and leave working-tree changes)

```bash
git add .claude/ishmael/scripts/forecast.ts .claude/ishmael/scripts/forecast.test.ts
git commit -m "feat(ishmael): add open-meteo forecast wrapper with gear flags"
```

---

### Task 3: `ishmael-weather` skill

**Files:**
- Create: `.claude/skills/ishmael-weather/SKILL.md`

**Interfaces:**
- Consumes: `forecast.ts` CLI (Task 2), `profile.json` gear prefs (Task 1), the active `trips/<slug>.json`.
- Produces: per-day outfit/gear brief + plan-shift suggestions; appends moves to the trip's `changes_log`.

- [ ] **Step 1: Write `SKILL.md`**

```markdown
---
name: ishmael-weather
description: Use when planning or adjusting a trip's days around weather — fetches the forecast for the trip city/dates and produces per-day outfit/gear advice (umbrella, fan, cap+sunglasses, layers) plus suggestions to move outdoor blocks off rainy or peak-heat slots. Trigger on "check the weather for the trip", "what should I pack/wear", or during ishmael-plan/ishmael-check.
---

# ishmael-weather

Adapt a trip to the forecast. Read `.claude/ishmael/profile.json` for gear prefs
(heat_averse → fan matters; cap_and_sunglasses_default; umbrella_when_rain).

## Steps

1. Resolve the active trip file `.claude/ishmael/trips/<slug>.json` (ask if ambiguous).
   Read `city` and `dates`.
2. Run the forecast:
   `bun run .claude/ishmael/scripts/forecast.ts "<city>" <start> <end>`
   (dates capped to open-meteo's 16-day horizon; if the trip is further out, say so and
   give seasonal-normal guidance instead of a false forecast.)
3. For each day, translate `gear` flags into a one-line brief, e.g.:
   - `fan:true` → "Pack the handheld fan — 34°C peak."
   - `umbrella:true` → "Umbrella: 70% rain."
   - `cap_sunglasses:true` → "Cap + sunglasses."
   - `layers:true` → "Cool morning (9°C) — light layer for the AM run."
4. Plan-shift: cross-reference the trip `days[].blocks`. If an outdoor/walking block sits
   in a rainy or ≥30°C peak-afternoon slot, propose moving it to morning/evening. Present
   proposals; on user agreement, edit the trip file and append to `changes_log`
   (`{ "at": "<today>", "what": "..." }`).
5. Never fabricate numbers — if the forecast call fails, say so and fall back to
   WebSearch for the city's seasonal normals, clearly labeled as normals not forecast.

## Output
A compact day-by-day gear list + any plan-shift proposals. Terse.
```

- [ ] **Step 2: Verify frontmatter + refs resolve**

Run: `cd /Volumes/Verbatim-Vi560-Media/Development/notes/scratchpad && head -4 .claude/skills/ishmael-weather/SKILL.md | grep -E "^name: ishmael-weather$" && test -f .claude/ishmael/scripts/forecast.ts && echo OK`
Expected: the `name:` line prints and `OK`.

---

### Task 4: `gog` playbooks — maps + calendar

**Files:**
- Create: `.claude/skills/ishmael-discover/references/gogcli-maps.md`
- Create: `.claude/skills/ishmael-discover/references/gogcli-calendar.md`

**Interfaces:**
- Produces: reference docs loaded on demand by `ishmael-discover`, `ishmael-plan`, `ishmael-check`. Command syntax verified against `gog` 0.21.0.

- [ ] **Step 1: Write `gogcli-maps.md`**

```markdown
# Playbook: Google Maps via `gog` (Places only)

`gog maps` exposes the **Places API only** — search + details. There is **no directions /
commute endpoint**. For commute/transit times use WebSearch or claude-in-chrome, not gog.

## Find a spot (ratings, address, place_id)
    gog maps places search "<query>" -j
e.g. `gog maps places search "natural wine bar Navigli Milan" -j`
Extract: name, rating, user_ratings_total, formatted_address, place_id.

## Details for a known place
    gog maps places details "<place_id>" -j
Extract: opening_hours, website, rating, reviews summary, price_level.

## Use in discovery
- Rank candidates by rating × review count, filtered to the profile's taste
  (fresh ingredients, complex flavours; avoid tourist traps → deprioritize very high
  review counts in the tourist core if the user wants local).
- Write chosen spots into the trip file's `research{}` with the place_id so later
  lookups are free.

## Commute (fallback, since gog has no directions)
- Prefer WebSearch "how to get from <A> to <B> Milan public transport" or the
  claude-in-chrome Google Maps directions page. Record the result in `research{}`.
```

- [ ] **Step 2: Write `gogcli-calendar.md`**

```markdown
# Playbook: Google Calendar via `gog`

Calendar is the ONLY write Ishmael performs. Kristian's `primary` calendar only.
Never pass `--attendees`. Claudia's calendar = read-only awareness (never create/edit).

## List calendars (find IDs)
    gog calendar calendars -j

## Read existing events across the trip window (conflict-check)
    gog calendar events primary --from <start-RFC3339> --to <end-RFC3339> -j
For a cross-calendar busy view (includes Claudia's shared calendars if subscribed):
    gog calendar conflicts --from <start> --to <end> -j     # busy-overlap report (read-only)
Surface clashes to the user; treat non-primary calendars as immovable context only.

## Create an event — ALWAYS dry-run first
    gog calendar create primary --summary "<title>" \
      --from "2026-07-18T20:00:00" --to "2026-07-18T23:30:00" \
      --start-timezone "Europe/Rome" --end-timezone "Europe/Rome" \
      --location "<place>" --description "<note>" -n
- `-n/--dry-run` prints the intended event WITHOUT creating it. Show that to the user.
- Only after an explicit "yes", re-run the SAME command WITHOUT `-n` (add `-j` to
  capture the created event id from JSON).
- All-day (e.g. lodging span): add `--all-day` and use date-only `--from/--to`.
- Store the returned event id into the trip file (`days[].blocks[].cal_event_id` or a
  `bookings[].cal_event_id`).

## Update a moved block
    gog calendar update primary <eventId> --from <new> --to <new> -n   # dry-run
Then re-run without `-n` after confirmation.

## Batch rule
When creating several events (flights, check-in/out, concert, anchors, deadlines),
present ALL dry-run lines as one list, get ONE explicit "yes", then execute the batch.
Never create silently.
```

- [ ] **Step 3: Verify**

Run: `cd /Volumes/Verbatim-Vi560-Media/Development/notes/scratchpad && grep -q "gog maps places search" .claude/skills/ishmael-discover/references/gogcli-maps.md && grep -q "dry-run" .claude/skills/ishmael-discover/references/gogcli-calendar.md && echo OK`
Expected: `OK`.

---

### Task 5: Site playbooks — tours / stays / trains

**Files:**
- Create: `.claude/skills/ishmael-discover/references/getyourguide.md`
- Create: `.claude/skills/ishmael-discover/references/tripadvisor.md`
- Create: `.claude/skills/ishmael-discover/references/booking.md`
- Create: `.claude/skills/ishmael-discover/references/airbnb.md`
- Create: `.claude/skills/ishmael-discover/references/trains.md`

**Interfaces:**
- Produces: browser/WebSearch playbooks used by `ishmael-discover` and the scout agent. Each ends by writing findings into the trip `research{}` / `bookings[]` / `apps[]`.

- [ ] **Step 1: Write `getyourguide.md`**

```markdown
# Playbook: GetYourGuide (tours & skip-the-line tickets)

Goal: find bookable activities and FLAG which sell out / need advance booking.

## Access
- Prefer WebSearch: `getyourguide <city> <activity>` then WebFetch the result page.
- For live availability use claude-in-chrome: open `https://www.getyourguide.com`,
  search the city, read cards. Decline cookie banners (most privacy-preserving option).

## Extract per activity
title, price, duration, rating/reviews, next available date, "Likely to sell out" /
limited-availability badges, free-cancellation window.

## Flag advance-booking
If an activity shows limited availability, timed entry, or is a known must-book
(e.g. Last Supper / Cenacolo Vinciano in Milan — books out weeks ahead), append to the
trip `bookings[]`: `{ item, needs_advance:true, deadline, url, booked:false }`.

## Safety
Never purchase or enter payment/personal data. Surface the booking link for the human.
```

- [ ] **Step 2: Write `tripadvisor.md`**

```markdown
# Playbook: TripAdvisor (things to do, restaurant sanity-check)

## Access
WebSearch `tripadvisor <city> things to do` / `tripadvisor <restaurant> <city>`, WebFetch
the page; or claude-in-chrome for the live "Things to Do" ranking. Decline cookie banners.

## Extract
Ranked attractions, rating, review count, "traveler favorite" tags; for restaurants:
cuisine, price, rating, whether reservations are recommended.

## Use
Cross-check gog Places ratings against TripAdvisor to avoid tourist traps (profile:
fresh ingredients, complex flavours). Deprioritize spots that are high-volume but
low-quality. Write keepers into `research{}`.

## Flag advance-booking
Reservation-recommended restaurants and timed attractions → `bookings[]` with a deadline.
```

- [ ] **Step 3: Write `booking.md`**

```markdown
# Playbook: Booking.com (lodging search/compare)

## Access
claude-in-chrome: `https://www.booking.com`, set city + dates + guests, read result cards.
Or WebSearch + WebFetch for a specific property. Decline non-essential cookies.

## Extract per property
name, area/neighborhood, price/night + total, review score & count, free-cancellation,
distance to the trip's anchor (concert venue, old town), breakfast.

## Use
Rank by (review score, location vs anchors, free-cancellation). Present a short list.
Never book or enter card/personal data — surface the link for the human to complete.
```

- [ ] **Step 4: Write `airbnb.md`**

```markdown
# Playbook: Airbnb (lodging alternative)

## Access
claude-in-chrome: `https://www.airbnb.com`, city + dates + guests. Decline non-essential
cookies. Reading listings is fine; do NOT log in, message hosts, or book.

## Extract per listing
title, area, price + total w/ fees, rating & review count, superhost, cancellation policy,
walk time to anchors.

## Use
Compare against Booking.com results; note trade-offs (whole-home vs hotel services).
Surface links; the human books.
```

- [ ] **Step 5: Write `trains.md`**

```markdown
# Playbook: Trains + "install-app-now" alerts

Rail is where planning-ahead pays off. Two jobs: (1) find real train times, (2) tell the
user which app to install BEFORE the trip.

## Find times
- Italy regional: Trenord (`https://www.trenord.it`) for Milan-area regional (e.g. Como,
  Lake lines). Trenitalia (`https://www.trenitalia.com`) for national/high-speed.
- Germany: DB (`https://www.bahn.de`). France: SNCF Connect. Use WebSearch/WebFetch or
  claude-in-chrome.
- WATCH the Italy trap: Trenitalia route search may stitch slow suburban S-lines
  (e.g. S7) giving 2h+/2-change results when a direct RegioExpress (~1h) exists on
  Trenord. Cross-check both operators; prefer the direct regional.

## Install-app alert (core behavior)
When a trip needs local rail, append to the trip `apps[]`:
  { "name": "Trenord", "why": "buy Milan regional tickets, avoid slow S-lines", "installed": false }
Common: Trenord / Trenitalia (IT), DB Navigator (DE), SNCF Connect (FR).
`ishmael-plan` surfaces uninstalled apps as a pre-trip checklist. Ishmael never installs.

## Safety
Never buy tickets or enter payment/personal data. Provide the link/app; the human buys.
```

- [ ] **Step 6: Verify all five exist**

Run: `cd /Volumes/Verbatim-Vi560-Media/Development/notes/scratchpad && ls .claude/skills/ishmael-discover/references/{getyourguide,tripadvisor,booking,airbnb,trains}.md && echo OK`
Expected: five paths + `OK`.

---

### Task 6: `ishmael-travel-scout` agent + `ishmael-discover` skill

**Files:**
- Create: `.claude/agents/ishmael-travel-scout.md`
- Create: `.claude/skills/ishmael-discover/SKILL.md`

**Interfaces:**
- Consumes: reference playbooks (Tasks 4–5), `profile.json`, active trip file.
- Produces: candidate spots/activities written into the trip's `research{}`; advance-booking items into `bookings[]`; rail apps into `apps[]`. The agent returns structured JSON so main-context stays clean.

- [ ] **Step 1: Write the agent `ishmael-travel-scout.md`**

```markdown
---
name: ishmael-travel-scout
description: Heavy discovery/browser research for a trip — searches Maps/TripAdvisor/GetYourGuide/Booking/Airbnb/rail sites and returns a structured shortlist. Invoke from ishmael-discover to keep noisy browsing out of the main thread.
tools: Bash, WebSearch, WebFetch, Read, Write
---

You are Ishmael's discovery scout. You research a single, well-scoped ask
(e.g. "natural-wine dinner near Navigli", "half-day Lake Como options", "must-book
Milan attractions") and return a compact structured result. You do NOT chat.

## Inputs (from the calling skill)
- city, dates, neighborhood/anchor
- the taste profile (food: fresh ingredients / complex flavours; interests; pace)
- which playbooks apply

## Method
1. Read the relevant reference playbooks under
   `.claude/skills/ishmael-discover/references/`.
2. Use `gog maps places search ... -j` for spots + ratings; WebSearch/WebFetch for
   TripAdvisor/GetYourGuide/Booking/Airbnb/rail per playbook.
3. Rank by fit to the profile, not raw popularity.
4. Flag anything that needs advance booking or a pre-trip app.

## Output (return ONLY this JSON, no prose)
{
  "candidates": [
    { "name", "kind": "food|sight|activity|stay|transport",
      "why_fit", "rating", "reviews", "place_id_or_url",
      "needs_advance": false, "deadline": null }
  ],
  "apps": [ { "name", "why" } ],
  "notes": "one-line caveats (closures, seasonality)"
}

Never book, pay, log in, or enter personal data. Report findings only.
```

- [ ] **Step 2: Write `ishmael-discover/SKILL.md`**

```markdown
---
name: ishmael-discover
description: Use when the user wants things to do / where to eat / day-trip ideas / lodging options for a trip. Finds candidates that fit the taste profile (fresh ingredients, complex flavours, art/music), flags advance-booking and pre-trip apps, and saves finds into the trip's research memory so it isn't re-researched. Trigger on "what should we do in <city>", "find a restaurant/bar", "day trip ideas", "where to stay".
---

# ishmael-discover

Find things worth doing for the active trip, cheaply and to taste.

## Steps
1. Load `.claude/ishmael/profile.json` and the active `trips/<slug>.json`.
2. Check `research{}` FIRST. If a fresh (≤ ~5 days old) entry answers the ask, reuse it —
   do not re-research. Only go external if missing, stale, or the user asks for fresh.
3. For a new ask, dispatch the `ishmael-travel-scout` agent with the scoped query,
   the profile, and the applicable playbooks (see `references/`).
4. Merge the scout's JSON:
   - write candidates under `research{"<topic>": { researched_at, findings }}`
   - append `needs_advance` items to `bookings[]`
   - append rail/city apps to `apps[]` (dedupe by name)
5. Present a terse shortlist with why-it-fits. Offer to add picks to the trip `days[]`.

## Rules
- Respect the profile: prefer local, high-quality, complex flavours; avoid tourist traps.
- Never book/pay/login. Advance-booking and app items are for the human to action.
```

- [ ] **Step 3: Verify**

Run: `cd /Volumes/Verbatim-Vi560-Media/Development/notes/scratchpad && grep -E "^name: ishmael-travel-scout$" .claude/agents/ishmael-travel-scout.md && grep -E "^name: ishmael-discover$" .claude/skills/ishmael-discover/SKILL.md && echo OK`
Expected: both `name:` lines + `OK`.

---

### Task 7: `ishmael-plan` skill (orchestrator)

**Files:**
- Create: `.claude/skills/ishmael-plan/SKILL.md`
- Create: `.claude/skills/ishmael-plan/references/trip-schema.md`

**Interfaces:**
- Consumes: `profile.json`; `forecast.ts` (via `ishmael-weather`); `ishmael-discover`; gog calendar playbook.
- Produces: a `trips/<slug>.json` conforming to `trip-schema.md`; calendar events (after confirm) with IDs stored back; an alerts checklist.

- [ ] **Step 1: Write `references/trip-schema.md`** (the canonical trip file shape)

```markdown
# Trip file schema — `.claude/ishmael/trips/<slug>.json`

    {
      "slug": "milan-2026-07",
      "city": "Milan",
      "country": "IT",
      "dates": { "start": "2026-07-17", "end": "2026-07-20" },
      "lodging": { "name": "", "address": "", "checkin": "", "checkout": "" },
      "flights": [ { "code": "", "from": "", "to": "", "dep": "", "arr": "" } ],
      "days": [
        { "date": "2026-07-17",
          "blocks": [ { "time": "afternoon", "place": "", "note": "", "cal_event_id": null } ] }
      ],
      "bookings": [
        { "item": "", "needs_advance": true, "deadline": "", "url": "", "booked": false,
          "cal_event_id": null }
      ],
      "apps": [ { "name": "", "why": "", "installed": false } ],
      "research": { "<topic>": { "researched_at": "", "findings": "" } },
      "changes_log": [ { "at": "", "what": "" } ]
    }

Rules: `slug` = kebab `<city>-<yyyy>-<mm>`. Dates ISO `YYYY-MM-DD`. Times in `days` are
coarse labels (morning/afternoon/evening) or `HH:MM`. `cal_event_id` filled only after a
real calendar create.
```

- [ ] **Step 2: Write `ishmael-plan/SKILL.md`**

```markdown
---
name: ishmael-plan
description: Use to start or refine a trip plan. Creates/updates the trip file, builds a day-by-day itinerary to the traveler's pace and taste, checks the calendar for conflicts, drafts calendar events (created only after an explicit yes), and produces a pre-trip alerts checklist for advance bookings and app installs. Trigger on "plan my trip to <city>", "set up the <trip>", "block my calendar for the trip", "what do I need to book/install".
---

# ishmael-plan

Orchestrate a trip end to end. Local state under `.claude/ishmael/`.

## Steps
1. Identify/create the trip file `trips/<slug>.json` (schema: `references/trip-schema.md`).
   Gather city, dates, lodging, flights from the user or an existing plan file.
2. Read `profile.json`. Build/refine `days[]` honoring pace (morning run, midday siesta in
   heat, public-transport default) and interests.
3. Weather pass: invoke `ishmael-weather` for the window; apply its gear + plan-shift
   output to `days[]`.
4. Discovery: invoke `ishmael-discover` for gaps (food, sights, day trips). Merge picks.
5. CALENDAR CONFLICT-CHECK (read-only): per `references/../ishmael-discover/references/gogcli-calendar.md`
   run `gog calendar events primary --from <start> --to <end> -j` (and `conflicts` for a
   cross-calendar busy view). Surface clashes; treat non-primary (incl. Claudia's) as
   immovable context.
6. CALENDAR CREATE (guarded write): draft events for flights, lodging check-in/out,
   concert/anchor blocks, and booking-deadline reminders. Present ALL as `-n` dry-run
   lines in one list. Get ONE explicit "yes". Then execute the batch WITHOUT `-n`,
   capturing each event id (`-j`) into the trip file. Kristian's `primary` only; never
   `--attendees`; never touch Claudia's calendar.
7. ALERTS PASS: scan `bookings[]` for `needs_advance && !booked` (sorted by `deadline`,
   flag any within ~14 days or past) and `apps[]` where `!installed`. Emit a dated
   checklist: "Book X by <date> — <url>", "Install <app> before travel — <why>".
8. Save the trip file. Summarize: plan + calendar result + checklist.

## Rules
- Never book, pay, submit, install, or invite. Calendar events are the only write, and
  only after explicit confirmation.
- Keep re-runs cheap: reuse `research{}`; don't re-fetch what's fresh.
```

- [ ] **Step 3: Verify**

Run: `cd /Volumes/Verbatim-Vi560-Media/Development/notes/scratchpad && grep -E "^name: ishmael-plan$" .claude/skills/ishmael-plan/SKILL.md && test -f .claude/skills/ishmael-plan/references/trip-schema.md && echo OK`
Expected: `name:` line + `OK`.

---

### Task 8: `ishmael-check` skill (on-demand re-plan)

**Files:**
- Create: `.claude/skills/ishmael-check/SKILL.md`

**Interfaces:**
- Consumes: active trip file, `ishmael-weather`, gog calendar playbook.
- Produces: a diff of what changed + minimal adjustments; updated calendar events (after confirm); appended `changes_log`.

- [ ] **Step 1: Write `SKILL.md`**

```markdown
---
name: ishmael-check
description: Use on the day (or day before) to re-check a trip and adjust — re-pulls the weather, re-reads the plan and its research memory, surfaces what changed, and proposes minimal edits, syncing any moved blocks to the calendar. Cheap because it reuses stored research instead of re-researching. Trigger on "check my trip", "re-plan today", "did anything change", "adjust today's plan".
---

# ishmael-check

Fast, cheap re-plan for the active trip. Reuse memory; don't re-research.

## Steps
1. Load the active `trips/<slug>.json` and `profile.json`.
2. Re-run `ishmael-weather` for today/remaining days. Compare to what the plan assumed.
3. Diff sources of change:
   - weather shift (rain now likely / hotter) → propose moving affected `days[].blocks`.
   - `bookings[]` deadlines newly inside the window / still unbooked → re-surface.
   - `apps[]` still uninstalled with travel imminent → re-surface.
   - Read `research{}` for the relevant topic INSTEAD of re-searching. Only go external if
     the user explicitly wants fresh data.
4. For any block the user agrees to move that already has a `cal_event_id`, update the
   event via `gog calendar update primary <eventId> ... -n` (dry-run), then execute after
   an explicit yes. Append every change to `changes_log`.
5. Output: a terse "what changed / what I moved / what still needs you" summary.

## Rules
- Minimal edits only — don't rebuild the plan. Never book/pay/install. Calendar update is
  the only write, guarded by confirmation.
```

- [ ] **Step 2: Verify**

Run: `cd /Volumes/Verbatim-Vi560-Media/Development/notes/scratchpad && grep -E "^name: ishmael-check$" .claude/skills/ishmael-check/SKILL.md && echo OK`
Expected: `name:` line + `OK`.

---

### Task 9: Commands + end-to-end smoke

**Files:**
- Create: `.claude/commands/ishmael-plan.md`
- Create: `.claude/commands/ishmael-check.md`
- Create (temp, then delete): `.claude/ishmael/trips/smoke-test.json`

**Interfaces:**
- Consumes: all prior tasks.
- Produces: two slash-command entry points; a passing end-to-end smoke.

- [ ] **Step 1: Write `commands/ishmael-plan.md`**

```markdown
---
description: Start or refine a trip plan with Ishmael (itinerary, weather, calendar, alerts).
---

Invoke the `ishmael-plan` skill for the trip described in: $ARGUMENTS

If no active trip is obvious, ask for city + dates first, then proceed.
```

- [ ] **Step 2: Write `commands/ishmael-check.md`**

```markdown
---
description: Re-check and adjust the active Ishmael trip (weather, deadlines, calendar sync).
---

Invoke the `ishmael-check` skill for the active trip (or the one named in: $ARGUMENTS).
```

- [ ] **Step 3: End-to-end smoke — forecast feeds a trip**

Create `.claude/ishmael/trips/smoke-test.json`:

```json
{
  "slug": "milan-smoke",
  "city": "Milan",
  "country": "IT",
  "dates": { "start": "2026-07-25", "end": "2026-07-27" },
  "lodging": { "name": "", "address": "", "checkin": "", "checkout": "" },
  "flights": [],
  "days": [ { "date": "2026-07-25", "blocks": [ { "time": "afternoon", "place": "Duomo", "note": "", "cal_event_id": null } ] } ],
  "bookings": [],
  "apps": [],
  "research": {},
  "changes_log": []
}
```

- [ ] **Step 4: Run the smoke checks**

Run:
```bash
cd /Volumes/Verbatim-Vi560-Media/Development/notes/scratchpad
python3 -m json.tool .claude/ishmael/trips/smoke-test.json > /dev/null && echo "trip-json OK"
bun run .claude/ishmael/scripts/forecast.ts "Milan" 2026-07-25 2026-07-27 | python3 -c "import sys,json; d=json.load(sys.stdin); assert len(d['days'])==3 and 'gear' in d['days'][0]; print('forecast OK')"
gog calendar create primary --summary "Ishmael smoke (dry-run)" --from "2026-07-25T15:00:00" --to "2026-07-25T16:00:00" --start-timezone "Europe/Rome" --end-timezone "Europe/Rome" -n && echo "calendar dry-run OK"
for f in ishmael-plan ishmael-discover ishmael-weather ishmael-check; do grep -qE "^name: $f$" .claude/skills/$f/SKILL.md && echo "$f skill OK"; done
```
Expected: `trip-json OK`, `forecast OK`, `calendar dry-run OK` (prints intended event, creates nothing), and four `... skill OK` lines. (If offline, the forecast line is the only one that may fail — note it.)

- [ ] **Step 5: Delete the smoke trip**

Run: `rm .claude/ishmael/trips/smoke-test.json && echo cleaned`
Expected: `cleaned`.

- [ ] **Step 6: Commit** (only if the user has asked for commits)

```bash
git add .claude/skills/ishmael-* .claude/agents/ishmael-travel-scout.md .claude/commands/ishmael-*.md .claude/ishmael/profile.json .claude/ishmael/README.md .claude/ishmael/scripts .claude/ishmael/DESIGN.md .claude/ishmael/PLAN.md .claude/.gitignore
git commit -m "feat(ishmael): local travel-agent skills, scout agent, commands, forecast script"
```

---

## Self-Review

**Spec coverage** (DESIGN.md → task):
- Data model profile/trip JSON → Task 1 + Task 7 schema. ✓
- research{} token-saver → Task 6 step 2, Task 8 step 3. ✓
- ishmael-plan/discover/weather/check → Tasks 7/6/3/8. ✓
- Calendar conflict-check + guarded create + update + IDs → Task 4 (playbook), Task 7 (create), Task 8 (update). ✓
- Site playbooks (maps, calendar, GYG, TripAdvisor, booking, airbnb, trains + install-app) → Tasks 4–5. ✓
- travel-scout agent → Task 6. ✓
- Commands → Task 9. ✓
- Weather via open-meteo script → Task 2. ✓
- Safety (no book/pay/invite; calendar the only write, gated; Claudia read-only) → Global Constraints + Tasks 4/7/8. ✓
- gog Maps = Places only (no directions) → Global Constraints + Task 4 honestly documented. ✓

**Placeholder scan:** trip-schema.md uses empty-string fields as the canonical template (intended), not TODOs. No "TBD"/"implement later" anywhere. Every markdown deliverable's full body is inline. ✓

**Type consistency:** `deriveGear` signature identical in Task 2 interface, test, and impl. Trip keys (`bookings`, `apps`, `research`, `changes_log`, `cal_event_id`) consistent across Tasks 1/6/7/8/9. Skill names consistent (`ishmael-plan/-discover/-weather/-check`, agent `ishmael-travel-scout`). `gog` commands match verified 0.21.0 syntax. ✓
