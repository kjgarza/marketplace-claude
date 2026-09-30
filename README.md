# Claude Plugin Marketplace

A collection of useful Claude Code plugins for development workflows, research, and productivity.

## Installation

Add this marketplace to your Claude Code installation:

```
/plugin marketplace add kjgarza/marketplace-claude
```

Or via the CLI:

```bash
claude plugin marketplace add kjgarza/marketplace-claude
```

## Available Plugins

| Plugin | Category | Description |
|--------|----------|-------------|
| **dev-workflow** | development | Developer workflow skills: PR babysitting, spikes, metaprompting, session cleanup, file-based planning, project scaffolding/bootstrapping, skill creation, plan execution, and a senior-dev advisor agent with a technical-lead output style. |
| **job-search** | productivity | Job search assistant: finds matching roles, prepares application materials, and identifies LinkedIn contacts to reach out to at target companies. |
| **smart-home** | utilities | Controls smart home devices (lights, speakers, music playback, scenes) from natural-language requests. |
| **file-tools** | utilities | Local file utilities: organize folders, find duplicates, and process images with ImageMagick (convert, resize, crop, batch). |
| **scholarly-research** | documentation | Expert agent for scholarly communication research with Dimensions database integration and academic search capabilities |
| **product** | productivity | Product management toolkit: PRDs, user stories, backlog prioritization, usability tests and design critiques, with Office document skills, Coda/Google Drive/Dimensions search, and a product-manager agent and output style. |
| **bookclub** | productivity | Book club management plugin for generating Slack communications, discussion materials, and reading schedules |
| **rapid-mvp** | development | Opinionated defaults and scaffolding for rapid MVP static websites using Next.js or 11ty monorepo patterns |
| **berlin-events** | productivity | Discover interesting art and food events in Berlin, check against your Google Calendar, and get a curated list with travel context from your neighborhood. |
| **readitlater-digest** | productivity | Generate themed weekly digests from Obsidian ReadItLater bookmarks with SQLite state tracking and automated cleanup |
| **prototyping** | development | Skills for rapid prototype development with a standardized Bun monorepo stack (core, types, api, ui, mcp). Encodes team conventions (Biome, bun:test, JSON:API, Actor Pattern, design tokens), deviation protocol, per-package patterns, test scaffolding, and development workflow chaining. |
| **ideation** | productivity | 5-stage ideation pipeline: problem intake, solution generation, review, ASCII UI concepts, and interactive HTML prototypes |
| **vhs-berlin-agent** | productivity | Personal navigation and monitoring layer for VHS Berlin courses — natural language search, watchlists with change detection, and awareness digests via deterministic bun scripts (no MCP). |
| **berlin-flats** | productivity | Berlin flat hunter — searches Kleinanzeigen and ImmoScout24 for rentals, detects scams, ranks listings by fit score, tracks the application pipeline, and prepares application dossiers and messages. |
| **bulletjournal** | productivity | Bullet journal workflow automation — daily migration, inbox triage, weekly/monthly reviews, and journal synthesis from daily notes and session memory. |
| **taskwarrior** | productivity | Taskwarrior task management with AI agent workflows — canonical add→start→update→close lifecycle, best practices, multiline notes via annotations, and /init setup command. |
| **finanz-pilot** | productivity | German finance and accounting assistant for HGB bookkeeping, SKR04 account mapping, journal entries, financial statements, tax checks, pension evaluation, real estate readiness, retirement projections, capital allocation, and integrated personal finance advisory. |

Each plugin has its own README under `plugins/<name>/` with its skills, commands and agents.

## Installing Plugins

After adding the marketplace, install individual plugins:

```
/plugin install <plugin-name>@marketplace-claude
```

## License

MIT License - see [LICENSE.md](LICENSE.md) for details.

## Author

Kristian Garza ([@kjgarza](https://github.com/kjgarza))
