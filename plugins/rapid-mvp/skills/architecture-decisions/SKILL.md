---
name: architecture-decisions
description: >
  This skill captures default architectural decisions and the conditions under which
  deviations are acceptable. Use when in plan mode, when Claude is about to suggest
  a technology or library choice, when the user asks "why do we use X", or when
  evaluating trade-offs between approaches. This is the source of truth for what
  the team's defaults are and when alternatives are warranted.
version: 0.1.0
---

# Architecture Decisions

This document defines the team's default choices and the decision framework for when to deviate. Every prototype starts with these defaults. Deviations are acceptable but must be surfaced explicitly during plan mode with a clear trade-off statement.

## Decision Framework

When suggesting anything during plan mode or implementation:

1. **Check if there's a default** — consult this document
2. **If default exists, use it** — do not suggest alternatives unless there's a concrete reason
3. **If deviation is warranted**, present it as: "The default is [X]. For this project, [Y] may be better because [reason]. The trade-off is [cost]. Which do you prefer?"
4. **Never silently deviate** — even if the alternative seems clearly better, surface the choice

This matters because multiple people work on these prototypes. Consistency reduces onboarding friction and context-switching cost. A "worse" but consistent choice is usually better than a "better" but unfamiliar one.

## Stack Selection

| Decision | Default | When to deviate |
|----------|---------|----------------|
| Next.js vs 11ty | Depends on project type | Next.js for interactive apps (forms, dashboards, auth). 11ty for content-driven sites (displays, timers, informational). If unclear, ask. |
| Runtime | Bun | Never deviate. Bun is always the runtime and package manager. |
| Monorepo tool | Bun workspaces | Never deviate. |
| Hosting | GitHub Pages (11ty) or Vercel (Next.js) | Only deviate if the project has specific infrastructure requirements (e.g., edge functions, specific region). |

## UI Decisions (Next.js)

| Decision | Default | When to deviate |
|----------|---------|----------------|
| Component library | shadcn/ui + Radix | Only if the prototype needs components shadcn doesn't offer AND Radix primitives can't compose them. Never for preference reasons. |
| CSS framework | Tailwind CSS 4 | Never deviate in Next.js projects. |
| Icons | lucide-react | Only if a specific icon set is required by brand guidelines. |
| Toasts/notifications | sonner | Never deviate. |
| Charts | recharts | Deviate to d3 only if the visualization is highly custom and recharts can't handle it. |
| Form handling | React Hook Form + Zod | Never deviate. Never use Formik or Yup. |
| Theming | next-themes with CSS custom properties | Never deviate. |
| Animation | tailwindcss-animate | Deviate to Framer Motion only if the prototype requires complex gesture-driven or layout animations. Discuss first. |
| State management | React Context + Hook Form state | Deviate to Zustand only if multiple unrelated components need shared state beyond theme/auth. Never Redux. |

## UI Decisions (11ty)

| Decision | Default | When to deviate |
|----------|---------|----------------|
| Templating | Nunjucks | Never deviate. |
| CSS framework | Tailwind CSS 4 | With `@tailwindcss/cli` build step. Same shared theme as Next.js. |
| Client JS | Vanilla JavaScript | Deviate to Alpine.js or Preact only if interactivity requirements are extensive. Discuss first. |
| Data validation | Zod | Never deviate. |

## Architecture Decisions

| Decision | Default | When to deviate |
|----------|---------|----------------|
| Component architecture | Three layers (Base UI → App components → Pages) | Never deviate. |
| Data pipeline | Separate package in monorepo | Only skip if the prototype has zero data transformation needs. |
| Validation | Zod schemas for all external data | Never deviate. Always validate. |
| API patterns | Next.js App Router API routes | Deviate to tRPC only if there are many type-safe endpoints between frontend and backend. |
| Auth | NextAuth v5 with Google OAuth | Deviate only if specific auth provider requirements exist. |
| Testing | bun test | Never deviate on tooling. Test coverage expectations are flexible per prototype. |

## Content & Structure Decisions (non-negotiable)

| Decision | Default | When to deviate |
|----------|---------|----------------|
| About page | Every UI includes an about page | Never deviate. About page covers motivations, design principles, and how the project was built. |
| Data/format separation | Content data is always separate from templates and components | Never deviate. 11ty: `src/_data/` = data, `src/_includes/` = format. Next.js: `src/content/` = data, `src/components/` + `src/app/` = format. |
| Design tokens | Shared `tooling/theme.css` using OKLCH `@theme` directive | Never deviate. Both stacks import the same theme file for visual consistency. |

Anti-pattern: Never hardcode content in templates or page components. Always extract to data files.

## Code Style Decisions (non-negotiable)

These never change across projects:
- 2-space indentation
- Double quotes
- No semicolons
- `import type` for type-only imports
- kebab-case for files
- PascalCase for components
- camelCase for functions and variables
- Design tokens over hardcoded values
- `"use client"` only where needed

## CLAUDE.md Generation

Every new project must have CLAUDE.md files that encode these decisions for the specific project context. The root CLAUDE.md should contain:

1. Project structure overview
2. Tech stack with exact versions
3. Code style rules
4. Key commands (dev, build, lint)
5. Anti-patterns specific to the stack
6. Any project-specific deviations from defaults (with rationale)

App-level CLAUDE.md files should contain app-specific guidance (ports, env vars, special build flags like `--webpack` for next-pwa).

## Working With the Team

When multiple people are coding on a prototype:
- Defaults reduce "which library?" discussions
- CLAUDE.md files ensure every Claude Code session starts with the same context
- Deviations documented in CLAUDE.md prevent "why did we use X here?" confusion
- Plan mode is where deviations get decided, not during implementation
