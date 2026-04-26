# AGENT.md — berlin-flats

## Purpose

`berlin-flats` is a small Berlin rental hunting plugin. It currently:
- loads TOML config
- builds portal search URLs
- scrapes search/detail pages
- parses listings
- scores likely scams
- stores listings in SQLite
- runs a CLI hunt loop

## Current Runtime Snapshot

- Language: JavaScript (ESM)
- Runtime: Node.js
- Database API: `node:sqlite`
- HTML parsing: `cheerio`
- Config parsing: `@iarna/toml`
- Network fetch: built-in `fetch` with Jina fallback
- Tests: ad hoc JS scripts executed from `package.json`

## Important Files

- `config/config.toml` — user search/profile settings
- `scripts/config.js` — config loader
- `scripts/db.js` — SQLite schema and persistence helpers
- `scripts/scrape.js` — fetch tier logic
- `scripts/parse-listing.js` — portal parsers
- `scripts/scam-score.js` — heuristic scam scoring
- `scripts/hunt.js` — orchestration and CLI entrypoint
- `scripts/*.test.js` / `scripts/hunt.smoke.js` — current test coverage
- `portals/*.yaml` — portal recon profiles
- `agents/` — sub-agent docs for plugin workflows

## Working Agreements

- Treat this plugin as a focused automation tool, not a general framework.
- Prefer small, verifiable steps over broad rewrites.
- Preserve behavior while migrating runtime/tooling unless a change is explicitly planned and tested.
- Use test-first migration: stabilize behavior under Bun in JavaScript before converting files to TypeScript.
- Keep parsing/scoring logic deterministic and easy to fixture-test.
- Avoid mixing feature work with runtime migration.

## Migration Target

The next planned refactor is:
1. run the plugin on Bun
2. replace the DB layer with Bun SQLite
3. convert scripts from `.js` to `.ts`
4. keep one shared test suite proving parity before and after the TypeScript conversion

See `TS_BUN_MIGRATION_PLAN.md` for the staged plan.

## Non-Goals for the Migration

- no portal expansion
- no scraping strategy redesign
- no schema redesign unless migration forces it
- no behavioral tuning of scam scoring unless covered by new tests and explicitly approved

## If You Work Here Later

Start by reading:
1. this file
2. `TS_BUN_MIGRATION_PLAN.md`
3. `package.json`
4. the current tests in `scripts/*.test.js`

Then confirm whether the task is:
- docs/planning only
- test stabilization
- Bun runtime migration
- DB migration
- TypeScript conversion

Do not implement multiple migration phases at once unless the user explicitly asks for that.