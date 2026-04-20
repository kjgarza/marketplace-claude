---
name: vhs-search
description: "Search VHS Berlin courses using natural language. Converts queries like 'Find A2 German evening courses in Neukölln' into structured VHS searches, extracts results, and presents them in a clean format. Use when the user wants to find specific VHS Berlin courses."
argument-hint: "[natural language search query]"
allowed-tools: ["Read", "Bash", "WebSearch", "WebFetch", "Agent", "mcp__browser__browser_navigate", "mcp__browser__browser_snapshot", "mcp__browser__browser_get_page_text", "mcp__sqlite__read_query", "mcp__sqlite__write_query", "mcp__sqlite__create_table", "mcp__sqlite__list_tables"]
---

# VHS Berlin Course Search

Convert natural language queries into VHS Berlin course searches, extract structured results, and present them cleanly.

## Workflow

### Step 1: Parse the User Query

Extract structured parameters from the natural language query:

**Location/District**: Mitte, Pankow, Neukölln, Tempelhof-Schöneberg, Charlottenburg-Wilmersdorf, Spandau, Steglitz-Zehlendorf, Treptow-Köpenick, Marzahn-Hellersdorf, Lichtenberg, Reinickendorf, Friedrichshain-Kreuzberg

**Category/Topic**: German language, integration courses, pottery, art, cooking, career, health, languages (Spanish, English, French, etc.), digital skills, crafts, music, dance, etc.

**Time**: morning, afternoon, evening, weekend, weekdays, specific day (Monday, Tuesday, etc.)

**Level** (for language courses): A1, A2, B1, B2, C1, C2

**Format**: online, in-person, hybrid

**Price range**: under €X, between €X and €Y

**Start date**: next month, this month, specific date range

**Course ID** (if user provides one): direct course lookup

### Step 2: Build Search Query

Check `config/query-registry.yaml` for known URL patterns and parameters.

**Priority order:**
1. **Direct course ID** → use `id=` parameter if available
2. **District + location** → use `direkt=1&bezirk=...&lehrstaette=...` if validated
3. **Keyword search** → use `stichw=` if pattern exists
4. **Browser-driven search** → navigate to VHS search page and fill form

Load `config/query-registry.yaml`:

```yaml
base_url: https://vhsit.berlin.de
patterns:
  direct_course:
    template: "{{base_url}}/VHSKURSE/...?id={{course_id}}"
    confidence: verified
    tested_at: "2026-04-18"
  
  district_location:
    template: "{{base_url}}/VHSKURSE/...?direkt=1&bezirk={{district_code}}&lehrstaette={{location_code}}"
    confidence: likely
    tested_at: "2026-04-18"
  
  keyword_search:
    template: "{{base_url}}/VHSKURSE/...?stichw={{keyword}}"
    confidence: observed
    tested_at: null
    note: "Seen in public snippets, not fully validated"

districts:
  mitte: {code: "01", variants: ["Mitte", "Berlin-Mitte"]}
  pankow: {code: "03", variants: ["Pankow"]}
  neukoelln: {code: "08", variants: ["Neukölln", "Neukoelln"]}
  # ... (complete list in actual file)
```

### Step 3: Execute Search

**Before fetching any course URL**, check qurl first:
```bash
qurl get "<vhs_course_url>"
```
- Exit 0: use cached course data, skip fetch. Course pages are stable for weeks.
- Exit 1: fetch the URL, then index:
```bash
echo "<fetched_content>" | qurl add "<vhs_course_url>" --source vhs-berlin \
  --tags "<level>,<district>,<category>"
```
To search cached courses: `qurl query "A2 German Mitte evening" --source vhs-berlin`

#### Option A: URL-driven (preferred)
```bash
curl -s "{{constructed_url}}" | extract_courses
```

#### Option B: Browser-driven (fallback)
Use Browser MCP to:
1. Navigate to VHS search page
2. Detect page type from `config/page-map.yaml`
3. Fill search form
4. Extract results

Load `config/page-map.yaml`:

```yaml
pages:
  search_form:
    url_pattern: "vhsit.berlin.de/VHSKURSE.*suche"
    identifier: "form.search-form"
    fields:
      keyword: "input[name='stichw']"
      district: "select[name='bezirk']"
      category: "select[name='kategorie']"
    submit: "button[type='submit']"
    verified_at: "2026-04-18"
  
  results_list:
    url_pattern: "vhsit.berlin.de/VHSKURSE.*ergebnisse"
    identifier: ".course-list"
    item_selector: ".course-item"
    fields:
      title: "h3.course-title"
      course_id: "a.course-link@href"
      district: ".course-district"
      location: ".course-location"
      dates: ".course-dates"
      price: ".course-price"
      status: ".booking-status"
    pagination: ".pagination a.next"
    verified_at: "2026-04-18"
  
  course_detail:
    url_pattern: "vhsit.berlin.de/VHSKURSE.*id="
    identifier: ".course-detail"
    # ... (extraction rules for detail page)
```

### Step 4: Extract and Normalize Results

Use `scripts/normalize-course.js` to structure the data:

```javascript
{
  source_url: "https://vhsit.berlin.de/...",
  source_course_id: "VHS-12345",
  title: "Deutsch als Fremdsprache A2.2",
  district: "Mitte",
  location: "VHS Linienstraße",
  category: "Sprachen > Deutsch",
  level: "A2",
  start_date: "2026-05-15",
  end_date: "2026-07-20",
  schedule_text: "Mo+Mi 18:00-20:15",
  price_text: "€135",
  booking_status: "Anmeldung möglich",
  special_rules: null,  // or "Beratung erforderlich"
  extracted_at: "2026-04-18T17:30:00Z",
  raw_hash: "sha256..."
}
```

### Step 5: Check for Special Registration Rules

If the course category matches known consultation-required patterns, surface the rule:

**Integration courses**: "Registration only possible after personal consultation and assessment"
**German language courses** (certain types): May require placement test

Check `config/extraction-rules.yaml` for rule patterns.

### Step 6: Store Results (Optional)

If the query seems reusable or the user wants to watch it, offer to save:

```sql
INSERT INTO courses (...) VALUES (...);
INSERT INTO watched_searches (label, query_type, query_payload, created_at)
VALUES ('A2 German evening Neukölln', 'natural_language', '{"text": "..."}', datetime('now'));
```

Use SQLite MCP:
```
mcp__sqlite__write_query("INSERT INTO courses ...")
mcp__sqlite__create_table("CREATE TABLE IF NOT EXISTS ...")  # on first use
```

### Step 7: Present Results

Return a clean summary:

```
## Found 5 matching courses:

### Deutsch als Fremdsprache A2.2 — Mitte
- **Where**: VHS Linienstraße
- **When**: May 15 – Jul 20, Mon+Wed 18:00-20:15
- **Price**: €135
- **Status**: Anmeldung möglich
- **Link**: [View details](https://vhsit.berlin.de/VHSKURSE/...)

### Deutsch Intensivkurs A2 — Neukölln
- **Where**: VHS Neukölln, Boddinstraße
- **When**: May 20 – Jun 28, Mon-Fri 09:00-12:15
- **Price**: €210
- **Status**: Warteliste
- **Link**: [View details](...)

---

**Want to watch this search for changes?** Let me know and I'll save it as a watchlist item.
```

### Step 8: Handle Errors Gracefully

If selectors fail or the page structure changed:

```
⚠️ Some course details could not be verified from the live page.
The VHS website structure may have changed.
I recommend opening the live search page for confirmation:
[Open VHS search](https://vhsit.berlin.de/...)

**What I could extract:**
- Found 3 course titles
- Locations and dates incomplete
- Booking status unavailable
```

---

## Tips

- **URL-first**: Try direct URLs before browser automation
- **Page map is your friend**: Always check `page-map.yaml` before scraping
- **Confidence levels**: Mark query params as verified / likely / observed
- **Selector fallbacks**: If primary selector fails, try secondary
- **Timestamps**: Always record `extracted_at` for freshness tracking
- **Special rules**: Surface consultation-required courses early

## See Also

- `vhs-watch` skill for monitoring saved searches
- `vhs-digest` skill for awareness summaries
- `config/query-registry.yaml` for URL patterns
- `config/page-map.yaml` for page structure
- `config/extraction-rules.yaml` for special rules
