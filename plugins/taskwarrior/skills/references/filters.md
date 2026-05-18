# Taskwarrior Filter Reference

## Filter Syntax

Filters are expressions placed before the command:

```
task [filter] [command] [modifications]
```

Multiple filter terms are implicitly ANDed:
```bash
task project:Work +urgent list   # project=Work AND tag=urgent
```

Use `or` and parentheses for OR logic:
```bash
task '( project:Home or project:Garden )' list
```

## Attribute Operators

| Operator | Meaning             | Example                        |
|----------|---------------------|-------------------------------|
| `:`      | equals              | `project:Work`                |
| `.not:`  | not equals          | `project.not:Work`            |
| `.is:`   | is (synonym for `:`)| `status.is:pending`           |
| `.isnt:` | is not              | `priority.isnt:L`             |
| `.has:`  | contains (string)   | `description.has:meeting`     |
| `.hasnt:`| does not contain    | `description.hasnt:optional`  |
| `.starts:`| starts with        | `project.starts:Work`         |
| `.ends:` | ends with           | `project.ends:.Q4`            |
| `.before:`| less than (date)   | `due.before:eow`              |
| `.after:` | greater than (date)| `due.after:today`             |
| `.none:`  | attribute is empty  | `project.none:`               |
| `.any:`   | attribute is set    | `due.any:`                    |

## Filterable Attributes

| Attribute     | Description                          | Example                    |
|---------------|--------------------------------------|----------------------------|
| `project`     | Project name                         | `project:Work`             |
| `priority`    | H, M, L, or empty                    | `priority:H`               |
| `due`         | Due date                             | `due:today`                |
| `scheduled`   | Scheduled start date                 | `scheduled.before:eow`     |
| `wait`        | Hidden until this date               | `wait.before:today`        |
| `until`       | Expiry date for recurring tasks      | `until.any:`               |
| `status`      | pending, completed, deleted, waiting | `status:pending`           |
| `tags`        | Tag list                             | `+tag` or `-tag`           |
| `description` | Task description text                | `description.has:invoice`  |
| `entry`       | Date task was created                | `entry.after:2025-01-01`   |
| `end`         | Date task was completed/deleted      | `end.after:2025-01-01`     |
| `modified`    | Date task was last changed           | `modified.before:yesterday`|
| `id`          | Numeric task ID                      | `1,3,5` or `1-5`           |
| `uuid`        | UUID                                 | `uuid:abc123...`           |
| `urgency`     | Computed urgency score               | `urgency.above:5`          |
| `depends`     | Task dependencies                    | `depends.any:`             |
| `recur`       | Recurrence interval                  | `recur.any:`               |

## Tags

```bash
task +tag list      # tasks WITH tag
task -tag list      # tasks WITHOUT tag
task +tag1 +tag2    # tasks with BOTH tags
```

## Virtual Tags (Computed)

Virtual tags are automatically computed by Taskwarrior:

| Virtual Tag  | Meaning                                     |
|--------------|---------------------------------------------|
| `+ACTIVE`    | Task has been started                       |
| `+ANNOTATED` | Task has annotations                        |
| `+BLOCKED`   | Task depends on an incomplete task          |
| `+BLOCKING`  | Task blocks other tasks                     |
| `+CHILD`     | Task is a child of a recurring template     |
| `+COMPLETED` | Task is completed                           |
| `+DELETED`   | Task is deleted                             |
| `+DUE`       | Task is due within the next week            |
| `+DUETODAY`  | Task is due today                           |
| `+MONTH`     | Task is due this month                      |
| `+ORPHAN`    | Task has no parent (for recurring)          |
| `+OVERDUE`   | Task is past its due date                   |
| `+PARENT`    | Task is a recurring template                |
| `+PENDING`   | Task is pending (default status)            |
| `+PRIORITY`  | Task has a priority set                     |
| `+PROJECT`   | Task belongs to a project                   |
| `+READY`     | Task is unblocked and has no wait date      |
| `+SCHEDULED` | Task has a scheduled date                   |
| `+TAGGED`    | Task has at least one tag                   |
| `+TODAY`     | Task is due today                           |
| `+TOMORROW`  | Task is due tomorrow                        |
| `+UDA`       | Task has a UDA set                          |
| `+UNBLOCKED` | Task has dependencies, all completed        |
| `+UNTIL`     | Task has an until date                      |
| `+WAIT`      | Task is in waiting status                   |
| `+WEEK`      | Task is due this week                       |
| `+YEAR`      | Task is due this year                       |

## Date Syntax

### Named Dates
```
today       now         yesterday   tomorrow
sunday      monday      tuesday     wednesday
thursday    friday      saturday
jan feb mar apr may jun jul aug sep oct nov dec
eow         eom         eoy         (end of week/month/year)
sow         som         soy         (start of week/month/year)
soww        eoww        (start/end of work week)
```

### ISO Dates
```
2025-06-15
2025-06-15T14:30:00
20250615
```

### Date Arithmetic
```
now+2d          2 days from now
now-1w          1 week ago
due+3d          3 days after due date
eom-2d          2 days before end of month
```

### Duration Units
```
d = days       w = weeks      m = months     y = years
h = hours      min = minutes  s = seconds
```

## ID Ranges and Lists

```bash
task 1 done           # single task
task 1,3,5 done       # specific IDs
task 1-5 done         # range of IDs
task 1,3-5,8 done     # mixed
```

## Complex Filter Examples

```bash
# High priority work tasks due this week
task project:Work priority:H due.before:eow list

# All tasks that are overdue or due today
task '( +OVERDUE or +TODAY )' list

# Tasks without a project
task project.none: list

# Tasks modified in the last 7 days
task modified.after:now-7d all

# Tasks with any due date set
task due.any: list

# Tasks that are either blocked or have no priority
task '( +BLOCKED or priority.none: )' list

# Pending tasks in Work project, not tagged with waiting
task project:Work -waiting status:pending list
```
