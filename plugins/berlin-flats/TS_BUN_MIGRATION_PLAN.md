# Berlin Flats — JavaScript → Bun → TypeScript Migration Plan

## Goal

Migrate `berlin-flats` from Node-based JavaScript scripts to a Bun-based TypeScript plugin, using Bun SQLite for persistence, without changing intended behavior.

## Guardrails

- Plan only. Do not implement during this phase.
- Follow TDD: write or upgrade tests first.
- Keep the same behavior visible through the test suite before and after TypeScript conversion.
- Separate runtime migration from feature work.
- Land changes in small phases with green tests at each checkpoint.

## Current Surface Area

### Modules
- `scripts/config.js`
- `scripts/db.js`
- `scripts/scrape.js`
- `scripts/parse-listing.js`
- `scripts/scam-score.js`
- `scripts/hunt.js`

### Existing tests
- `scripts/config.test.js`
- `scripts/parse-listing.test.js`
- `scripts/scam-score.test.js`
- `scripts/hunt.smoke.js`

## Desired End State

- Runtime entrypoints use Bun
- Tests run with `bun test`
- Database uses Bun SQLite (`bun:sqlite`)
- Source files are TypeScript
- A shared fixture-oriented test suite proves parity across the migration
- CLI behavior remains the same unless intentionally changed in a later task

---

## Phase 0 — Baseline and freeze behavior

### Objective
Define what the plugin currently does and lock that behavior down before any migration starts.

### Work
1. Inventory all exported functions and side effects.
2. Record current commands and expected outputs:
   - hunt command
   - config loading
   - parser outputs
   - scam verdict thresholds
   - DB schema and upsert semantics
3. Identify logic that is currently untested:
   - `db.js`
   - `scrape.js`
   - more of `hunt.js`
4. Capture a small set of fixtures for portals already supported:
   - Kleinanzeigen search HTML
   - Kleinanzeigen detail HTML
   - ImmoScout24 search HTML with `__NEXT_DATA__`
   - ImmoScout24 detail HTML with hydration blob

### Deliverable
A clear behavior baseline so migration work is constrained by evidence, not guesswork.

### Exit criteria
- Team agrees what is considered preserved behavior.
- Fixtures exist for the parser and hunt-flow tests.

---

## Phase 1 — Replace ad hoc assertions with Bun-run JavaScript tests first

### Objective
Run the existing JavaScript code under Bun and upgrade tests before converting any source file to TypeScript.

### Why this comes first
This is the core TDD requirement: the JavaScript version should pass under Bun first. That creates the contract the later TypeScript version must continue to satisfy.

### Work
1. Replace script-style `console.assert` tests with `bun test` test files.
2. Keep source files as `.js` in this phase.
3. Add a real test command in `package.json`, for example:
   - `bun test`
4. Recast existing coverage into explicit tests:
   - `config.test.js`
   - `parse-listing.test.js`
   - `scam-score.test.js`
   - `hunt.smoke.test.js`
5. Add missing tests before touching runtime internals.

### Tests to add first

#### Config tests
- loads TOML config successfully
- reads expected profile/search fields
- fails clearly on missing config file
- fails clearly on malformed TOML

#### Parser tests
- Kleinanzeigen search parsing
- Kleinanzeigen detail parsing
- ImmoScout24 hydration-based search parsing
- ImmoScout24 hydration-based detail parsing
- DOM fallback parsing when hydration is missing
- malformed HTML returns safe defaults instead of crashing

#### Scam-score tests
- hard-rule scam detection
- price outlier scoring
- benign listing remains below review threshold
- verdict boundaries at `<0.55`, `0.55-0.84`, `>=0.85`

#### Hunt-flow tests
- buildSearchUrl for each supported portal
- scoreAgainstPrefs rejects over-budget listings
- scoreAgainstPrefs rejects deal breakers
- hunt skips unknown portals cleanly
- hunt ignores already-seen listings
- hunt stores parsed listings with expected verdict mapping

#### DB tests
- initializes schema
- upserts by `(portal, external_id)`
- updates fields on conflict
- `isSeen` behavior
- `getQueue` filtering
- `setVerdict` updates only target row

#### Scrape tests
- plain fetch success path
- fallback to Jina when primary fetch fails
- all-tier failure path returns stable error object
- timeout/network failure handling

### Recommended test structure
- `scripts/__tests__/config.test.js`
- `scripts/__tests__/parse-listing.test.js`
- `scripts/__tests__/scam-score.test.js`
- `scripts/__tests__/db.test.js`
- `scripts/__tests__/scrape.test.js`
- `scripts/__tests__/hunt.test.js`
- `scripts/__fixtures__/...`

### Exit criteria
- JavaScript source is unchanged or minimally reshaped for testability.
- Tests run with Bun.
- Test suite is green on the JavaScript version.
- This green Bun/JS suite becomes the migration baseline.

---

## Phase 2 — Make the JavaScript code Bun-native without TypeScript yet

### Objective
Switch runtime assumptions from Node-first to Bun-first while still keeping `.js` source.

### Work
1. Update scripts/entrypoints to run with Bun.
2. Remove Node-only assumptions where unnecessary.
3. Replace any brittle Node-specific APIs with Bun-compatible patterns, except for the database layer which is handled explicitly in the next phase.
4. Update package scripts to use Bun commands for:
   - test
   - hunt

### Important rule
Do not mix TypeScript conversion into this phase.

### TDD loop for this phase
For each runtime change:
1. write or refine a failing Bun test
2. make the minimal JS change
3. run the full Bun test suite
4. stop once green

### Exit criteria
- JavaScript code runs under Bun.
- Bun test suite stays green.
- Runtime entrypoint uses Bun successfully.

---

## Phase 3 — Migrate persistence from current DB layer to Bun SQLite

### Objective
Replace the current database implementation with Bun SQLite while preserving schema and behavior.

### Work
1. Decide on the exact Bun SQLite API to standardize on (`bun:sqlite`).
2. Keep SQL schema functionally identical at first.
3. Port only the DB adapter, not business logic.
4. Preserve these behaviors via tests:
   - schema creation
   - unique constraint on `(portal, external_id)`
   - upsert semantics
   - queue reads
   - verdict updates
5. Use a temporary test database per test file or per test case.
6. Make DB path injectable for tests rather than hard-coded to `../state.db`.

### TDD loop for this phase
1. write DB tests against current behavior
2. confirm they pass on existing JS implementation
3. swap implementation to Bun SQLite
4. rerun the same tests unchanged

### Specific risk areas
- parameter binding differences
- `.run()/.get()/.all()` behavior differences
- timestamp defaults and SQLite dialect expectations
- transaction semantics if later added

### Exit criteria
- DB tests are unchanged and green after the swap.
- No user-visible schema regression.
- Hunt-flow tests still pass using the new DB adapter.

---

## Phase 4 — Convert modules from JavaScript to TypeScript one boundary at a time

### Objective
Convert the working Bun/JS codebase to TypeScript without changing behavior.

### Order of conversion
1. `config`
2. `scam-score`
3. `parse-listing`
4. `db`
5. `scrape`
6. `hunt`

This order moves from the most deterministic modules toward the most orchestration-heavy module.

### Work
1. Introduce `tsconfig.json` tuned for Bun.
2. Define core types first:
   - `Listing`
   - `SearchListing`
   - `ListingDetail`
   - `ScamVerdict`
   - `ScamReason`
   - `SearchCriteria`
   - `PluginConfig`
   - DB row types
3. Rename one module at a time from `.js` to `.ts`.
4. Fix only type-driven issues and module boundary issues.
5. Keep tests functionally identical.
6. Prefer explicit return types on exported functions.

### TDD loop for this phase
For each module:
1. keep the existing Bun test suite
2. convert one file to `.ts`
3. run tests
4. add focused tests only if the conversion exposes an untested assumption
5. do not proceed to the next module until green

### Exit criteria
- All source modules are `.ts`.
- Test suite still matches the same behavior contract established in Phase 1.
- Type checking passes.

---

## Phase 5 — Tighten tests around types and regression safety

### Objective
Use TypeScript to improve safety after the migration, without changing runtime behavior.

### Work
1. Add tests for nullability and partial listing inputs.
2. Add parser regression fixtures for portal variants.
3. Add DB contract tests for invalid or incomplete listing payloads.
4. Add smoke coverage for CLI invocation under Bun.
5. Optionally add snapshot-style fixture comparisons for parser outputs if they stay readable.

### Exit criteria
- TypeScript migration is not just syntactic; it has stronger regression protection.
- Future portal updates can be made with fixture-first tests.

---

## Suggested File Evolution

### Before
- `scripts/*.js`
- script-style test files in `scripts/`

### During migration
- `scripts/*.js`
- `scripts/__tests__/*.test.js`
- `scripts/__fixtures__/*`

### After
- `src/*.ts` or keep `scripts/*.ts` if the plugin prefers the current layout
- `src/**/*.test.ts` or `scripts/__tests__/*.test.ts`
- shared fixtures retained

Recommendation: keep the current folder layout unless there is a real reason to split `scripts/` into `src/`. The runtime migration is already enough change.

---

## Definition of Done

The migration is complete when all of the following are true:
- `bun test` is the canonical test command
- the JS behavior was first locked down with Bun-based tests
- the same behavioral tests pass after the Bun runtime changes
- the same behavioral tests pass after the Bun SQLite swap
- the same behavioral tests pass after TypeScript conversion
- type checking passes
- CLI hunt entrypoint runs on Bun
- no migration step required silent behavior changes to get green

---

## Recommended Execution Strategy

Use small PRs or commits in this order:
1. test harness + fixtures only
2. Bun test execution on current JS
3. Bun runtime adjustments
4. Bun SQLite migration
5. TypeScript conversion by module
6. post-migration regression hardening

That sequence keeps breakage localized and makes it obvious where a regression entered.

## What Not To Do

- do not convert to TypeScript before Bun tests exist
- do not swap runtime and DB and language in one step
- do not rewrite parser logic during migration unless a failing test forces it
- do not change schema shape and runtime stack in the same phase
- do not rely on manual smoke testing as the primary migration check

## First concrete next step

Write the Bun test suite for the current JavaScript implementation, using fixtures for both supported portals, and make that suite green before touching runtime or file extensions.
---

## Implementation Checklist

### Checklist A — Behavior baseline
- [ ] inventory exports and side effects in `config.js`, `db.js`, `scrape.js`, `parse-listing.js`, `scam-score.js`, and `hunt.js`
- [ ] capture current CLI expectations for `hunt`
- [ ] add HTML fixtures for Kleinanzeigen search/detail pages
- [ ] add HTML fixtures for ImmoScout24 search/detail pages
- [ ] document any known gaps between current behavior and intended behavior

### Checklist B — Bun test harness for current JavaScript
- [ ] move from script-style assertions to `bun test`
- [ ] create `scripts/__tests__/`
- [ ] create `scripts/__fixtures__/`
- [ ] port existing config, parser, scam, and hunt smoke coverage into Bun tests
- [ ] add first-pass tests for `db.js`
- [ ] add first-pass tests for `scrape.js`
- [ ] add hunt-flow tests that stub scrape and persistence behavior
- [ ] make the Bun test suite green without converting source files to TypeScript

### Checklist C — Bun runtime migration while staying in JavaScript
- [ ] switch package scripts from Node entrypoints to Bun entrypoints
- [ ] remove Node-only runtime assumptions except the DB adapter under active test coverage
- [ ] verify `hunt` runs under Bun in smoke form
- [ ] keep the full Bun test suite green after each runtime tweak

### Checklist D — Database migration to `bun:sqlite`
- [ ] make DB path injectable for tests
- [ ] lock in schema/upsert contract with tests before swapping the adapter
- [ ] replace current DB implementation with `bun:sqlite`
- [ ] rerun unchanged DB tests
- [ ] rerun hunt-flow tests against the new adapter

### Checklist E — TypeScript conversion
- [ ] add Bun-oriented `tsconfig.json`
- [ ] define shared domain types first
- [ ] convert `config` to TypeScript and rerun tests
- [ ] convert `scam-score` to TypeScript and rerun tests
- [ ] convert `parse-listing` to TypeScript and rerun tests
- [ ] convert `db` to TypeScript and rerun tests
- [ ] convert `scrape` to TypeScript and rerun tests
- [ ] convert `hunt` to TypeScript and rerun tests
- [ ] enable and pass type checking

### Checklist F — Post-migration hardening
- [ ] add nullability and malformed-input regression tests
- [ ] add portal-variant parser fixtures
- [ ] add Bun CLI smoke coverage
- [ ] confirm final `bun test` and typecheck pass together

## Suggested PR / Commit Slices

### PR 1 — Test harness and fixtures
- **Scope:** add Bun test structure and HTML fixtures; no runtime changes
- **Expected files:** `package.json`, `scripts/__tests__/*`, `scripts/__fixtures__/*`
- **Effort:** M
- **Success signal:** Bun can discover tests; parser fixtures are committed; existing assertions are represented in tests

### PR 2 — Coverage completion for current JavaScript behavior
- **Scope:** add missing tests for `db.js`, `scrape.js`, and broader `hunt.js` behavior
- **Expected files:** `scripts/__tests__/db.test.js`, `scripts/__tests__/scrape.test.js`, `scripts/__tests__/hunt.test.js`
- **Effort:** M
- **Success signal:** current JavaScript behavior is covered well enough that migration work can proceed safely

### PR 3 — Bun runtime switch for JavaScript
- **Scope:** change scripts and runtime assumptions so the JS plugin runs on Bun
- **Expected files:** `package.json`, `scripts/hunt.js`, `scripts/scrape.js`, possibly small supporting edits in other JS modules
- **Effort:** S-M
- **Success signal:** `bun test` passes and the hunt entrypoint runs under Bun without TypeScript yet

### PR 4 — `bun:sqlite` adapter migration
- **Scope:** swap persistence implementation only
- **Expected files:** `scripts/db.js`, DB-focused tests, any test helpers for temp databases
- **Effort:** M
- **Success signal:** unchanged DB and hunt-flow tests pass with Bun SQLite

### PR 5 — TypeScript scaffolding and shared types
- **Scope:** add `tsconfig.json`, decide final TS layout, define shared types
- **Expected files:** `tsconfig.json`, `scripts/types.ts` or equivalent, possibly package metadata updates
- **Effort:** S
- **Success signal:** type system scaffold is in place before module-by-module conversion

### PR 6 — TypeScript conversion: deterministic modules
- **Scope:** convert `config`, `scam-score`, and `parse-listing`
- **Expected files:** `scripts/config.ts`, `scripts/scam-score.ts`, `scripts/parse-listing.ts`, related tests/import rewiring
- **Effort:** M
- **Success signal:** deterministic logic compiles and all tests stay green

### PR 7 — TypeScript conversion: integration modules
- **Scope:** convert `db`, `scrape`, and `hunt`
- **Expected files:** `scripts/db.ts`, `scripts/scrape.ts`, `scripts/hunt.ts`, related import updates
- **Effort:** M-L
- **Success signal:** full plugin flow and CLI smoke tests pass in TypeScript

### PR 8 — Regression hardening
- **Scope:** add final edge-case tests and tighten smoke coverage
- **Expected files:** test files and fixtures only, unless a test exposes a real bug
- **Effort:** S-M
- **Success signal:** migration is stable enough for later feature work
