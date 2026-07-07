# Berlin Events Plugin

Discover interesting art and food events in Berlin. Searches multiple event sources, checks your Google Calendar for conflicts, and produces a curated list ranked by relevance with travel context from your neighborhood.

## Features

- Searches 15+ Berlin event sources (APIs, RSS feeds, web scraping)
- Uses a typed source registry with Readability and Playwright-backed extractors
- Checks Google Calendar for scheduling conflicts
- Considers your Berlin neighborhood for travel context
- Ranks events by relevance, proximity, and uniqueness
- Generates Google Calendar add links

## Prerequisites

- [Bun](https://bun.sh/) runtime (for extraction scripts)
- Playwright Chromium for JS-rendered sources (`cd plugins/berlin-events/scripts && bunx playwright install chromium`)
- [gogcli](https://github.com/openclaw/gogcli) (binary `gog`, for Google Calendar integration)

### Install dependencies

```bash
# Install bun (if not already installed)
curl -fsSL https://bun.sh/install | bash

# Install script dependencies
cd plugins/berlin-events/scripts && bun install

# Install gogcli
brew install openclaw/tap/gogcli

# Authenticate with Google Calendar (first time only)
gog auth add you@gmail.com --services calendar
```

## Configuration

Create `.claude/berlin-events.local.md` in your project root (the single location the skill reads — or run `/berlin-events:init`):

```markdown
---
neighborhood: Kreuzberg
interests: art, food
calendar_id: primary
lookahead_days: 14
---
```

See `skills/find-events/references/settings-template.md` for all options.

## Usage

```
/berlin-events:find-events              # Events for next 2 weeks
/berlin-events:find-events 7            # Events for next 7 days
/berlin-events:find-events this weekend # This weekend only
/berlin-events:init neighborhood=Kreuzberg interests=art,food lookahead_days=10
```

Or just ask naturally:
- "What interesting events are happening in Berlin this week?"
- "Any good art openings next weekend?"
- "Find food events in Berlin for the next 3 days"

## Components

| Component | Type | Purpose |
|-----------|------|---------|
| find-events | Skill (user-invoked) | Main entry point - orchestrates search, calendar check, and output |
| event-sources | Skill (knowledge) | Directory of Berlin event websites with scraping strategies |
| event-scout | Agent | Autonomous web scraping agent for parallel source searching |
| extract-events.ts | Script | Source dispatcher for Readability and Playwright-backed extraction |
| extract-content.js | Script | Legacy Mozilla Readability content extraction |

## Event Sources

Sources are organized by extraction reliability:

1. **API-driven**: Eventbrite, Meetup, Ticketmaster
2. **RSS feeds**: Berlin Art Link, ART@Berlin, Mit Vergnuegen, SMB
3. **Web scraping**: Berlin.de, INDEX Berlin, visitBerlin, Tip Berlin
4. **Institutional**: Berlinische Galerie, Gropius Bau, C/O Berlin, KW Institute

The canonical ingestion list lives in `scripts/sources.ts`; run
`bun run plugins/berlin-events/scripts/list-sources.ts` to inspect registered sources.
