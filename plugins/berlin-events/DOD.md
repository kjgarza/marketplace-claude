# Definition of Done — berlin-events plugin

## Goal

The plugin is **done** when it can autonomously:
1. Scrape event websites from its configured sources
2. Ingest scraped content into the qurl database (`/Volumes/Verbatim-Vi560-Media/.cache/qurl/qurl.sqlit`)
3. Run a semantic search over the indexed content using the user's preferences from `.claude/berlin-events.local.md`
4. Present a curated, relevance-ranked event list

---

## Acceptance Criteria

### AC-1 · Scrape & Ingest

- [ ] `extract-events.ts` successfully fetches clean text or structured `Event[]` JSON from at least **3 of the priority event sources** defined in `scripts/sources.ts`
- [ ] Each scraped page is ingested into qurl with:
  - `--source berlin-events`
  - `--tags` matching the source category (`art`, `food`, or `art,food`)
  - The canonical source URL as the document key
  ```bash
  bun run extract-events.ts "<slug-or-url>" | \
    qurl add "<url>" --source berlin-events --tags art
  ```
- [ ] Duplicate runs do not create duplicate documents (qurl deduplicates by URL + SHA-256)

### AC-2 · Semantic Search with User Preferences

- [ ] A query is constructed from the user's `.claude/berlin-events.local.md` preferences:
  - `interests` → search terms (e.g. `art food`)
  - `neighborhood` → appended context (e.g. `near Schöneberg`)
  - `lookahead_days` → results filtered to the date window
- [ ] The query runs semantic vector search against the `berlin-events` source in qurl:
  ```bash
  qurl vsearch "art food events Berlin" --source berlin-events
  ```
- [ ] Returns **≥ 5 relevant event results** ranked by semantic similarity

### AC-3 · Presented Results

- [ ] Output is a formatted markdown list with: event name, date, venue/neighborhood, category, and source URL
- [ ] Events outside the `lookahead_days` window are excluded
- [ ] Results reflect the user's `interests` (no off-topic events in top 5)

---

## Autoresearch Loop Parameters

These parameters are used when running the `/autoresearch` skill to iteratively improve the pipeline.

### Metric
```
METRIC_COMMAND:     bash plugins/berlin-events/scripts/test-pipeline.sh
METRIC_EXTRACTION:  "relevant_results: (\d+)" from stdout
METRIC_DIRECTION:   higher_is_better
TARGET:             ≥ 5 relevant results in top 10
```

The **test pipeline script** (`scripts/test-pipeline.sh`) should:
1. Scrape sources from `scripts/sources.ts`, ingest to qurl
2. Run `qurl vsearch "art food events Berlin" --source berlin-events --limit 10`
3. Count results that contain a valid date within the lookahead window
4. Print `relevant_results: N`

### Scope
```
IN_SCOPE_FILES:
  - scripts/extract-content.ts       # Readability scraping logic
  - scripts/extract-events.ts        # extraction dispatcher
  - scripts/sources.ts               # typed source registry
  - scripts/extractors/*.ts          # source-specific extractors
  - scripts/test-pipeline.sh         # metric harness
  - skills/find-events/SKILL.md      # qurl integration steps
  - skills/event-sources/SKILL.md    # source strategy

OUT_OF_SCOPE_FILES:
  - skills/event-sources/references/sources.md  # source registry, read-only
  - agents/event-scout.md                       # agent definition
  - .claude-plugin/plugin.json
```

### Constraints
- No new npm/bun dependencies beyond what is already in `scripts/package.json` and qurl's own packages
- Each experiment run must complete within **3 minutes**
- qurl source tag must remain `berlin-events` (other scripts may depend on it)
- Must not overwrite existing qurl documents outside the `berlin-events` source

### Baseline
Run before any changes:
```bash
# Expected baseline: 0 results (qurl db empty for berlin-events source)
qurl status --source berlin-events
```

---

## Done Checklist

- [ ] AC-1 passes: scrape + ingest works for ≥ 3 sources
- [ ] AC-2 passes: vsearch returns ≥ 5 relevant results
- [ ] AC-3 passes: formatted output respects user preferences
- [ ] `scripts/test-pipeline.sh` exists and prints `relevant_results: N`
- [ ] `qurl status --source berlin-events` shows `activeDocuments: ≥ 15`
- [ ] End-to-end run completes in < 3 minutes on a warm machine
