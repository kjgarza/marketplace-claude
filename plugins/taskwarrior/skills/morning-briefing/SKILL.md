---
name: morning-briefing
description: >
  Generate a morning briefing combining today's Google Calendar events with
  blocked, overdue, and due-today Taskwarrior tasks. Use when running the daily
  08:00 cron, or when asked "what does my day look like", "morning briefing",
  "daily digest", "what's on today". Designed for headless execution — no user
  confirmation required.
allowed-tools: ["Bash"]
---

# Morning Briefing

Combines Google Calendar and Taskwarrior into a single daily digest. Runs
headlessly — no interaction required.

## Workflow

### Step 1: Fetch Today's Calendar

```bash
gog calendar events --today
```

Parse the output into a list of `HH:MM–HH:MM event title` entries, sorted by
start time. If `gog` is not available, fall back to:

```bash
# MCP fallback — requires ToolSearch: select:mcp__claude_ai_Google_Calendar__list_events
```

### Step 2: Fetch Task State

Run all three queries:

```bash
task +TODAY list
task +OVERDUE list
task +blocked list
```

### Step 3: Format Digest

Output the following structure. Omit any section that has no items.

```
## Morning Briefing — [Weekday, YYYY-MM-DD]

### Calendar
- HH:MM–HH:MM  Event title
- HH:MM–HH:MM  Event title

### Due Today
- [id]  Task description  (project:Name)

### Overdue
- [id]  Task description  (due: N days ago)

### Blocked
- [id]  Task description  — [reason from most recent annotation]
```

If all four lists are empty:

```
## Morning Briefing — [Weekday, YYYY-MM-DD]

Clear day — nothing due, no blocks, no overdue.
```

## Rules

- Never create, modify, or delete tasks or calendar events
- Never ask for confirmation — this skill is read-only
- If `gog` returns an error, omit the Calendar section and note the failure inline
- If Taskwarrior returns no results for a query, omit that section silently
