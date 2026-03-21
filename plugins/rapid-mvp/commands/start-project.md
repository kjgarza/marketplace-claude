---
description: Scaffold a new MVP project with monorepo structure
allowed-tools: Read, Write, Edit, Bash(mkdir:*), Bash(bun:*), Bash(git:*), Bash(cp:*), Bash(cat:*), Bash(echo:*), Bash(touch:*), AskUserQuestion, TaskCreate
argument-hint: [project-name]
---

Scaffold a new rapid MVP project. The project name is `$1`. If no name was provided, ask the user for one.

## Step 1: Determine the stack

Use the `AskUserQuestion` tool to ask which stack to use. Present these two options:

1. **Next.js stack** — For interactive apps with React, shadcn/ui, Tailwind CSS 4, PWA support. Best when the prototype needs client-side interactivity, forms, dashboards, or authentication.
2. **11ty stack** — For content-driven static sites with Nunjucks, vanilla JS, custom CSS. Best when the prototype is primarily informational, recipe-like, or content-display focused.

If the user already specified the stack in their message, skip this question.

## Step 2: Read the relevant skills

Before generating any files, read the appropriate skill files to load the full tech stack context:

- Read `${CLAUDE_PLUGIN_ROOT}/skills/shared-packages/SKILL.md` and `${CLAUDE_PLUGIN_ROOT}/skills/shared-packages/references/package-specs.md`
- Read `${CLAUDE_PLUGIN_ROOT}/skills/architecture-decisions/SKILL.md`
- If Next.js: Read `${CLAUDE_PLUGIN_ROOT}/skills/nextjs-stack/SKILL.md` and `${CLAUDE_PLUGIN_ROOT}/skills/nextjs-stack/references/nextjs-patterns.md`
- If 11ty: Read `${CLAUDE_PLUGIN_ROOT}/skills/eleventy-stack/SKILL.md` and `${CLAUDE_PLUGIN_ROOT}/skills/eleventy-stack/references/eleventy-patterns.md`

## Step 2.5: Create scaffolding tasks

After reading the skills, use `TaskCreate` to break the scaffolding into trackable sub-tasks for subagents. Example tasks: "Create root monorepo config", "Set up shared packages", "Scaffold app with stack-specific files", "Generate CLAUDE.md files", "Create CITATION.cff and LICENSE".

## Step 3: Scaffold the project

Create the project directory with the monorepo structure from the shared-packages skill. Then populate with the stack-specific files from the relevant stack skill.

### For both stacks, generate:

1. Root `package.json` with Bun workspaces (`apps/*`, `packages/*`) and `bun run --filter` scripts
2. Root `CITATION.cff` (CFF 1.2.0, author Kristian Garza, ORCID 0000-0003-3484-6875, license CC-BY-NC-ND-4.0)
3. Root `LICENSE` (MIT)
4. `tooling/theme.css` with shared OKLCH design tokens using `@theme` directive
5. Root `CLAUDE.md` tailored to the chosen stack — this is critical. It must contain:
   - The monorepo structure overview
   - The exact tech stack and version constraints
   - Code style rules (2-space indent, double quotes, no semicolons, kebab-case files)
   - Component architecture layers
   - Commands to run (dev, build, lint)
   - Anti-patterns to avoid (documented in the architecture-decisions skill)
6. Root `.gitignore`
7. Shared packages: `packages/utils/`, `packages/tsconfig/`
8. A `justfile` with common commands

### For Next.js stack, additionally generate:

9. `packages/ui/` — shadcn/ui component library with tsup, Radix UI, CVA
10. `packages/eslint-config/` — ESLint config for Next.js
11. `apps/<project-name>/` — Next.js 15 app with:
   - `next.config.js` (static export, basePath/assetPrefix for GitHub Pages, transpiling monorepo packages)
   - `postcss.config.js` (Tailwind CSS v4 via `@tailwindcss/postcss` — no autoprefixer needed)
   - `tsconfig.json` extending `@repo/tsconfig/app.json`
   - `src/app/layout.tsx` with ThemeProvider, Inter + Space Grotesk fonts, Open Graph metadata, metadataBase for GitHub Pages
   - `src/app/page.tsx` with landing page skeleton
   - `src/app/globals.css` with Tailwind v4 (`@import "tailwindcss"`, `@plugin`, `@theme inline`, `@source` for monorepo packages)
   - `src/components/theme-provider.tsx` — client-side ThemeProvider wrapper
   - `components.json` for shadcn/ui (new-york style, tsx, rsc — no `config` field, v4 doesn't use JS config)
   - `src/content/about.ts` — about page data (motivations, principles, how-built)
   - `src/app/about/page.tsx` — about page using `@tailwindcss/typography` prose classes
   - `public/opengraph.png` — placeholder OG image (1200x630) — remind user to replace
   - App-specific `CLAUDE.md`
12. `.github/workflows/deploy-pages.yml` — GitHub Actions workflow for deploying to GitHub Pages (Bun setup, build with `NEXT_PUBLIC_REPO_NAME`, upload artifact from `apps/<project-name>/out`, deploy)

Do NOT create a `tailwind.config.ts` file — Tailwind CSS v4 configures everything in CSS via `globals.css`.

The `package.json` dev script must be `"dev": "next dev"` (no `--webpack` flag — Turbopack is the default in Next.js 15.5+, and next-pwa is disabled during dev).

### For 11ty stack, additionally generate:

9. `src/_data/site.json` with project metadata
10. `src/_data/about.json` — about page data (motivations, principles, how-built)
11. `src/_includes/layouts/base.njk` — base layout
12. `src/_includes/components/` — empty components directory
13. `src/css/main.css` — Tailwind entry point (`@import "tailwindcss"` + shared theme import)
14. `src/js/` — client-side JS directory
15. `src/index.njk` — home page
16. `src/about.njk` — about page with Tailwind `prose` classes
17. `.eleventy.js` — config with passthrough copy (excluding `src/css`), Nunjucks, custom filters
18. `src/schemas/` — Zod validation schema templates
19. `scripts/validate.js` — validation script skeleton
20. App-specific `CLAUDE.md`

## Step 4: Initialize

Run `bun install` and `git init` in the new project directory.

## Step 5: Summary

Tell the user what was created. List the directory structure. Remind them of the key commands (`bun run dev`, `bun run build`). Mention that the generated `CLAUDE.md` files will guide Claude in future sessions.
