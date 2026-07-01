---
name: sync-daily
description: Pull today's OpenClaw session activity into the current daily note. Use when the user asks to "sync today", "pull in today's activity", "sync openclaw", or wants to enrich the daily note with Telegram/agent session context.
disable-model-invocation: true
portable: false
---

# Sync Daily — OpenClaw → Daily Note

Pull activity from the OpenClaw workspace (Telegram/autonomous agent sessions) into today's daily note.

## Settings

Read `.claude/bulletjournal.local.md` (use Read tool). Parse YAML frontmatter:

| Variable | Key | Default |
|----------|-----|---------|
| `DAILY_PATH` | `daily_path` | `daily` |
| `OPENCLAW_WS` | `openclaw_workspace` | (empty) |

Run `/bulletjournal:init` to create this file. Use these variables for all path references below.

## Context Sources

- **OpenClaw workspace**: `{OPENCLAW_WS}/` (from settings)
- **Memory files**: `{OPENCLAW_WS}/memory/YYYY-MM-DD*.md` — dated session logs
- **MEMORY.md**: `{OPENCLAW_WS}/MEMORY.md` — high-level project/context summary
- **Today's daily note**: `{DAILY_PATH}/YYYY-MM-DD.md`

All OpenClaw memory files are qmd-indexed. Search them before reading directly.

## Step-by-Step

### 0. Check OpenClaw integration

Read `.claude/bulletjournal.local.md`. If `openclaw_workspace` is empty or the file does not exist, stop and report:
```
sync-daily requires openclaw_workspace — run /bulletjournal:init to configure it.
```

### 1. Load qmd tool schemas

```
ToolSearch select:mcp__qmd__search,mcp__qmd__query,mcp__qmd__get
```

### 2. Search OpenClaw for today's activity

Run in parallel:
- `qmd search "YYYY-MM-DD"` — find today's session logs
- `qmd search "YYYY-MM-DD"` scoped to openclawy collection if supported, else filter results by path containing `openclawy`

Also check yesterday if today's entries are sparse (sessions may span midnight UTC vs Berlin time).

### 3. Read today's daily note

`Read {DAILY_PATH}/YYYY-MM-DD.md` to get current content. If it doesn't exist, stop and report.

### 4. Extract activities from OpenClaw entries

From the session memory files, extract:
- Tasks completed or progressed
- Decisions made
- Projects touched (repos, code, research)
- Reminders set or fired
- Any open threads or blockers mentioned

Skip: raw conversation transcripts, system messages, HEARTBEAT_OK responses.

### 5. Append `## OpenClaw Activity` section

Append to today's daily note only if there is meaningful content. Do not duplicate entries already present (check for the section header first).

Format:
```markdown
## OpenClaw Activity — YYYY-MM-DD

- [brief activity summary]
- [decision or outcome]
- [open thread or follow-up, if any]
```

Use `Edit` to append — never overwrite existing note content.

### 6. Confirm

Output one line:
```
Synced OpenClaw activity → {DAILY_PATH}/YYYY-MM-DD.md
```

If no meaningful activity found:
```
No OpenClaw activity found for YYYY-MM-DD — daily note unchanged.
```
