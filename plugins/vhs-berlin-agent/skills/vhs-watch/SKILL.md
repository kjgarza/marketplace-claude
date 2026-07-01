---
name: vhs-watch
description: "Monitor VHS Berlin courses and searches for changes. Save watchlists, check for updates, and get notified when course availability changes. Use when the user wants to track specific courses or searches over time."
argument-hint: "[action: save|check|list|remove] [query or watch ID]"
allowed-tools: ["Bash", "Read", "Write"]
portable: false
---

> `<plugin_dir>` = this plugin's root directory (two levels above this SKILL.md).

# VHS Watch: Monitoring & Watchlists

Track VHS Berlin courses and searches for changes over time using deterministic bun scripts.

## Configuration

Read DB path from `.claude/vhs-berlin-agent.local.md` (frontmatter `db_path`), else default `~/.local/share/vhs-berlin/vhs.db`.

## Resolve bun

```bash
BUN=$(command -v bun 2>/dev/null || echo "$HOME/.bun/bin/bun")
```

Ensure the DB is initialized before any watch command:
```bash
$BUN run <plugin_dir>/scripts/init-db.ts --db-path "<db_path>"
```

---

### Action: Save a Watch

**User request:** "Watch this search" or "Monitor B1 German courses in Mitte"

#### Step 1: Build query-json

Parse the user's query into a JSON object with fields: `district`, `category`, `level`, `time`, `keyword`.

Example: `{"district":"Mitte","category":"German","level":"B1","time":"evening"}`

#### Step 2: Run watch save

```bash
$BUN run <plugin_dir>/scripts/watch.ts save \
  --db-path "<db_path>" \
  --label "B1 German evening Mitte" \
  --query-json '{"district":"Mitte","category":"German","level":"B1","time":"evening"}'
```

The script saves the watch, runs an initial search, and stores a baseline snapshot. It outputs JSON with `{watch_id, label, course_count, url}`.

#### Step 3: Confirm

```
Saved watch: "B1 German evening Mitte" (watch #3)
Found N matching courses on initial check.
```

---

### Action: Check Watches

**User request:** "Check my watches" or "Any updates?"

```bash
$BUN run <plugin_dir>/scripts/watch.ts check \
  --db-path "<db_path>"
```

The script:
1. Loads all enabled watches
2. Re-runs each search (fetch + parse)
3. Compares current course IDs vs the latest snapshot (SHA-256 of sorted IDs)
4. Writes `course_events` for new / disappeared courses
5. Writes a new snapshot
6. Returns JSON: `[{watch_id, label, new_courses, removed, current_count}]`

Present changes:

```
## Updates for "B1 German evening Mitte"

**New courses (2):**
- Deutsch B1.2 Intensiv — Mitte, starts May 20
- Deutsch B1 Abendkurs — Mitte, starts Jun 1

**No longer listed (1):**
- course ID xyz removed

**No changes in 2 other watches.**
```

If `new_courses` and `removed` are both empty for all watches:
```
No changes detected in your N active watches.
```

---

### Action: List Watches

**User request:** "Show my watches" or "What am I monitoring?"

```bash
$BUN run <plugin_dir>/scripts/watch.ts list \
  --db-path "<db_path>"
```

Parse the JSON and present:

```
## Your Watches

1. **B1 German evening Mitte** (active, watch #1)
   - Created: Apr 12, 2026
   - Last checked: Apr 18, 2026

2. **Pottery weekend classes** (active, watch #2)
   - Created: Apr 5, 2026
   - Last checked: never
```

---

### Action: Remove a Watch

**User request:** "Stop watching B1 German" or "Remove watch #2"

```bash
$BUN run <plugin_dir>/scripts/watch.ts remove \
  --db-path "<db_path>" \
  --watch-id <N>
```

Confirm:
```
Removed watch: "B1 German evening Mitte" (watch #N)
```

---

## Tips

- **Check frequency**: Daily or weekly — avoid hammering the VHS site hourly
- **Change detection**: SHA-256 hash of sorted course IDs for fast snapshot comparison
- **Pause vs. remove**: The DB stores `enabled` flag — offer to disable instead of delete
- **Verification failures**: If the search script returns `verification.ok: false`, report that explicitly rather than showing empty results

## See Also

- `vhs-search` skill — run one-off searches
- `vhs-digest` skill — weekly summaries
- `data/schema.sql` — database structure
