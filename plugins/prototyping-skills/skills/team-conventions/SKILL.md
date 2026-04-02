---
name: team-conventions
description: >
  This skill should be used when the user is working on a prototype monorepo
  with the standard Bun workspace structure (core, types, api, ui, mcp packages),
  mentions "team defaults", "deviation protocol", "our conventions", "standard stack",
  asks about anti-patterns, or references @repo/types, @repo/core, Bun workspaces,
  or any of the stable packages. It also applies when the user mentions "plan mode"
  in the context of suggesting alternatives to established patterns.
---

# Team Conventions for Prototype Development

These conventions apply to all prototypes built with this team's standard monorepo
structure. Multiple people work on each prototype, so consistency matters.

## Deviation Protocol

When working in **execution mode**, follow the defaults below without question.

When working in **Plan mode** and an alternative to a default is worth considering,
follow this protocol:

1. **State the default**: "Our team default for this is X."
2. **Name the alternative**: "For this prototype, Y could work better because..."
3. **Explain the trade-off**: What do we gain? What team consistency do we lose?
4. **Flag the blast radius**:
   - **Low risk**: Change is isolated to `packages/core` (the variable package)
   - **Medium risk**: Change affects one of the stable packages (api, ui, or mcp)
   - **High risk**: Change ripples across multiple packages or affects `@repo/types`
5. **Let the human decide.** Never silently deviate from defaults.

When a deviation is approved, add it to the project's CLAUDE.md under
"Deviations from Team Defaults" with: what was changed, why, who approved it,
and what other team members should watch out for.

The core package is expected to change tech per prototype — that is low risk by design.
API, UI, and MCP stacks changing is medium-to-high risk because it creates inconsistency
across prototypes and requires the team to context-switch.

## Default Stack

- **Runtime**: Bun (not Node.js)
- **Monorepo**: Bun workspaces
- **Linting + Formatting**: Biome (not ESLint, not Prettier)
- **Testing**: `bun:test` (not Jest, Vitest, etc.)
- **CI**: GitHub Actions (`.github/workflows/ci.yml`)
- **Task runner**: justfile (not Makefile, not npm scripts for complex tasks)
- **API**: Hono + @hono/zod-openapi. Routes use `createRoute()` + `app.openapi()`. Paths follow JSON:API spec.
- **UI**: Next.js 15+ App Router + shadcn/ui + Lucide icons. Server Components by default. Server Actions for mutations. Design tokens over hard-coded styles.
- **MCP**: @modelcontextprotocol/sdk with stdio transport. Actor pattern when using domain entities.
- **Database**: `bun:sqlite` when persistence is needed. Not better-sqlite3, Prisma, or Drizzle unless deviation approved.
- **Types**: Shared `@repo/types` package. Types and Zod schemas defined once.
- **Entity Modeling**: Use Schema.org property names where a relevant type exists (e.g. `headline` not `title`, `datePublished` not `publishedAt`, `text` not `body`). Only include fields actually needed; enforce strict types.
- **Infrastructure**: SST v3 (optional — use when deploying to AWS)

## Research Workflow

When introducing **new technologies** to the stack (libraries, frameworks, tools not already
in the defaults above), use the `/context7` MCP to fetch up-to-date documentation and examples
before writing code. This prevents hallucinated APIs and outdated patterns.

## Package Roles

- `@repo/core` — All business logic. **Variable tech stack per prototype.**
- `@repo/types` — All shared types and Zod schemas. Single source of truth.
- `packages/api` — Thin HTTP wrapper around core. Hono + OpenAPI.
- `packages/ui` — Dashboard visualisation. Next.js + shadcn/ui.
- `packages/mcp` — Thin MCP wrapper around core. Official SDK.

## Testing Defaults

- Every generated package must have test infrastructure scaffolded before development begins
- Use `superpowers:test-driven-development` for new features
- Minimum: one test file per source file with business logic
- CI must pass `bun test` before merge
- Run `/generate-tests` after scaffolding to set up test directories, helpers, and example tests
- Test files mirror source structure: `src/routes/items.ts` → `tests/routes/items.test.ts`

## Replace-Not-Layer Principle

When introducing a new approach, delete the old code in the same PR. Do not layer new
code on top of old code and leave both in place.

**Deviation protocol addition** — when evaluating an alternative approach, add this step:

> **Replacement Check** — Does this replace existing functionality? If yes, identify and
> remove the old implementation in the same PR. Do not leave dead code.

**Anti-patterns:**
- Keeping dead code "just in case" — if it's in git history, it's recoverable
- Adding a new utility alongside the old one without removing the old one
- Wrapping old code in new abstractions instead of replacing it
- Leaving `// TODO: remove old implementation` comments

**Enforcement:**
- Run `/simplify` to catch accumulated layers
- Code review (`superpowers:requesting-code-review`) should flag layered code
- When in doubt, delete — git has the history

## Common Anti-Patterns to Avoid

- Express/Fastify middleware patterns (`req, res, next`) instead of Hono context
- Pages Router patterns (`getServerSideProps`) instead of App Router
- Client-side data fetching (`useEffect` + `fetch`, Tanstack Query) instead of RSC
- Duplicating types across packages instead of using `@repo/types`
- Business logic in API handlers or MCP tools instead of `@repo/core`
- `process.env` instead of `Bun.env`
- ESLint/Prettier instead of Biome
- Jest/Vitest instead of `bun:test`
- Hard-coded colors/spacing in UI instead of design tokens
- Calling actor methods outside `provide()` callback
- Missing `.passthrough()` on Zod schemas for external API data
- Skipping validation before `provide()` in actor pattern
- Verb-based API paths (`/items/create`) instead of JSON:API resource paths (`POST /items`)
- Inventing field names (`title`, `publishedAt`, `body`) when a relevant Schema.org type exists (`headline`, `datePublished`, `text`)

## Related Skills

For package-specific patterns, consult the corresponding skill:
- **`prototyping-skills:generate-api`** — Hono + @hono/zod-openapi route patterns
- **`prototyping-skills:generate-ui`** — Next.js + shadcn/ui dashboard patterns
- **`prototyping-skills:generate-mcp`** — MCP server tool patterns
- **`prototyping-skills:init-prototype`** — Bootstrap a new monorepo
- **`prototyping-skills:generate-tests`** — Scaffold test infrastructure per package
- **`prototyping-skills:development-workflow`** — Bridge scaffolding to development with skill chaining
