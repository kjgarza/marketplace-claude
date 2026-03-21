---
name: shared-packages
description: >
  This skill defines the shared monorepo package patterns for rapid MVP projects.
  Use when the user asks to "add a package", "create a shared library", "set up
  the monorepo", "add utilities", or when scaffolding any new MVP project. Also
  load when Claude needs to understand the monorepo workspace structure or when
  creating cross-package imports.
version: 0.1.0
---

# Shared Monorepo Packages

All MVP projects use a Bun workspace monorepo. The root structure is always:

```
project-name/
├── apps/           # Deployable applications
│   └── app-name/   # One or more apps
├── packages/       # Shared libraries
│   ├── utils/      # Always present
│   ├── tsconfig/   # Always present (Next.js stack)
│   └── ...         # Stack-specific packages
├── tooling/        # Shared build tooling
│   └── theme.css   # Shared OKLCH design tokens (@theme directive)
├── scripts/        # Root-level build utilities (11ty stack)
├── package.json    # Bun workspaces config
├── CITATION.cff    # Citation metadata (CFF 1.2.0)
├── LICENSE         # MIT license
├── CLAUDE.md       # AI guidance for the entire monorepo
├── justfile        # Task runner shortcuts
└── bun.lock
```

## Root Configuration

### package.json

```json
{
  "name": "project-name",
  "private": true,
  "workspaces": ["apps/*", "packages/*"],
  "scripts": {
    "dev": "bun run --filter './apps/*' dev",
    "build": "bun run --filter './packages/*' build && bun run --filter './apps/*' build",
    "test": "bun test",
    "lint": "bun run --filter '*' lint",
    "type-check": "bun run --filter '*' type-check"
  },
  "packageManager": "bun@1.1.38"
}
```

## Always-Present Packages

### @repo/utils

Shared utility functions. Always contains at minimum:

| File | Purpose |
|------|---------|
| `cn.ts` | `cn()` helper — merges Tailwind classes via `clsx` + `tailwind-merge` |
| `types.ts` | Shared TypeScript type definitions |
| `validation-schemas.ts` | Shared Zod schemas used across apps |

Dependencies: `clsx`, `tailwind-merge`, `zod`
Build: `tsup` with CJS + ESM + type declarations

### @repo/tsconfig (Next.js stack only)

Shared TypeScript configs:

| File | Purpose |
|------|---------|
| `base.json` | Strict mode, ES2022 target, ESNext modules, bundler resolution |
| `app.json` | Extends base, preserves JSX, includes .next/types |

## Next.js-Specific Packages

### @repo/ui

shadcn/ui component library built on Radix UI primitives.

Entry point: `./src/index.ts`
Build: `tsup` with watch mode for dev

Core dependencies: All Radix UI primitives needed by installed shadcn components, plus `class-variance-authority`, `clsx`, `tailwind-merge`, `lucide-react`, `react-hook-form`, `@hookform/resolvers`, `sonner`.

Peer dependencies: `react@19`, `react-dom@19`

New components are added via `bunx shadcn@latest add <component>` run inside the `packages/ui/` directory.

### @repo/eslint-config

ESLint configuration extending `next/core-web-vitals` and `prettier`.

### @repo/ai-elements (optional)

AI-focused UI components. Only add when the prototype involves AI features (chat, artifacts, message rendering).

## Pipeline Package Pattern

When an MVP needs a data pipeline (API integration, data transformation, AI processing), create a dedicated package:

```
packages/pipeline/
├── src/
│   ├── index.ts        # Public API
│   ├── fetcher.ts      # Data fetching
│   ├── transformer.ts  # Data transformation
│   └── types.ts        # Pipeline-specific types
├── package.json
├── tsconfig.json
└── tsup.config.ts
```

The pipeline package should:
- Export clean functions, never expose implementation details
- Use Zod for input/output validation
- Be framework-agnostic (no React, no Next.js imports)
- Define its own types, import shared types from @repo/utils

## Cross-Package Import Rules

- Apps import from packages via workspace aliases: `import { cn } from "@repo/utils"`
- Packages can import from other packages but never from apps
- Use `import type` for type-only imports across packages
- Never use relative paths across workspace boundaries

## Detailed Specs

For complete package.json templates, tsconfig configurations, and tsup configs, read `references/package-specs.md`.
