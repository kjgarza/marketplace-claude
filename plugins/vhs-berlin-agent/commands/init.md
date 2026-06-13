---
name: init
description: Initialize the VHS Berlin agent database. Creates the SQLite DB at the configured path and confirms the schema is ready.
argument-hint: "[db_path=~/.local/share/vhs-berlin/vhs.db]"
allowed-tools: ["Read", "Write", "Edit", "Bash"]
---

# Initialize VHS Berlin Agent

Set up the VHS Berlin agent database so that `vhs-search`, `vhs-watch`, and `vhs-digest` skills can store and query course data.

## Steps

### Step 1: Resolve configuration

Parse `$ARGUMENTS` for an optional `db_path=<value>` argument.

Default: `~/.local/share/vhs-berlin/vhs.db`

Also check `.claude/vhs-berlin-agent.local.md` for a `db_path` frontmatter field:

```yaml
---
db_path: /path/to/vhs.db
---
```

Argument > config file > default.

### Step 2: Resolve bun

Before running any script, resolve the bun executable once:

```bash
BUN=$(command -v bun 2>/dev/null || echo "$HOME/.bun/bin/bun")
```

Use `$BUN` in all subsequent script invocations. This prevents silent failures in non-interactive shells.

### Step 3: Initialize database

```bash
$BUN run ${CLAUDE_PLUGIN_ROOT}/scripts/init-db.ts --db-path "<resolved_db_path>"
```

The script:
- Creates the directory if it does not exist
- Creates the SQLite database file
- Applies the schema from `data/schema.sql` (idempotent — safe to run again)

### Step 4: Confirm

Report the resolved db path and confirm the database is ready. Suggest next steps:

```
VHS Berlin Agent initialized.
Database: ~/.local/share/vhs-berlin/vhs.db

Next steps:
  - Search: "Find A2 German evening courses in Neukölln"
  - Watch:  "Watch B1 German evening Mitte"
  - Digest: "Weekly VHS digest"
```