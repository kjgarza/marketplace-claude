# Package Manager Configuration Guide

## Table of Contents
- [Bun](#bun)
- [PNPM](#pnpm)
- [Yarn](#yarn)
- [Comparison](#comparison)

---

## Bun

### Root package.json
```json
{
  "name": "monorepo",
  "private": true,
  "workspaces": ["apps/*", "packages/*", "tooling/*"],
  "scripts": {
    "dev": "turbo dev",
    "build": "turbo build",
    "lint": "turbo lint",
    "type-check": "turbo type-check"
  },
  "devDependencies": {
    "turbo": "^2.3.0",
    "typescript": "^5.7.0"
  },
  "packageManager": "bun@1.1.0"
}
```

### Commands
```bash
# Initialize
bun init -y

# Install all dependencies
bun install

# Add dependency to specific workspace
bun add react --filter web
bun add -d typescript --filter @monorepo/ui

# Run workspace script
bun run --filter web dev

# Run all workspaces
bun run dev
```

### Workspace Protocol
```json
{
  "dependencies": {
    "@monorepo/ui": "workspace:*"
  }
}
```

### Lock file
- `bun.lockb` (binary format)

---

## PNPM

### Root package.json
```json
{
  "name": "monorepo",
  "private": true,
  "scripts": {
    "dev": "turbo dev",
    "build": "turbo build",
    "lint": "turbo lint",
    "type-check": "turbo type-check"
  },
  "devDependencies": {
    "turbo": "^2.3.0",
    "typescript": "^5.7.0"
  },
  "packageManager": "pnpm@9.0.0"
}
```

### pnpm-workspace.yaml
```yaml
packages:
  - "apps/*"
  - "packages/*"
  - "tooling/*"
```

### Commands
```bash
# Initialize
pnpm init

# Install all dependencies
pnpm install

# Add dependency to specific workspace
pnpm add react --filter web
pnpm add -D typescript --filter @monorepo/ui

# Run workspace script
pnpm --filter web dev

# Run all workspaces
pnpm dev
```

### Workspace Protocol
```json
{
  "dependencies": {
    "@monorepo/ui": "workspace:*"
  }
}
```

### Lock file
- `pnpm-lock.yaml`

### .npmrc (recommended)
```ini
auto-install-peers=true
strict-peer-dependencies=false
```

---

## Yarn

### Root package.json
```json
{
  "name": "monorepo",
  "private": true,
  "workspaces": ["apps/*", "packages/*", "tooling/*"],
  "scripts": {
    "dev": "turbo dev",
    "build": "turbo build",
    "lint": "turbo lint",
    "type-check": "turbo type-check"
  },
  "devDependencies": {
    "turbo": "^2.3.0",
    "typescript": "^5.7.0"
  },
  "packageManager": "yarn@4.0.0"
}
```

### Commands
```bash
# Initialize (Yarn 4+)
yarn init -2

# Install all dependencies
yarn install

# Add dependency to specific workspace
yarn workspace web add react
yarn workspace @monorepo/ui add -D typescript

# Run workspace script
yarn workspace web dev

# Run all workspaces
yarn dev
```

### Workspace Protocol
```json
{
  "dependencies": {
    "@monorepo/ui": "workspace:*"
  }
}
```

### Lock file
- `yarn.lock`

### .yarnrc.yml (Yarn 4+)
```yaml
nodeLinker: node-modules
```

---

## Comparison

| Feature | Bun | PNPM | Yarn |
|---------|-----|------|------|
| Speed | Fastest | Fast | Moderate |
| Disk usage | Low | Lowest | Moderate |
| Workspace config | package.json | pnpm-workspace.yaml | package.json |
| Maturity | Newer | Mature | Most mature |
| Node compatibility | Good | Full | Full |
| Lock file | Binary | YAML | Text |

### Recommendation
- **Bun**: Best for new projects, fastest development experience
- **PNPM**: Best for large projects, strictest dependency management
- **Yarn**: Best for teams familiar with it, widest ecosystem support
