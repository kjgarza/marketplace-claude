---
name: nextjs-stack
description: >
  This skill provides the default Next.js monorepo tech stack for rapid MVP development.
  Use when the user asks to "create a Next.js app", "add a new app to the monorepo",
  "build a dashboard", "scaffold a React page", "set up a new frontend", or when working
  in any project that uses Next.js with Bun workspaces. Also load when Claude is about
  to suggest UI libraries, form handling, or styling approaches in a Next.js context —
  this skill defines the defaults.
---

# Next.js MVP Stack

Default tech stack and patterns for Next.js-based rapid MVPs. These are opinionated defaults — deviations require explicit discussion (see architecture-decisions skill).

## Core Stack

| Layer | Technology | Version | Notes |
|-------|-----------|---------|-------|
| Framework | Next.js | 16.x | App Router only, no Pages Router |
| React | React | 19.x | Server Components by default |
| Runtime | Bun | 1.1+ | Package manager AND runtime |
| Monorepo | Bun workspaces | — | Workspace management via `bun run --filter` |
| Language | TypeScript | 5.6+ | Strict mode always |

## UI & Styling

| Concern | Default | Details |
|---------|---------|---------|
| CSS framework | Tailwind CSS 4 | With OKLCH color variables |
| Component library | shadcn/ui | New York style, RSC-compatible |
| Primitives | Radix UI | Via shadcn/ui, never install Radix directly |
| Icons | lucide-react | Only icon library; never Font Awesome or Heroicons |
| Theming | next-themes | Class-based dark mode |
| Animations | tailwindcss-animate | Plugin for Tailwind |
| Typography | @tailwindcss/typography | For prose content |
| Variant management | class-variance-authority | For component variants |
| Class merging | tailwind-merge + clsx | Via `cn()` utility from @repo/utils |
| Toasts | sonner | Never react-hot-toast or react-toastify |
| Charts | recharts | When data visualization needed |

## Forms & Validation

| Concern | Default |
|---------|---------|
| Form library | React Hook Form |
| Schema validation | Zod |
| Form resolvers | @hookform/resolvers |
| Number inputs | react-number-format |

Never use Formik. Never use Yup. Always pair Zod schemas with React Hook Form via resolvers.

## Authentication

| Concern | Default |
|---------|---------|
| Auth library | NextAuth (Auth.js) v5 |
| Default provider | Google OAuth |
| Dev mode | Mock user bypass for local development |

## Three-Layer Component Architecture

1. **Base UI** (`packages/ui/`) — shadcn/ui components built on Radix primitives. These are generic, reusable, and have no business logic. Exported from `@repo/ui`.

2. **Application components** (`apps/<name>/src/components/`) — Business-specific compositions of Base UI components. Organized in subdirectories by feature (e.g., `components/dashboard/`, `components/invest/`).

3. **Pages** (`apps/<name>/src/app/`) — Next.js App Router pages that compose application components. Minimal logic in pages; delegate to components.

### Shared building blocks (`components/blocks/`)

Reusable application-level primitives like `metric-card`, `section-header`, `currency-input`. These sit between Base UI and feature components.

## Code Style (enforced)

- 2-space indentation, double quotes, no semicolons
- `import type` for React types
- Named imports for libraries (never `import * as`)
- `"use client"` directive only on interactive components
- PascalCase for components, camelCase for functions, kebab-case for files
- Design tokens over hardcoded color/spacing values
- Path alias: `@/*` maps to `./src/*`

## Data/Format Separation

Next.js projects enforce data/format separation:
- **Data** (`src/content/`): Content files as TypeScript (.ts) or JSON (.json)
  - Use `.ts` when you need type safety or computed values
  - Use `.json` for simple data matching 11ty's `_data/` pattern
- **Format** (`src/components/` + `src/app/`): React components and pages — these only define presentation
- Never hardcode content in page components or templates — always extract to `src/content/` files

## Tailwind CSS v4 (critical)

Tailwind CSS v4 is a major change from v3. These rules are non-negotiable:

- **No `tailwind.config.ts`** — v4 does not use a JS/TS config file
- **`@import "tailwindcss"`** replaces `@tailwind base/components/utilities` in `globals.css`
- **`@plugin`** directives replace the `plugins: []` array
- **`@theme inline`** maps CSS custom properties to Tailwind utility classes
- **`@source`** tells Tailwind where to scan for class usage (for monorepo `packages/ui/`)
- **`@tailwindcss/postcss`** is the PostCSS plugin (replaces `tailwindcss` + `autoprefixer`)
- **`components.json`** must NOT have a `tailwind.config` field

## Deployment (GitHub Pages)

Default deployment target is GitHub Pages via static export:

- `next.config.ts` uses `output: "export"`, `basePath`, and `assetPrefix` driven by `NEXT_PUBLIC_REPO_NAME`
- GitHub Actions workflow builds with Bun and deploys to Pages
- All image paths in components must use the basePath helper pattern
- Use static `public/opengraph.png` (1200x630) for OG images — no dynamic generation (incompatible with static export)
- `images: { unoptimized: true }` is required for static export

## Open Graph

Every project must include Open Graph metadata in the root layout:

- `metadataBase` dynamically constructed from `NEXT_PUBLIC_REPO_NAME` for GitHub Pages
- Static `opengraph.png` (1200x630) in `public/`
- Twitter card set to `summary_large_image`
- Never use `opengraph-image.tsx` or `twitter-image.tsx` dynamic routes — incompatible with static export

## Anti-patterns (never do these)

- Never use `pages/` directory — App Router only
- Never install Radix UI packages directly — use shadcn/ui
- Never use CSS Modules or styled-components — Tailwind only
- Never use `var` — `const` preferred, `let` when needed
- Never hardcode colors — use CSS custom properties via Tailwind theme
- Never hardcode image paths without basePath — use the `basePath` helper for GitHub Pages compatibility
- Never create `tailwind.config.ts` — Tailwind v4 configures everything in CSS
- Never use `--webpack` flag in dev script — Turbopack is the default bundler in Next.js 16
- Never pass `--turbopack` flag in dev script — it is the default in Next.js 16 and the flag is unnecessary
- Never use dynamic OG image routes with `output: "export"` — use static images
- Never put business logic in page.tsx files — extract to components
- Never hardcode content in page.tsx or components — extract to `src/content/`

## Detailed Patterns

For complete file templates, configuration examples, and directory structures, read `references/nextjs-patterns.md`.
