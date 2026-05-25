---
name: vhs-digest
description: "Generate awareness summaries and digests of VHS Berlin courses. Create weekly summaries of new courses, courses starting soon, status changes, or custom digest views. Use when the user wants a periodic overview or 'what's new this week' summary."
argument-hint: "[period: daily|weekly|monthly] [optional: custom filters]"
allowed-tools: ["Read", "Bash", "mcp__sqlite__read_query", "mcp__sqlite__list_tables"]
---

# VHS Digest: Awareness Summaries

Generate periodic summaries of VHS Berlin course activity based on your watches and interests.

## Workflow

### Digest Type: Weekly

**User request:** "What's new this week?" or "Weekly digest"

#### Step 1: Define Time Window
```
start_date = today - 7 days
end_date = today
```

#### Step 2: Query New Courses
Find courses extracted within the time window that match your active watches:

```sql
SELECT DISTINCT c.*
FROM courses c
JOIN snapshots s ON json_extract(s.result_course_ids, '$') LIKE '%' || c.source_course_id || '%'
JOIN watched_searches w ON s.watch_id = w.watch_id
WHERE w.enabled = 1
  AND c.extracted_at >= date('now', '-7 days')
  AND c.extracted_at <= date('now')
ORDER BY c.start_date ASC;
```

#### Step 3: Query Recent Changes
Find events logged in the past week:

```sql
SELECT e.*, c.title, c.district, c.location, w.label AS watch_label
FROM course_events e
LEFT JOIN courses c ON e.course_id = c.source_course_id
LEFT JOIN watched_searches w ON e.watch_id = w.watch_id
WHERE e.detected_at >= date('now', '-7 days')
ORDER BY e.detected_at DESC;
```

#### Step 4: Query Starting Soon
Find courses starting in the next 2 weeks:

```sql
SELECT c.*
FROM courses c
JOIN snapshots s ON json_extract(s.result_course_ids, '$') LIKE '%' || c.source_course_id || '%'
JOIN watched_searches w ON s.watch_id = w.watch_id
WHERE w.enabled = 1
  AND c.start_date >= date('now')
  AND c.start_date <= date('now', '+14 days')
ORDER BY c.start_date ASC;
```

#### Step 5: Present Digest

```
# VHS Berlin Weekly Digest
**Week of April 14-18, 2026**

---

## 🆕 New Courses This Week (5)

### Deutsch B1.2 Intensiv — Mitte
- **Where**: VHS Linienstraße
- **When**: May 20 – Jul 15, Mon-Fri 09:00-12:15
- **Price**: €280
- **Status**: Anmeldung möglich
- **Watch**: B1 German evening Mitte
- **Link**: [View](...)

### Töpfern für Anfänger — Pankow
- **Where**: VHS Pankow, Schulstraße
- **When**: May 10 – Jun 21, Sat 10:00-14:00
- **Price**: €95
- **Status**: Anmeldung möglich
- **Watch**: Pottery weekend classes
- **Link**: [View](...)

---

## 📅 Starting Soon (Next 2 Weeks)

- **May 1**: Spanisch A2 Konversation (Neukölln)
- **May 6**: Aquarellmalerei (Charlottenburg)
- **May 8**: Python Programmierung (Mitte)

---

## 🔄 Status Changes (3)

- **Deutsch B1 Kompakt** (Mitte) → now open for registration (was waitlist)
- **Yoga Anfänger** (Tempelhof) → waitlist (was open)
- **Keramik Workshop** (Friedrichshain) → fully booked (was open)

---

## ❌ No Longer Available (1)

- **Deutsch B1 Wochenende** (Mitte) — removed from listing

---

**Summary**: 5 new courses, 3 status changes, 3 courses starting soon.
Want to adjust your watches or search for something specific?
```

If nothing new:
```
# VHS Berlin Weekly Digest
**Week of April 14-18, 2026**

No new courses or changes this week matching your active watches.

**Your active watches:**
- B1 German evening Mitte
- Pottery weekend classes

Want to add more watches or explore different topics?
```

---

### Digest Type: Monthly

**User request:** "Monthly summary" or "What happened this month?"

Similar to weekly, but with 30-day window.

---

### Digest Type: Custom

**User request:** "Show me pottery classes that appeared this month under €100"

#### Step 1: Parse Custom Filters
Extract:
- Time window: "this month"
- Category: "pottery"
- Price limit: "under €100"

#### Step 2: Build Custom Query
```sql
SELECT c.*
FROM courses c
WHERE c.category LIKE '%töpfern%' OR c.category LIKE '%keramik%'
  AND cast(replace(replace(c.price_text, '€', ''), ',', '.') AS REAL) < 100
  AND c.extracted_at >= date('now', 'start of month')
ORDER BY c.start_date ASC;
```

#### Step 3: Present Results

---

## Digest Delivery Options

### On-Demand
User asks "Weekly digest" → generate and return immediately.

### Scheduled (Future Enhancement)
Set up a cron job or periodic task to:
1. Generate digest automatically
2. Send via notification channel (Telegram, email, etc.)

For now, focus on on-demand generation.

---

## Tips

- **Group by watch**: Show which watch triggered each result
- **Highlight urgency**: "Starting this week" or "Last chance to register"
- **Include stats**: "5 new, 3 changes, 1 removed"
- **Offer actions**: "Want to watch one of these?" or "Shall I open the booking page?"

## See Also

- `vhs-watch` skill (for managing watches)
- `vhs-search` skill (for finding specific courses)
- `data/schema.sql` (for query structure)
