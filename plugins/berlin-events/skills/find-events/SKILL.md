---
name: find-events
description: "Find interesting art and food events in Berlin. Use when the user asks 'What events are happening in Berlin this week?' or 'Find me art exhibitions and food festivals in Berlin next weekend.' Ingest event sources into qurl, run semantic search, check against Google Calendar for conflicts, and produce a curated list of relevant events with location context."
argument-hint: "[days ahead, e.g. '7' or 'this weekend']"
allowed-tools: ["Read", "Bash", "WebSearch", "WebFetch", "Grep", "Glob", "Agent", "mcp__claude-in-chrome__navigate", "mcp__claude-in-chrome__read_page", "mcp__claude-in-chrome__get_page_text", "mcp__claude-in-chrome__tabs_create_mcp", "mcp__claude-in-chrome__tabs_context_mcp"]
---

# Find Berlin Events

Ingest Berlin event sources into qurl, run semantic search, check Google Calendar for conflicts, and produce a curated, relevance-ranked list.

## Workflow

### Step 1: Load User Settings

Read settings from **`.claude/berlin-events.local.md` in the current project root** — the single
canonical location, the same path the `/berlin-events:init` command writes to. Do **not** look
anywhere else (no `~/.claude` fallback); a second location only creates ambiguity about which
file wins. Extract:
- **neighborhood**: User's Berlin neighborhood (for travel context)
- **interests**: Art, food, or both (default: both)
- **calendar_id**: Google Calendar ID (default: primary)
- **lookahead_days**: How many days ahead to search (default: 14)

If the file is absent, assume defaults (neighborhood=Mitte, interests=art+food,
calendar=primary, lookahead=14) and tell the user they can run `/berlin-events:init` to create
`.claude/berlin-events.local.md` in this project.

### Step 2: Determine Date Range

Parse the optional argument for date range:
- No argument: today through 14 days ahead
- Number (e.g., "7"): today through N days ahead
- "this weekend": upcoming Saturday and Sunday
- "next week": Monday through Sunday of next week

Calculate exact dates using today's date. Only include future events.

### Step 3: Ingest Sources into qurl

Scrape each priority source and ingest it into the local qurl database.

> **Do not background the `qurl add` calls.** qurl writes to a single sqlite file; concurrent
> writers hit `database is locked` and silently drop sources (seen in real runs: co-berlin
> dropped). Run the `ingest` calls **sequentially** — scraping is the slow part, the writes are
> fast. The `bun run … | qurl add` pipe below is already sequential; keep it that way.

```bash
PLUGIN_ROOT="${CLAUDE_PLUGIN_ROOT:-plugins/berlin-events}"

ingest() {
  local url="$1" tags="$2"
  bun run "$PLUGIN_ROOT/scripts/extract-content.js" "$url" \
    | qurl add "$url" --source berlin-events --tags "$tags"
}

# Art sources
ingest "https://www.indexberlin.com/events/list/"                                         "art"
ingest "https://www.kw-berlin.de/en/events"                                               "art"
ingest "https://berlinischegalerie.de/programme/kalender/"                                "art"
ingest "https://www.artatberlin.com/en/calendar-for-vernissagen-exhibitions-events/"      "art"
ingest "https://co-berlin.org/de/programm/kalender"                                       "art"
ingest "https://kunstleben-berlin.de/events/"                                             "art"

# Food / broad sources
ingest "https://www.berlin.de/en/events/"                  "food"
ingest "https://www.visitberlin.de/en/event-calendar-berlin" "art,food"
```

qurl deduplicates by URL + content hash — re-running is safe.

### Step 4: Embed

Generate vector embeddings for any newly ingested documents:

```bash
qurl embed
```

### Step 5: Search with qurl query

> **Tool note — use `qurl`, NOT `qmd`.** This pipeline searches the `qurl` event-scrape
> database. `qmd` is a *different* engine over your markdown notes corpus — it does not contain
> any scraped events and will return nothing relevant. Never substitute a `qmd` command for a
> `qurl` one, even where they share a subcommand name.

**Pick the right qurl command — they behave differently (verified against the qurl source):**

| Command | Engine | Behaviour |
|---------|--------|-----------|
| `qurl search`  | **pure BM25 / FTS5 keyword** | exact terms; **needs term overlap** — a long/verbose query returns "No results". Honors `--source`/`--tag`/`--limit`. |
| `qurl query`   | **alias for `search`** (identical, also pure BM25) | same as `search`. Despite the name, the CLI does **not** do hybrid/RRF/rerank. |
| `qurl vsearch` | **pure vector / semantic** | tolerates long verbose queries (good recall); honors `--limit` but **ignores `--source`/`--tag`** — filter hosts yourself. |

**Primary search — `qurl search` (or `query`) with a SHORT query.** It is keyword/BM25, so a
long keyword-stuffed query matches no document and returns "No results". Use 3–5 focused words:

```bash
# SHORT query — do NOT stuff in the month or a dozen keywords.
qurl search "Berlin art exhibition opening" --source berlin-events --limit 20
```

`--source berlin-events` excludes docs ingested by other plugins. Optionally add `--tag art`
**or** `--tag food` if the user's `interests` is a single category — but note tags can
over-narrow (food docs are sparse) and return 0; drop the tag and re-run if so.

**Recall fallback — `qurl vsearch` with the verbose query.** If `query` yields few hits, vector
search handles a richer query but ignores `--source`, so grep the known event hosts:

```bash
QUERY="$(date '+%B %Y') Berlin exhibition opening vernissage workshop event calendar art food"
qurl vsearch "$QUERY" 2>&1 | grep -E -i \
  'indexberlin|kw-berlin|berlinischegalerie|artatberlin|co-berlin|kunstleben-berlin|berlin\.de|visitberlin'
```

**Relevance filter** — first derive the date tokens from **today's date**, do not hardcode months:
- `MONTH_NAMES` = lowercased full English + German names of the current month and next month (e.g. for June: `june`, `juni`, `july`, `juli`).
- `MONTH_NUMS` = zero-padded numeric forms for the same two months bracketed by dots (e.g. `.06.`, `.07.`).
- `YEAR` = current year (and next year if the lookahead window crosses into January).

A result counts as relevant if its snippet contains any of:
- EN/DE month names from `MONTH_NAMES`
- `monday`–`sunday`, `vernissage`, `opening`, `exhibition`, `finissage`
- DE: `ausstellung`, `veranstaltung`, `führung`, `kalender`, `programm`
- Dates: any token in `MONTH_NUMS`, or `YEAR`

If `qurl query` returns fewer than 5 relevant results, fall back to web search (Step 5b).

### Step 5b: Web Search Fallback (only if query < 5 results)

```
"Berlin art events this week [date range]"
"Berlin food events this week [date range]"
"Berlin exhibition openings [date range]"
```

### Step 6: Check Google Calendar

Check for scheduling conflicts over the lookahead window.

- **Interactive sessions:** prefer the **Google Calendar MCP tools** if available
  (`mcp__claude_ai_Google_Calendar__list_events` for the date range). No install or OAuth needed.
- **Headless / no MCP** (the weekly launchd job): fall back to `gogcli` (binary `gog`):
  ```bash
  gog calendar events --from today --days 14 --json
  ```
  If gogcli is not installed: `brew install openclaw/tap/gogcli`. If not authenticated, ask the
  user to run `! gog auth add you@gmail.com --services calendar` to complete OAuth.

Parse output to identify busy time slots. Flag events that overlap with existing entries.

### Step 7: Add Location Context

For each event, note the neighborhood (e.g., "Kreuzberg", "Mitte", "Charlottenburg") and compare with the user's neighborhood:
- Same neighborhood: "Near you"
- Adjacent: "~15 min by transit"
- Far: "~30+ min by transit"

Use general Berlin geography knowledge. Do not call external routing APIs.

### Step 7.5: Drop already-shown events (dedup) and load taste feedback

Initialize the state DB once (idempotent), then filter out events surfaced in previous runs so the user never sees the same suggestion twice. Resolve `$BUN` first:

```bash
BUN=$(command -v bun 2>/dev/null || echo "$HOME/.bun/bin/bun")
PLUGIN_ROOT="${CLAUDE_PLUGIN_ROOT:-plugins/berlin-events}"
$BUN run "$PLUGIN_ROOT/scripts/events-db.ts" init
```

Write your curated candidate events to a temp JSON array (each object needs `title`, `date`, `venue`, plus any other fields you carry), then filter:

```bash
echo "$CANDIDATES_JSON" | $BUN run "$PLUGIN_ROOT/scripts/events-db.ts" filter
```

Only the returned (unseen) events proceed. Also load recent taste feedback to inform ranking:

```bash
$BUN run "$PLUGIN_ROOT/scripts/events-db.ts" recent-feedback --limit 20
```

Bias ranking toward venues/categories the user marked `went` and away from those marked `skip`.

### Step 7.6: Weather Scoring

Fetch the daily weather forecast for the date range from Step 2. Pass the `weather` block from user settings as `--config` JSON so thresholds and weights are respected. If the settings file lacks a `weather` block, omit `--config` to use script defaults.

```bash
BUN=$(command -v bun 2>/dev/null || echo "$HOME/.bun/bin/bun")
PLUGIN_ROOT="${CLAUDE_PLUGIN_ROOT:-plugins/berlin-events}"
# Extract weather config from user settings (if present) and pass as JSON
WEATHER_CFG=$(grep -A 40 '^weather:' .claude/berlin-events.local.md 2>/dev/null | python3 -c "
import sys, json, re
text = sys.stdin.read()
# simple extraction — skip if parsing fails
" 2>/dev/null || echo "")
if [ -n "$WEATHER_CFG" ]; then
  WEATHER_JSON=$($BUN run "$PLUGIN_ROOT/scripts/weather-gate.ts" --from "$DATE_FROM" --to "$DATE_TO" --config "$WEATHER_CFG")
else
  WEATHER_JSON=$($BUN run "$PLUGIN_ROOT/scripts/weather-gate.ts" --from "$DATE_FROM" --to "$DATE_TO")
fi
```

`DATE_FROM` and `DATE_TO` are the ISO-8601 start/end dates calculated in Step 2.

**Script output shape** — one object per day:

```json
{
  "date": "2026-06-24",
  "temp_max_c": 34,
  "temp_min_c": 20,
  "is_rainy": false,
  "mode": "score",
  "scores": { "outdoor_delta": -2.0, "indoor_delta": 1.0 },
  "drop_outdoor": false,
  "drop_indoor": false,
  "suggest_lake": true,
  "note": "hot day (34°C) — favour indoor/AC venues; evening outdoor still good; very hot — consider a lake / Strandbad as an alternative"
}
```

**Apply weather to ranking (score mode — default):**

1. Match each event to its day's weather object by `date`.
2. Classify each event as **indoor**, **outdoor**, or **unknown** using keyword search on `venue`, `name`, and `description` fields (case-insensitive):
   - **Indoor keywords**: `museum`, `gallery`, `galerie`, `kunsthalle`, `kunsthaus`, `theater`, `theatre`, `kino`, `cinema`, `philharmonie`, `konzerthaus`, `konzertsaal`, `bibliothek`, `library`, `atelier`, `studio`, `club`, `bar`, `restaurant`, `café`, `cafe`, `bistro`, `haus`, `halle`, `akademie`, `institut`
   - **Outdoor keywords**: `park`, `garten`, `garden`, `freilicht`, `freiluft`, `markt`, `market`, `platz`, `square`, `straße`, `strasse`, `festival`, `outdoor`, `open-air`, `open air`, `rooftop`, `dachterrasse`, `strand`
   - **Unknown** (no keyword match): neutral — no delta applied
   - **Dual match** (both lists): treat as Unknown
3. Apply score delta from Step 8's ranking:
   - Outdoor event: add `scores.outdoor_delta` to its ranking score
   - Indoor event: add `scores.indoor_delta` to its ranking score
   - If `drop_outdoor === true`: remove outdoor events for that date entirely (hard drop — precipitation makes them incompatible)
   - `drop_indoor` is always `false` in score mode — indoor events are never hard-dropped
4. If `suggest_lake === true` for any date, append one entry at the top of that day's results:
   > 🏊 **Hot day suggestion**: Check out Berlin's Strandbäder / lakes (Wannsee, Müggelsee, Weißensee) — great alternative to crowded indoor venues.
5. If no weather object exists for an event's date (beyond the 16-day OpenMeteo window): keep the event, apply no delta.

**Legacy filter mode** (`mode: "filter"` in user settings): `drop_outdoor` and `drop_indoor` are set directly; apply as hard drops, ignore score deltas.

**Weather note in output header** — include one line per date using the `note` field from the script output:

```
Weather 20 Jun: 34°C max — hot day (34°C) — favour indoor/AC venues; evening outdoor still good; 🏊 lake suggestion added.
Weather 21 Jun: 14°C max — rain expected — outdoor events dropped.
Weather 22 Jun: 18°C max — mild and dry (18°C) — all events shown.
```

### Step 8: Rank and Curate

Score events by:
1. **Relevance** to user interests (art/food)
2. **Time fit** — no calendar conflicts, within lookahead window
3. **Proximity** to user's neighborhood
4. **Uniqueness** — special/one-time events ranked higher than recurring
5. **Source quality** — primary sources and editorial picks ranked higher
6. **Taste** — prior `went`/`skip` feedback (Step 7.5)
7. **Weather** — apply `outdoor_delta` / `indoor_delta` from Step 7.6 (already done inline in 7.6; Step 8 uses the adjusted scores)

### Step 9: Present Results

Output a curated list grouped by date:

```
## [Day, Date]

### [Event Name]
- **What**: [Brief description]
- **Where**: [Venue, Neighborhood] — [travel context from your location]
- **When**: [Time]
- **Category**: Art | Food
- **Link**: [URL]
- **Calendar conflict**: None | "Conflicts with [existing event] at [time]"
- **Add to calendar**: [`gog calendar create` command or Google Calendar link]

---
```

Google Calendar link format (compact ISO 8601 dates: `YYYYMMDDTHHmmssZ`):
```
https://calendar.google.com/calendar/render?action=TEMPLATE&text=[title]&dates=20260325T190000Z/20260325T210000Z&location=[venue]&details=[description+link]
```

Or, with gogcli (RFC3339 times), let the user add directly:
```bash
gog calendar create primary --summary "[title]" --from "2026-03-25T19:00:00+01:00" --to "2026-03-25T21:00:00+01:00" --location "[venue]"
```

Include a summary at the top: "Found X events (Y art, Z food) for [date range]. N conflicts with your calendar."

**After presenting**, record the events you showed so they are not repeated next run:

```bash
echo "$PRESENTED_JSON" | $BUN run "$PLUGIN_ROOT/scripts/events-db.ts" record
```

To capture taste over time, the user can later mark an event with the `/berlin-events:feedback`
command (resolves the event by title and records the verdict):

```bash
$BUN run "$PLUGIN_ROOT/scripts/events-db.ts" feedback --hash <event-hash> --verdict went|skip --notes "..."
```

## Tips

- If a source fails extraction, skip it and continue — do not abort
- Prefer English-language sources but include notable German-only events
- For food events: markets, pop-ups, food festivals, tastings, food-related workshops
- For art events: openings, exhibitions, gallery walks, art talks, performances
- Limit output to ~15–20 best events
- See `event-sources` skill for validated source list and ingestion notes
