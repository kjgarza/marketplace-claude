---
name: project-scaffold
description: >
  Scaffold new software projects with best practices. This skill should be used when
  the user wants to create a new project, initialize a codebase, scaffold an application,
  start a new repo, set up a project from scratch, or generate a boilerplate/starter
  template. Supports frontend (React, Vue, vanilla), CLI tools, REST APIs, and monorepos
  in TypeScript/JavaScript or Python.
---

# Project Scaffolder

Scaffold production-ready projects with modern tooling and configurable features.

## Interactive Workflow

Follow these steps in order. Use the AskUserQuestion tool for each step.

### Step 1: Project Name

Ask for the project name. Validate that it:
- Uses lowercase letters, numbers, and hyphens only (kebab-case)
- Starts with a letter
- Is between 2-50 characters
- Does not start with a number

Example prompt:
```
What would you like to name your project?
(Use lowercase with hyphens, e.g., my-awesome-app)
```

### Step 2: Project Type

Ask which type of project to create:

| Type | Description |
|------|-------------|
| **Frontend** | Static site or single-page application |
| **CLI** | Command-line tool |
| **API** | REST API server |
| **Monorepo** | Multi-package workspace |

### Step 3: Language/Framework

Based on project type, present these options:

**Frontend:**
1. React with TypeScript (Recommended)
2. React with JavaScript
3. Vue with TypeScript
4. Vue with JavaScript
5. Vanilla (no framework)

**CLI:**
1. TypeScript/Node.js with Commander (Recommended)
2. JavaScript/Node.js with Commander
3. Python with Click

**API:**
1. TypeScript/Express (Recommended)
2. JavaScript/Express
3. Python/FastAPI

**Monorepo:**
1. Node.js with pnpm + Turborepo (Recommended)
2. Python with uv workspaces

### Step 4: Features

Ask which features to include (allow multiple selections):

| Feature | Node.js | Python |
|---------|---------|--------|
| Testing | Vitest / Jest | Pytest |
| Linting | ESLint + Prettier | Ruff |
| CI/CD | GitHub Actions | GitHub Actions |
| Docker | Dockerfile + compose | Dockerfile + compose |
| Documentation | README, CONTRIBUTING, LICENSE | README, CONTRIBUTING, LICENSE |

### Step 5: Confirmation

Summarize all selections and ask for confirmation:

```
I'll create a [LANGUAGE] [TYPE] project named '[NAME]' with:
- [Feature 1]
- [Feature 2]
- ...

Proceed? (yes to confirm, or specify changes)
```

## Generation Process

After confirmation, generate the project:

1. **Create project directory** at the specified path (default: current directory)

2. **Copy base templates** from the appropriate `templates/[type]/[language]/` directory

3. **Process template variables** - Replace these placeholders in all `.tmpl` files:
   - `{{PROJECT_NAME}}` - kebab-case name (e.g., `my-app`)
   - `{{PROJECT_NAME_PASCAL}}` - PascalCase (e.g., `MyApp`)
   - `{{PROJECT_NAME_SNAKE}}` - snake_case (e.g., `my_app`)
   - `{{AUTHOR}}` - From `git config user.name` or "Your Name"
   - `{{YEAR}}` - Current year

4. **Add feature files** from `templates/features/[feature]/` for each selected feature

5. **Create .gitignore** appropriate for the language

6. **Initialize git** with `git init`

7. **Display next steps**:
   ```
   Project created successfully!

   Next steps:
     cd [project-name]
     [install command]  # npm install / pip install -e .
     [dev command]      # npm run dev / python -m [name]
   ```

## Template Locations

Base project templates:
- `templates/frontend/react-ts/` - React + TypeScript + Vite
- `templates/frontend/react-js/` - React + JavaScript + Vite
- `templates/frontend/vue-ts/` - Vue + TypeScript + Vite
- `templates/frontend/vue-js/` - Vue + JavaScript + Vite
- `templates/frontend/vanilla/` - Vanilla JS + Vite
- `templates/cli/node-ts/` - Node.js + TypeScript + Commander
- `templates/cli/node-js/` - Node.js + JavaScript + Commander
- `templates/cli/python/` - Python + Click
- `templates/api/node-ts/` - Express + TypeScript
- `templates/api/node-js/` - Express + JavaScript
- `templates/api/python/` - FastAPI + Uvicorn
- `templates/monorepo/node/` - pnpm + Turborepo
- `templates/monorepo/python/` - uv workspaces

Feature templates:
- `templates/features/testing/` - Test configs (vitest, jest, pytest)
- `templates/features/linting/` - Lint configs (eslint, prettier, ruff)
- `templates/features/ci-cd/` - GitHub Actions workflows
- `templates/features/docker/` - Dockerfile and docker-compose
- `templates/features/docs/` - README, CONTRIBUTING, LICENSE

## File Naming

Template files use `.tmpl` extension. When copying:
- Remove `.tmpl` extension (e.g., `package.json.tmpl` → `package.json`)
- Process variable substitutions
- Preserve directory structure

## Best Practices Applied

All generated projects include:
- **Modern tooling**: Vite for frontend, tsx for Node, uv for Python
- **Type safety**: TypeScript by default, type hints for Python
- **Sensible defaults**: Works out of the box with minimal config
- **Clean structure**: Organized src/ directory, clear separation of concerns
- **Git-ready**: Appropriate .gitignore, ready for version control
