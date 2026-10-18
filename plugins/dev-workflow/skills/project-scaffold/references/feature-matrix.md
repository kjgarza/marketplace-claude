# Feature Compatibility Matrix

## Overview

This document shows which features are available for each project type and language combination.

## Feature Support

| Feature | Frontend (Node) | CLI (Node) | CLI (Python) | API (Node) | API (Python) | Monorepo (Node) | Monorepo (Python) |
|---------|-----------------|------------|--------------|------------|--------------|-----------------|-------------------|
| Testing | Vitest | Jest | Pytest | Jest | Pytest | Vitest/Jest | Pytest |
| Linting | ESLint + Prettier | ESLint + Prettier | Ruff | ESLint + Prettier | Ruff | ESLint + Prettier | Ruff |
| CI/CD | GitHub Actions | GitHub Actions | GitHub Actions | GitHub Actions | GitHub Actions | GitHub Actions | GitHub Actions |
| Docker | Dockerfile | Dockerfile | Dockerfile | Dockerfile | Dockerfile | Dockerfile | Dockerfile |
| Docs | README, CONTRIBUTING | README, CONTRIBUTING | README, CONTRIBUTING | README, CONTRIBUTING | README, CONTRIBUTING | README, CONTRIBUTING | README, CONTRIBUTING |

---

## Feature Details

### Testing

**Node.js Projects (Vitest)**
- Used for frontend projects with Vite
- Fast, native ESM support
- Compatible with Jest API
- Files: `vitest.config.ts`

**Node.js Projects (Jest)**
- Used for CLI and API projects
- Mature ecosystem, wide adoption
- Files: `jest.config.js`

**Python Projects (Pytest)**
- Used for all Python projects
- Plugin ecosystem, fixtures
- Files: `pytest.ini`, `conftest.py`

### Linting

**Node.js (ESLint + Prettier)**
- ESLint for code quality
- Prettier for formatting
- TypeScript support via typescript-eslint
- Files: `eslint.config.js`, `.prettierrc`

**Python (Ruff)**
- Fast, Rust-based linter
- Replaces flake8, isort, black
- Files: `ruff.toml`

### CI/CD

**GitHub Actions (Node)**
- Uses pnpm for package management
- Node 20 LTS
- Steps: install, lint, build, test

**GitHub Actions (Python)**
- Uses uv for package management
- Python 3.12
- Steps: install, lint, format check, test

### Docker

**Node.js Dockerfile**
- Multi-stage build
- Alpine base image
- pnpm for package management
- Production dependencies only

**Python Dockerfile**
- Multi-stage build
- Slim base image
- uv for package management
- Virtual environment in production

### Documentation

All projects get:
- `README.md` - Getting started, commands, license
- `CONTRIBUTING.md` - Development setup, PR process
- `LICENSE` - MIT license template

---

## Adding Features

When a user selects features, copy the appropriate files from `templates/features/`:

```
templates/features/
├── testing/
│   ├── vitest.config.ts.tmpl    # For frontend
│   ├── jest.config.js.tmpl      # For Node CLI/API
│   ├── pytest.ini.tmpl          # For Python
│   └── conftest.py.tmpl         # For Python
├── linting/
│   ├── eslint.config.js.tmpl    # For Node
│   ├── .prettierrc.tmpl         # For Node
│   └── ruff.toml.tmpl           # For Python
├── ci-cd/
│   ├── github-actions-node.yml.tmpl
│   └── github-actions-python.yml.tmpl
├── docker/
│   ├── Dockerfile.node.tmpl
│   ├── Dockerfile.python.tmpl
│   └── docker-compose.yml.tmpl
└── docs/
    ├── README.md.tmpl
    ├── CONTRIBUTING.md.tmpl
    └── LICENSE.tmpl
```

### Dependencies to Add

When features are selected, also add these dependencies:

**Testing (Node - Vitest)**
```json
{
  "devDependencies": {
    "vitest": "^2.1.0",
    "@vitest/coverage-v8": "^2.1.0"
  }
}
```

**Testing (Node - Jest)**
```json
{
  "devDependencies": {
    "jest": "^29.7.0",
    "ts-jest": "^29.2.0",
    "@types/jest": "^29.5.0"
  }
}
```

**Testing (Python)**
```toml
[project.optional-dependencies]
dev = ["pytest>=8.0.0", "pytest-cov>=4.0.0"]
```

**Linting (Node)**
```json
{
  "devDependencies": {
    "eslint": "^9.16.0",
    "typescript-eslint": "^8.18.0",
    "prettier": "^3.4.0"
  }
}
```

**Linting (Python)**
```toml
[project.optional-dependencies]
dev = ["ruff>=0.8.0"]
```
