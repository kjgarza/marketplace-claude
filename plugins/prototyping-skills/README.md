# prototyping-skills

A Claude Code plugin for rapid prototype development with a standardized Bun monorepo stack.

## What This Solves

**Problem 1: Claude picks the wrong patterns.** You ask for an API endpoint and get Express middleware. You ask for a dashboard page and get `useEffect` + `fetch`. The skills encode your exact library choices and patterns so Claude follows them by default.

**Problem 2: Plan mode suggests changes with no framework for evaluating them.** The skills include a "Deviation Protocol" — when Claude suggests an alternative during planning, it must state the default, name the trade-off, flag the blast radius, and let you decide. Approved deviations get documented in the project CLAUDE.md so other team members understand why.

## Installation

```
/plugin install prototyping-skills
```

Or for local development:

```bash
claude --plugin-dir /path/to/prototyping-skills
```

## Skills

| Skill | Slash Command | Purpose |
|-------|--------------|---------|
| **init-prototype** | `/prototyping-skills:init-prototype` | Bootstrap a new monorepo with all packages wired up, per-package CLAUDE.md signposts, and project CLAUDE.md committed to git |
| **generate-api** | `/prototyping-skills:generate-api` | Generate Hono + @hono/zod-openapi routes and handlers |
| **generate-ui** | `/prototyping-skills:generate-ui` | Generate Next.js 16 + shadcn/ui dashboard pages and components |
| **generate-mcp** | `/prototyping-skills:generate-mcp` | Generate MCP server tools using the official SDK |
| **generate-tests** | `/prototyping-skills:generate-tests` | Scaffold test infrastructure per package (Hono test client, MCP mock transport, bun:test patterns) |
| **generate-infra** | `/prototyping-skills:generate-infra` | Generate SST v3 infrastructure for AWS deployment |
| **development-workflow** | `/prototyping-skills:development-workflow` | Bridge scaffolding to development: run readiness checks, prescribe TDD + simplify + verify + review workflow |
| **team-conventions** | *(auto-triggered)* | Team defaults (Biome, bun:test, JSON:API, Actor Pattern, design tokens, bun:sqlite), deviation protocol, testing defaults, replace-not-layer principle, anti-patterns |

## How It Works

### Team Consistency via Git

When you run `/prototyping-skills:init-prototype`, the skill:

1. Scaffolds the full monorepo structure (core, types, api, ui, mcp)
2. Creates a **project-level `CLAUDE.md`** with a "Deviations from Team Defaults" section
3. Creates **per-package `CLAUDE.md` signposts** in `packages/api/`, `packages/ui/`, `packages/mcp/` that point Claude at the right skill
4. Commits everything to git

Every team member who clones the repo gets the same Claude Code context automatically.

### Deviation Protocol

In execution mode, Claude follows team defaults without question. In Plan mode, Claude may suggest alternatives but must:

1. State the default
2. Name the alternative
3. Explain the trade-off
4. Flag the blast radius (low/medium/high)
5. Let you decide

Approved deviations are documented in the project's CLAUDE.md.

## Stack

| Package | Tech | Role |
|---------|------|------|
| **core** | Variable per prototype | All business logic |
| **types** | TypeScript + Zod | Shared types, single source of truth |
| **api** | Hono + @hono/zod-openapi | Thin HTTP wrapper around core (JSON:API paths) |
| **ui** | Next.js 16 + shadcn/ui + Lucide | Dashboard visualisation (design tokens, mandatory about page) |
| **mcp** | @modelcontextprotocol/sdk | Thin MCP wrapper around core (Actor Pattern support) |

Runtime: **Bun** everywhere. Monorepo: **Bun workspaces**. Linting: **Biome**. Testing: **bun:test**. CI: **GitHub Actions**. Tasks: **justfile**. Database: **bun:sqlite**.

## Customising

### Override per-prototype

Don't change the plugin skills. Instead, override in that project's CLAUDE.md:

```markdown
## Deviations from Team Defaults

### Using tRPC instead of Hono + OpenAPI for the API
**Why**: This prototype's API is only consumed by the UI, no external clients.
**Approved by**: [Name], 2026-03-19
**Impact**: The generate-api skill patterns don't apply here.
```

## Recommended Companion Plugins

```
/plugin install code-simplifier@claude-plugins-official
/plugin install pr-review-toolkit@claude-plugins-official
/plugin install frontend-design@claude-plugins-official
```
