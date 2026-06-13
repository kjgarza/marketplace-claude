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

- Language: TypeScript (ESM)
- Runtime: Bun + TypeScript
- Database API: `bun:sqlite`
- HTML parsing: `cheerio`
- Config parsing: `@iarna/toml`
- Network fetch: built-in `fetch` with Jina fallback
- Tests: `bun test` executed from `package.json`

## Important Files

- `config/config.toml` — user search/profile settings
- `scripts/config.ts` — config loader
- `scripts/db.ts` — `bun:sqlite` schema and persistence helpers
- `scripts/scrape.ts` — fetch tier logic
- `scripts/parse-listing.ts` — portal parsers
- `scripts/scam-score.ts` — heuristic scam scoring
- `scripts/hunt.ts` — orchestration and CLI entrypoint
- `scripts/__tests__/*.test.ts` — current test coverage
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
3. keep deterministic scripts in `.ts`
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
4. the current tests in `scripts/__tests__/*.test.ts`

Then confirm whether the task is:
- docs/planning only
- test stabilization
- Bun runtime migration
- DB migration
- TypeScript conversion

Do not implement multiple migration phases at once unless the user explicitly asks for that.
