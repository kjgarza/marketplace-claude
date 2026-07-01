---
name: generate-infra
description: >
  This skill generates SST v3 (Ion) infrastructure for deploying a Bun monorepo prototype
  to AWS. It should be used when the user asks to deploy the prototype, add infrastructure,
  set up SST, configure AWS deployment, add Lambda functions, set up a production environment,
  or mentions "sst", "deploy to AWS", "infrastructure", "production deploy", "Lambda",
  "CloudFront", or "SST v3". It also applies when the user says "make this deployable",
  "I want to deploy this", or "set up cloud deployment."
argument-hint: "[stage]"
allowed-tools:
  - Bash
  - Write
  - Edit
  - Read
  - Glob
  - Grep
  - AskUserQuestion
  - TaskCreate
---

# SST v3 Infrastructure Stack

Wire up a Bun monorepo prototype for AWS deployment using **SST v3 (Ion)**. Lambda
functions run **nodejs22.x** (not Bun — Bun is the local dev/build runtime only).
Hono apps bridge to Lambda via `hono/aws-lambda`. Infrastructure modules live in
`infra/` and are imported by `sst.config.ts` at the repo root.

## Defaults and Deviations

These are **team defaults**. In **execution mode**, follow them unless the project
CLAUDE.md explicitly overrides them.

In **Plan mode**, apply the deviation protocol from `prototyping-skills:team-conventions`:
state the default, name the alternative, explain the trade-off, flag the blast radius,
let the human decide.

Key defaults:
- **SST version**: v3 (Ion) — not SST v2
- **Lambda runtime**: `nodejs22.x` — never `bun` or `nodejs18.x`
- **Secrets**: `sst.Secret` for all sensitive vars — never plaintext in infra files
- **Removal policy**: `retain` for production, `remove` for all other stages
- **Env bridging**: Bridge `Resource.<X>.value` to `process.env.X` at handler top — app packages read `process.env` or `Bun.env`, not SST at runtime

## Pre-flight Checklist

Run ALL of these checks **before generating any file**:

1. **Detect packages**: `ls packages/` — record which of `api`, `ui`, `core`, `mcp` exist
2. **Detect UI framework**: `grep '"next"' packages/ui/package.json 2>/dev/null` — only generate `infra/frontend.ts` if Next.js is confirmed
3. **Detect env vars**: `cat .env.example 2>/dev/null` then grep for `Bun.env.` and `process.env.` across all packages — build the full list of secrets to declare
4. **Detect native modules**: `grep -r '@libsql/client\|better-sqlite3' packages/*/package.json 2>/dev/null` — add `nodejs.install` if found
5. **Pipeline gate** — ask the user (multiple-choice): _"Does this project have a background processing pipeline? (queue-based jobs, scheduled Lambda functions, cron workers)"_
6. **App name gate** — ask the user (multiple-choice): _"What is the SST app name? (kebab-case, e.g. 'my-prototype') This becomes the CloudFormation stack prefix."_

## App Export Split (Critical)

Every project built with `init-prototype` has `packages/api/src/index.ts` exporting:
`export default { port, fetch: app.fetch }`. Lambda cannot use this — it needs a Hono
`app` exported from a separate module. Detect before generating infra:

```bash
grep -l "export default.*fetch" packages/api/src/index.ts
```

If found:
1. Create `packages/api/src/app.ts` — move the Hono app construction and all route mounts here, add `export default app`
2. Update `packages/api/src/index.ts` — import `app` from `./app.js` (`.js` required for ESM), keep only the Bun server entry (`Bun.serve({ port, fetch: app.fetch })`)

See `references/sst-patterns.md` → **App Export Split** for full file templates.

## Step-by-Step Execution

Execute all steps in order. Skip steps whose conditions aren't met (e.g. skip Step 7 if no Next.js).

**Step 1 — Root package.json scripts**

Add `"sst": "^3.0.0"` to root `package.json` devDependencies. Add scripts:
```json
"sst:dev": "sst dev",
"sst:deploy": "sst deploy",
"sst:remove": "sst remove"
```

**Step 2 — `infra/secrets.ts`**

Convert all detected env vars to `sst.Secret()` declarations. Conversion rule:
`SNAKE_CASE` → PascalCase per segment (`OPENAI_API_KEY` → `OpenaiApiKey`).
Add all to the `allSecrets` array and export it.
Exclusions: `NEXT_PUBLIC_*`, `PORT`, `NODE_ENV`.

See **Secret Name Conversion Table** below and `references/sst-patterns.md` → **infra/secrets.ts**.

**Step 3 — `sst.config.ts`**

Always generate. Import only the infra modules that were actually generated.
Set `removal: input?.stage === "production" ? "retain" : "remove"`. Use the app
name provided by the user in Step 0.

See `references/sst-patterns.md` → **sst.config.ts**.

**Step 4 — App export split**

Run the detection from **App Export Split** above. Create `app.ts` and fix `index.ts`
if needed. This must be done before generating infra handler files.

**Step 5 — `infra/api.ts`** _(if `packages/api` exists)_

Generate `sst.aws.Function("Api", ...)` with runtime `nodejs22.x`, timeout `30 seconds`,
memory `512 MB`, `link: allSecrets`, `url: true`. Add `nodejs.install` for native deps
if detected in pre-flight. Export `apiUrl`.

See `references/sst-patterns.md` → **infra/api.ts**.

**Step 6 — `infra/functions/api.ts`** _(if `packages/api` exists)_

Generate the Lambda handler: import `handle` from `hono/aws-lambda` and the Hono app
from `../../packages/api/src/app.js` (`.js` extension required for ESM). Bridge all
detected secrets to `process.env` using `??=`. Export `handler`.

See `references/sst-patterns.md` → **infra/functions/api.ts**.

**Step 7 — `infra/frontend.ts`** _(if Next.js confirmed)_

Generate `sst.aws.Nextjs("Frontend", { path: "packages/ui", environment: {...} })`.
`NEXT_PUBLIC_API_URL` gets `apiUrl` (stack output — not a secret). Auth vars
(`NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`)
get `.value` from their secrets. Export `frontendUrl`.

See `references/sst-patterns.md` → **infra/frontend.ts**.

**Step 8 — `infra/pipeline.ts`** _(only if user confirmed pipeline)_

Ask the user a follow-up (multiple-choice): _"What triggers the pipeline — a queue (SQS),
a schedule (cron), or both?"_ Then generate the appropriate pattern.

See `references/sst-patterns.md` → **infra/pipeline.ts**.

**Step 9 — `infra/tsconfig.json`**

Always generate. Extends `../tsconfig.json`, includes `["**/*.ts", "../sst.config.ts"]`.

**Step 10 — `infra/CLAUDE.md`**

Always generate. Document secret-bridging convention, bundling rules, stage behavior,
how to add new Lambdas, and SST commands.

See `references/sst-patterns.md` → **infra/CLAUDE.md** for exact content.

## Secret Name Conversion Table

| Env Var | SST Secret Name |
|---------|-----------------|
| `OPENAI_API_KEY` | `OpenaiApiKey` |
| `GOOGLE_API_KEY` | `GoogleApiKey` |
| `GOOGLE_CLIENT_ID` | `GoogleClientId` |
| `GOOGLE_CLIENT_SECRET` | `GoogleClientSecret` |
| `NEXTAUTH_SECRET` | `NextauthSecret` |
| `NEXTAUTH_URL` | `NextauthUrl` |
| `DATABASE_URL` | `DatabaseUrl` |
| `DATABASE_AUTH_TOKEN` | `DatabaseAuthToken` |
| `JINA_API_KEY` | `JinaApiKey` |
| `GOOGLE_CX` | `GoogleCx` |

Rule: split on `_`, capitalize first letter of each word, join. `GOOGLE_CX` → `GoogleCx`.

## Anti-Patterns

- **Never** hardcode secrets in infra files — always use `sst.Secret`
- **Never** use `Bun.env` in Lambda handlers — use `process.env` (bridged via `??=`)
- **Never** bundle native modules (`@libsql/client`, `better-sqlite3`) with esbuild — use `nodejs.install`
- **Never** use `sst.aws.Function` for Next.js — use `sst.aws.Nextjs`
- **Never** omit the removal policy — always set `removal` in `sst.config.ts`
- **Never** import from application packages without `.js` extension in Lambda handlers — ESM requires explicit extensions

## Verification Checklist

After generating all files, run the TypeScript check:

```bash
bunx tsc --noEmit -p infra/tsconfig.json
```

Fix any type errors before proceeding. Then create this task:

```
TaskCreate({
  subject: "Verify SST infrastructure before first deploy",
  description: "1. Set all secrets: npx sst secret set <Name> <value> — see infra/secrets.ts for full list\n2. bun run sst:dev — confirm API URL is printed\n3. curl <API_URL>/health — confirm 200 response\n4. If frontend: confirm CloudFront URL loads\n5. bun run sst:remove to tear down dev stack when done"
})
```
