# Plan: Refactor find-events SKILL.md — Extract Reference Files

## Context

`plugins/berlin-events/skills/find-events/SKILL.md` is 312 lines. The plugin rules say to split when
approaching 500 lines, and the user notes that the full logical content (including all embedded blocks)
is effectively over 500 lines of dense material competing with conversation history every time the
skill loads. Two sections are clear extraction candidates with no loss of workflow integrity:

1. **Step 5 — qurl command table + relevance-filter logic** (~48 lines): The 3-row command comparison
   table and the detailed month-token derivation rules are reference material consulted only when
   something goes wrong. The actual commands in the workflow are short bash snippets that can stay.

2. **Step 7.6 — Weather Scoring** (~64 lines): The indoor/outdoor keyword lists, score-mode vs.
   legacy-filter-mode details, and the formatted weather-note examples are reference. The bash snippet
   and the high-level directive ("apply deltas, check drop flags") can stay.

Step 9's output template (~38 lines) is short and genuinely imperative — keep it.

---

## Approach

### Files to create

**`plugins/berlin-events/skills/find-events/references/qurl-search.md`**

Move from SKILL.md Step 5:
- The 3-column command behavior table (BM25 vs alias vs vsearch)
- The vsearch grep pipeline with the full host list
- The relevance-filter token derivation rules (MONTH_NAMES, MONTH_NUMS, YEAR, keyword lists)

**`plugins/berlin-events/skills/find-events/references/weather-scoring.md`**

Move from SKILL.md Step 7.6:
- The script output shape (JSON example)
- The "Apply weather to ranking (score mode)" 5-step algorithm
- Indoor/outdoor keyword classification lists
- The lake suggestion injection rule
- Legacy filter mode description
- The weather-note header format with examples

---

### File to modify

**`plugins/berlin-events/skills/find-events/SKILL.md`**

**Step 5 replacement** (keep the tool-note warning and the `qurl search` snippet; add reference pointer):

```markdown
### Step 5: Search with qurl query

> **Tool note — use `qurl`, NOT `qmd`.** This pipeline searches the `qurl` event-scrape database.
> `qmd` is a different engine over your markdown notes and will return nothing relevant.

Run a **short (3–5 word) BM25 query** first; fall back to `vsearch` if fewer than 5 hits.
Full command comparison, flag behaviour, and relevance-filter token derivation:
→ **`references/qurl-search.md`**

```bash
qurl search "Berlin art exhibition opening" --source berlin-events --limit 20
```

Relevance-filter results against date/event keywords. If fewer than 5 relevant hits, proceed to
Step 5b.
```

**Step 7.6 replacement** (keep the bash snippet; add reference pointer):

```markdown
### Step 7.6: Weather Scoring

Run the weather script for the date range. Pass `--config` if the settings file has a `weather`
block; omit it otherwise.

```bash
BUN=$(command -v bun 2>/dev/null || echo "$HOME/.bun/bin/bun")
PLUGIN_ROOT="${CLAUDE_PLUGIN_ROOT:-plugins/berlin-events}"
WEATHER_CFG_JSON=$($BUN run "$PLUGIN_ROOT/scripts/read-weather-config.ts" .claude/berlin-events.local.md 2>/dev/null || echo "")
if [ -n "$WEATHER_CFG_JSON" ]; then
  WEATHER_JSON=$($BUN run "$PLUGIN_ROOT/scripts/weather-gate.ts" --from "$DATE_FROM" --to "$DATE_TO" --config "$WEATHER_CFG_JSON")
else
  WEATHER_JSON=$($BUN run "$PLUGIN_ROOT/scripts/weather-gate.ts" --from "$DATE_FROM" --to "$DATE_TO")
fi
```

Classify each event as indoor/outdoor, apply `outdoor_delta`/`indoor_delta` per day, and honour
`drop_outdoor` as a hard removal. For full keyword lists, scoring algorithm, lake-suggestion rule,
and weather-note header format:
→ **`references/weather-scoring.md`**
```

---

### Step 9 — calendar add formats (also extractable)

Step 9's output template structure (the `## [Day]` / `### [Event Name]` block) is genuinely
imperative and stays. But the **Google Calendar link format** (compact ISO 8601 dates explanation
+ URL template) and the **gogcli create command** example (~15 lines) are reference material
consulted only when building a calendar link. Extract to `references/calendar-add.md`.

**Step 9 replacement** (keep template structure and summary line; add reference pointer):

```markdown
After ranking, output events grouped by date using the template structure below. For the exact
Google Calendar URL format (compact ISO 8601) and the gogcli `calendar create` command:
→ **`references/calendar-add.md`**

## [Day, Date]

### [Event Name]
- **What**: [Brief description]
- **Where**: [Venue, Neighborhood] — [travel context]
- **When**: [Time]
- **Category**: Art | Food
- **Link**: [URL]
- **Calendar conflict**: None | "Conflicts with [existing event] at [time]"
- **Add to calendar**: [link or command — see references/calendar-add.md]
```

(The "After presenting" record-shown-events bash snippet stays in SKILL.md — it's imperative, not reference.)

---

## Critical Files

| File | Action |
|------|--------|
| `plugins/berlin-events/skills/find-events/SKILL.md` | Modify — replace Steps 5, 7.6, and 9 calendar formats with summaries + reference pointers |
| `plugins/berlin-events/skills/find-events/references/qurl-search.md` | Create |
| `plugins/berlin-events/skills/find-events/references/weather-scoring.md` | Create |
| `plugins/berlin-events/skills/find-events/references/calendar-add.md` | Create |

The existing `references/settings-template.md` is unchanged.

---

## Verification

1. `bash scripts/validate-plugin.sh berlin-events` — must pass (checks plugin.json, SKILL.md frontmatter, hook scripts, marketplace.json)
2. Read the trimmed SKILL.md and confirm the workflow is still coherent end-to-end without the reference files open
3. Confirm each reference file is self-contained and can be read standalone
4. Target: SKILL.md ≤ 200 lines after all three extractions
