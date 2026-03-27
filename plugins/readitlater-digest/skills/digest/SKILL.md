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
| `inbox_folder` | `ReadItLater Inbox` | Folder where ReadItLater saves bookmarks |
| `digest_folder` | `Digests` | Folder for generated digests |
| `archive_folder` | `ReadItLater Inbox/Archive` | Where processed bookmarks get moved |

Derived paths:
- `db_path` = `<vault_path>/.readitlater-digest.db`
- `inbox_path` = `<vault_path>/<inbox_folder>`
- `digest_path` = `<vault_path>/<digest_folder>`
- `archive_path` = `<vault_path>/<archive_folder>`

## Pipeline

Run these steps in order. If `--dry-run` is passed as an argument, stop after Step 2 and report what would be digested.

### Step 1: Initialize database

```bash
bun run ${CLAUDE_PLUGIN_ROOT}/scripts/init-db.ts --db-path "<db_path>"
```

This is idempotent — safe to run every time.

### Step 2: Scan inbox for new bookmarks

```bash
bun run ${CLAUDE_PLUGIN_ROOT}/scripts/scan-bookmarks.ts \
  --inbox-path "<inbox_path>" \
  --db-path "<db_path>"
```

The script outputs JSON with `new`, `duplicates`, `already_tracked`, and `errors` fields.

If there are **zero new + zero unprocessed** bookmarks, report "No unprocessed bookmarks" and stop. Do not generate an empty digest.

If `--dry-run`, print the scan results and stop here.

### Step 3: Read and enrich bookmark content

1. Query the database or use the scan output to identify all `unprocessed` bookmarks
2. Read each bookmark's markdown file from `<inbox_path>/<file_path>`
3. **Content enrichment** — if a bookmark file is thin (fewer than ~200 words of body content, excluding frontmatter), fetch the original URL with `WebFetch` to extract richer content. Run fetches concurrently where possible to avoid blocking the pipeline. If the fetch fails or returns little, proceed with whatever content is available and note it in the digest prose (e.g., "the full content wasn't extractable from the bookmark").
4. Extract **substantially more content** per bookmark than a bare summary — capture key arguments, notable quotes, specific data points, and the author's main thesis. The goal is enough material to write informed editorial commentary, not just a blurb.

### Step 4: Cluster by theme and find the narrative

1. Analyze all bookmarks together and identify **3-7 natural themes**:
   - Themes should be specific and descriptive (e.g., "Agentic Engineering Patterns & Multi-Agent Architectures" not "AI")
   - A bookmark can appear in multiple themes if it genuinely spans topics
   - Group stragglers under a casual catch-all section (e.g., "Quick Saves", "Miscellaneous") at the end
2. **Find the throughline.** Identify the overarching narrative that connects the week's themes — a single sentence or idea that ties the reading together. This becomes the digest title and opening paragraph.

### Step 5: Generate the digest note

Determine week boundaries (default: Monday-Sunday of the current week, or use `--week YYYY-MM-DD` to specify the Monday).

Write the digest to: `<digest_path>/Digest — <week_start> to <week_end>.md`

**Template:**

```markdown
---
type: digest
date_generated: <ISO date>
week: <week_start> to <week_end>
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

```bash
bun run ${CLAUDE_PLUGIN_ROOT}/scripts/update-db.ts \
  --db-path "<db_path>" \
  --digest-file "<relative_path_to_digest>" \
  --bookmark-files "<comma_separated_relative_paths>" \
  --week-start "<YYYY-MM-DD>" \
  --week-end "<YYYY-MM-DD>" \
  --themes-json '<JSON array of {"name": "...", "count": N}>'
```

### Step 7: Archive processed bookmarks

```bash
bun run ${CLAUDE_PLUGIN_ROOT}/scripts/cleanup.ts archive \
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

- **Idempotency**: Check the DB for existing digests covering the same week. If one exists, warn and skip unless the user confirms.
- **Never delete files without asking.** Archive moves files; it doesn't delete them.
- **Handle missing files gracefully.** If a bookmark in the DB no longer exists on disk, mark it as `archived` and continue.
- **Frontmatter varies.** The scan script handles multiple field names — trust its output.
- **UTF-8 always.** Read and write all files as UTF-8.
- **Week boundaries.** Default to Monday-Sunday. If bookmarks span multiple weeks, group by the most recent week.
