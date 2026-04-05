---
name: digest
description: >
  Generate a themed weekly digest from Obsidian ReadItLater bookmarks. Use this skill when the user runs
  /readitlater-digest:digest or asks to process bookmarks, create a reading digest, summarize saved articles,
  or consolidate ReadItLater files. Also trigger on cron/loop invocations targeting bookmark processing.
argument-hint: "[--dry-run] [--week YYYY-MM-DD]"
allowed-tools: ["Bash", "Read", "Write", "Glob", "Grep", "WebFetch"]
---

# ReadItLater Weekly Digest

Generate a themed digest from unprocessed Obsidian ReadItLater bookmarks. Designed for automated runs via cron or `/loop`.

## Configuration

Read settings from `.claude/readitlater-digest.local.md`. If it doesn't exist, prompt the user to create one using the template below, then stop.

**Required settings** (YAML frontmatter):

| Field | Default | Description |
|-------|---------|-------------|
| `vault_path` | `/Volumes/Verbatim-Vi560-Media/Development/notes/scratchpad` | Obsidian vault root |
| `inbox_folder` | `ReadItLater` | Folder where ReadItLater saves bookmarks |
| `digest_folder` | `Digests` | Folder for generated digests |
| `archive_folder` | `<inbox_folder>/Archive` | Where processed bookmarks get moved (default: `<inbox_folder>/Archive`) |

Derived paths:
- `db_path` = `<vault_path>/.readitlater-digest.db`
- `inbox_path` = `<vault_path>/<inbox_folder>`
- `digest_path` = `<vault_path>/<digest_folder>`
- `archive_path` = `<vault_path>/<archive_folder>` (default: `<inbox_path>/Archive`)

**If `archive_folder` is not set**, derive it as `<inbox_folder>/Archive`.

## Resolving `bun`

Before running any script, resolve the bun executable once:

```bash
BUN=$(command -v bun 2>/dev/null || echo "$HOME/.bun/bin/bun")
```

Use `$BUN` in place of `bun` throughout all subsequent script invocations. This prevents silent failures in cron/non-interactive shells where `.zshrc` is not sourced.

## Pipeline

Run these steps in order. If `--dry-run` is passed as an argument, stop after Step 2 and report what would be digested.

### Step 0: Pre-check for existing digest

Before starting the pipeline, check whether a digest already exists for the current week:

```bash
sqlite3 "<db_path>" \
  "SELECT id, file_path FROM digests WHERE week_start = '<week_start>' AND week_end = '<week_end>'"
```

If a row is returned, **abort immediately** and report: "A digest already exists for <week_start> to <week_end>: <file_path>. Pass --force to regenerate." Do not proceed unless the user explicitly confirms.

### Step 1: Initialize database and validate paths

```bash
$BUN run ${CLAUDE_PLUGIN_ROOT}/scripts/init-db.ts --db-path "<db_path>"
```

This is idempotent — safe to run every time.

Also ensure the archive path exists:

```bash
mkdir -p "<archive_path>"
```

### Step 2: Scan inbox for new bookmarks

```bash
$BUN run ${CLAUDE_PLUGIN_ROOT}/scripts/scan-bookmarks.ts \
  --inbox-path "<inbox_path>" \
  --db-path "<db_path>"
```

The script outputs JSON with `new`, `duplicates`, `already_tracked`, and `errors` fields.

If there are **zero new + zero unprocessed** bookmarks, report "No unprocessed bookmarks" and stop. Do not generate an empty digest.

If `--dry-run`, print the scan results and stop here.

### Step 3: Read and enrich bookmark content

1. Query the database or use the scan output to identify all `unprocessed` bookmarks.
2. **Batch-read all bookmark files in one pass** — run a single shell command to read all inbox markdown files at once rather than one file per invocation:

   ```bash
   cat "<inbox_path>"/*.md "<inbox_path>"/**/*.md 2>/dev/null
   ```

   Or use the Read tool on each file in a single parallel batch rather than sequentially.

3. **Classify bookmarks before enrichment.** After reading, separate bookmarks into two groups:
   - **Resolvable**: file body has ≥50 words of content (excluding frontmatter), or has a fetchable URL that returns content.
   - **Unresolvable**: fewer than 50 words of body content AND the URL is a short-link, mobile redirect, or returns no extractable content (e.g., TikTok, Reddit mobile, Google share links). Mark these for the appendix (see Step 4).

4. **Content enrichment** — for resolvable bookmarks that are thin (<200 words), fetch the original URL with `WebFetch`. Run fetches concurrently where possible. If the fetch fails or returns little content, treat as unresolvable.

5. Extract **substantially more content** per bookmark than a bare summary — capture key arguments, notable quotes, specific data points, and the author's main thesis. The goal is enough material to write informed editorial commentary, not just a blurb.

### Step 4: Cluster by theme and find the narrative

1. Analyze all **resolvable** bookmarks together and identify **3-7 natural themes**:
   - Themes should be specific and descriptive (e.g., "Agentic Engineering Patterns & Multi-Agent Architectures" not "AI")
   - A bookmark can appear in multiple themes if it genuinely spans topics
   - Group stragglers under a casual catch-all section (e.g., "Quick Saves", "Miscellaneous") at the end
2. **Unresolvable bookmarks** are collected separately and appended as an "Unresolvable Links" section (see template below). Do not attempt to write editorial commentary for these — a single sentence noting the link is sufficient.
3. **Find the throughline.** Identify the overarching narrative that connects the week's themes — a single sentence or idea that ties the reading together. This becomes the digest title and opening paragraph.

### Step 5: Generate the digest note

Determine week boundaries (default: Monday-Sunday of the current week, or use `--week YYYY-MM-DD` to specify the Monday).

**Week label accuracy**: The `week` frontmatter field reflects the calendar week boundaries used to select bookmarks (e.g., `2026-03-30 to 2026-04-05`). Additionally, include a `date_range` field showing the actual span of bookmark `date_saved` values (e.g., `2026-03-24 to 2026-03-29`). If bookmarks span multiple weeks, use the most recent Monday-Sunday as `week` but always set `date_range` to the actual bookmark dates.

Write the digest to: `<digest_path>/Digest — <week_start> to <week_end>.md`

**Template:**

```markdown
---
type: digest
date_generated: <ISO date>
week: <week_start> to <week_end>
date_range: <earliest_bookmark_date> to <latest_bookmark_date>
bookmark_count: <count>
themes:
  - <theme 1>
  - <theme 2>
---

# <Creative Title>

<Opening paragraph: 2-4 sentences establishing the throughline — what connected this week's reading, why it matters, and the editorial lens.>

## <Theme Name — evocative, not just descriptive>

<Editorial prose weaving multiple bookmarks into a narrative. Link to sources inline using [display text](url) markdown links. Discuss, compare, and comment on the articles rather than listing them. Each paragraph should read like a newsletter essay — opinionated, specific, and useful. Mention what's interesting, what's surprising, what connects to other reads. If a bookmark's content was thin or inaccessible, acknowledge it naturally in the prose (e.g., "though the full content wasn't extractable from the bookmark").>

<Continue with more paragraphs as needed for the theme. Multiple bookmarks per paragraph when they relate.>

## <Next Theme>

...

## <Catch-all section: "Quick Saves" or similar>

<Brief mentions of bookmarks that don't warrant full commentary but are worth noting. One or two sentences each, still in prose form.>

## Unresolvable Links

<Include this section only if there were unresolvable bookmarks. List each as a bullet with title and URL. No editorial commentary — just the link.>

- [<title>](<url>)
- ...

---

<Closing reflection: 1-2 sentences reflecting on the week's reading as a whole — a parting thought, not a summary.>

*Generated by ReadItLater Digest*
```

**Writing style rules:**
- **Editorial voice**: Write as a thoughtful reader sharing what they found interesting, not a summarization engine. Use first person sparingly ("my favorite", "what strikes me").
- **Inline links**: Use `[display text](url)` markdown links woven into sentences — never structured link blocks.
- **No per-bookmark headers or structured entries.** Bookmarks are woven into flowing paragraphs within each theme section.
- **Specific over generic**: Reference concrete details — numbers, names, quotes, specific claims — not vague summaries.
- **Honest about gaps**: If a bookmark had thin content that couldn't be enriched, say so naturally rather than fabricating substance.
- Valid YAML frontmatter
- UTF-8 always

### Step 6: Update database

Pass each bookmark file as a separate `--bookmark-files` flag. **Do not use comma-separated values** — filenames can contain commas.

```bash
$BUN run ${CLAUDE_PLUGIN_ROOT}/scripts/update-db.ts \
  --db-path "<db_path>" \
  --digest-file "<relative_path_to_digest>" \
  --bookmark-files "<file1.md>" \
  --bookmark-files "<file2.md>" \
  --bookmark-files "<file with, comma.md>" \
  --week-start "<YYYY-MM-DD>" \
  --week-end "<YYYY-MM-DD>" \
  --themes-json '<JSON array of {"name": "...", "count": N}>'
```

Build the argument list dynamically in shell:

```bash
ARGS=(--db-path "<db_path>" --digest-file "<relative_path_to_digest>" \
      --week-start "<YYYY-MM-DD>" --week-end "<YYYY-MM-DD>" \
      --themes-json '<json>')
for f in "${BOOKMARK_FILES[@]}"; do
  ARGS+=(--bookmark-files "$f")
done
$BUN run ${CLAUDE_PLUGIN_ROOT}/scripts/update-db.ts "${ARGS[@]}"
```

### Step 7: Archive processed bookmarks

```bash
$BUN run ${CLAUDE_PLUGIN_ROOT}/scripts/cleanup.ts archive \
  --db-path "<db_path>" \
  --inbox-path "<inbox_path>" \
  --archive-path "<archive_path>"
```

### Output

After completing the pipeline, print a short summary:
- Number of bookmarks processed
- Number of themes identified
- Path to the generated digest file
- Any errors encountered

## Important rules

- **Idempotency**: Step 0 enforces this — abort if a digest for the same week already exists. Never skip Step 0.
- **Never delete files without asking.** Archive moves files; it doesn't delete them.
- **Handle missing files gracefully.** If a bookmark in the DB no longer exists on disk, mark it as `archived` and continue.
- **Frontmatter varies.** The scan script handles multiple field names — trust its output.
- **UTF-8 always.** Read and write all files as UTF-8.
- **Week boundaries.** Default to Monday-Sunday. If bookmarks span multiple weeks, group by the most recent week. Always set `date_range` in frontmatter to the actual bookmark date span.
- **No comma-separated bookmark files.** Use repeatable `--bookmark-files` flags in Step 6. Filenames can contain commas.
- **Unresolvable bookmarks get an appendix**, not filler summaries. Never write "no content was extractable" as body prose — move the link to the "Unresolvable Links" section instead.
