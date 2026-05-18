---
name: taskwarrior
description: >
  This skill should be used when the user asks to "add a task", "list my tasks",
  "complete a task", "mark task done", "show overdue tasks", "create a task with
  a due date", "filter tasks by project", "modify a task", "show task details",
  "delete a task", "add tags to a task", "set task priority", "manage tasks with
  taskwarrior", or asks about their to-do list via the task CLI. Use for any
  interaction with Taskwarrior (the `task` command-line tool).
---

# Taskwarrior Skill

Manage tasks using Taskwarrior — a powerful CLI task manager. Always run `task` commands
via Bash. Taskwarrior stores data in `~/.task/` by default.

## Core Concepts

- **Task**: A unit of work with attributes (description, project, tags, due, priority, etc.)
- **Filter**: A query that selects which tasks to act on (e.g., `project:Work +urgent`)
- **Report**: A named view of tasks (e.g., `next`, `list`, `all`, `completed`)
- **Virtual tag**: A computed tag like `+OVERDUE`, `+TODAY`, `+ACTIVE`, `+BLOCKED`
- **Context**: A saved filter applied globally to all commands

## Essential Workflows

### Adding Tasks

```bash
# Basic task
task add "Buy groceries"

# With project and priority
task add project:Home priority:H "Fix leaking faucet"

# With due date and tags
task add project:Work +meeting due:tomorrow "Prepare quarterly review"

# With recurrence
task add project:Work recur:weekly due:monday "Weekly team standup"

# With dependency
task add "Deploy to production" depends:42
```

Priority values: `H` (high), `M` (medium), `L` (low)
Due date shortcuts: `today`, `tomorrow`, `eow` (end of week), `eom` (end of month), `monday`, etc.

### Viewing Tasks

```bash
# Most urgent tasks (default report)
task next

# All pending tasks
task list

# All tasks including completed/deleted
task all

# Task details
task 5 info

# Completed tasks
task completed

# Overdue tasks
task +OVERDUE list

# Due today
task +TODAY list

# Active (started) tasks
task +ACTIVE list

# Blocked tasks
task +BLOCKED list
```

### Filtering Tasks

```bash
# By project
task project:Work list

# By tag
task +urgent list

# By due date
task due.before:eow list

# Combined filters
task project:Work +urgent due.before:friday list

# By priority
task priority:H list

# Search description
task /quarterly/ list

# Multiple projects (use parentheses)
task '( project:Home or project:Garden )' list
```

See `references/filters.md` for the complete filter syntax reference.

### Modifying Tasks

```bash
# Change priority
task 5 modify priority:H

# Add tag
task 5 modify +important

# Remove tag
task 5 modify -shopping

# Change project
task 5 modify project:Work.Q4

# Set due date
task 5 modify due:tomorrow

# Update description
task 5 modify "Updated description text"

# Add dependency
task 3 modify depends:1

# Modify multiple tasks at once
task project:Home modify +household
```

### Completing and Deleting

```bash
# Mark task done
task 5 done

# Delete task
task 5 delete

# Mark multiple done
task project:Home +errands done
```

### Annotations (Notes and Context Links)

Annotations are the primary way to attach context to a task — notes, URLs, Obsidian note
links, GitHub issues, and local file paths all go here. A task can have unlimited annotations.

```bash
# Plain note
task 42 annotate "Spoke with vendor, waiting for quote"

# Obsidian note — use open?vault= form; see references/obsidian-vault.md for vault name
task 42 annotate "obsidian://open?vault=<vault>&file=Projects/finanz-pilot/pension.md"

# Any web URL — GitHub, docs, news article, Notion, Confluence, etc.
task 42 annotate "https://github.com/user/repo/issues/87"
task 42 annotate "https://docs.python.org/3/library/asyncio.html"
task 42 annotate "https://notion.so/team/spec-abc123"

# Local file path
task 42 annotate "~/code/finance-de/src/validator.rs"

# View all annotations for a task
task 42 info

# Remove a specific annotation (matches by substring)
task 42 denotate "pension.md"
```

### Starting and Stopping Work

```bash
# Start working on a task (makes it ACTIVE)
task 5 start

# Stop working on a task
task 5 stop
```

## Common Reports

| Report      | Description                        |
|-------------|------------------------------------|
| `next`      | Highest-urgency pending tasks      |
| `list`      | All pending tasks                  |
| `all`       | All tasks (any status)             |
| `completed` | Completed tasks                    |
| `overdue`   | Tasks past due date                |
| `ready`     | Tasks ready to start               |
| `blocked`   | Tasks blocked by dependencies      |
| `blocking`  | Tasks blocking other tasks         |
| `recurring` | Recurring task templates           |
| `reports`   | List all available reports         |

## Context Management

Use contexts to apply a persistent filter to all task commands.

```bash
# Define a context
task context define work project:Work or +work
task context define home project:Home or +home

# Activate a context
task context work

# See active context
task context show

# List all contexts
task context list

# Disable context
task context none
```

## Configuration

```bash
# View all config
task config

# Set a value
task config default.project Work

# View urgency breakdown for a task
task 5 info
```

For urgency tuning, UDA definitions, and hooks, see `references/advanced.md`.

## Interaction Guidelines

- Always confirm task ID before `done` or `delete` — show `task <id> info` first if ambiguous.
- When the user gives a natural-language date ("next Friday", "end of month"), translate it to a Taskwarrior date value before running the command.
- When listing tasks, prefer `task next` for daily planning and `task list` for a full view.
- When filtering, build the filter incrementally and confirm with the user if it's complex.
- After completing or deleting tasks, show a brief summary of remaining tasks in the same project/context.
- When the user mentions a file, note, GitHub issue, or URL alongside a task, annotate the task with it immediately — don't just mention it in the description.
- Obsidian links use the scheme `obsidian://open?vault=<vault>&file=<path>` or the shorthand `obsidian://vault/<path>`. Prefer the `open?vault=` form when the vault name is known.
- One annotation per resource so each link stays individually removable.
- After ANY completed task, call `task <id> done` — never leave a finished task pending.
- If OpenClaw cannot complete a task fully, annotate the reason and remove the
  +ACTIVE tag rather than leaving it silently stalled.
- When a task has a GitHub annotation, close or comment on the issue after completing.

## OpenClaw Integration

### State update is mandatory
Every time OpenClaw completes work on a task, it MUST update TaskWarrior before
considering the work done. This is non-negotiable — the task is not done until
the ledger reflects it.

```bash
# Minimum on completion
task <id> done

# If blocked mid-work
task <id> modify status:pending +blocked
task <id> annotate "Blocked: <reason>"

# If work is partial
task <id> annotate "Progress: <what was done>"
task <id> modify start.none: # stop the active timer
```

### Picking up work
Before starting any task, always read its full record to discover context pointers:

```bash
task <id> info
```

Any annotation containing `obsidian://`, `https://github.com`, or a file path `~/`
is a context pointer — open it before acting. The task description is the intent;
the annotations are the full context.

### Capture from Telegram
When the user sends a task request via Telegram, translate it immediately:

```bash
task add "<description>" project:<inferred> priority:<inferred>
task <new-id> annotate "<any URLs or file paths mentioned>"
```

Confirm the task ID back to the user so they have a reference.

### Handoff to doing-tasks

This skill handles TaskWarrior operations only. For executing the actual work
described in a task, hand off to the `doing-tasks` skill, passing the task ID
and any annotation pointers as context. On completion, doing-tasks calls back
here to mark the task done.

### Deferred tasks

Tasks tagged `+deferred` are managed by the `deferred-tasks` skill, which scans
memory files, syncs discovered items into Taskwarrior, and handles staleness triage.
Use it when reviewing pending work that was put off:

```bash
task +deferred list            # all deferred tasks
task +deferred -WAITING list   # deferred tasks that have resurfaced
task +deferred +OVERDUE list   # deferred tasks past their due date
```

## Additional Resources

- **`references/filters.md`** — Full filter syntax: operators, attributes, date math, virtual tags
- **`references/advanced.md`** — Urgency configuration, UDAs, hooks, custom reports
- **`references/obsidian-vault.md`** — Vault name, base path, and PARA URI patterns
- **`scripts/tw-summary.sh`** — Print a quick task summary by project
