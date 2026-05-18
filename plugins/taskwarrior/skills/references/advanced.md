# Taskwarrior Advanced Reference

## Urgency Calculation

Urgency is a numeric score computed from task attributes. It determines `task next` ordering.

```bash
# View urgency breakdown for a task
task 5 info

# View urgency for all tasks
task list rc.verbose=label,new-id
```

### Urgency Coefficients

```bash
# Due date proximity (default: 12.0)
task config urgency.due.coefficient 12.0

# Blocking tasks (default: 8.0)
task config urgency.blocking.coefficient 8.0

# Blocked tasks (default: -5.0)
task config urgency.blocked.coefficient -5.0

# Active tasks (default: 4.0)
task config urgency.active.coefficient 4.0

# Scheduled tasks (default: 5.0)
task config urgency.scheduled.coefficient 5.0

# Age coefficient (default: 2.0)
task config urgency.age.coefficient 2.0
task config urgency.age.max 365

# Project membership (default: 1.0)
task config urgency.project.coefficient 1.0

# Tags presence (default: 1.0)
task config urgency.tags.coefficient 1.0

# Annotations presence (default: 1.0)
task config urgency.annotations.coefficient 1.0

# Enable urgency inheritance (blocked tasks inherit urgency)
task config urgency.inherit 1

# Priority urgency values
task config urgency.priority.coefficient 6.0
task config urgency.user.tag.next.coefficient 15.0
task config urgency.user.tag.urgent.coefficient 10.0

# Project-specific urgency boost
task config urgency.user.project.Work.coefficient 5.0
```

## Custom Reports

```bash
# Define a custom report
task config report.sprint.description "Sprint tasks"
task config report.sprint.columns "id,project,priority,due.relative,description,tags"
task config report.sprint.labels "ID,Project,Pri,Due,Description,Tags"
task config report.sprint.sort "due+,priority-,project+"
task config report.sprint.filter "status:pending +sprint"

# Use the report
task sprint

# List all reports
task reports

# View available columns
task columns
```

### Column Formats

Columns can have format suffixes:
```
id              - numeric ID
uuid.short      - truncated UUID
description.count  - description + annotation count
due.relative    - "3 days" instead of date
due.age         - age of due date
project.parent  - parent project only
tags.count      - number of tags
```

## User Defined Attributes (UDAs)

Extend tasks with custom fields.

```bash
# String UDA with allowed values
task config uda.estimate.type string
task config uda.estimate.label "Estimate"
task config uda.estimate.values "XS,S,M,L,XL,"

# Numeric UDA
task config uda.points.type numeric
task config uda.points.label "Story Points"

# Date UDA
task config uda.reviewed.type date
task config uda.reviewed.label "Last Reviewed"

# Duration UDA
task config uda.timebudget.type duration
task config uda.timebudget.label "Time Budget"

# Use UDA when adding
task add project:Work "Implement feature" estimate:M points:3

# Filter by UDA
task estimate:M list

# List all UDAs
task udas

# Include UDA in custom report
task config report.sprint.columns "id,description,estimate,points,due"
```

## Hook Scripts

Hooks run at specific lifecycle events. They live in `~/.task/hooks/` and must be executable.

### Hook Events

| Event       | Trigger                               |
|-------------|---------------------------------------|
| `on-launch` | Taskwarrior starts                    |
| `on-exit`   | Taskwarrior exits                     |
| `on-add`    | New task is added                     |
| `on-modify` | Existing task is modified/completed   |

### Hook Protocol

- `on-add`: reads 1 task JSON from stdin, writes 1 task JSON to stdout (or exit 1 to reject)
- `on-modify`: reads 2 lines (original, modified) from stdin, writes 1 (modified) to stdout
- Non-zero exit = operation aborted + stderr shown to user

### Example: Require Project for High-Priority Tasks

```python
#!/usr/bin/env python3
# ~/.task/hooks/on-add.require-project.py
import json
import sys

task = json.loads(sys.stdin.readline())

if task.get('priority') == 'H' and not task.get('project'):
    print("High priority tasks must have a project", file=sys.stderr)
    sys.exit(1)

print(json.dumps(task))
sys.exit(0)
```

```bash
chmod +x ~/.task/hooks/on-add.require-project.py
```

### Example: Auto-tag by Project

```python
#!/usr/bin/env python3
# ~/.task/hooks/on-add.auto-tag.py
import json
import sys

task = json.loads(sys.stdin.readline())

project = task.get('project', '')
if project.startswith('Work'):
    tags = task.get('tags', [])
    if 'work' not in tags:
        tags.append('work')
    task['tags'] = tags

print(json.dumps(task))
sys.exit(0)
```

### Debugging Hooks

```bash
# Disable hooks temporarily
task rc.hooks=0 add "Task without hooks"

# Debug hook execution (shows hook inputs/outputs)
task rc.debug.hooks=2 add "Debug me"
```

## Recurring Tasks

```bash
# Weekly task
task add "Team standup" recur:weekly due:monday

# Daily task
task add "Check email" recur:daily due:9am

# Monthly task
task add "Pay bills" recur:monthly due:1st

# Task that expires
task add "Submit report" recur:weekly due:friday until:2025-12-31

# View recurring templates
task recurring
```

### Recurrence Values
```
daily           weekly          monthly         yearly
2d              1w              3m              1y
weekdays        (Mon-Fri only)
```

## Dependencies

```bash
# Task 5 cannot start until task 3 is done
task 5 modify depends:3

# Multiple dependencies
task 5 modify depends:1,2,3

# View blocked tasks
task +BLOCKED list

# View what a task blocks
task 3 info  # shows "blocks" field
```

## Sync (Taskserver / TaskChampion)

```bash
# Sync with configured server
task sync

# One-time sync URI (TaskChampion)
task config sync.server.url https://task.example.com
task config sync.server.client_id YOUR_CLIENT_ID
task config sync.server.encryption_secret YOUR_SECRET
```

## Useful Configuration

```bash
# Set default project
task config default.project Home

# Set default priority
task config default.priority M

# Change data directory
task config data.location ~/.task

# Disable confirmation prompts (use carefully)
task config confirmation off

# Show task IDs in output
task config verbose label,new-id,affected,edit,special,project,sync,filter,footnote,recur,unwait

# Color themes
task config theme.color.header.color cyan
```

## Bulk Operations

```bash
# Complete all tasks in a project
task project:OldProject done

# Delete all waiting tasks older than 30 days
task +WAITING entry.before:now-30d delete

# Bulk modify
task project:Work +sprint modify due:eow

# Export tasks as JSON
task export > backup.json

# Import tasks from JSON
task import < backup.json
```
