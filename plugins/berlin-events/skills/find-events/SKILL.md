---
name: find-events
description: "This skill should be used when the user asks 'What events are happening in Berlin this week?', 'Find me art exhibitions and food festivals in Berlin next weekend', or wants to discover upcoming Berlin art and food events. Ingests event sources into qurl, runs semantic search, checks Google Calendar for conflicts, and produces a curated, relevance-ranked list of events with location context."
argument-hint: "[days ahead, e.g. '7' or 'this weekend']"
allowed-tools: ["Read", "Bash", "WebSearch", "WebFetch", "Grep", "Glob", "Agent", "mcp__claude-in-chrome__navigate", "mcp__claude-in-chrome__read_page", "mcp__claude-in-chrome__get_page_text", "mcp__claude-in-chrome__tabs_create_mcp", "mcp__claude-in-chrome__tabs_context_mcp"]
portable: false
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

Run a **short (3–5 word) BM25 query** first; fall back to `vsearch` if fewer than 5 hits.
For the full command comparison, `--source`/`--tag` flag behaviour, vsearch grep pipeline, and
relevance-filter token derivation: → **`references/qurl-search.md`**

```bash
qurl search "Berlin art exhibition opening" --source berlin-events --limit 20
```

Relevance-filter the results against date/event keywords. If fewer than 5 relevant hits, proceed
to Step 5b.

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
  If gogcli is not installed or not authenticated, see **`references/calendar-add.md`**.

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

Run the weather script for the date range. Pass `--config` if the settings file has a `weather`
block; omit it otherwise.

```bash
BUN=$(command -v bun 2>/dev/null || echo "$HOME/.bun/bin/bun")
PLUGIN_ROOT="${CLAUDE_PLUGIN_ROOT:-plugins/berlin-events}"
WEATHER_CFG_JSON=$($BUN run "$PLUGIN_ROOT/scripts/read-weather-config.ts" .claude/berlin-events.local.md 2>/dev/null || echo "")
if [ -n "$WEATHER_CFG_JSON" ]; then
  WEATHER_JSON=$($BUN run "$PLUGIN_ROOT/scripts/weather-gate.ts" --from "$DATE_FROM" --to "$DATE_TO" --config "$WEATHER_CFG_JSON")
else
  WEATHER_JSON=$($BUN run "$PLUGIN_ROOT/scripts/weather-gate.ts" --from "$DATE_FROM" --to "$DATE_TO")
fi
```

`DATE_FROM` and `DATE_TO` are the ISO-8601 start/end dates calculated in Step 2.

Classify each event as indoor/outdoor by keyword-matching `venue`, `name`, and `description`;
apply `outdoor_delta`/`indoor_delta` per day; honour `drop_outdoor` as a hard removal.
For full keyword lists, scoring algorithm, lake-suggestion rule, and weather-note header format:
→ **`references/weather-scoring.md`**

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

Include a summary at the top: "Found X events (Y art, Z food) for [date range]. N conflicts with your calendar."

Output events grouped by date. For the Google Calendar URL format and gogcli `calendar create`
command: → **`references/calendar-add.md`**

```
## [Day, Date]

### [Event Name]
- **What**: [Brief description]
- **Where**: [Venue, Neighborhood] — [travel context from your location]
- **When**: [Time]
- **Category**: Art | Food
- **Link**: [URL]
- **Calendar conflict**: None | "Conflicts with [existing event] at [time]"
- **Add to calendar**: [Google Calendar link or gogcli command — see references/calendar-add.md]

---
```

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
