---
name: vhs-digest
description: "Generate awareness summaries and digests of VHS Berlin courses. Create weekly summaries of new courses, courses starting soon, status changes, or custom digest views. Use when the user wants a periodic overview or 'what's new this week' summary."
argument-hint: "[period: daily|weekly|monthly] [optional: custom filters]"
allowed-tools: ["Bash", "Read", "Write"]
portable: false
---

> `<plugin_dir>` = this plugin's root directory (two levels above this SKILL.md).

# VHS Digest: Awareness Summaries

Generate periodic summaries of VHS Berlin course activity based on your watches and interests. All data comes from the local SQLite database populated by watch checks and searches.

## Configuration

Read DB path from `.claude/vhs-berlin-agent.local.md` (frontmatter `db_path`), else default `~/.local/share/vhs-berlin/vhs.db`.

## Resolve bun

```bash
BUN=$(command -v bun 2>/dev/null || echo "$HOME/.bun/bin/bun")
```

## Workflow

### Digest Type: Weekly (default)

**User request:** "What's new this week?" or "Weekly VHS digest"

#### Step 1: Define time window

```
period = weekly → 7 days
period = monthly → 30 days
period = daily → 1 day
```

#### Step 2: Query the database

Run these queries using `sqlite3`:

**New courses this period:**
```bash
sqlite3 "<db_path>" "SELECT DISTINCT c.source_course_id, c.title, c.district, c.location, c.schedule_text, c.price_text, c.booking_status, c.source_url FROM courses c WHERE c.extracted_at >= datetime('now', '-7 days') ORDER BY c.extracted_at DESC LIMIT 50"
```

**Recent course events (changes):**
```bash
sqlite3 "<db_path>" "SELECT e.event_type, e.course_id, e.detected_at, w.label FROM course_events e LEFT JOIN watched_searches w ON e.watch_id = w.watch_id WHERE e.detected_at >= datetime('now', '-7 days') ORDER BY e.detected_at DESC"
```

**Active watches:**
```bash
sqlite3 "<db_path>" "SELECT watch_id, label, last_checked_at FROM watched_searches WHERE enabled=1 ORDER BY label"
```

#### Step 3: Run check if no recent data

If no courses extracted in the past period, offer to run a watch check first:
```bash
$BUN run <plugin_dir>/scripts/watch.ts check --db-path "<db_path>"
```

#### Step 4: Present the digest

```
# VHS Berlin Weekly Digest
**Week of <date range>**

## New Courses This Week (N)

### <title> — <district>
- **Where**: <location>
- **When**: <schedule_text>
- **Price**: <price_text>
- **Status**: <booking_status>
- **Link**: <source_url>

## Course Changes (N)
- <title> → new_course / disappeared (watch: <label>)

## Your Active Watches
- <label> (last checked: <date>)

**Summary**: N new courses, N changes detected.
Want to search for something specific or adjust your watches?
```

If no data:
```
No VHS course activity recorded yet.
Run a watch check first, or search for courses to populate the database.
```

---

### Digest Type: Custom

**User request:** "Show pottery classes under €100 this month"

Parse custom filters (category, price limit, time window) and translate to appropriate sqlite3 queries using the `courses` table columns: `category`, `price_text`, `district`, `start_date`, `booking_status`, `extracted_at`.

Note: `price_text` is a raw string (e.g., "€95,00") — use `CAST(REPLACE(REPLACE(price_text,'€',''),',','.') AS REAL)` to compare numerically.

---

## Tips

- **Group by watch**: Show which watch label triggered each result
- **Highlight urgency**: Surface courses starting in the next 7 days
- **Include stats**: "N new, N changes, N watches active"
- **Offer actions**: "Want to watch one of these?" or link directly to VHS site
- **If DB is empty**: Direct user to run `/vhs-berlin-agent:init` and then a search

## See Also

- `vhs-watch` skill — run check and manage watchlists
- `vhs-search` skill — find courses on demand
- `data/schema.sql` — full database schema
