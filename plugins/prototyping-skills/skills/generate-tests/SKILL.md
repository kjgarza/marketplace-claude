---
name: generate-tests
description: >
  This skill scaffolds test infrastructure for a prototype monorepo. It should be used
  when the user asks to "set up tests", "add test infrastructure", "scaffold tests",
  "generate tests", "write tests", "create test files", "add testing", or after running
  init-prototype, generate-api, or generate-mcp. It also applies when the user mentions
  "bun:test", "test setup", "test helpers", "test patterns", or "missing tests".
allowed-tools:
  - Bash
  - Write
  - Edit
  - Read
  - Glob
  - Grep
argument-hint: "[package-name]"
---

# Test Infrastructure Scaffolder

Scaffold test infrastructure for a prototype monorepo. Detect which packages exist
and generate appropriate test setup for each.

## Auto-Detection

Before scaffolding, detect the existing package structure:

1. List directories in `packages/` to identify which packages exist
2. For each package, read `package.json` to determine its type (api, core, mcp, ui, types)
3. Scaffold test infrastructure only for detected packages

## Test Directory Structure

Mirror the source structure within each package:

```
packages/
├── core/
│   └── tests/
│       ├── helpers.ts          # Shared test utilities for core
│       └── index.test.ts       # Example test file
├── api/
│   └── tests/
│       ├── helpers.ts          # Hono test client factory
│       └── routes/
│           └── health.test.ts  # Example route test
├── mcp/
│   └── tests/
│       ├── helpers.ts          # MCP mock transport
│       └── tools/
│           └── example.test.ts # Example tool test
├── ui/
│   └── tests/
│       └── helpers.ts          # React testing utilities
└── types/
    └── tests/
        └── schemas.test.ts     # Schema validation tests
```

## Package-Specific Test Patterns

For each detected package, scaffold the appropriate test helpers and example tests.
Read **`references/scaffold-templates.md`** for the exact file contents to generate.

| Package | Test Helper | What It Provides |
|---------|------------|------------------|
| **core** | `tests/helpers.ts` | Shared test context factory |
| **api** | `tests/helpers.ts` | `createTestClient(app)` — Hono test client using `app.request()` |
| **mcp** | `tests/helpers.ts` | `createTestMcpClient(server)` — MCP client via `InMemoryTransport` |
| **ui** | `tests/helpers.ts` | Placeholder for React Testing Library setup |
| **types** | `tests/schemas.test.ts` | Zod schema validation tests |

Each package also gets an example `.test.ts` file demonstrating the correct bun:test patterns for that package type.

## Root Configuration Updates

### Add test scripts to root package.json

Ensure the root `package.json` has:

```json
{
  "scripts": {
    "test": "bun test",
    "test:watch": "bun test --watch"
  }
}
```

### Add test recipes to justfile

Append if not already present:

```makefile
# Run all tests
test:
    bun test

# Run tests in watch mode
test-watch:
    bun test --watch

# Run tests for a specific package
test-pkg pkg:
    cd packages/{{pkg}} && bun test
```

## Per-Package CLAUDE.md Updates

After scaffolding tests, append a **Testing** section to each package's `CLAUDE.md`:

```markdown
## Testing

- Test files live in `tests/` mirroring the source structure
- Run tests: `bun test` (from package or root)
- Use `superpowers:test-driven-development` when adding new features
- Minimum: one test file per source file with business logic
```

## CI Integration

Verify that `.github/workflows/ci.yml` includes `bun test`. If not, add it.

## Chaining

After scaffolding test infrastructure, inform the user:

- Use `superpowers:test-driven-development` for the TDD workflow when building features
- Run `bun test` before every commit
- The `development-workflow` skill provides a full checklist bridging scaffolding to development

## Additional Resources

### Reference Files

For detailed test patterns and scaffolding templates, consult:
- **`references/scaffold-templates.md`** — Exact file contents to generate per package type
- **`references/test-patterns.md`** — Advanced bun:test patterns: database setup, mocking, snapshots, async, Zod schema testing
