---
name: inbox-triage
description: Process notes in 00-Inbox/ into the correct PARA location with frontmatter filled in. Use when the user asks to "triage inbox", "process inbox", "sort inbox", or "clear inbox".
disable-model-invocation: true
portable: false
---

# Inbox Triage

Read all notes in the inbox folder, classify each into its PARA destination, propose frontmatter values, and move them. Each move is shown to the user before execution.

## Settings

Read `.claude/bulletjournal.local.md` (use Read tool). Parse YAML frontmatter:

| Variable | Key | Default |
|----------|-----|---------|
| `INBOX_PATH` | `inbox_path` | `00-Inbox` |
| `PROJECTS_PATH` | `projects_path` | `10-Projects` |
| `AREAS_PATH` | `areas_path` | `20-Areas` |
| `RESOURCES_PATH` | `resources_path` | `30-Resources` |
| `ARCHIVE_PATH` | `archive_path` | `40-Archive` |

Run `/bulletjournal:init` to create this file. Use these variables for all path references below.

## PARA Destinations

| Folder | When to use |
|--------|-------------|
| `{PROJECTS_PATH}/` | Has a defined outcome and end date |
| `{AREAS_PATH}/` | Ongoing responsibility with no end date |
| `{RESOURCES_PATH}/` | Reference material, research, read-later |
| `{ARCHIVE_PATH}/` | Already done, inactive, or historical |

## Step-by-Step

### 1. List inbox notes

```bash
ls {INBOX_PATH}/
```

If empty, report "`{INBOX_PATH}/` is empty — nothing to triage." and stop.

### 2. Read each note

Read each file in `00-Inbox/`. Extract: title, any existing tags/frontmatter, body content.

### 3. Classify and propose frontmatter

For each note, determine:
- **Destination folder** (PARA logic above)
- **Frontmatter fields** (for action notes going to 10-Projects/ or 20-Areas/):
  - `status`: `seed` (default for new items)
  - `domain`: one of `apps | career | wellness | personal | learning | people`
  - `urgency`: 1–5
  - `importance`: 1–5
  - `effort`: 1–5
  - `impact`: 1–5
  - `next-action`: first concrete step
  - `tags`: `#action` for projects/areas, `#resource` for 30-Resources/

Use qmd to check for existing related notes before classifying:
```
ToolSearch select:mcp__qmd__query
mcp__qmd__query "note title or key concept"
```

### 4. Present triage plan

Show a table before making any moves:

```
| Note | → Destination | Status | Domain | Urgency | Importance | Next Action |
|------|--------------|--------|--------|---------|------------|-------------|
| filename.md | 10-Projects/ | seed | apps | 3 | 4 | Write spec |
```

Ask: "Apply this triage? (yes / edit / skip [filename])"

Wait for user confirmation before proceeding.

### 5. Apply moves

For each approved note:
1. Update frontmatter with proposed values (use Edit)
2. Move file to destination folder (use Bash `mv`)
3. Update `created` and `updated` dates if missing

### 6. Confirm

Report how many notes were triaged:
```
Triaged 4 notes: 2 → 10-Projects/, 1 → 30-Resources/, 1 → 40-Archive/
```
