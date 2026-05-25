# VHS Berlin Agent

A personal agent layer for interacting with VHS Berlin (Volkshochschule Berlin adult education) courses.

## Description

Instead of manually searching the VHS Berlin website, this plugin lets you interact with a conversational agent that:
- Understands your course preferences in natural language
- Searches and monitors VHS Berlin courses
- Tracks changes to courses you're watching
- Provides awareness digests of new and updated courses
- Guides you to the official site for final booking

This is a **personal navigation and monitoring layer**, not a replacement for the official VHS Berlin website.

## Features

- **Natural language search**: "Find A2 evening German courses in Neukölln" or "Show pottery classes under €90 on weekends"
- **Watchlists & change detection**: Monitor specific courses or searches and get notified when things change
- **Guided booking handoff**: Agent surfaces important rules (e.g., consultation-required courses) before directing you to the official booking page
- **Awareness digests**: Weekly summaries of new matching courses, courses starting soon, or status changes

## Technical Approach

- **URL-driven + lightweight scraping**: Uses direct VHS search URLs when possible, scrapes only needed pages
- **Small SQLite cache**: Stores course data, watched searches, and snapshots for comparison
- **Page model with fallbacks**: Structured page registry for robustness when site structure changes
- **Official site remains authoritative**: Always links back to source; no booking replacement

## Skills

| Skill | Description |
|-------|-------------|
| `vhs-search` | Natural language course search assistant |
| `vhs-watch` | Watchlists and change monitoring |
| `vhs-digest` | Awareness summaries and digests |

## Requirements

- Browser MCP server (for page loading and extraction)
- SQLite MCP server (for local course data storage)

## Installation

```bash
# From marketplace-claude root
cd plugins/vhs-berlin-agent
```

The plugin will auto-create its SQLite database on first use.

## Usage

### Search for courses
```
/vhs-search "Find watercolor classes in Pankow on weekday evenings"
```

### Watch a course or search
```
/vhs-watch save "B1 German evening courses in Mitte"
```

### Check for changes
```
/vhs-watch check
```

### Get a digest
```
/vhs-digest weekly
```

## Design Principles

1. **Keep official site authoritative** — No booking replacement; always link back to source
2. **Cache intent, not whole website** — Store queries, course IDs, normalized records
3. **Use page model, not raw selectors** — Structured page registry with fallbacks
4. **Be explicit about uncertainty** — Flag verification failures clearly

## Data Model

- **courses**: Course details (title, district, location, dates, price, booking status)
- **watched_searches**: Saved searches with query parameters
- **snapshots**: Historical results for comparison
- **course_events**: Change log (status changes, new courses, etc.)

## Risks & Mitigations

- **DOM drift**: VHS pages may change structure → page map with fallbacks + explicit verification failures
- **Query parameter uncertainty**: Some URL params partially validated → confidence levels + browser fallback
- **Stale data**: Cached results may be outdated → timestamps + refresh before important actions

## Author

Kristian Garza

## License

MIT

## Version

0.1.0 (Phase 1: Foundation)
