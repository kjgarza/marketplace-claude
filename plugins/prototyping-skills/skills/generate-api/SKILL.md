---
name: generate-api
description: >
  This skill generates or scaffolds a Hono API package using @hono/zod-openapi with Zod
  validation and OpenAPI spec generation. It should be used when the user asks to create
  an API, add API routes, build endpoints, scaffold a REST API, work on the api package,
  or mentions Hono, OpenAPI, or API development. It also applies when the user is working
  inside a packages/api directory or mentions exposing core functionality via HTTP.
allowed-tools:
  - Bash
  - Write
  - Edit
  - Read
  - Glob
  - Grep
argument-hint: "[resource-name]"
---

# Hono API Stack

Generate code for a Hono API that runs on **Bun** and uses **@hono/zod-openapi**
for route-level schema definitions with automatic OpenAPI spec generation.

## Defaults and Deviations

These are the **team defaults**. Multiple people work on these prototypes, so consistency
matters. In **execution mode**, follow these defaults unless the project's CLAUDE.md
explicitly overrides them.

In **Plan mode**, suggest alternatives using the deviation protocol from the
`prototyping-skills:team-conventions` skill: state the default, name the alternative,
explain the trade-off, flag the blast radius, let the human decide.

## Team Defaults — Follow Unless Explicitly Overridden

1. **Framework**: Hono. Not Express, Fastify, Koa, or any other HTTP framework.
2. **Validation + OpenAPI**: `@hono/zod-openapi` with `createRoute()` + `app.openapi()`. Not `hono/validator` directly, not raw `app.get()`.
3. **URL paths**: Follow **JSON:API spec** (`https://jsonapi.org/format/`). Resource-centric, plural nouns, relationships as nested paths.
4. **Runtime**: Bun-native APIs. Not Node.js `http`, `fs`, etc. Use `Bun.env` not `process.env`.
5. **Middleware style**: Hono context (`c`), not Express-style `(req, res, next)`.
6. **Types**: From `@repo/types`. Never duplicate type definitions in the API package.
7. **Business logic**: In `@repo/core`. API handlers are thin wrappers.
8. **Linting + formatting**: Biome. No ESLint or Prettier.
9. **Database**: `bun:sqlite` when persistence is needed. Not better-sqlite3, not Prisma, not Drizzle (unless deviation approved).

## Package Setup

```
packages/api/
├── src/
│   ├── index.ts          # App entry point, mounts route groups
│   ├── routes/            # One file per resource/domain
│   │   ├── health.ts
│   │   └── [resource].ts
│   ├── middleware/         # Custom Hono middleware
│   └── lib/               # Shared utilities (error formatting, etc.)
├── package.json
└── tsconfig.json
```

**package.json** must include:
```json
{
  "type": "module",
  "scripts": {
    "dev": "bun --watch src/index.ts",
    "start": "bun src/index.ts"
  },
  "dependencies": {
    "hono": "^4",
    "@hono/zod-openapi": "^0.18",
    "zod": "^3",
    "@repo/types": "workspace:*",
    "@repo/core": "workspace:*"
  }
}
```

## JSON:API Path Conventions

Follow the [JSON:API specification](https://jsonapi.org/format/) for URL design:

| Pattern | Example | Purpose |
|---------|---------|---------|
| `/{resource}` | `/articles` | Collection (plural nouns) |
| `/{resource}/{id}` | `/articles/1` | Individual resource |
| `/{resource}/{id}/{related}` | `/articles/1/comments` | Related resources |
| `/{resource}/{id}/relationships/{relation}` | `/articles/1/relationships/author` | Relationship linkage |

**Rules:**
- Resource names are **plural, kebab-case**: `/articles`, `/blog-posts` (not `/article`, `/blogPosts`).
- No verbs in paths: use HTTP methods (`POST /articles`, not `POST /articles/create`).
- Nested resources for relationships, not deep nesting: `/articles/1/comments` (not `/authors/1/articles/2/comments`).

## Route Definition Pattern

Every route MUST use `createRoute` + `app.openapi()`. This is non-negotiable.

```typescript
import { createRoute, z } from "@hono/zod-openapi";
import { OpenAPIHono } from "@hono/zod-openapi";

const app = new OpenAPIHono();

const getItemRoute = createRoute({
  method: "get",
  path: "/items/{id}",
  request: {
    params: z.object({
      id: z.string().openapi({ description: "Item ID", example: "abc-123" }),
    }),
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z.object({ id: z.string(), name: z.string() }),
        },
      },
      description: "Item found",
    },
    404: {
      content: {
        "application/json": {
          schema: z.object({ error: z.string() }),
        },
      },
      description: "Item not found",
    },
  },
  tags: ["Items"],
});

app.openapi(getItemRoute, async (c) => {
  const { id } = c.req.valid("param");
  // Call into @repo/core for business logic
  return c.json({ id, name: "Example" }, 200);
});
```

### POST / PUT with request body:

```typescript
const createItemRoute = createRoute({
  method: "post",
  path: "/items",
  request: {
    body: {
      content: {
        "application/json": {
          schema: z.object({
            name: z.string().min(1),
            description: z.string().optional(),
          }),
        },
      },
      required: true,
    },
  },
  responses: {
    201: {
      content: {
        "application/json": {
          schema: z.object({ id: z.string(), name: z.string() }),
        },
      },
      description: "Created",
    },
  },
  tags: ["Items"],
});

app.openapi(createItemRoute, async (c) => {
  const body = c.req.valid("json");
  return c.json({ id: "new-id", name: body.name }, 201);
});
```

## Entry Point Pattern

```typescript
// src/index.ts
import { OpenAPIHono } from "@hono/zod-openapi";
import { swaggerUI } from "@hono/swagger-ui";
import { cors } from "hono/cors";
import itemRoutes from "./routes/items";
import healthRoutes from "./routes/health";

const app = new OpenAPIHono();

app.use("/*", cors());

app.route("/api", itemRoutes);
app.route("/", healthRoutes);

app.doc("/doc", {
  openapi: "3.1.0",
  info: { title: "API", version: "0.1.0" },
});

app.get("/swagger", swaggerUI({ url: "/doc" }));

export default {
  port: Bun.env.PORT ?? 3001,
  fetch: app.fetch,
};
```

## Error Handling Pattern

```typescript
import { HTTPException } from "hono/http-exception";

app.onError((err, c) => {
  if (err instanceof HTTPException) {
    return c.json({ error: err.message }, err.status);
  }
  console.error(err);
  return c.json({ error: "Internal server error" }, 500);
});
```

## Key Conventions

- Each route file exports an `OpenAPIHono` instance, mounted in `index.ts` via `app.route()`.
- Business logic lives in `@repo/core`, not in route handlers. Handlers: validate, call core, format response.
- Zod schemas for request/response go at the top of route files or in a `schemas.ts` if shared.
- Reusable Zod schemas that appear in multiple routes belong in `@repo/types` (add `.openapi()` refinements in the API package).
- Environment variables via `Bun.env.VARIABLE_NAME`, never `process.env`.
