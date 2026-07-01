---
name: vhs-search
description: "Search VHS Berlin courses using natural language. Converts queries like 'Find A2 German evening courses in Neukölln' into structured VHS searches, extracts results, and presents them in a clean format. Use when the user wants to find specific VHS Berlin courses."
argument-hint: "[natural language search query]"
allowed-tools: ["Bash", "Read", "Write"]
portable: false
---

> `<plugin_dir>` = this plugin's root directory (two levels above this SKILL.md).

# VHS Berlin Course Search

Convert natural language queries into VHS Berlin course searches, run deterministic fetch+parse scripts, and present results cleanly.

## Configuration

Read DB path from `.claude/vhs-berlin-agent.local.md` (frontmatter `db_path`), else default `~/.local/share/vhs-berlin/vhs.db`.

## Resolve bun

```bash
BUN=$(command -v bun 2>/dev/null || echo "$HOME/.bun/bin/bun")
```

## Workflow

### Step 1: Parse the user query

Extract structured parameters from the natural language query and build a `query-json` object:

| Field | Examples |
|-------|---------|
| `district` | "Mitte", "Neukölln", "Pankow" |
| `category` | "German", "pottery", "yoga", "cooking" |
| `level` | "A1", "A2", "B1", "B2" (language courses) |
| `time` | "evening", "morning", "weekend" |
| `keyword` | free-text search term |
| `max_price` | numeric (e.g. 90) |

Example JSON for "Find A2 German evening courses in Neukölln":
```json
{"district": "Neukölln", "category": "German", "level": "A2", "time": "evening"}
```

### Step 2: Run search script

```bash
$BUN run <plugin_dir>/scripts/search.ts \
  --query-json '{"district":"Neukölln","category":"German","level":"A2"}' \
  --db-path "<db_path>" \
  --limit 20
```

The script:
1. Reads `config/query-registry.yaml` to build the VHS search URL
2. Fetches via direct HTTP (tier 1) or Jina reader fallback (tier 2)
3. Parses course links with cheerio
4. Upserts results into the SQLite DB (if initialized)
5. Outputs JSON: `{courses, url, tier, via?, verification}`

### Step 3: Handle verification result

Check `verification.ok` in the output:

- `ok: true` → parse courses and present them
- `ok: false` → report the `reason` explicitly:
  ```
  ⚠️ VHS search completed but 0 courses parsed.
  Reason: <reason from script>
  Search URL: <url>
  Suggest opening: https://vhsit.berlin.de/VHSKURSE/BusinessPages/CourseList.aspx
  ```

Never silently return empty results. If the script reports a verification failure, surface it.

### Step 4: Check for special registration rules

After parsing, check each course title/category against `config/extraction-rules.yaml` patterns:

- **Integration courses** (Integrationskurs, Alphabetisierung): consultation required — warn the user before they try to book online
- **Language courses with A1/A2/B1/B2**: placement test may be required
- **Seniorenkurs / für Frauen**: eligibility restrictions may apply

### Step 5: Present results

```
## Found N matching courses

### Deutsch als Fremdsprache A2.2 — Mitte
- **Where**: VHS Linienstraße
- **When**: [schedule_text]
- **Price**: [price_text]
- **Status**: [booking_status]
- **Link**: [source_url]

---

**Want to watch this search for changes?** Say "Watch this search" to save it.
```

If no courses found (verification ok but 0 results): suggest broadening the search or checking the VHS website directly.

## See Also

- `vhs-watch` skill — save and monitor searches
- `vhs-digest` skill — weekly summaries
- `config/query-registry.yaml` — URL patterns and district codes
- `config/extraction-rules.yaml` — registration rule patterns
