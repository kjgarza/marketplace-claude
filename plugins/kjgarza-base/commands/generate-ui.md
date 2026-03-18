---
name: generate-ui
description: Generate a frontend UI package or add a feature module. Use without arguments to scaffold a full frontend, or pass a feature name to add a single feature.
---

Generate frontend UI code. If "$ARGUMENTS" is empty or "all", scaffold the entire frontend package (Mode A). If "$ARGUMENTS" names a specific feature (e.g. "dashboard", "settings"), add that feature as a new module (Mode B).

## Team conventions (always apply)

These are fixed standards across all projects — do not auto-detect or ask about them:

- **Framework**: Next.js with the App Router (app/ directory)
- **Package manager**: Bun
- **Linter/Formatter**: Biome (not ESLint/Prettier)
- **Component library**: shadcn/ui
- **Entity modeling**: When modeling entities, check if a relevant Schema.org type exists and use its property names as a guide (e.g. `headline` not `title`, `datePublished` not `publishedAt`, `text` not `body`). Only include fields actually needed and enforce strict types.

## Phase 1 — Discovery (read before writing anything)

Silently collect facts from project files. Do NOT generate code yet.

### 1a. Project context

1. Read CLAUDE.md at the repo root and any CLAUDE.md inside the frontend package (if it exists).
2. Read README.md at the repo root.
3. Read docs/DESIGN.md or docs/ARCHITECTURE.md if present — especially dependency direction rules.
4. Read the root package.json (and workspace config if monorepo).

### 1b. Frontend package detection

5. Identify the frontend package. Look for: packages/ui/, packages/web/, packages/frontend/, apps/web/, apps/frontend/. Note candidates if ambiguous.
6. Read the frontend package.json — extract dependencies, devDependencies, scripts.
7. Read tsconfig.json in the frontend package.

### 1c. Auto-detect remaining stack (record each as DETECTED or UNKNOWN)

| Signal | Detection strategy |
|--------|-------------------|
| **Styling** | deps: `tailwindcss` → Tailwind, `styled-components`/`@emotion/*` → CSS-in-JS, `sass` → SCSS. Check config files and existing component patterns. |
| **State mgmt** | deps: `zustand`, `@reduxjs/toolkit`, `jotai`, `@tanstack/react-query`, `swr`. |
| **Data fetching** | deps: `@tanstack/react-query`, `swr`, `axios`, `ky`. Check existing API utilities and env vars for base URLs. |
| **Test runner** | devDeps: `vitest`, `jest`, `@testing-library/*`. Check existing test file imports. Default: `bun:test`. |
| **Naming conventions** | Read 3-5 existing component files. Note: casing, export style, function vs arrow. |

### 1d. API layer detection

8. Find the API package or route files (packages/api/, apps/api/).
9. Read existing API routes to understand available data.
10. Look for existing fetch utilities or API client wrappers in the frontend (e.g. an api-client package).

## Phase 2 — Clarification (AskUserQuestion for UNKNOWN signals only)

Batch related questions into a single AskUserQuestion call.

**Ask if UNKNOWN:**
- Styling approach (if not detectable from deps or existing components)
- Data fetching pattern and API base URL (if no existing API client or env var found)
- Frontend package location (if ambiguous candidates found in 1b)

**Never ask (derive from code or use sensible defaults):**
- Framework, package manager, linter, component library (team conventions above)
- Naming conventions (follow existing code)
- Test runner (follow existing patterns, default bun:test)
- TypeScript vs JavaScript (always TypeScript)

## Phase 3 — Architecture rules (universal)

Violating any of these is a build-breaking error:

1. **Dependency direction**: The frontend NEVER imports from packages/core/ packages directly. All data flows through a network boundary packages/api/.
2. **No business logic in UI**: Frontend handles presentation and data fetching orchestration. Domain logic belongs on the server.
3. **Type duplication over coupling**: Replicate relevant type subsets in the frontend using Schema.org-aligned field names. Do NOT cross-import types from backend packages unless a shared types package already exists.
4. **Stub missing endpoints**: If an API endpoint you need doesn't exist, stub the fetch call with a TODO noting the missing route, expected request, and expected response shape.
5. **TypeScript strict mode** unless the project explicitly opts out.
6. **Follow existing conventions**: Match naming, exports, component style, and file organization patterns already in the codebase. Do not introduce new patterns.

## Phase 4 — Code generation

### Mode A — Full scaffold ($ARGUMENTS is empty or "all")

1. **Package setup**: package.json with dependencies (next, react, react-dom, shadcn/ui deps), tsconfig.json, next.config.ts.
2. **Entry point**: `app/layout.tsx` with root layout.
3. **Routing**: App Router structure with `app/page.tsx` as home page.
4. **Shared utilities**:
   - `lib/api-client.ts` — thin HTTP wrapper with API base URL. Use the project's fetch library or plain fetch.
   - `lib/types.ts` — frontend-local type definitions mirroring API response shapes (Schema.org-aligned names).
5. **Example feature module**: One module (e.g. "home" or "overview") to establish the pattern.
6. **Styling foundation**: Tailwind config + globals.css (if Tailwind detected), or appropriate setup per detected styling approach. shadcn/ui components.json config.
7. **Scripts**: `dev`, `build`, `start`, `lint` using Bun.

### Mode B — Single feature ($ARGUMENTS names a feature)

Produce only the new feature module using Next.js App Router conventions:

- `app/{feature}/page.tsx` — page entry point
- `app/{feature}/_components/` — feature-specific components (keep flat)
- Co-located hooks for data fetching and state

**Every feature module includes:**
1. Page entry point (`page.tsx`).
2. Feature-specific components using shadcn/ui primitives (keep flat, avoid deep nesting).
3. Data fetching logic (hooks or server components — match existing patterns in the project).
4. Types for API response shapes used by this feature (Schema.org-aligned field names).
5. Comment block listing which API routes this feature depends on.
6. Test file following the project's testing patterns.

## What NOT to produce

- API routes, server logic, database changes, or backend code.
- Changes outside the frontend package (packages/ui, packages/frontend, packages/web).
- New dependencies without explaining why (prefer what's already installed).
- Abstract base classes, DI containers, or over-engineered patterns.
