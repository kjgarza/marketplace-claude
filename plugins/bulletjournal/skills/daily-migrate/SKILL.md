---
name: daily-migrate
description: This skill should be used when the user asks to "run daily migration", "migrate tasks", "do morning review", "carry forward tasks", "run daily-migrate", or wants to review yesterday's open tasks and prepare today's or tomorrow's note. Performs bullet-journal-style task migration across recent daily notes.
portable: false
---

# Daily Migrate

Migrate incomplete tasks from the last 2 daily notes (yesterday and the day before) into a recorded decision log on today's note, and pre-populate tomorrow's note with carry-forward tasks. Migration is a **recorded decision** — never silent.

## Settings

Read `.claude/bulletjournal.local.md` (use Read tool). Parse YAML frontmatter:

| Variable | Key | Default |
|----------|-----|---------|
| `DAILY_PATH` | `daily_path` | `daily` |
| `TEMPLATES_PATH` | `templates_path` | `Templates` |
| `PROJECTS_PATH` | `projects_path` | `10-Projects` |

Run `/bulletjournal:init` to create this file. Use these variables for all path references below.

## Vault Layout

Daily notes live at `{DAILY_PATH}/YYYY-MM-DD.md`. The vault root is the working directory for this session (the Obsidian vault). The daily template lives at `{TEMPLATES_PATH}/daily-template.md`.

## qmd MCP Tool Signatures

Before making any qmd calls, load schemas with:

```
ToolSearch select:mcp__qmd__get,mcp__qmd__query,mcp__qmd__search
```

Correct parameter signatures:
- `mcp__qmd__get` → `{ path: "relative/path.md" }`
- `mcp__qmd__query` → `{ query: "text", limit?: number }`
- `mcp__qmd__search` → `{ query: "text", limit?: number }`

## Step-by-Step Procedure

### 0. Refresh the qmd index

Run in Bash before any searches. The `|| true` ensures a failure does not abort the migration:

```bash
qmd update && qmd embed || true
```

This ensures project notes and daily notes written since the last auto-index are visible to qmd queries in steps 2 and 4.

### 1. Verify today's note exists

Use `Read` on `daily/YYYY-MM-DD.md` (today's date) to confirm the note exists and load it into context. `Edit` requires a prior `Read`, so this is the single required read — do not call qmd get for today's note separately.

- If it does not exist: report the missing note and stop. Do not migrate into a void.

### 2. Locate the last 2 daily notes and fire project-match queries in parallel

Use Glob with pattern `daily/YYYY-*.md` (current year) to avoid truncation, then sort by name descending and take the 3 most recent (skip today, leaving 2 source notes: yesterday and the day before).

**In the same parallel batch**, fire `mcp__qmd__query` for any project keywords already visible from today's note context (e.g. recurring project names). This lets classification (step 4) proceed without extra sequential round trips.

### 3. Extract incomplete tasks and progress bullets

For each of the 2 source notes, read the file and collect:

- **Incomplete tasks**: lines matching `- [ ]` (not yet done)
- **Recent progress**: lines tagged with `#progress` (inline tag on any bullet, e.g. `- Fixed the auth bug #progress`)

Skip tasks that are already marked done (`- [x]`, `✅`) or cancelled (`❌`).

### 4. Classify each incomplete task

For each `- [ ]` task, determine its category:

| Category | Condition |
|----------|-----------|
| **Carry forward** | Still relevant, no matching project note |
| **Move to project** | Semantically matches an existing `#action` note in `10-Projects/` — use `mcp__qmd__query` to find candidates; top result is the suggested project if confidence is reasonable |
| **Stale** | Appeared in both source notes (yesterday and the day before) with no related `#progress` bullets (stuck for 2+ days) |
| **Informational** | Looks like a reference or note, not an actionable task (e.g., URLs, "see X", definitions) |

Run all `mcp__qmd__query "<task text>"` calls in parallel across all tasks needing project matching. If the top result is an `#action` note and the title clearly relates to the task, classify as "Move to project."

### 5. Write into today's note: `### Carried` and migration log

Today's note is already in context from step 1. Make two edits:

**5a. Populate `### Carried`.** Insert carry-forward tasks (only tasks classified as "Carry forward" in step 4) under the existing empty `### Carried` sub-heading inside `## Tasks`. Preserve task text and emoji dates exactly. If `### Carried` is missing, add it above `## Progress`.

**5b. Append the migration decision log** as a `## Migration — YYYY-MM-DD` section at the bottom of the file:

```markdown
## Migration — 2026-04-05

Carried forward:
- [ ] Write the spec 📅 2026-04-07
- [ ] Draft weekly email

Suggested for project notes:
- Review PR for PIDGraph → [[PIDGraph MCP]]

Dropped (stale):
- Look into mystery dinner venues

Informational (not migrated):
- https://example.com/reference
```

Use Edit for both operations — never overwrite the existing note content. The `### Carried` section is the reviewable list; the `## Migration — …` block is the auditable decision log (what was dropped, what was suggested for projects, etc.).

### 6. Create or update tomorrow's note

Determine tomorrow's date. Check if `daily/YYYY-MM-DD.md` (tomorrow) exists.

**If it does not exist:**
- Read `Templates/daily-template.md`
- Substitute all template variables with tomorrow's date values: `{{date:YYYY-MM-DD}}`, `{{date:dddd, MMMM D, YYYY}}`
- Inject a navigation line `<< [[PREV]] | [[NEXT]] >>` immediately below the `# Weekday, Month D, YYYY` heading, using the computed previous-day and next-day dates (format `YYYY-MM-DD`). The template itself does not contain this line — the skill is the source of truth for nav.
- Add carry-forward tasks under `## Tasks` → `### Carried` sub-heading
- `### New` is already in the template above `### Carried`; leave it as-is for manual task entry
- Write the file with Write

**If it already exists:**
- Append carry-forward tasks under a `### Carried` sub-heading inside the existing `## Tasks` section
- Use Edit to append — never overwrite

Carry-forward task list: only tasks classified as "Carry forward" in step 4.

### 7. Print confirmation

Output exactly one line:

```
Migration recorded → daily/2026-04-05.md
```

## Edge Cases

- **Today's note missing**: Report and stop. Message: `Today's note not found: daily/YYYY-MM-DD.md — create it first.`
- **No incomplete tasks found**: Append a minimal migration log noting "No open tasks found in the last 2 days." Still create tomorrow's note from template.
- **Tomorrow's note already exists**: Append under `### Carried`, never overwrite.
- **Project match ambiguous**: Default to "Carry forward" and add a comment in the log: `(possible match: [[Project Name]])`
- **Task has a due date in the past**: Still classify normally — due-date surfacing is handled by the Tasks plugin query blocks, not by migration.

## Task Format Reference

Tasks plugin emoji standard used in this vault:

- `📅` due date
- `⏳` scheduled date
- `🛫` start date
- `✅` done date
- `❌` cancelled

Preserve these emojis exactly when carrying tasks forward. Do not modify task text.

## Additional Resources

- **`Templates/daily-template.md`** — The daily note template used by Obsidian periodic-notes plugin
- **`.claude/skills/README.md`** — Overview of all BuJo skills and how to use them
