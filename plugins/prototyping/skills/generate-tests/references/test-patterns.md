# Detailed Test Patterns for bun:test

## bun:test Core API

```typescript
import { describe, test, expect, beforeAll, afterAll, beforeEach, afterEach, mock } from "bun:test";
```

## Database Test Setup (bun:sqlite)

When the prototype uses `bun:sqlite`, set up an in-memory database for tests:

```typescript
// packages/core/tests/helpers.ts
import { Database } from "bun:sqlite";

export function createTestDb() {
  const db = new Database(":memory:");
  // Run migrations or schema setup
  db.run(`
    CREATE TABLE items (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      dateCreated TEXT NOT NULL
    )
  `);
  return db;
}

export function seedTestDb(db: Database) {
  const insert = db.prepare("INSERT INTO items (id, name, dateCreated) VALUES (?, ?, ?)");
  insert.run("item-1", "Test Item", new Date().toISOString());
  return db;
}
```

```typescript
// packages/core/tests/items.test.ts
import { describe, test, expect, beforeEach } from "bun:test";
import { Database } from "bun:sqlite";
import { createTestDb, seedTestDb } from "./helpers";

let db: Database;

beforeEach(() => {
  db = seedTestDb(createTestDb());
});

describe("items", () => {
  test("lists all items", () => {
    const items = db.query("SELECT * FROM items").all();
    expect(items).toHaveLength(1);
  });
});
```

## Hono API Testing Patterns

### Testing Route Responses

```typescript
import { describe, test, expect } from "bun:test";
import app from "../../src/index";

describe("GET /api/items", () => {
  test("returns JSON array", async () => {
    const res = await app.request("/api/items");
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("application/json");
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
  });

  test("returns 404 for unknown route", async () => {
    const res = await app.request("/api/nonexistent");
    expect(res.status).toBe(404);
  });
});
```

### Testing POST with Body

```typescript
describe("POST /api/items", () => {
  test("creates item and returns 201", async () => {
    const res = await app.request("/api/items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "New Item" }),
    });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.name).toBe("New Item");
    expect(body.id).toBeDefined();
  });

  test("returns 400 for invalid body", async () => {
    const res = await app.request("/api/items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    expect(res.status).toBe(400);
  });
});
```

### Testing with Middleware

```typescript
describe("CORS", () => {
  test("includes CORS headers", async () => {
    const res = await app.request("/api/items", {
      method: "OPTIONS",
      headers: { Origin: "http://localhost:3000" },
    });
    expect(res.headers.get("access-control-allow-origin")).toBeDefined();
  });
});
```

## MCP Tool Testing Patterns

### Testing Individual Tools

```typescript
import { describe, test, expect } from "bun:test";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { createTestMcpClient } from "../helpers";
import { registerItemTools } from "../../src/tools/items";

describe("item tools", () => {
  test("list-items returns items", async () => {
    const server = new McpServer({ name: "test", version: "0.1.0" });
    registerItemTools(server);
    const client = await createTestMcpClient(server);

    const result = await client.callTool({ name: "list-items", arguments: {} });
    expect(result.content).toBeDefined();
    expect(result.content[0].type).toBe("text");
    const items = JSON.parse(result.content[0].text);
    expect(Array.isArray(items)).toBe(true);
  });

  test("get-item returns error for missing item", async () => {
    const server = new McpServer({ name: "test", version: "0.1.0" });
    registerItemTools(server);
    const client = await createTestMcpClient(server);

    const result = await client.callTool({
      name: "get-item",
      arguments: { id: "nonexistent" },
    });
    expect(result.isError).toBe(true);
  });
});
```

## Mocking Patterns

### Mock Functions

```typescript
import { test, expect, mock } from "bun:test";

const fetchData = mock(() => Promise.resolve({ id: "1", name: "Test" }));

test("calls fetch", async () => {
  await fetchData();
  expect(fetchData).toHaveBeenCalledTimes(1);
});
```

### Mock Modules

```typescript
import { test, expect, mock } from "bun:test";

mock.module("@repo/core", () => ({
  listItems: () => [{ id: "1", name: "Mocked" }],
}));

// Now imports from @repo/core return mocked values
```

## Async Patterns

```typescript
import { describe, test, expect } from "bun:test";

describe("async operations", () => {
  test("resolves with expected value", async () => {
    const result = await someAsyncFn();
    expect(result).toBe("expected");
  });

  test("rejects with error", () => {
    expect(failingAsyncFn()).rejects.toThrow("expected error");
  });
});
```

## Snapshot Testing

```typescript
import { test, expect } from "bun:test";

test("matches snapshot", () => {
  const output = generateSomething();
  expect(output).toMatchSnapshot();
});
```

Run `bun test --update-snapshots` to update snapshot files.

## Zod Schema Testing

```typescript
import { describe, test, expect } from "bun:test";
import { ItemSchema } from "@repo/types";

describe("ItemSchema", () => {
  test("parses valid item", () => {
    const valid = {
      id: "item-1",
      name: "Test",
      dateCreated: "2026-01-01T00:00:00.000Z",
    };
    expect(() => ItemSchema.parse(valid)).not.toThrow();
  });

  test("rejects missing name", () => {
    const invalid = { id: "item-1", dateCreated: "2026-01-01T00:00:00.000Z" };
    expect(() => ItemSchema.parse(invalid)).toThrow();
  });

  test("rejects invalid datetime", () => {
    const invalid = { id: "item-1", name: "Test", dateCreated: "not-a-date" };
    expect(() => ItemSchema.parse(invalid)).toThrow();
  });
});
```

## Test Organization Best Practices

1. **One test file per source file**: `src/items.ts` → `tests/items.test.ts`
2. **Mirror directory structure**: `src/routes/health.ts` → `tests/routes/health.test.ts`
3. **Shared helpers in `tests/helpers.ts`**: Factory functions, test DB setup, test clients
4. **Describe blocks match module structure**: Use `describe("functionName", ...)` for each exported function
5. **Test names describe behavior**: "returns 404 for unknown route", not "test GET"
