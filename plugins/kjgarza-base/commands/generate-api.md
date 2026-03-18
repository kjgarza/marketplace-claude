---
name: generate-api
description: Generate the entire API package or add a new feature route. Use without arguments to scaffold the full API, or pass a feature name to add a single route.
---

Generate API code in packages/api/. If "$ARGUMENTS" is empty or "all", scaffold the entire API package. If "$ARGUMENTS" names a specific feature (e.g. "themes", "content", "usage"), add that feature as a new route module to the existing API.

## Before writing any code

1. Read CLAUDE.md at the repo root and any CLAUDE.md inside packages/api/.
2. Read README.md at the repo root.
3. Read docs/DESIGN.md — especially the Architecture Decisions, dependency direction, and data modeling sections.
4. Read packages/core/src/index.ts to see what core exports are available.
5. Read packages/core/src/types.ts for the canonical data types.
6. If packages/api/ already exists, read packages/api/package.json, packages/api/tsconfig.json, and packages/api/src/app.ts to understand the existing HTTP framework and middleware.

## Architecture rules — violating any of these is a build-breaking error

- The API's only internal dependency is @problemsniffer/core (via "workspace:*"). It NEVER imports from packages/mcp, packages/ui, or packages/cli.
- The API is a thin HTTP wrapper around core functions. It adds serialization, validation, auth, rate limiting, and error handling. It contains ZERO business logic — no filtering, no analysis, no LLM calls, no direct DB access. If you need logic that doesn't exist in core, note it as a TODO for core, don't put it here.
- All LLM access goes through core's llm/ module. The API never imports provider SDKs directly.
- The API reads from the shared data/ directory (same path core writes to). It does not maintain its own data store.

## Conventions

- TypeScript strict mode. Bun runtime.
- HTTP framework: match whatever packages/api/src/app.ts already uses (likely Hono). If starting fresh, use Hono on Bun.
- Route files go in packages/api/src/routes/{feature}.ts.
- camelCase in TypeScript and JSON responses. The API is the boundary where snake_case DB columns (from core's db.ts) become camelCase JSON. If core already returns camelCase objects, pass them through.
- Schema.org-aligned field names: `headline`, `text`, `datePublished`, `isPartOf`, `commentCount`, `upvoteCount`, etc. Do not rename fields at the API layer.
- Error responses: use a consistent `{ error: string, details?: unknown }` shape with appropriate HTTP status codes.
- Formatting: follow biome.json config (Biome, not ESLint/Prettier).

## Mode A — Full API scaffold (when "$ARGUMENTS" is empty or "all")

Produce the complete packages/api/ package:

1. **Package setup**: package.json (with workspace dependency on @problemsniffer/core), tsconfig.json extending the root config, biome.json if needed.
2. **Entry point**: src/index.ts that starts the server.
3. **App setup**: src/app.ts with Hono app, global middleware (error handler, CORS, request logging), and health check route.
4. **Route modules**: One route file per core domain area. Inspect packages/core/src/index.ts exports and packages/core/src/types.ts to determine which resources to expose. Typical candidates:
   - content — CRUD/query for ContentItem records
   - themes — theme listing, detail, items-by-theme
   - usage — usage log and cost summary
   - pipeline — trigger/status for pipeline runs
   - health — readiness/liveness checks (include in app.ts)
5. **Route registration**: Wire all route modules into app.ts.
6. **Tests**: One test file per route module in packages/api/tests/ with at least one happy-path test each.
7. **Scripts**: Add `dev`, `start`, and `test` scripts to package.json.

## Mode B — Single feature route (when "$ARGUMENTS" names a feature)

Produce only the new feature module:

1. A route file at packages/api/src/routes/{feature}.ts with the endpoints.
2. Registration of those routes in app.ts (add the import and mount, or leave a comment showing where).
3. Request validation (query params, body parsing) at the route level.
4. Types for request/response shapes if they differ from core's ContentItem or Theme types.
5. A test file at packages/api/tests/{feature}.test.ts with at least one happy-path test.

## Do not produce

Core logic, database migrations, frontend code, MCP tools, or anything outside packages/api/.
