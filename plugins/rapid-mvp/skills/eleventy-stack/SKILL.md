---
name: eleventy-stack
description: >
  This skill provides the default 11ty (Eleventy) tech stack for rapid MVP development.
  Use when the user asks to "create a static site", "build a content site", "scaffold
  an 11ty project", "set up Eleventy", or when working in any project that uses 11ty
  with Bun. Also load when Claude is about to suggest templating, data handling, or
  styling approaches in an 11ty context — this skill defines the defaults.
version: 0.1.0
---

# 11ty MVP Stack

Default tech stack and patterns for Eleventy-based rapid MVPs. These are opinionated defaults — deviations require explicit discussion (see architecture-decisions skill).

## Core Stack

| Layer | Technology | Version | Notes |
|-------|-----------|---------|-------|
| Framework | Eleventy (11ty) | 3.x | Static site generator |
| Templating | Nunjucks | — | Primary template engine |
| Runtime | Bun | 1.1+ | Package manager AND runtime (not Node) |
| Validation | Zod | 4.x | Schema validation for data files |
| Client JS | Vanilla JavaScript | — | No React, no Vue, no framework |
| Language | JavaScript | — | ESM modules in scripts, no TypeScript in 11ty projects |

## Styling

| Concern | Default |
|---------|---------|
| CSS framework | Tailwind CSS 4 via `@tailwindcss/cli` |
| Typography | `@tailwindcss/typography` for prose content |
| Theme | Shared `tooling/theme.css` with OKLCH `@theme` directive |
| Dark mode | Tailwind dark mode with `[data-theme]` selector |
| Build step | `@tailwindcss/cli` processes `src/css/main.css` → `_site/css/main.css` |

Never use CSS-in-JS. Never use PostCSS as a plugin — use `@tailwindcss/cli` directly.

## Data Architecture

11ty projects follow a strict data pipeline:

1. **Human-authored data** → JSON files in `src/_data/` (e.g., `recipes.json`, `products.json`)
2. **Validation** → Zod schemas in `src/schemas/` validate data on build
3. **Generation** → Scripts in `scripts/` transform validated data into derived data files
4. **Build** → 11ty reads both authored and derived data, generates static HTML
5. **Client runtime** → Vanilla JS loads data into `window.*` for interactivity

### The validate → generate → build pipeline

This is critical. Every data change must go through:
```
Edit data → bun run validate → bun run generate → bun run build
```

The `prebuild` script in `package.json` should run validation automatically.

## Template Architecture

| Directory | Purpose |
|-----------|---------|
| `src/_includes/layouts/` | Page layouts (base.njk, etc.) |
| `src/_includes/components/` | Reusable template partials |
| `src/_includes/macros/` | Nunjucks macros for repetitive patterns |
| `src/_data/` | Global data files (JSON) |
| `src/schemas/` | Zod validation schemas |
| `src/css/` | Tailwind CSS entry point (imports shared theme) |
| `src/js/` | Client-side vanilla JavaScript |
| `scripts/` | Build utilities (validate, generate, transform) |

## Data/Format Separation

11ty enforces data/format separation by convention:
- **Data** (`src/_data/`): JSON files containing content — this is where all content lives
- **Format** (`src/_includes/`): Nunjucks layouts, components, macros — these only define presentation
- Never hardcode content in templates — always extract to `_data/` files

## Configuration Pattern

The `.eleventy.js` config should:
- Set passthrough copy for `src/js`, `src/assets` (NOT `src/css` — processed by Tailwind CLI)
- Set `env` global data (defaults to "development")
- Add custom filters (`formatMinutes`, `json`, etc. as needed)
- Set directory config: input `src`, output `_site`, includes `_includes`, data `_data`
- Default to Nunjucks for all template formats

## Deployment

Default to GitHub Pages via GitHub Actions:
1. Trigger on push to `main`
2. Setup Bun
3. `bun install` → `bun run validate` → `bun run build`
4. Upload `_site/` artifact
5. Deploy to GitHub Pages

## Code Style (enforced)

- Data files use kebab-case slugs
- Nunjucks templates use component-style naming
- JavaScript files use camelCase functions
- Schemas mirror data file structure exactly
- No bundlers — files are copied as-is

## Anti-patterns (never do these)

- Never use React or any JS framework in 11ty projects
- Never use CSS-in-JS or styled-components
- Never use PostCSS as a plugin — use `@tailwindcss/cli` for Tailwind builds
- Never use TypeScript in 11ty projects — plain JavaScript
- Never skip validation before build
- Never put derived data in `_data/` manually — always generate via scripts
- Never use Node.js — use Bun for all scripts
- Never hardcode content in templates — always extract to `_data/` files

## Detailed Patterns

For complete file templates, configuration examples, and directory structures, read `references/eleventy-patterns.md`.
