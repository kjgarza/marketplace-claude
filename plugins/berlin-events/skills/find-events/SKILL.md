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

Check `.claude/berlin-events.local.md` in the current project root first, then fall back to `~/.claude/berlin-events.local.md`. Extract:
- **neighborhood**: User's Berlin neighborhood (for travel context)
- **interests**: Art, food, or both (default: both)
- **calendar_id**: Google Calendar ID (default: primary)
- **lookahead_days**: How many days ahead to search (default: 14)

If no settings file exists, assume defaults: neighborhood=Mitte, interests=art+food, calendar=primary, lookahead=14 days.

### Step 2: Determine Date Range

Parse the optional argument for date range:
- No argument: today through 14 days ahead
- Number (e.g., "7"): today through N days ahead
- "this weekend": upcoming Saturday and Sunday
- "next week": Monday through Sunday of next week

Calculate exact dates using today's date. Only include future events.

### Step 3: Ingest Sources into qurl

Scrape each priority source and ingest it into the local qurl database. Run in parallel where possible.

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

### Step 5: Search with qurl vsearch

Build a query from the user's settings and run semantic search:

```bash
# Build query from interests + neighborhood + current month
QUERY="$(date '+%B %Y') Berlin exhibition opening vernissage workshop event calendar art food"

qurl vsearch "$QUERY" \
  --source berlin-events \
  --limit 20
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

If vsearch returns fewer than 5 relevant results, fall back to web search (Step 5b).

### Step 5b: Web Search Fallback (only if vsearch < 5 results)

```
"Berlin art events this week [date range]"
"Berlin food events this week [date range]"
"Berlin exhibition openings [date range]"
```

### Step 6: Check Google Calendar

Check for scheduling conflicts:

```bash
gcalcli agenda --nocolor --details end "today" "+14 days"
```

If gcalcli is not installed: `pip3 install gcalcli`. If not authenticated, ask the user to run `! gcalcli agenda` to complete OAuth.

Parse output to identify busy time slots. Flag events that overlap with existing entries.

### Step 7: Add Location Context

For each event, note the neighborhood (e.g., "Kreuzberg", "Mitte", "Charlottenburg") and compare with the user's neighborhood:
- Same neighborhood: "Near you"
- Adjacent: "~15 min by transit"
- Far: "~30+ min by transit"

Use general Berlin geography knowledge. Do not call external routing APIs.

### Step 8: Rank and Curate

Score events by:
1. **Relevance** to user interests (art/food)
2. **Time fit** — no calendar conflicts, within lookahead window
3. **Proximity** to user's neighborhood
4. **Uniqueness** — special/one-time events ranked higher than recurring
5. **Source quality** — primary sources and editorial picks ranked higher

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
- **Add to calendar**: [gcalcli command or Google Calendar link]

---
```

Google Calendar link format (compact ISO 8601 dates: `YYYYMMDDTHHmmssZ`):
```
https://calendar.google.com/calendar/render?action=TEMPLATE&text=[title]&dates=20260325T190000Z/20260325T210000Z&location=[venue]&details=[description+link]
```

Include a summary at the top: "Found X events (Y art, Z food) for [date range]. N conflicts with your calendar."

## Tips

- If a source fails extraction, skip it and continue — do not abort
- Prefer English-language sources but include notable German-only events
- For food events: markets, pop-ups, food festivals, tastings, food-related workshops
- For art events: openings, exhibitions, gallery walks, art talks, performances
- Limit output to ~15–20 best events
- See `event-sources` skill for validated source list and ingestion notes
