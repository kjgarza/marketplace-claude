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

## Architecture

The plugin uses **deterministic bun/TypeScript scripts** for all data work. Skills are thin LLM orchestration prose that call scripts via Bash. No MCP servers required.

```
scripts/
  init-db.ts    — Create/verify SQLite DB from data/schema.sql
  search.ts     — Build URL, two-tier fetch, cheerio parse, upsert courses
  watch.ts      — save|check|list|remove watchlist management
  smoke.ts      — Quick end-to-end health check
```

All scripts accept `--db-path` and output JSON to stdout.

## Known limitation — live course extraction

The VHS course list (`CourseList.aspx`) is an **ASP.NET WebForms** page whose results are
hydrated by JavaScript / postback after the initial load. A raw HTTP fetch (and the Jina
reader fallback) returns the page shell with **0 parseable course rows**. `search.ts` detects
this and returns `verification.ok = false` with an explicit reason — it never fabricates data.

The DB layer, snapshot diffing, watch/digest logic, and URL building are all functional. To
make live extraction work, a follow-up needs **one** of:
- recon of the AJAX/postback endpoint that returns the course rows (capture it via the
  browser network tab, then have `search.ts` POST to it with the right `__VIEWSTATE`), or
- an in-session browser fetch (e.g. `claude-in-chrome`) feeding rendered HTML to the parser.

Until then, treat `vhs-search` / `vhs-watch` as wired-but-pending-recon rather than autonomous.

## Requirements

- **bun** (≥1.0) — `curl -fsSL https://bun.sh/install | bash`
- No MCP servers required

## Installation

```bash
/plugin marketplace add kjgarza/marketplace-claude
```

Then initialize the database:

```
/vhs-berlin-agent:init
```

## Usage

### Initialize (required first time)
```
/vhs-berlin-agent:init
```

### Search for courses
```
Find watercolor classes in Pankow on weekday evenings
```

### Watch a course or search
```
Watch B1 German evening courses in Mitte
```

### Check for changes
```
Check my VHS watches
```

### Get a digest
```
Weekly VHS digest
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

0.2.0 (Phase 2: Bun scripts, no MCP)
