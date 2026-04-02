---
name: development-workflow
description: >
  This skill bridges the gap between scaffolding and active development. It should be
  used when the user says "start development", "begin building", "ready to code",
  "what's next after scaffolding", "what do I do now", "development checklist",
  "start coding", "how do I start", "check readiness", "run development checks",
  or "readiness report". It also applies when the user has just finished scaffolding
  with init-prototype and wants to begin building features.
allowed-tools:
  - Bash
  - Read
  - Glob
  - Grep
  - Skill
---

# Development Workflow Bridge

Run automated checks on the current prototype monorepo and present an actionable
development checklist. This skill connects the scaffolding phase to active development
by verifying readiness and prescribing the correct skill chain.

## Step 0: Verify Monorepo

First verify `packages/` exists. If not, inform the user this skill requires a monorepo
scaffolded by `prototyping-skills:init-prototype` and suggest running that skill first.

## Step 1: Assess Current State

Run these checks automatically:

### Detect packages

```bash
ls packages/
```

### Check test infrastructure per package

For each detected package, check if `tests/` directory exists:

```bash
for pkg in packages/*/; do
  name=$(basename "$pkg")
  if [ -d "$pkg/tests" ]; then
    count=$(find "$pkg/tests" -name "*.test.ts" | wc -l)
    echo "$name: $count test files"
  else
    echo "$name: NO TEST INFRASTRUCTURE"
  fi
done
```

### Run existing tests

```bash
bun test 2>&1 || echo "Tests failed or no tests found"
```

### Check lint status

```bash
bunx @biomejs/biome check . 2>&1 | tail -5
```

### Check CI configuration

```bash
if [ -f .github/workflows/ci.yml ]; then
  echo "CI: configured"
  grep -q "bun test" .github/workflows/ci.yml && echo "CI includes tests" || echo "CI MISSING test step"
else
  echo "CI: NOT CONFIGURED"
fi
```

## Step 2: Report Findings

Present results as a readiness report:

```
## Development Readiness Report

### Packages Detected
List each package found by `ls packages/` with its status. Only include packages that exist.

### Test Infrastructure
- [package]: [X test files | NO TESTS]

### Lint Status
- [pass/fail with summary]

### CI
- [configured with tests | configured without tests | not configured]
```

## Step 3: Recommend Actions

Based on findings, recommend specific actions:

### Missing test infrastructure

If any package lacks a `tests/` directory:

> Run `prototyping-skills:generate-tests` to scaffold test infrastructure for packages missing tests.

### No test files

If test directories exist but contain no `.test.ts` files:

> Start with `superpowers:test-driven-development` to write tests alongside new features.

### Lint failures

If Biome reports issues:

> Run `bun run fix` to auto-fix lint and formatting issues before starting development.

### CI missing test step

If `.github/workflows/ci.yml` lacks `bun test`:

> Add `- run: bun test` to the CI workflow to gate merges on passing tests.

## Step 4: Present the Development Workflow

After reporting state, present the prescribed workflow:

```
## Prescribed Development Workflow

### Adding a Feature
1. Write tests first — use `superpowers:test-driven-development`
2. Implement the feature in the appropriate package
3. Run `code-simplifier:simplify` before committing (enforced by pre-commit hook)
4. Run `superpowers:verification-before-completion` to verify completeness
5. Run `superpowers:requesting-code-review` before merging

### After a Burst Session
Before merging, run the full verification chain:
1. `bun check` (Biome lint + format)
2. `bun test` (all packages)
3. `superpowers:verification-before-completion`
4. `superpowers:requesting-code-review`
```

## Step 5: Quick-Reference Skill Map

Present available skills by development phase:

```
## Available Skills by Phase

### Planning
- `superpowers:writing-plans` — Structure implementation plans
- `superpowers:brainstorming` — Explore ideas and approaches

### Building
- `superpowers:test-driven-development` — TDD workflow (write test → implement → refactor)
- `superpowers:dispatching-parallel-agents` — Parallelize independent tasks
- `prototyping-skills:generate-api` — Add API routes
- `prototyping-skills:generate-ui` — Add UI pages/components
- `prototyping-skills:generate-mcp` — Add MCP tools

### Finishing
- `code-simplifier:simplify` — Review code for quality and efficiency
- `superpowers:verification-before-completion` — Verify work is complete
- `superpowers:requesting-code-review` — Get code review before merge
- `superpowers:finishing-a-development-branch` — PR/merge/cleanup workflow
```

## Behavior

This skill is **active, not passive**. When triggered:

1. Immediately run the assessment checks (Step 1)
2. Present the readiness report (Step 2)
3. Recommend specific actions based on findings (Step 3)
4. Always show the prescribed workflow and skill map (Steps 4-5)
5. Ask the user what they want to build first
