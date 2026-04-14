---
name: init-prototype
description: >
  This skill bootstraps a new prototype monorepo with the standard package structure:
  core, api, ui, mcp, and types packages — all wired up with Bun workspaces. It should
  be used when the user wants to start a new prototype, create a new project, scaffold
  a monorepo, or says anything like "new prototype", "new project", "let's start fresh",
  "set up the repo", "init", or "bootstrap."
allowed-tools:
  - Bash
  - Write
  - Edit
  - Read
  - Glob
  - Grep
argument-hint: "[project-name]"
---

# Prototype Bootstrapper

Set up a new prototype monorepo using **Bun workspaces** with the following
standard package structure. Follow this exactly — do not improvise the structure.

## Monorepo Structure

```
[project-name]/
├── package.json              # Root workspace config
├── bunfig.toml               # Bun configuration
├── biome.json                # Biome linting + formatting config
├── tsconfig.json             # Base tsconfig
├── justfile                  # Quick setup and dev actions
├── CLAUDE.md                 # Project-specific context for Claude Code
├── .github/
│   └── workflows/
│       └── ci.yml            # GitHub Actions CI
├── .claude/
│   └── settings.json         # Project-level Claude Code settings
├── packages/
│   ├── core/                 # Core business logic (variable tech)
│   │   ├── src/
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   ├── types/                # Shared TypeScript types + Zod schemas
│   │   ├── src/
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   ├── api/                  # Hono API (follows prototyping-skills:generate-api conventions)
│   │   ├── CLAUDE.md
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   └── routes/
│   │   │       └── health.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   ├── ui/                   # Next.js dashboard (follows prototyping-skills:generate-ui conventions)
│   │   ├── CLAUDE.md
│   │   ├── src/
│   │   │   └── app/
│   │   │       ├── layout.tsx
│   │   │       ├── page.tsx
│   │   │       └── globals.css
│   │   ├── components.json
│   │   ├── next.config.ts
│   │   ├── postcss.config.mjs
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── mcp/                  # MCP server (follows prototyping-skills:generate-mcp conventions)
│       ├── CLAUDE.md
│       ├── src/
│       │   ├── index.ts
│       │   └── tools/
│       ├── package.json
│       └── tsconfig.json
```

## Step-by-Step Bootstrap Process

### 1. Root workspace configuration

**package.json:**
```json
{
  "name": "[project-name]",
  "private": true,
  "workspaces": ["packages/*"],
  "scripts": {
    "dev": "bun --filter '*' dev",
    "dev:api": "bun --filter api dev",
    "dev:ui": "bun --filter ui dev",
    "dev:mcp": "bun --filter mcp dev",
    "check": "bunx @biomejs/biome check .",
    "fix": "bunx @biomejs/biome check --write .",
    "test": "bun test"
  },
  "devDependencies": {
    "@biomejs/biome": "^1.9"
  }
}
```

**bunfig.toml:**
```toml
[install]
peer = false
```

**tsconfig.json** (base config):
```json
{
  "compilerOptions": {
    "target": "ESNext",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "esModuleInterop": true,
    "strict": true,
    "skipLibCheck": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "composite": true,
    "paths": {
      "@repo/*": ["./packages/*/src"]
    }
  }
}
```

**biome.json:**
```json
{
  "$schema": "https://biomejs.dev/schemas/1.9.4/schema.json",
  "organizeImports": { "enabled": true },
  "linter": {
    "enabled": true,
    "rules": { "recommended": true }
  },
  "formatter": {
    "enabled": true,
    "indentStyle": "tab",
    "lineWidth": 100
  },
  "javascript": {
    "formatter": {
      "quoteStyle": "double",
      "semicolons": "always"
    }
  }
}
```

**justfile:**
```makefile
# Default: list available recipes
default:
    @just --list

# Install all dependencies
setup:
    bun install

# Run all packages in dev mode
dev:
    bun run dev

# Run only the API
dev-api:
    bun run dev:api

# Run only the UI
dev-ui:
    bun run dev:ui

# Lint and format with Biome
check:
    bunx @biomejs/biome check .

# Lint and format with auto-fix
fix:
    bunx @biomejs/biome check --write .

# Run all tests
test:
    bun test

# Run tests in watch mode
test-watch:
    bun test --watch
```

**.github/workflows/ci.yml:**
```yaml
name: CI
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v2
      - run: bun install
      - run: bunx @biomejs/biome check .
      - run: bun test
```

Add `@biomejs/biome` as a root dev dependency in **package.json:**
```json
{
  "devDependencies": {
    "@biomejs/biome": "^1.9"
  }
}
```

### 2. Types package (create first — others depend on it)

Hold all shared TypeScript types AND Zod schemas used across packages.

```json
{
  "name": "@repo/types",
  "version": "0.1.0",
  "type": "module",
  "exports": { ".": "./src/index.ts" },
  "dependencies": {
    "zod": "^3"
  }
}
```

Starter `src/index.ts`:
```typescript
import { z } from "zod";

// Entity modeling: use Schema.org property names where a relevant type exists.
// See https://schema.org/CreativeWork — only include fields you actually need.
export const ItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  dateCreated: z.string().datetime(),
});

export type Item = z.infer<typeof ItemSchema>;
```

### 3. Core package

The core package is where the prototype's unique functionality lives. Its tech stack
varies per prototype. Set up the shell and let the user define what goes here.

```json
{
  "name": "@repo/core",
  "version": "0.1.0",
  "type": "module",
  "exports": { ".": "./src/index.ts" },
  "dependencies": {
    "@repo/types": "workspace:*"
  }
}
```

### 4. API, UI, MCP packages

Set these up following the conventions in the `prototyping-skills:generate-api`,
`prototyping-skills:generate-ui`, and `prototyping-skills:generate-mcp` skills
respectively. Create minimal working starters:

- **API**: Health check route, CORS middleware, Swagger UI mounted
- **UI**: Root layout with sidebar, home page with placeholder content, shadcn/ui initialised
- **MCP**: Server entry point with stdio transport, one placeholder tool

### 5. Generate the project CLAUDE.md

After scaffolding, create a `CLAUDE.md` at the project root. Ask the user what the
prototype is about and fill in this template:

```markdown
# [Project Name]

## What This Prototype Does
[Description from user]

## Monorepo Structure
- `packages/core` — Core logic: [what the core does + any special tech]
- `packages/types` — Shared TypeScript types and Zod schemas
- `packages/api` — Hono API with @hono/zod-openapi (port 3001)
- `packages/ui` — Next.js dashboard with shadcn/ui (port 3000)
- `packages/mcp` — MCP server using @modelcontextprotocol/sdk

## Stack & Conventions
- **Runtime**: Bun
- **Monorepo**: Bun workspaces
- **Linting + Formatting**: Biome (not ESLint/Prettier)
- **Testing**: bun:test
- **CI**: GitHub Actions (.github/workflows/ci.yml)
- **Task runner**: justfile
- **API**: Hono + @hono/zod-openapi — all routes use `createRoute` + `app.openapi()`, JSON:API spec paths
- **UI**: Next.js 16 App Router + shadcn/ui — Server Components by default, Server Actions for mutations
- **MCP**: @modelcontextprotocol/sdk with stdio transport
- **Database**: bun:sqlite when persistence is needed
- **Types**: Shared via @repo/types, never duplicate across packages

## Team
Multiple people work on this prototype. Follow the global skill conventions unless
a deviation is documented below.

## Deviations from Team Defaults
<!-- Document any approved deviations here so all team members understand why -->
<!-- Format: what was changed, why, who approved it, what to watch out for -->
_None yet._

## Core Package — Prototype-Specific Tech
<!-- This section is for tech unique to THIS prototype's core package -->
[Libraries, patterns, or approaches specific to this prototype's core functionality]

## Commands
- `bun install` — Install all dependencies
- `bun run dev` — Run all packages in dev mode
- `bun run dev:api` — API only
- `bun run dev:ui` — UI only
- `bun run check` — Lint and format check (Biome)
- `bun run fix` — Lint and format with auto-fix (Biome)
- `bun test` — Run all tests (bun:test)
- `just` — List all available tasks (justfile)

## Development Workflow

### Adding a Feature
1. Write tests first: use `superpowers:test-driven-development`
2. Implement the feature
3. Run `/simplify` before committing (enforced by hook)
4. Run `superpowers:verification-before-completion` to verify completeness
5. Run `superpowers:requesting-code-review` before merging

### Commit Messages
Use conventional commit format: `type(scope): description`
Types: feat, fix, refactor, test, docs, chore, style, perf, ci, build
Minimum description: 15 characters

### After a Burst Session
Before merging, run the full verification chain:
1. `bun check` (Biome lint + format)
2. `bun test` (all packages)
3. `superpowers:verification-before-completion`
4. `superpowers:requesting-code-review`

## Rules
- Types are defined ONLY in @repo/types
- Business logic is defined ONLY in @repo/core
- API handlers are thin wrappers around @repo/core
- MCP tools are thin wrappers around @repo/core
- Deviations from defaults must be documented in this file
```

### 6. Generate per-package CLAUDE.md signposts

Create a small `CLAUDE.md` in each stable package directory to point Claude at the
right skill. These get committed to git so every team member's Claude Code session
picks up the same context.

**packages/api/CLAUDE.md:**
```markdown
# API Package

This package follows the `prototyping-skills:generate-api` skill conventions.
Hono + @hono/zod-openapi patterns. Handlers are thin wrappers around @repo/core.

Key rules:
- All routes use `createRoute()` + `app.openapi()` — never raw `app.get()`
- Business logic in @repo/core, not in handlers
- Types from @repo/types, never duplicated
- Use `Bun.env`, not `process.env`
```

**packages/ui/CLAUDE.md:**
```markdown
# UI Package

This package follows the `prototyping-skills:generate-ui` skill conventions.
Next.js 16 App Router + shadcn/ui patterns.

Key rules:
- Server Components by default — only add "use client" when genuinely needed
- Server Actions for mutations, not client-side POST calls
- Data fetching in async Server Components, not useEffect + fetch
- Types from @repo/types, never duplicated
```

**packages/mcp/CLAUDE.md:**
```markdown
# MCP Package

This package follows the `prototyping-skills:generate-mcp` skill conventions.
@modelcontextprotocol/sdk with stdio transport.

Key rules:
- Tool handlers are thin wrappers around @repo/core
- Zod `.describe()` on every parameter
- Return structured JSON as text content
- Types from @repo/types, never duplicated
```

### 7. Commit the scaffolding

After all files are created and `bun install` has run, initialise git and create
the initial commit:

```bash
git init
git add .
git commit -m "Bootstrap [project-name] prototype monorepo"
```

This ensures every team member's Claude Code session picks up the CLAUDE.md files
from the first clone.

## Important Notes

- Always ask the user what the prototype is about before generating core package contents.
- The core package is the ONLY package whose tech stack varies. API, UI, and MCP are standardised.
- If the user specifies special libraries for the core (e.g., a specific AI SDK, a database driver, a processing library), add them only to the core package.
