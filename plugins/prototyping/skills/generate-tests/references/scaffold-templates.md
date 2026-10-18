# Test Scaffold Templates

These are the exact file contents to generate when scaffolding test infrastructure.
Generate only for packages that exist in the monorepo.

## Core Package

### packages/core/tests/helpers.ts

```typescript
import { expect } from "bun:test";

export function createTestContext() {
  return {
    // Add shared test state factories here
  };
}
```

### packages/core/tests/index.test.ts

```typescript
import { describe, test, expect } from "bun:test";

describe("core", () => {
  test("placeholder — replace with real tests", () => {
    expect(true).toBe(true);
  });
});
```

## API Package (Hono)

### packages/api/tests/helpers.ts

```typescript
import { type OpenAPIHono } from "@hono/zod-openapi";

/**
 * Create a test client for a Hono app.
 * Uses Bun's native fetch against the app's request handler.
 */
export function createTestClient(app: OpenAPIHono) {
  return {
    async get(path: string) {
      return app.request(path, { method: "GET" });
    },
    async post(path: string, body: unknown) {
      return app.request(path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    },
    async put(path: string, body: unknown) {
      return app.request(path, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    },
    async delete(path: string) {
      return app.request(path, { method: "DELETE" });
    },
  };
}
```

### packages/api/tests/routes/health.test.ts

```typescript
import { describe, test, expect } from "bun:test";
import app from "../../src/index";
import { createTestClient } from "../helpers";

const client = createTestClient(app);

describe("GET /health", () => {
  test("returns 200 with status ok", async () => {
    const res = await client.get("/health");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("ok");
  });
});
```

## MCP Package

### packages/mcp/tests/helpers.ts

```typescript
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

/**
 * Create a test client connected to an MCP server via in-memory transport.
 */
export async function createTestMcpClient(server: McpServer) {
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();

  const client = new Client({ name: "test-client", version: "0.1.0" });
  await Promise.all([
    client.connect(clientTransport),
    server.connect(serverTransport),
  ]);

  return client;
}
```

### packages/mcp/tests/tools/example.test.ts

```typescript
import { describe, test, expect } from "bun:test";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { createTestMcpClient } from "../helpers";

describe("MCP tools", () => {
  test("placeholder — replace with real tool tests", async () => {
    const server = new McpServer({ name: "test", version: "0.1.0" });
    // Register tools on server here
    const client = await createTestMcpClient(server);
    const tools = await client.listTools();
    expect(tools.tools).toBeDefined();
  });
});
```

## UI Package

### packages/ui/tests/helpers.ts

```typescript
// UI test helpers — add React Testing Library setup here when needed
// For prototypes, prefer API and core tests over UI unit tests
```

## Types Package

### packages/types/tests/schemas.test.ts

```typescript
import { describe, test, expect } from "bun:test";
// Import schemas from the types package
// import { ItemSchema } from "../src";

describe("schemas", () => {
  test("placeholder — validate schemas parse correctly", () => {
    expect(true).toBe(true);
  });
});
```
