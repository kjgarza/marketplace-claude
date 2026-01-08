---
name: monorepo-generator
description: Generate production-ready monorepo structures for full-stack applications including frontends (Next.js, React), APIs (Hono, Express), and data pipelines. Use when creating new monorepo projects, scaffolding multi-project architectures (web apps, APIs, workers, CLI tools), setting up shared packages, or configuring workspace tooling with Bun, PNPM, or Yarn.
---

# Monorepo Generator

Generate scalable monorepo structures for full-stack applications with shared packages.

## Quick Start

```bash
mkdir my-monorepo && cd my-monorepo
bun init -y  # or: pnpm init / npm init -y
```

---

## Workflow

### Step 1: Gather Requirements

Ask user what project types they need:

| Type | Examples | Common Stack |
|------|----------|--------------|
| **Frontend** | Web app, admin dashboard, docs site | Next.js 15, React 19, Tailwind |
| **API** | REST API, GraphQL server | Hono, Express, Fastify |
| **Pipeline** | ETL jobs, cron tasks, workers | Node scripts, Python |
| **CLI** | Developer tools, automation | Commander, Yargs |
| **Mobile** | React Native app | Expo, React Native |

### Step 2: Choose Package Manager

- **Bun** (recommended): Fastest, built-in workspaces
- **PNPM**: Efficient disk usage, strict dependencies
- **Yarn**: Mature ecosystem, plug'n'play option

See [Package Manager Guide](./references/package-managers.md) for configs.

### Step 3: Create Directory Structure

```
/monorepo/
├── apps/                       # Deployable applications
│   ├── web/                    # Next.js frontend
│   ├── api/                    # Hono/Express API
│   ├── admin/                  # Admin dashboard
│   └── docs/                   # Documentation site
│
├── services/                   # Backend services & workers
│   ├── jobs/                   # Scheduled jobs/cron
│   ├── workers/                # Background workers
│   └── pipelines/              # Data pipelines
│
├── packages/                   # Shared libraries
│   ├── ui/                     # React components (shadcn/ui)
│   ├── utils/                  # Shared utilities
│   ├── db/                     # Database client & schemas
│   ├── api-client/             # Generated API client
│   ├── config/                 # Shared configuration
│   ├── eslint-config/          # Shared ESLint
│   └── typescript-config/      # Shared TS configs
│
├── package.json                # Workspace root
├── turbo.json                  # Turborepo config
└── .gitignore
```

Adapt structure based on needs—not all projects need all directories.

### Step 4: Create Root Configuration

**Root package.json:**
```json
{
  "name": "monorepo",
  "private": true,
  "workspaces": ["apps/*", "services/*", "packages/*"],
  "scripts": {
    "dev": "turbo dev",
    "build": "turbo build",
    "lint": "turbo lint",
    "type-check": "turbo type-check",
    "test": "turbo test"
  },
  "devDependencies": {
    "turbo": "^2.3.0",
    "typescript": "^5.7.0"
  },
  "packageManager": "bun@1.1.0"
}
```

**turbo.json:**
```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".next/**"]
    },
    "dev": { "cache": false, "persistent": true },
    "start": { "dependsOn": ["build"] },
    "lint": { "dependsOn": ["^lint"] },
    "type-check": { "dependsOn": ["^type-check"] },
    "test": { "dependsOn": ["^build"] }
  }
}
```

---

## Project Templates

### Frontend App (Next.js)

```json
// apps/web/package.json
{
  "name": "web",
  "private": true,
  "scripts": {
    "dev": "next dev --turbopack",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "@monorepo/ui": "workspace:*",
    "@monorepo/utils": "workspace:*",
    "next": "^15.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  },
  "devDependencies": {
    "@monorepo/typescript-config": "workspace:*",
    "tailwindcss": "^4.0.0",
    "typescript": "^5.7.0"
  }
}
```

```typescript
// apps/web/next.config.ts
import type { NextConfig } from 'next';

const config: NextConfig = {
  transpilePackages: ['@monorepo/ui', '@monorepo/utils'],
};

export default config;
```

### API Server (Hono)

```json
// apps/api/package.json
{
  "name": "api",
  "private": true,
  "scripts": {
    "dev": "bun run --hot src/index.ts",
    "build": "bun build src/index.ts --outdir dist --target node",
    "start": "bun run dist/index.js",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "@monorepo/db": "workspace:*",
    "@monorepo/utils": "workspace:*",
    "hono": "^4.6.0",
    "@hono/node-server": "^1.13.0"
  },
  "devDependencies": {
    "@monorepo/typescript-config": "workspace:*",
    "@types/node": "^22.0.0",
    "typescript": "^5.7.0"
  }
}
```

```typescript
// apps/api/src/index.ts
import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';

const app = new Hono();

app.use('*', logger());
app.use('*', cors());

app.get('/', (c) => c.json({ status: 'ok' }));
app.get('/health', (c) => c.json({ healthy: true }));

// Routes
app.route('/api/users', usersRouter);
app.route('/api/items', itemsRouter);

serve({ fetch: app.fetch, port: 3001 }, (info) => {
  console.log(`API running on http://localhost:${info.port}`);
});
```

### Background Worker/Job

```json
// services/jobs/package.json
{
  "name": "jobs",
  "private": true,
  "scripts": {
    "dev": "bun run --watch src/index.ts",
    "build": "bun build src/index.ts --outdir dist --target node",
    "start": "bun run dist/index.js",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "@monorepo/db": "workspace:*",
    "@monorepo/utils": "workspace:*",
    "cron": "^3.1.0"
  },
  "devDependencies": {
    "@monorepo/typescript-config": "workspace:*",
    "@types/cron": "^2.4.0",
    "typescript": "^5.7.0"
  }
}
```

```typescript
// services/jobs/src/index.ts
import { CronJob } from 'cron';
import { db } from '@monorepo/db';

// Run every hour
const hourlyJob = new CronJob('0 * * * *', async () => {
  console.log('Running hourly job...');
  // Your job logic here
});

// Run daily at midnight
const dailyJob = new CronJob('0 0 * * *', async () => {
  console.log('Running daily cleanup...');
  // Cleanup logic here
});

hourlyJob.start();
dailyJob.start();

console.log('Job scheduler started');
```

### Data Pipeline

```json
// services/pipelines/package.json
{
  "name": "pipelines",
  "private": true,
  "scripts": {
    "etl:users": "bun run src/etl/users.ts",
    "etl:analytics": "bun run src/etl/analytics.ts",
    "build": "bun build src/**/*.ts --outdir dist",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "@monorepo/db": "workspace:*",
    "@monorepo/utils": "workspace:*",
    "zod": "^3.23.0"
  },
  "devDependencies": {
    "@monorepo/typescript-config": "workspace:*",
    "typescript": "^5.7.0"
  }
}
```

```typescript
// services/pipelines/src/etl/users.ts
import { db } from '@monorepo/db';
import { z } from 'zod';

const UserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  createdAt: z.coerce.date(),
});

async function extractUsers() {
  // Extract from source
}

async function transformUsers(raw: unknown[]) {
  return raw.map((r) => UserSchema.parse(r));
}

async function loadUsers(users: z.infer<typeof UserSchema>[]) {
  // Load to destination
}

async function main() {
  console.log('Starting ETL pipeline...');
  const raw = await extractUsers();
  const transformed = await transformUsers(raw);
  await loadUsers(transformed);
  console.log(`Processed ${transformed.length} users`);
}

main().catch(console.error);
```

---

## Shared Packages

### packages/utils

```typescript
// packages/utils/src/index.ts
export { cn } from './cn';
export { formatDate, parseDate } from './date';
export { sleep, retry } from './async';
export type { Result, AsyncResult } from './types';
```

### packages/db

```json
// packages/db/package.json
{
  "name": "@monorepo/db",
  "private": true,
  "exports": { ".": "./src/index.ts" },
  "dependencies": {
    "drizzle-orm": "^0.36.0",
    "postgres": "^3.4.0"
  },
  "devDependencies": {
    "drizzle-kit": "^0.28.0",
    "@monorepo/typescript-config": "workspace:*"
  }
}
```

### packages/config

```typescript
// packages/config/src/index.ts
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DATABASE_URL: z.string().url(),
  API_URL: z.string().url().optional(),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
});

export const config = envSchema.parse(process.env);
export type Config = z.infer<typeof envSchema>;
```

---

## TypeScript Configs

```json
// packages/typescript-config/base.json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "compilerOptions": {
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "declaration": true,
    "declarationMap": true
  }
}
```

```json
// packages/typescript-config/node.json (for APIs/services)
{
  "extends": "./base.json",
  "compilerOptions": {
    "lib": ["ES2022"],
    "noEmit": true
  }
}
```

```json
// packages/typescript-config/nextjs.json
{
  "extends": "./base.json",
  "compilerOptions": {
    "lib": ["DOM", "DOM.Iterable", "ES2022"],
    "jsx": "preserve",
    "noEmit": true,
    "plugins": [{ "name": "next" }]
  }
}
```

---

## Adding New Projects

```bash
# New frontend
mkdir -p apps/dashboard && cp -r apps/web/* apps/dashboard/

# New API
mkdir -p apps/gateway && cp -r apps/api/* apps/gateway/

# New service
mkdir -p services/notifications
```

Update `package.json` name and dependencies for each new project.

---

## Deployment

| Project Type | Deployment Options |
|--------------|-------------------|
| Frontend | Vercel, Netlify, Cloudflare Pages |
| API | Railway, Fly.io, AWS Lambda, Docker |
| Workers | Railway, Render, AWS ECS |
| Jobs | Cron service, GitHub Actions, Temporal |

Each project deploys independently from its directory.

---

## Resources

- [Package Manager Guide](./references/package-managers.md) - Bun/PNPM/Yarn configs
- [assets/](./assets/) - Template files for scaffolding
