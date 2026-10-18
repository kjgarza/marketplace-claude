# Project Types Reference

## Frontend

Static sites and single-page applications built with modern tooling.

### React + TypeScript
- **Tooling**: Vite + React plugin
- **Features**: Strict TypeScript, HMR, production build optimization
- **Structure**:
  ```
  src/
    main.tsx    # Entry point
    App.tsx     # Root component
    index.css   # Global styles
  ```
- **Commands**:
  - `npm run dev` - Start dev server
  - `npm run build` - Production build
  - `npm run preview` - Preview production build

### React + JavaScript
- Same as React TS but without TypeScript configuration
- Simpler setup for prototypes

### Vue + TypeScript
- **Tooling**: Vite + Vue plugin + vue-tsc
- **Features**: Composition API, TypeScript SFCs
- **Structure**: Similar to React with `.vue` files

### Vue + JavaScript
- Same as Vue TS but without TypeScript

### Vanilla
- **Tooling**: Vite only (no framework)
- **Features**: Zero dependencies, pure JS/HTML/CSS
- **Best for**: Simple landing pages, learning

---

## CLI

Command-line tools and utilities.

### Node.js + TypeScript
- **Tooling**: tsx for development, tsc for build
- **CLI Framework**: Commander.js
- **Features**: Type-safe commands, argument parsing
- **Structure**:
  ```
  src/
    index.ts    # CLI entry with commander setup
    cli.ts      # Command implementations
  ```
- **Commands**:
  - `npm run dev` - Run with tsx
  - `npm run build` - Compile to JS
  - `npm link` - Install globally

### Node.js + JavaScript
- Same as Node TS without TypeScript
- Directly executable without build step

### Python
- **Tooling**: uv for package management
- **CLI Framework**: Click
- **Features**: Decorator-based commands, automatic help
- **Structure**:
  ```
  src/
    __init__.py
    __main__.py   # Entry point for python -m
    cli.py        # Click command group
  ```
- **Commands**:
  - `uv run python -m package` - Run module
  - `uv pip install -e .` - Install for development

---

## API

REST API servers with modern frameworks.

### Express + TypeScript
- **Tooling**: tsx for development, tsc for build
- **Framework**: Express.js
- **Features**: JSON middleware, error handling, typed routes
- **Structure**:
  ```
  src/
    index.ts              # Server setup
    routes/
      health.ts           # Example route
    middleware/
      error-handler.ts    # Error middleware
  ```
- **Commands**:
  - `npm run dev` - Watch mode with tsx
  - `npm run build` - Compile
  - `npm start` - Run production

### Express + JavaScript
- Same as Express TS without TypeScript
- JSDoc types for editor support

### FastAPI (Python)
- **Tooling**: uv for packages, uvicorn for server
- **Framework**: FastAPI
- **Features**: Async routes, automatic OpenAPI, CORS
- **Structure**:
  ```
  src/
    __init__.py
    main.py         # FastAPI app
    routes/
      health.py     # Route modules
  ```
- **Commands**:
  - `uv run uvicorn main:app --reload` - Dev server
  - `uv run python -m package` - Entry script

---

## Monorepo

Multi-package workspaces for larger projects.

### Node.js (pnpm + Turborepo)
- **Tooling**: pnpm workspaces + Turborepo
- **Features**: Cached builds, parallel tasks, dependency graph
- **Structure**:
  ```
  apps/           # Applications
  packages/       # Shared packages
  package.json    # Root config
  pnpm-workspace.yaml
  turbo.json      # Build pipeline
  ```
- **Commands**:
  - `pnpm install` - Install all deps
  - `pnpm build` - Build all packages
  - `pnpm dev` - Start all dev servers

### Python (uv workspaces)
- **Tooling**: uv workspaces
- **Features**: Shared dependencies, workspace packages
- **Structure**:
  ```
  apps/           # Applications
  packages/       # Shared packages
  pyproject.toml  # Root config with workspace
  ```
- **Commands**:
  - `uv sync` - Install all deps
  - `uv run -p package cmd` - Run in specific package
