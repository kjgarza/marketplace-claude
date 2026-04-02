---
name: generate-mcp
description: >
  This skill generates or scaffolds an MCP (Model Context Protocol) server package using
  the official @modelcontextprotocol/sdk. It should be used when the user asks to create
  an MCP server, add MCP tools, expose functionality via MCP, build a Model Context
  Protocol integration, or work inside a packages/mcp directory. It also applies when
  the user mentions "MCP", "tool for Claude", "tool for AI", "Claude integration", or
  wants to make core functionality available to LLM agents.
allowed-tools:
  - Bash
  - Write
  - Edit
  - Read
  - Glob
  - Grep
  - TaskCreate
argument-hint: "[tool-name]"
---

# MCP Server Stack

Generate an MCP server using the **official `@modelcontextprotocol/sdk`** package
running on **Bun**. The server exposes core package functionality as MCP tools.

## Defaults and Deviations

These are **team defaults**. In **execution mode**, follow them unless the project CLAUDE.md
overrides them. In **Plan mode**, suggest alternatives using the deviation protocol from
the `prototyping-skills:team-conventions` skill: state the default, name the alternative,
explain the trade-off, flag the blast radius, let the human decide.

## Team Defaults — Follow Unless Explicitly Overridden

1. **SDK**: `@modelcontextprotocol/sdk`. Not a custom implementation.
2. **Transport**: stdio for local use. Not HTTP/REST (that's what the API package is for).
3. **Runtime**: Bun. Use `Bun.env` not `process.env`.
4. **Business logic**: In `@repo/core`. MCP tool handlers are thin wrappers.
5. **Types**: From `@repo/types`. Never duplicate.
6. **Validation**: Zod schemas with `.describe()` on every parameter.

## Package Setup

```
packages/mcp/
├── src/
│   ├── index.ts          # Server entry point, transport setup
│   ├── tools/            # One file per tool or tool group
│   │   └── [tool-name].ts
│   └── lib/              # Shared utilities
├── package.json
└── tsconfig.json
```

**package.json** must include:
```json
{
  "type": "module",
  "bin": {
    "mcp-server": "./src/index.ts"
  },
  "scripts": {
    "dev": "bun --watch src/index.ts",
    "start": "bun src/index.ts",
    "inspect": "bunx @modelcontextprotocol/inspector bun src/index.ts"
  },
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1",
    "zod": "^3",
    "@repo/types": "workspace:*",
    "@repo/core": "workspace:*"
  }
}
```

## Server Setup Pattern

```typescript
// src/index.ts
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerItemTools } from "./tools/items";

const server = new McpServer({
  name: "my-prototype-mcp",
  version: "0.1.0",
});

registerItemTools(server);

const transport = new StdioServerTransport();
await server.connect(transport);
```

## Tool Definition Pattern

Each tool file registers tools on the server instance using Zod schemas for input validation:

```typescript
// src/tools/items.ts
import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getItem, listItems, createItem } from "@repo/core";

export function registerItemTools(server: McpServer) {

  server.tool(
    "list-items",
    "List all items, optionally filtered by status",
    {
      status: z.enum(["active", "archived"]).optional()
        .describe("Filter by item status"),
      limit: z.number().min(1).max(100).default(20)
        .describe("Maximum number of items to return"),
    },
    async ({ status, limit }) => {
      const items = await listItems({ status, limit });
      return {
        content: [{ type: "text", text: JSON.stringify(items, null, 2) }],
      };
    }
  );

  server.tool(
    "get-item",
    "Get a single item by its ID",
    {
      id: z.string().describe("The item ID to retrieve"),
    },
    async ({ id }) => {
      const item = await getItem(id);
      if (!item) {
        return {
          content: [{ type: "text", text: `Item not found: ${id}` }],
          isError: true,
        };
      }
      return {
        content: [{ type: "text", text: JSON.stringify(item, null, 2) }],
      };
    }
  );

  server.tool(
    "create-item",
    "Create a new item with the given name and optional description",
    {
      name: z.string().min(1).describe("Name for the new item"),
      description: z.string().optional().describe("Optional description"),
    },
    async ({ name, description }) => {
      const item = await createItem({ name, description });
      return {
        content: [{ type: "text", text: JSON.stringify(item, null, 2) }],
      };
    }
  );
}
```

## Resource Definition Pattern (for exposing readable data)

```typescript
server.resource(
  "config",
  "config://app",
  "Current application configuration",
  async (uri) => ({
    contents: [
      {
        uri: uri.href,
        mimeType: "application/json",
        text: JSON.stringify(getConfig(), null, 2),
      },
    ],
  })
);
```

## Actor Pattern — Critical Rules

When using the actor pattern in `@repo/core` (e.g., domain entities powered by `provide()`),
these rules are **non-negotiable**:

### 1. ALL actor methods MUST be called inside `provide()` callback

```typescript
// WRONG — will throw or return undefined
const data = Entity.validate(rawData);
const summary = Entity.getSummary();

// CORRECT — always wrap in provide()
const result = Entity.provide(Entity.validate(rawData), () => ({
  summary: Entity.getSummary(),
  count: Entity.getCount(),
}));
```

### 2. Export actors with aliases to avoid type conflicts

```typescript
// In actors/index.ts
export { Entity as EntityActor } from "./entity";

// In parent index.ts
export { EntityActor } from "./actors";
```

### 3. Use `.passthrough()` in Zod schemas for API responses

API and MCP responses from external sources may include fields not in your schema.
Always use `.passthrough()` to avoid silently stripping data:

```typescript
export const EntitySchema = z.object({
  id: z.string(),
  name: z.string(),
}).passthrough();
```

### 4. Always validate before providing

```typescript
// CORRECT — validate first, then provide
Entity.provide(Entity.validate(data), () => {
  // safe to call actor methods here
});

// WRONG — providing unvalidated data
Entity.provide(data, () => { /* ... */ });
```

### Actor Pattern in MCP Tool Handlers

When an MCP tool wraps a core actor, follow this pattern:

```typescript
server.tool(
  "get-entity-summary",
  "Get a summary of the entity including computed fields",
  {
    id: z.string().describe("The entity ID"),
  },
  async ({ id }) => {
    const raw = await fetchEntity(id);
    const result = EntityActor.provide(EntityActor.validate(raw), () => ({
      summary: EntityActor.getSummary(),
      stats: EntityActor.getStats(),
    }));
    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
    };
  }
);
```

## Key Conventions

- **Tool names use kebab-case**: `list-items`, `get-item`, `create-item`.
- **Tool descriptions are written for an LLM audience.** Be specific about what the tool does, what it returns, and when to use it.
- **Zod `.describe()` on every parameter.** This becomes the parameter description in the MCP schema — LLMs rely on it heavily.
- **Zod `.passthrough()`** on schemas used for external API responses — never silently drop fields.
- **Return structured JSON as text content.** Always `JSON.stringify` with pretty-printing.
- **Error handling**: Return `{ isError: true }` with a descriptive message. Never throw unhandled exceptions.
- **One tool group per file.** Group related tools (CRUD for a resource) in the same file.
- **The MCP package is a thin wrapper.** All logic lives in `@repo/core`. Tool handlers: ~5-15 lines.
- **Actor methods only inside `provide()`.** This is the single most common mistake — never call actor methods outside the callback.

## Transport Architecture

The MCP server always uses **stdio transport** locally. The UI never connects to it directly.

- **Local dev**: MCP server is a stdio process. The **Hono API** (`packages/api`, port `3001`) wraps it and exposes REST endpoints. The Next.js UI fetches from `http://localhost:3001/api/...` — not from stdio.
- **Production**: Deploy the MCP server with an **HTTP/SSE transport** (e.g., via an MCP host or reverse proxy). The Hono layer is still the HTTP interface the UI consumes.

```
UI (Next.js :3000)  →  Hono API (:3001)  →  MCP stdio process  →  @repo/core
```

Never try to connect a browser or Next.js server directly to a stdio MCP process.

## Testing with MCP Inspector

Test the MCP server using:
```bash
cd packages/mcp
bun run inspect
```

This opens the MCP Inspector UI where tools can be tested interactively.

## Verification Checklist

After scaffolding, create these tasks to confirm the MCP server and its HTTP wrapper are working.

**MCP Inspector check — create after registering tools:**

```
TaskCreate({
  subject: "Verify MCP tools with Inspector",
  description: "Run: cd packages/mcp && bun run inspect\nIn the Inspector UI: list available tools, call each tool with sample inputs, confirm JSON responses are correct and match expected schema."
})
```

**API curl check — create after the Hono API layer is scaffolded:**

```
TaskCreate({
  subject: "Verify API endpoints with curl",
  description: "Run these commands and confirm JSON responses:\n  curl http://localhost:3001/api/[resource] | python3 -m json.tool\n  curl -X POST http://localhost:3001/api/[resource] -H 'Content-Type: application/json' -d '{}' | python3 -m json.tool\nExpect: 200 responses with valid JSON. Fix any 404/500 before the UI consumes these routes."
})
```

## Claude Desktop / Claude Code Configuration

To use this MCP server locally, add to `claude_desktop_config.json` or `.mcp.json`:

```json
{
  "mcpServers": {
    "my-prototype": {
      "command": "bun",
      "args": ["packages/mcp/src/index.ts"],
      "cwd": "/path/to/monorepo"
    }
  }
}
```
