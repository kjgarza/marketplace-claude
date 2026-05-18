---
name: task-calendar
description: >
  Use when the user wants to "schedule a task", "block time for a task", "add task to calendar",
  "check if I'm free", "find a slot for this", "when can I work on", "create a calendar event
  for a task", "reschedule this task", or any request that bridges a Taskwarrior task with
  Google Calendar. Uses gogcli (gog) when available, falls back to Google Calendar MCP tools.
---

# Task Calendar

Bridge Taskwarrior tasks and Google Calendar. Taskwarrior is source of truth for **what** and
**when (deadline)**. Google Calendar is source of truth for **time blocks** (when you actually
sit down to work).

Follow [[task-workflow]] for all task lifecycle rules. This skill adds calendar operations only.

## Core Principle

- `due:` on a task = deadline, not a work block
- Calendar event = committed work time for a task
- Never auto-sync; always confirm with user before writing to Calendar

## Tool Selection

At the start of any calendar operation, detect which tool is available:

```bash
command -v gog && echo "gogcli available"
```

**Prefer `gog`** (gogcli) when present — runs via Bash, outputs JSON/TSV to stdout, no MCP overhead.
Fall back to `mcp__claude_ai_Google_Calendar__*` MCP tools when `gog` is absent.

gogcli docs: https://gogcli.sh/quickstart.html

## Operations

### 1. Check availability before setting a due date

When user says "add task due Friday" or asks about scheduling:

```bash
# gogcli — list events for target date
gog calendar events --today          # for today
# for a specific date, inspect output and filter by date

# MCP fallback
# mcp__claude_ai_Google_Calendar__list_events (timeMin: date start, timeMax: date end)
```

→ Report conflicts found  
→ Proceed with `task add ... due:<date>` only after user confirms

### 2. Block time for a task (write to Calendar)

When user says "schedule this", "block time", "add to calendar":

```
1. task <id> info                              — get description, due, project
2. gog calendar events --today                 — inspect free windows
3. Show proposed slot to user, get confirmation
4. Create event:

     gogcli:
       gog calendar create \
         --summary "<task description>" \
         --from "YYYY-MM-DDTHH:MM:SS+TZ" \
         --to   "YYYY-MM-DDTHH:MM:SS+TZ"

     MCP fallback:
       mcp__claude_ai_Google_Calendar__create_event

5. task <id> annotate "gcal:<summary> <date> <HH:MM>"
```

Event format:
- **`--summary`**: task description verbatim
- **Description** (if MCP): `taskwarrior id: <id>  project: <project>`
- **Duration**: 25–90 min depending on complexity; ask user if unclear
- **Timezone**: use local timezone offset (e.g. `+02:00` for CEST)

### 3. Reschedule a task

When user says "move this to next week", "reschedule task 42":

```
1. task <id> info                              — get existing gcal annotation
2. gog calendar events --today                 — find new free slot
3. Show proposed change, get confirmation
4. Recreate event with new times (gogcli has no edit command — delete + create):
     gog calendar create --summary "..." --from "..." --to "..."
5. task <id> modify due:<new-date>             — only if deadline also changed
6. task <id> annotate "Rescheduled: <old-date> → <new-date>"
```

### 4. Daily planning view with calendar context

When user says "plan my day", "what should I work on today":

```bash
# Step 1 — tasks
task +TODAY list
task +OVERDUE list

# Step 2 — calendar
gog calendar events --today
# MCP fallback: mcp__claude_ai_Google_Calendar__list_events
```

→ Report: meetings that consume time, free windows, tasks without blocks  
→ Offer to block time for unscheduled tasks

## Rules

- **Never** create a calendar event without user confirmation
- **Never** modify a task's `due:` date based on calendar data alone — only on explicit user instruction
- **Never** delete calendar events without confirmation
- If `gcal:` annotation already exists on a task, check that event before creating a new one
- Keep annotation format consistent: `gcal:<summary> YYYY-MM-DD HH:MM`

## Calendar Tool Reference

| Intent | gogcli (`gog`) | MCP fallback |
|--------|----------------|--------------|
| List today's events | `gog calendar events --today` | `mcp__claude_ai_Google_Calendar__list_events` |
| Create event | `gog calendar create --summary "..." --from "..." --to "..."` | `mcp__claude_ai_Google_Calendar__create_event` |
| Find free slot | inspect `events --today` output | `mcp__claude_ai_Google_Calendar__suggest_time` |
| Update event | delete + recreate (no edit command) | `mcp__claude_ai_Google_Calendar__update_event` |

MCP tools require loading via ToolSearch before calling:
`ToolSearch: select:mcp__claude_ai_Google_Calendar__<tool_name>`
