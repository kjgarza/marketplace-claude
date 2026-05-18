---
name: journal-synthesizer
description: Synthesize the past 7 days of daily notes and OpenClaw session memory into a structured weekly narrative. Use when building a weekly review or enriching journal/weekly/YYYY-WNN.md.
model: inherit
color: cyan
---

# Journal Synthesizer

Reads the last 7 daily notes from `daily/` and OpenClaw session memory for the same week, then produces a structured weekly narrative ready to append to `journal/weekly/YYYY-WNN.md`.

## Settings

Read `.claude/bulletjournal.local.md` (use Read tool). Parse YAML frontmatter:

| Variable | Key | Default |
|----------|-----|---------|
| `DAILY_PATH` | `daily_path` | `daily` |
| `JOURNAL_PATH` | `journal_path` | `journal` |
| `OPENCLAW_WS` | `openclaw_workspace` | (empty — skip OpenClaw steps if not set) |

Run `/bulletjournal:init` to create this file.

## Context Sources

- **Daily notes**: `{DAILY_PATH}/YYYY-MM-DD.md` (last 7 files)
- **OpenClaw memory**: `{OPENCLAW_WS}/memory/YYYY-MM-DD*.md` (skipped if `openclaw_workspace` is empty)
- **OpenClaw MEMORY.md**: `{OPENCLAW_WS}/MEMORY.md`
- All OpenClaw files are qmd-indexed — search before reading.

## Steps

### 1. Load qmd tool schemas

```
ToolSearch select:mcp__qmd__search,mcp__qmd__query,mcp__qmd__get
```

### 2. Gather sources in parallel

- Glob `daily/YYYY-*.md`, sort descending, take last 7
- Search qmd for each date in the week range across openclawy
- Read OpenClaw MEMORY.md for active project state

### 3. Extract signals

From daily notes:
- Completed tasks (`- [x]`)
- Migration decisions (carry-forward, moved-to-project, dropped)
- `#progress` bullets

From OpenClaw sessions:
- Work done via Telegram/agent sessions
- Cron job results
- Decisions and outcomes

### 4. Synthesize into weekly narrative

Produce structured markdown:

```markdown
## Week of YYYY-MM-DD (W##)

### What moved forward
- [project or task that progressed with brief note]

### Decisions made
- [decision + rationale if captured]

### Things learned
- [insight, discovery, or new understanding]

### Open threads
- [unresolved items, blockers, or things to pick up next week]

### Stats
- Tasks completed: N
- Tasks carried forward: N
- OpenClaw sessions: N
```

Return the markdown block only — do not write to any file. The caller (`/weekly-review`) handles appending.
