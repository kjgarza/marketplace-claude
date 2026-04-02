# SST v3 Patterns Reference

Full code templates sourced from the `problemsniffer` reference implementation.
Copy and adapt — replace placeholders in `[brackets]` with project-specific values.

---

## sst.config.ts — Full Template (all four infra modules)

```typescript
/// <reference path="./.sst/platform/config.d.ts" />

export default $config({
  app(input) {
    return {
      name: "[app-name]",
      removal: input?.stage === "production" ? "retain" : "remove",
      home: "aws",
    };
  },
  async run() {
    const secrets = await import("./infra/secrets.js");
    const api = await import("./infra/api.js");
    const pipeline = await import("./infra/pipeline.js");
    const frontend = await import("./infra/frontend.js");

    return {
      apiUrl: api.apiUrl,
      frontendUrl: frontend.frontendUrl,
    };
  },
});
```

---

## sst.config.ts — API-Only Minimal Template

Use when only `packages/api` exists (no pipeline, no frontend):

```typescript
/// <reference path="./.sst/platform/config.d.ts" />

export default $config({
  app(input) {
    return {
      name: "[app-name]",
      removal: input?.stage === "production" ? "retain" : "remove",
      home: "aws",
    };
  },
  async run() {
    const secrets = await import("./infra/secrets.js");
    const api = await import("./infra/api.js");

    return {
      apiUrl: api.apiUrl,
    };
  },
});
```

---

## infra/secrets.ts — Annotated Template

Declare one `sst.Secret` per env var. Replace the example vars with those detected
from `.env.example` and `Bun.env`/`process.env` usages in the project.

```typescript
// Replace these with the actual secrets detected during pre-flight.
// Naming rule: SNAKE_CASE env var → PascalCase secret name
// Example: OPENAI_API_KEY → OpenaiApiKey

export const openaiApiKey = new sst.Secret("OpenaiApiKey");
export const databaseUrl = new sst.Secret("DatabaseUrl");
export const databaseAuthToken = new sst.Secret("DatabaseAuthToken");

// Google OAuth / NextAuth (only if auth is in use)
export const googleClientId = new sst.Secret("GoogleClientId");
export const googleClientSecret = new sst.Secret("GoogleClientSecret");
export const nextauthSecret = new sst.Secret("NextauthSecret");
// Set NextauthUrl after first deploy once the CloudFront URL is known
export const nextauthUrl = new sst.Secret("NextauthUrl");

// Add all secrets to this array — it is passed to every Lambda via `link`
export const allSecrets = [
  openaiApiKey,
  databaseUrl,
  databaseAuthToken,
  googleClientId,
  googleClientSecret,
  nextauthSecret,
  nextauthUrl,
];
```

---

## infra/api.ts — Standard (no native modules)

```typescript
import { allSecrets } from "./secrets.js";

const api = new sst.aws.Function("Api", {
  handler: "infra/functions/api.handler",
  runtime: "nodejs22.x",
  timeout: "30 seconds",
  memory: "512 MB",
  link: allSecrets,
  url: true,
});

export const apiUrl = api.url;
```

---

## infra/api.ts — With nodejs.install for Native Modules

Use when `@libsql/client` or `better-sqlite3` is detected in packages:

```typescript
import { allSecrets } from "./secrets.js";

// Native modules must be installed in Lambda (not bundled by esbuild)
// so that npm resolves the correct Linux binary at deploy time.
const nodeConfig = {
  nodejs: {
    install: ["@libsql/client"],  // add "better-sqlite3" if also detected
    esbuild: {
      // Exclude browser-only or unsupported deps from the Lambda bundle
      external: ["playwright", "playwright-core", "chromium-bidi"],
    },
  },
} as const;

const api = new sst.aws.Function("Api", {
  handler: "infra/functions/api.handler",
  runtime: "nodejs22.x",
  timeout: "30 seconds",
  memory: "512 MB",
  link: allSecrets,
  url: true,
  ...nodeConfig,
});

export const apiUrl = api.url;
```

---

## infra/functions/api.ts — Lambda Handler with Resource Bridging

```typescript
import { handle } from "hono/aws-lambda";
import { Resource } from "sst";
import app from "../../packages/api/src/app.js";

// Bridge SST secrets to process.env so app packages can use process.env
// without depending on SST at runtime. Add one line per secret.
process.env.DATABASE_URL ??= Resource.DatabaseUrl.value;
process.env.DATABASE_AUTH_TOKEN ??= Resource.DatabaseAuthToken.value;
process.env.OPENAI_API_KEY ??= Resource.OpenaiApiKey.value;
// Add additional secrets as needed:
// process.env.GOOGLE_API_KEY ??= Resource.GoogleApiKey.value;

export const handler = handle(app);
```

**Key rules:**
- Import app from `../../packages/api/src/app.js` — the `.js` extension is required for ESM
- Bridge secrets before any app code executes (top of file, before other imports)
- Use `??=` (not `=`) so existing environment overrides are respected in local dev

---

## infra/frontend.ts — With Auth Env Vars

Use when Next.js + Google OAuth / NextAuth is detected:

```typescript
import { apiUrl } from "./api.js";
import { googleClientId, googleClientSecret, nextauthSecret, nextauthUrl } from "./secrets.js";

const frontend = new sst.aws.Nextjs("Frontend", {
  path: "packages/ui",
  environment: {
    // Stack output — not a secret, passed as plain string
    NEXT_PUBLIC_API_URL: apiUrl,
    // Auth secrets — pass the `.value` string, not the secret object
    NEXTAUTH_SECRET: nextauthSecret.value,
    NEXTAUTH_URL: nextauthUrl.value,
    GOOGLE_CLIENT_ID: googleClientId.value,
    GOOGLE_CLIENT_SECRET: googleClientSecret.value,
  },
});

export const frontendUrl = frontend.url;
```

---

## infra/frontend.ts — Without Auth (API URL Only)

Use when Next.js exists but no auth vars were detected:

```typescript
import { apiUrl } from "./api.js";

const frontend = new sst.aws.Nextjs("Frontend", {
  path: "packages/ui",
  environment: {
    NEXT_PUBLIC_API_URL: apiUrl,
  },
});

export const frontendUrl = frontend.url;
```

---

## infra/pipeline.ts — Queue + Cron Pattern

Use when the user confirms a background pipeline with both SQS queue and scheduled jobs:

```typescript
import { allSecrets } from "./secrets.js";

const pipelineNodeConfig = {
  nodejs: {
    install: ["@libsql/client"],
    esbuild: {
      external: ["playwright", "playwright-core", "chromium-bidi"],
    },
  },
};

// SQS queue for async processing jobs
const jobQueue = new sst.aws.Queue("JobQueue", {
  visibilityTimeout: "15 minutes",
});

// Consumer Lambda — processes one job per SQS message
jobQueue.subscribe(
  {
    handler: "infra/functions/worker.handler",
    runtime: "nodejs22.x",
    timeout: "15 minutes",
    memory: "1024 MB",
    link: allSecrets,
    ...pipelineNodeConfig,
  },
  {
    batch: { size: 1 },
  },
);

// Scheduled Lambda — runs on cron
new sst.aws.Cron("DailyJob", {
  schedule: "rate(1 day)",
  job: {
    handler: "infra/functions/scheduler.handler",
    runtime: "nodejs22.x",
    timeout: "5 minutes",
    memory: "256 MB",
    environment: {
      JOB_QUEUE_URL: jobQueue.url,
    },
    ...pipelineNodeConfig,
  },
});

export { jobQueue };
```

---

## infra/pipeline.ts — Cron-Only Pattern

Use when the user confirms a scheduled pipeline but no queue:

```typescript
import { allSecrets } from "./secrets.js";

new sst.aws.Cron("DailyJob", {
  schedule: "rate(1 day)",
  function: {
    handler: "infra/functions/worker.handler",
    runtime: "nodejs22.x",
    timeout: "15 minutes",
    memory: "1024 MB",
    link: allSecrets,
  },
});
```

---

## infra/tsconfig.json

```json
{
  "extends": "../tsconfig.json",
  "include": ["**/*.ts", "../sst.config.ts"]
}
```

---

## infra/CLAUDE.md

```markdown
# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this directory.

## Overview

SST v3 (Ion) infrastructure for deploying the project to AWS. All resources are defined as TypeScript modules under `infra/`, imported by `sst.config.ts` at the repo root.

## Commands

\`\`\`bash
bun run sst:dev                           # Live Lambda dev mode
bun run sst:deploy                        # Deploy current stage
bun run sst:deploy -- --stage production  # Deploy to production
bun run sst:remove                        # Tear down stack

npx sst secret set <SecretName> <value>   # Set a secret (see secrets.ts for full list)
npx sst secret list                       # List all secrets and their status
\`\`\`

## Conventions

### Module Organization

Each infra module (`secrets.ts`, `api.ts`, `pipeline.ts`, `frontend.ts`) owns a single concern. `sst.config.ts` imports them in dependency order. When adding new infrastructure, create a new module file and import it in `sst.config.ts`.

### Secret Bridging

Lambda handlers in `functions/` manually map SST secrets to environment variables so that application packages can read `process.env.*` without depending on SST at runtime. When adding a new secret:

1. Declare it in `secrets.ts` and add it to `allSecrets`
2. Add `process.env.NEW_VAR ??= Resource.NewSecret.value` in any handler that needs it

### Bundling Rules

- **Playwright/Chromium**: Always excluded from Lambda bundles via esbuild `external` — browser-based fetching is not available in Lambda
- **Native modules** (e.g. `@libsql/client`): Use `nodejs.install` (not esbuild bundling) so npm resolves the correct Linux binary at deploy time
- **Static files**: Use `copyFiles` to include non-JS assets (e.g. config YAML) in the Lambda bundle

### Stage Behavior

- Production stage retains resources on `sst remove` to prevent accidental deletion
- All other stages fully remove resources on teardown
- Each developer can use their own stage name (`npx sst dev --stage <name>`) for isolation

### Adding a New Lambda

1. Create a handler in `functions/` that imports from application packages
2. Bridge any needed secrets to `process.env` at the top of the handler
3. Define the SST resource (`sst.aws.Function`, `Queue.subscribe`, etc.) in the appropriate infra module
4. Add Playwright to esbuild externals if the handler transitively imports it
```

---

## App Export Split

### packages/api/src/app.ts — Extracted Hono App Module

Create this file to separate the Hono app from the Bun server entry point.
Move all app construction (middleware, routes, OpenAPI config) here:

```typescript
import { swaggerUI } from "@hono/swagger-ui";
import { OpenAPIHono } from "@hono/zod-openapi";
import { cors } from "hono/cors";
// import your route files here
// import { itemRoutes } from "./routes/items.js";

const app = new OpenAPIHono();

app.use("*", cors());

app.get("/health", (c) => {
  return c.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Mount route groups
// app.route("/items", itemRoutes);

app.doc("/openapi.json", {
  openapi: "3.0.0",
  info: {
    version: "0.1.0",
    title: "[Project] API",
  },
});

app.get("/ui", swaggerUI({ url: "/openapi.json" }));

app.onError((err, c) => {
  console.error("[api] Unhandled error:", err);
  return c.json({ error: "Internal server error", details: err.message }, 500);
});

export default app;
```

### packages/api/src/index.ts — Updated Bun Entry Point

After extracting `app.ts`, update `index.ts` to import the app and serve it with Bun:

```typescript
import app from "./app.js";

const port = Number(Bun.env.PORT) || 3001;

Bun.serve({
  port,
  fetch: app.fetch,
});
```

---

## Root package.json — SST Scripts Block

Add to the root `package.json` (merge into existing `scripts` and `devDependencies`):

```json
{
  "scripts": {
    "sst:dev": "sst dev",
    "sst:deploy": "sst deploy",
    "sst:remove": "sst remove"
  },
  "devDependencies": {
    "sst": "^3.0.0"
  }
}
```
