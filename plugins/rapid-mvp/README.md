# rapid-mvp

Opinionated defaults and scaffolding for rapid MVP static websites using Next.js or 11ty monorepo patterns.

## What it does

This plugin gives Claude Code (and Cowork) your team's default tech stack, architectural decisions, and project scaffolding patterns. It eliminates the back-and-forth of directing Claude toward the right libraries and patterns by encoding those choices as skills that Claude loads automatically.

## Components

### Command: `/start-project`

Scaffolds a new MVP project with the full monorepo structure. Asks which stack (Next.js or 11ty), then generates all config files, shared packages, and CLAUDE.md files.

Usage: `/start-project my-project-name`

### Skill: nextjs-stack

Loaded when working in Next.js projects. Defines the default UI libraries (shadcn/ui, Tailwind CSS 4, Radix), form handling (React Hook Form + Zod), authentication (NextAuth), and code patterns. Includes detailed file templates in `references/`.

### Skill: eleventy-stack

Loaded when working in 11ty projects. Defines the default templating (Nunjucks), styling (Tailwind CSS 4 via @tailwindcss/cli), data pipeline (Zod validation + generation scripts), and deployment (GitHub Pages). Includes detailed file templates in `references/`.

### Skill: shared-packages

Defines the monorepo package structure (Bun workspaces), shared packages (@repo/utils, @repo/tsconfig, @repo/ui), and the pipeline package pattern. Includes complete package.json and tsconfig templates in `references/`.

### Skill: architecture-decisions

The decision framework for when to use defaults vs. when to deviate. Loaded during plan mode. Ensures Claude surfaces trade-offs explicitly rather than silently choosing alternatives.

## How it works with plan mode

During plan mode, Claude loads the `architecture-decisions` skill. When it considers suggesting a technology that differs from your defaults, it presents the deviation explicitly: "The default is X. For this project, Y may be better because [reason]. The trade-off is [cost]."

## Works alongside

- **code-simplifier** — handles code quality while this plugin handles stack-level decisions
- **frontend-design** — complements with design guidance

## Setup

Install the plugin in Claude Code or Cowork. No environment variables or MCP servers required.
