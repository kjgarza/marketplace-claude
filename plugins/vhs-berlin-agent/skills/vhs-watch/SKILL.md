---
name: vhs-watch
description: "Monitor VHS Berlin courses and searches for changes. Save watchlists, check for updates, and get notified when course status, prices, or availability changes. Use when the user wants to track specific courses or searches over time."
argument-hint: "[action: save|check|list|remove] [query or watch ID]"
allowed-tools: ["Read", "Bash", "WebFetch", "mcp__sqlite__read_query", "mcp__sqlite__write_query", "mcp__sqlite__create_table", "mcp__sqlite__list_tables", "mcp__browser__browser_navigate", "mcp__browser__browser_snapshot"]
---

# VHS Watch: Monitoring & Watchlists

Track VHS Berlin courses and searches for changes over time.

## Workflow

### Action: Save a Watch

**User request:** "Watch this search" or "Monitor B1 German courses in Mitte"

#### Step 1: Capture the Query
Extract:
- User-friendly label (e.g., "B1 German evening Mitte")
- Query type: `natural_language`, `course_id`, `district_location`, `keyword`
- Query payload (JSON):
  ```json
  {
    "text": "B1 German evening courses in Mitte",
    "parsed": {
      "district": "mitte",
      "category": "german",
      "level": "B1",
      "time": "evening"
    }
  }
  ```

#### Step 2: Store the Watch
```sql
INSERT INTO watched_searches (label, query_type, query_payload, created_at, enabled)
VALUES (
  'B1 German evening Mitte',
  'natural_language',
  '{"text": "...", "parsed": {...}}',
  datetime('now'),
  1
);
```

#### Step 3: Take Initial Snapshot
Run the search immediately using `vhs-search` skill, then store the baseline:

```sql
INSERT INTO snapshots (watch_id, extracted_at, result_hash, result_count, result_course_ids)
VALUES (
  last_insert_rowid(),
  datetime('now'),
  'sha256_of_sorted_ids',
  5,
  '["VHS-12345", "VHS-12346", ...]'
);
```

#### Step 4: Confirm
```
✅ Saved watch: "B1 German evening Mitte"
Found 5 matching courses. I'll check for changes when you ask.
```

---

### Action: Check Watches

**User request:** "Check my watches" or "Any updates?"

#### Step 1: Load Active Watches
```sql
SELECT watch_id, label, query_type, query_payload, last_checked_at
FROM watched_searches
WHERE enabled = 1
ORDER BY last_checked_at ASC NULLS FIRST;
```

#### Step 2: For Each Watch, Refresh Results
Re-run the search using `vhs-search` skill or direct query.

#### Step 3: Compare with Last Snapshot
```sql
SELECT result_course_ids
FROM snapshots
WHERE watch_id = ?
ORDER BY extracted_at DESC
LIMIT 1;
```

Parse the JSON arrays and compare:
- **New courses**: IDs in current but not in previous
- **Disappeared courses**: IDs in previous but not in current
- **Still present**: IDs in both

For still-present courses, check if details changed:
```sql
SELECT source_course_id, booking_status, price_text, start_date
FROM courses
WHERE source_course_id IN (...)
ORDER BY extracted_at DESC;
```

Compare latest vs. previous:
- Booking status change
- Price change
- Date change

#### Step 4: Log Events
For each detected change:
```sql
INSERT INTO course_events (course_id, event_type, old_value, new_value, detected_at, watch_id)
VALUES (
  'VHS-12345',
  'status_change',
  '{"booking_status": "Warteliste"}',
  '{"booking_status": "Anmeldung möglich"}',
  datetime('now'),
  ?
);
```

#### Step 5: Store New Snapshot
```sql
INSERT INTO snapshots (watch_id, extracted_at, result_hash, result_count, result_course_ids)
VALUES (...);
```

Update the watch:
```sql
UPDATE watched_searches
SET last_checked_at = datetime('now')
WHERE watch_id = ?;
```

#### Step 6: Report Changes
```
## Updates for "B1 German evening Mitte"

**New courses (2):**
- Deutsch B1.2 Intensiv — Mitte, VHS Linienstraße, starts May 20
- Deutsch B1 Abendkurs — Mitte, VHS Antonstraße, starts Jun 1

**Status changes (1):**
- "Deutsch B1.1 Kompakt" — now open for registration (was waitlist)

**No longer available (1):**
- "Deutsch B1 Wochenende" — removed from listing
```

If no changes:
```
✅ No changes detected in your 3 active watches.
Last checked: 2 days ago
```

---

### Action: List Watches

**User request:** "Show my watches" or "What am I monitoring?"

```sql
SELECT watch_id, label, query_type, created_at, last_checked_at, enabled
FROM watched_searches
ORDER BY created_at DESC;
```

Present:
```
## Your Watches

1. **B1 German evening Mitte** (active)
   - Created: Apr 12, 2026
   - Last checked: Apr 18, 2026 (5 courses)

2. **Pottery weekend classes** (active)
   - Created: Apr 5, 2026
   - Last checked: never

3. **Spanish A2 Neukölln** (paused)
   - Created: Mar 20, 2026
   - Last checked: Apr 1, 2026
```

---

### Action: Remove a Watch

**User request:** "Stop watching B1 German" or "Remove watch #2"

```sql
DELETE FROM watched_searches
WHERE watch_id = ? OR label LIKE '%...%';
```

Confirm:
```
✅ Removed watch: "B1 German evening Mitte"
```

---

## Tips

- **Check frequency**: Recommend checking daily or weekly, not every hour (to avoid hammering VHS site)
- **Change detection**: SHA-256 hash of sorted course IDs for fast snapshot comparison
- **Event logging**: Keep a permanent log of changes for historical reference
- **Pause vs. delete**: Offer to pause watches instead of deleting (can resume later)

## See Also

- `vhs-search` skill (for running the actual searches)
- `vhs-digest` skill (for weekly summaries)
- `data/schema.sql` (for database structure)
