---
name: find-events
description: "Find interesting art and food events in Berlin. Use when the user asks 'What events are happening in Berlin this week?' or 'Find me art exhibitions and food festivals in Berlin next weekend.' Search event sources, check against Google Calendar for conflicts, and produce a curated list of relevant events with location context."
argument-hint: "[days ahead, e.g. '7' or 'this weekend']"
allowed-tools: ["Read", "Bash", "WebSearch", "WebFetch", "Grep", "Glob", "Agent", "mcp__claude-in-chrome__navigate", "mcp__claude-in-chrome__read_page", "mcp__claude-in-chrome__get_page_text", "mcp__claude-in-chrome__tabs_create_mcp", "mcp__claude-in-chrome__tabs_context_mcp"]
---

# Find Berlin Events

Search Berlin event sources for upcoming art and food events, check against Google Calendar for conflicts, and produce a curated, relevance-ranked list.

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

### Step 3: Search Event Sources

Load the event sources knowledge from the `event-sources` skill's reference file at `${CLAUDE_PLUGIN_ROOT}/skills/event-sources/references/sources.md`.

Search sources in parallel using the `event-scout` agent for each source group:

**Group 1 - Web Search (fastest, broadest)**
Run web searches for:
- "Berlin art events this week [date range]"
- "Berlin food events this week [date range]"
- "Berlin exhibition openings [date range]"
- "Berlin food festival market [date range]"

**Group 2 - Key Event Pages (via Readability)**
Extract content from high-value pages using:
```bash
bun run ${CLAUDE_PLUGIN_ROOT}/scripts/extract-content.js "<url>"
```

Priority pages for art:
- https://www.indexberlin.com/events/list/
- https://www.berlinartlink.com/
- https://www.artatberlin.com/en/calendar-for-vernissagen-exhibitions-events/

Priority pages for food:
- https://www.berlin.de/en/events/
- https://mitvergnuegen.com/category/ausgehen/events

**Group 3 - Browser (for dynamic pages)**
If browser tools are available, use Chrome automation to load JavaScript-heavy event pages that Readability cannot extract.

### Step 4: Check Google Calendar

Check for scheduling conflicts using gcalcli:

```bash
gcalcli agenda --nocolor --details end "today" "+14 days"
```

If gcalcli is not installed, install it:
```bash
pip3 install gcalcli
```

If not authenticated, inform the user to run `! gcalcli agenda` to complete OAuth flow.

Parse the calendar output to identify busy time slots. Flag any events that overlap with existing calendar entries.

### Step 5: Add Location Context

For each discovered event, note the neighborhood/area (e.g., "Kreuzberg", "Mitte", "Charlottenburg"). Compare with the user's neighborhood from settings to provide travel context:
- Same neighborhood: "Near you"
- Adjacent: "~15 min by transit"
- Far: "~30+ min by transit"

Use general Berlin geography knowledge for estimates. Do not call external routing APIs.

### Step 6: Rank and Curate

Score events by:
1. **Relevance** to user interests (art/food)
2. **Time fit** - no calendar conflicts
3. **Proximity** to user's neighborhood
4. **Uniqueness** - special/one-time events ranked higher than recurring
5. **Source quality** - primary sources and editorial picks ranked higher

### Step 7: Present Results

Output a curated list grouped by date, formatted as:

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

For the Google Calendar add link, generate a URL in this format (dates use compact ISO 8601: `YYYYMMDDTHHmmssZ`):
```
https://calendar.google.com/calendar/render?action=TEMPLATE&text=[title]&dates=20260325T190000Z/20260325T210000Z&location=[venue]&details=[description+link]
```

Include a summary at the top: "Found X events (Y art, Z food) for [date range]. N conflicts with your calendar."

## Tips

- If a source is down or returns no useful content, skip it and note it
- Prefer English-language sources but include German-only if the event is notable
- For food events, include markets, pop-ups, food festivals, tastings, and food-related workshops
- For art events, include openings, exhibitions, gallery walks, art talks, and performances
- Limit output to ~15-20 best events to avoid overwhelming the user
