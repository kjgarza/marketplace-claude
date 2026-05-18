---
name: monthly-review
description: This skill should be used when the user asks to "run monthly review", "create monthly note", "do the month-end review", "generate monthly summary", "run monthly-review", or wants to produce a structured monthly journal note comparing planned goals against actual outcomes.
---

# Monthly Review

Generate a monthly note at `journal/monthly/YYYY-MM.md` by reading the yearly plan, weekly notes for the month, and referenced project notes. Produces a goals-vs-actuals comparison, aggregated accomplishments, and a reflection narrative. Intended to run on the last day of the month or first 3 days of the next.

## Settings

Read `.claude/bulletjournal.local.md` (use Read tool). Parse YAML frontmatter:

| Variable | Key | Default |
|----------|-----|---------|
| `JOURNAL_PATH` | `journal_path` | `journal` |
| `PROJECTS_PATH` | `projects_path` | `10-Projects` |
| `QMD_BIN` | `qmd_bin` | `qmd` |

Run `/bulletjournal:init` to create this file. Use these variables for all path references below.

## Vault Layout

- Yearly note: `{JOURNAL_PATH}/YYYY.md` (goals per month)
- Weekly notes: `{JOURNAL_PATH}/weekly/YYYY-[W]WW.md`
- Monthly notes: `{JOURNAL_PATH}/monthly/YYYY-MM.md`
- Project notes: `{PROJECTS_PATH}/` with `#action` tag

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

### 1. Determine the target month

Check today's date:
- If day ≥ 4: target = current month
- If day ≤ 3: target = previous month (default, but ask the user if ambiguous)

### 2. Check for existing monthly note

Use `qmd get journal/monthly/YYYY-MM.md` or Glob.

- If it exists: **do not overwrite**. Warn: `Monthly note already exists: journal/monthly/2026-04.md — append '-v2' or abort?` Stop and wait for confirmation.

### 3. Read the yearly plan

Run `qmd get journal/YYYY.md` to retrieve the yearly note. Extract the goals listed under the target month's heading. Note: heading levels are inconsistent in the yearly note — look for the month name at any heading level (`##` or `###`, e.g. `### April` or `## April`).

- If the yearly note does not exist or has no goals for the target month: note "No planned goals found" and continue — the review can still document actuals.

### 4. Retrieve weekly notes for the month

Use Glob on `journal/weekly/YYYY-W*.md` to find all weekly notes, then filter to weeks whose date range overlaps the target month. Read each matching note.

- If no weekly notes found: fall back to Glob on `daily/YYYY-MM-*.md` and read daily notes directly.
- If neither weekly nor daily notes exist: report and create nothing. Message: `No notes found for 2026-04. Nothing to review.`

### 5. Aggregate content from weekly (or daily) notes

From weekly notes, collect:

| Data | Source field/section |
|------|---------------------|
| Wins | `## Wins` section |
| Open/stalled items | `## Still open` and `## Stalled / blocked` sections |
| Progress bullets | Lines tagged with `#progress` (inline tag, e.g. `- Fixed auth bug #progress`) |
| Project links | `[[...]]` wiki-links |
| Migration decisions | `## Migration decisions` tables |

If reading daily notes directly (fallback), collect the same data from individual daily note sections.

Deduplicate `#progress` bullets that appear in multiple notes — keep the most informative version.

### 6. Fetch project status for referenced projects

For each unique `[[Project Name]]` found, run:

```bash
qmd get "10-Projects/Project Name.md"
```

Extract `status` and `next-action`. Note any projects that changed status during the month.

### 7. Compare planned goals vs. actuals

For each goal from the yearly note, assess:

- **Achieved**: evidence in wins, progress bullets, or project status change to `archived`/completed
- **Partially met**: some progress but not complete
- **Missed / deferred**: no evidence of progress — note why if discernible

### 8. Generate the monthly note

Write the file at `journal/monthly/YYYY-MM.md`:

```markdown
---
type: monthly
month: 2026-04
created: 2026-04-30
---

# April 2026

## Goals (from yearly plan)
- (goals pulled from journal/2026.md ## April)

## Goals achieved
- (which goals were met, with evidence)

## Goals missed / deferred
- (which goals weren't met, with context)

## Active projects
- [[Project Name]] — status: active | next-action: Write spec
- ...

## Accomplishments
- (aggregated #progress bullets, deduplicated and grouped by theme)

## Stalled work
- (repeated blockers from weekly notes, with brief context)

## Reflection
(2–4 sentence narrative: what worked, what didn't, what to adjust next month)
```

Draft the **Reflection** as a candid, brief narrative. Draw on: goals achieved vs. missed ratio, recurring blockers, and overall momentum.

For **Active projects**: list only projects with activity this month (appeared in a weekly or daily note). Show current `status` and `next-action` from frontmatter.

### 9. Write the file

Write the note with Write.

### 10. Print confirmation

```
Monthly note created → journal/monthly/2026-04.md
```

## Edge Cases

- **Monthly note already exists**: warn and stop — never overwrite. Suggest `-v2` suffix.
- **No weekly notes, no daily notes**: report and create nothing.
- **Yearly note missing**: continue without planned goals; note "No yearly plan found."
- **No goals for the target month in yearly note**: note "No planned goals for this month" and continue.
- **Project note not found**: skip status fetch; mark "status unknown" in Active projects.
- **Day 1–3 ambiguity**: if today is day 1–3, default to previous month but confirm with user before proceeding.

## Additional Resources

- **`.claude/skills/README.md`** — Overview of all BuJo skills and how to use them
