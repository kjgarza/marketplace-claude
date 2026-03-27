---
name: status
description: >
  Show the current status of ReadItLater bookmarks and digests. Use this skill when the user runs
  /readitlater-digest:status or asks about bookmark counts, digest history, unprocessed bookmarks,
  reading backlog, or "how many bookmarks do I have".
allowed-tools: ["Bash", "Read"]
---

# ReadItLater Status

Show a quick status report of bookmarks and digests.

## Configuration

Read settings from `.claude/readitlater-digest.local.md` to get `vault_path`. If the file doesn't exist, ask the user for their vault path.

Derive: `db_path` = `<vault_path>/.readitlater-digest.db`

If the database doesn't exist, report "No database found — run /readitlater-digest:digest first to initialize."

## Report

Run:

```bash
bun run ${CLAUDE_PLUGIN_ROOT}/scripts/cleanup.ts status --db-path "<db_path>"
```

Format the JSON output as a readable summary:

```
ReadItLater Status
──────────────────
Total bookmarks: <N>
  Unprocessed:   <N>
  Processed:     <N>
  Archived:      <N>
  Duplicates:    <N>

Digests generated: <N>
Last digest:       <week> (<bookmark_count> bookmarks)

Top domains:
  1. <domain> (<count>)
  2. <domain> (<count>)
  ...
```

If there are unprocessed bookmarks, suggest running `/readitlater-digest:digest`.
