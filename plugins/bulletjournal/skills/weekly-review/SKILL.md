---
name: weekly-review
description: This skill should be used when the user asks to "run weekly review", "create weekly note", "do the Friday review", "generate this week's summary", "run weekly-review", or wants to produce a structured weekly journal note from the current week's daily notes.
portable: false
---

# Weekly Review

Generate a weekly note at `journal/weekly/YYYY-[W]WW.md` by reading the current week's daily notes, aggregating wins, open tasks, progress bullets, and project status, then drafting a structured review note. Intended to run on Fridays or on-demand.

## Settings

Read `.claude/bulletjournal.local.md` (use Read tool). Parse YAML frontmatter:

| Variable | Key | Default |
|----------|-----|---------|
| `DAILY_PATH` | `daily_path` | `daily` |
| `JOURNAL_PATH` | `journal_path` | `journal` |
| `PROJECTS_PATH` | `projects_path` | `10-Projects` |
| `QMD_BIN` | `qmd_bin` | `qmd` |

Run `/bulletjournal:init` to create this file. Use these variables for all path references below.

## Vault Layout

- Daily notes: `{DAILY_PATH}/YYYY-MM-DD.md`
- Weekly notes: `{JOURNAL_PATH}/weekly/YYYY-[W]WW.md` (e.g., `2026-W14.md`)
- Project notes: `{PROJECTS_PATH}/` with `#action` tag and frontmatter fields `status`, `next-action`

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

Run in Bash before any searches. The `|| true` ensures a failure does not abort the review:

```bash
${QMD_BIN} update && ${QMD_BIN} embed || true
```

### 1. Determine the current ISO week

Calculate today's ISO week number and the Monday–Friday date range. For example: Week 14, 2026-03-30 to 2026-04-04.

### 2. Check for existing weekly note

Use `qmd get journal/weekly/YYYY-[W]WW.md` or Glob to check if the file already exists.

- If it exists: **do not overwrite**. Warn the user: `Weekly note already exists: journal/weekly/2026-W14.md — append '-v2' suffix or abort?` Then stop and wait for confirmation.

### 3. Retrieve the week's daily notes

Use Glob on `daily/YYYY-MM-*.md` to find all daily notes, then filter to dates within the Mon–Sun window for the target week. Optionally supplement with `qmd search` if needed.

- If no daily notes exist for the week: report that and create nothing. Message: `No daily notes found for week 2026-W14. Nothing to review.`

### 4. Aggregate content from daily notes

Read each daily note and collect:

| Data | Source |
|------|--------|
| Completed tasks | `- [x]` lines and tasks with `✅` emoji |
| Incomplete tasks | `- [ ]` lines |
| Progress bullets | Lines tagged with `#progress` (inline tag, e.g. `- Fixed auth bug #progress`) |
| Project links | `[[...]]` wiki-links appearing in task or progress lines |
| Log entries | Lines under `## Log` sections |

Group incomplete tasks by the project they reference (if any `[[link]]` is present on the line or nearby).

### 5. Fetch project status for referenced projects

For each unique `[[Project Name]]` found in step 4, run:

```bash
qmd get "10-Projects/Project Name.md"
```

Extract `status` and `next-action` from frontmatter. Use these to populate the "Still open" and "Stalled / blocked" sections.

### 6. Identify stalled items

An item is stalled if it appeared as incomplete in 3 or more daily notes this week with no associated `#progress` tagged bullet. Note these with a brief "why" if discernible from the log entries.

### 7. Generate the weekly note

Write the file at `journal/weekly/YYYY-[W]WW.md` using this structure:

```markdown
---
type: weekly
week: 2026-W14
start: 2026-03-30
end: 2026-04-04
created: 2026-04-04
---

# Week 14 — Mar 30 – Apr 4, 2026

## Wins
- (completed tasks and #progress bullets from the week)

## Still open
- (incomplete tasks grouped by project/area)

## Migration decisions
| Task | Action |
|------|--------|
| ... | carry → next week / move → project note / drop / delegate |

## Next week focus
- (2–4 priorities inferred from open items and project status)

## Stalled / blocked
- (items that didn't move, with why if discernible)

## Week summary
(2–3 sentence narrative of the week based on wins and progress)
```

Draft the **Week summary** as a concise narrative: what moved, what didn't, overall character of the week.

For **Migration decisions**: propose a disposition for each open task based on age, urgency, and project match. The user reviews and edits this table — do not auto-decide.

For **Next week focus**: infer 2–4 priorities from incomplete high-urgency tasks and project `next-action` fields.

### 8. Write the file

Write the generated note with Write.

### 9. Print confirmation

```
Weekly note created → journal/weekly/2026-W14.md
```

## Edge Cases

- **Partial week** (e.g., running on Monday): generate from available days, note in the summary that the week is in progress.
- **Week note already exists**: warn and stop — never overwrite. Suggest `-v2` suffix.
- **No daily notes**: report and create nothing.
- **Project note not found by qmd**: skip that project's status fetch; note "status unknown" in the review.

## Additional Resources

- **`.claude/skills/README.md`** — Overview of all BuJo skills and how to use them
