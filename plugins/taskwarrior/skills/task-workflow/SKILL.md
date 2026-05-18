---
name: task-workflow
description: >
  This skill should be used when an AI agent needs to "add a task", "create a task",
  "update a task", "modify a task", "complete a task", "mark task done", "close a task",
  "start working on a task", "annotate a task with notes", "add context to a task",
  "log progress on a task", "check task status", "list tasks", "show overdue tasks",
  "manage tasks with taskwarrior", or when any agent workflow requires recording work
  in the task ledger. Defines the default add→start→update→close lifecycle for AI
  agents executing tasks via the `task` CLI.
---

# Task Workflow

Manage the full lifecycle of tasks using Taskwarrior — from capture through completion.
This skill defines the canonical workflow AI agents MUST follow when touching the task
ledger. Taskwarrior stores data in `~/.task/` by default; run all `task` commands via Bash.

## Core Lifecycle: Add → Start → Update → Close

Every unit of work follows this four-stage lifecycle. Never skip stages silently.

### Stage 1: Add (Capture)

Capture tasks immediately when work is identified. A task not in the ledger doesn't exist.

```bash
# Minimal capture — always include project
task add "Description of work" project:ProjectName

# Full capture with all known attributes
task add "Description of work" \
  project:ProjectName.SubProject \
  priority:H \
  due:tomorrow \
  +tag1 +tag2

# Record the new task ID from output for subsequent commands
```

**Capture rules:**
- Always assign a `project` — unowned tasks decay
- Use `project:Parent.Child` for sub-projects (e.g., `project:Work.API`)
- Set `priority:H/M/L` only when it reflects real urgency — do not default to H
- Add `due:` only when there is a real deadline
- Add `+` tags for cross-cutting concerns (`+blocked`, `+waiting`, `+review`)
- Translate natural language dates: "next Friday" → `due:friday`, "end of month" → `due:eom`

### Stage 2: Start (Activate)

Before executing any work, mark the task active. This creates an audit trail and exposes
blockers before time is spent.

```bash
# Read full task record — annotations are context pointers
task <id> info

# Open any annotation URLs or file paths before acting:
# obsidian:// links → open the note
# https://github.com/... → read the issue/PR
# ~/path/to/file → read the file

# Mark active
task <id> start
```

**Start rules:**
- Always run `task <id> info` before starting — annotations contain the full context
- Open every annotation that is a URL or file path before proceeding
- Only start one task at a time when possible (`task +ACTIVE list` to check)

### Stage 3: Update (Progress)

Log progress incrementally. Do not batch updates at the end — if execution is interrupted,
the ledger must reflect current state.

```bash
# Annotate progress — one annotation per meaningful event
task <id> annotate "Progress: implemented X, pending Y"

# Annotate a blocker
task <id> annotate "Blocked: waiting for API key from team"
task <id> modify +blocked

# Link a new resource discovered during work
task <id> annotate "https://github.com/user/repo/issues/42"
task <id> annotate "~/code/project/src/module.py"

# Annotate an Obsidian note
task <id> annotate "obsidian://open?vault=<vault>&file=Projects/<slug>/notes.md"

# Update due date if timeline changed
task <id> modify due:eow

# Remove a tag when state resolves
task <id> modify -blocked
```

**Update rules:**
- One annotation per resource or event — keeps each item individually removable
- Never batch multiple updates into one annotation
- If blocked mid-work: annotate the reason + add `+blocked` before stopping
- If context becomes available (URL, file, note), annotate immediately
- See `references/obsidian-vault.md` for Obsidian URI format

### Stage 4: Close (Complete)

Close tasks immediately when work is done. Never leave a finished task pending.

```bash
# Mark done — mandatory after any completed work
task <id> done

# If a GitHub/GitLab issue was linked, close or comment after marking done
# (retrieve annotation first: task <id> info)

# Partial completion — stop and annotate remaining work
task <id> stop
task <id> annotate "Partial: completed X. Remaining: Y"
```

**Close rules:**
- Call `task <id> done` — this is non-negotiable; the task is not done until the ledger reflects it
- If completion is partial: stop the active timer, annotate remaining work, do NOT mark done
- After closing, show a brief summary of remaining tasks in the same project

## Notes and Annotations

Annotations are the primary mechanism for attaching context — notes, URLs, file paths,
Obsidian links, GitHub issues. A task can carry unlimited annotations.

```bash
# Plain note
task 42 annotate "Spoke with vendor, waiting for quote"

# Obsidian note (see references/obsidian-vault.md for vault config)
task 42 annotate "obsidian://open?vault=<vault>&file=Projects/<slug>/meeting.md"

# Web URL
task 42 annotate "https://github.com/user/repo/issues/87"

# Local file
task 42 annotate "~/code/src/validator.rs"

# View all annotations
task 42 info

# Remove a specific annotation (matches by substring)
task 42 denotate "validator.rs"
```

For multiline notes and extended task descriptions, see `references/examples.md`.

## Viewing Tasks

```bash
# Daily planning view (urgency-sorted)
task next

# Full pending list
task list

# Task with all annotations and metadata
task <id> info

# Overdue
task +OVERDUE list

# Due today
task +TODAY list

# Active (started) tasks
task +ACTIVE list

# By project
task project:Work list

# Quick summary across all projects
bash /CLAUDE_PLUGIN_ROOT/skills/task-workflow/scripts/tw-summary.sh
```

## Mandatory State Updates for AI Agents

Every time an AI agent completes, stalls, or is blocked on work, it MUST update Taskwarrior
before considering the turn done.

| Situation | Required action |
|-----------|----------------|
| Work completed | `task <id> done` |
| Work partially done | `task <id> stop` + annotate progress |
| Blocked | `task <id> modify +blocked` + annotate reason |
| Blocked resolved | `task <id> modify -blocked` + `task <id> start` |
| New resource found | `task <id> annotate "<url or path>"` |
| Timeline slipped | `task <id> modify due:<new-date>` |

## Picking Up Existing Work

```bash
# See what is active
task +ACTIVE list

# Read full record before acting
task <id> info

# Open all annotation pointers — obsidian://, https://, ~/path
# Then continue from where work left off
```

## Modifying Tasks

```bash
# Change priority
task <id> modify priority:H

# Change project
task <id> modify project:Work.Q4

# Set due date
task <id> modify due:tomorrow

# Add/remove tags
task <id> modify +important -waiting

# Add dependency (task <id> cannot start until task <dep> is done)
task <id> modify depends:<dep>

# Change description
task <id> modify "Updated description"
```

## Additional Resources

- **`references/best-practices.md`** — Taskwarrior best practices: project hierarchy, tagging, urgency, capture habits
- **`references/examples.md`** — Multiline tasks, notes patterns, complex real-world examples
- **`references/filters.md`** — Full filter syntax: operators, date math, virtual tags
- **`references/advanced.md`** — Urgency tuning, UDAs, hook scripts, custom reports
- **`references/obsidian-vault.md`** — Vault name, base path, PARA URI patterns
- **`scripts/tw-summary.sh`** — Quick summary by project, overdue, and active tasks
