# Taskwarrior Best Practices

Distilled from https://taskwarrior.org/docs/best-practices/

## Capture Habits

**Capture everything, immediately.** A task not in Taskwarrior doesn't exist. The moment work
is identified — even if it's 30 seconds away from being done — add it.

```bash
task add "Quick fix on invoice page" project:Work.Frontend
```

**One task per activity, not per meeting or day.** Avoid:
- "Meeting prep" (too vague)
- "Monday work" (time-bound, not action-bound)

Prefer:
- "Prepare Q3 slide deck for finance review"
- "Reply to vendor quote from Acme Corp"

## Project Hierarchy

Use dot-notation for sub-projects. Taskwarrior rolls up stats automatically.

```bash
task add "Write API spec" project:Work.API.v2
task add "Implement auth endpoint" project:Work.API.v2
task add "Update home page copy" project:Work.Marketing
```

```bash
# Summary with rollups
task summary
```

**Keep hierarchy to 2–3 levels.** Deeper than `Work.API.v2` becomes hard to navigate.

**Use a consistent naming convention:**
- PascalCase: `Work.FinancePilot.Auth`
- kebab: `work.finance-pilot.auth`

Pick one and stick to it.

## Tagging Strategy

Tags are for cross-cutting concerns that span projects. Use sparingly.

| Tag | Meaning |
|-----|---------|
| `+next` | High urgency boost (next to work on) |
| `+urgent` | Urgency boost for time-sensitive |
| `+waiting` | Waiting on someone else |
| `+blocked` | Blocked by a dependency or blocker |
| `+review` | Needs review before closing |
| `+deferred` | Deliberately postponed |
| `+someday` | Low-priority, no deadline |

```bash
# Boost a task to the top of your list
task 42 modify +next

# Mark waiting on external party
task 18 modify +waiting
task 18 annotate "Waiting: vendor to send API credentials"
```

Do not replicate project names as tags (`+work` when the task already has `project:Work`).

## Priority

Use priority sparingly so it retains signal.

- `H` — Must be done today or it causes a real problem
- `M` — Should be done this week
- `L` — Nice to have, no deadline pressure
- (empty) — Backlog / someday

```bash
task add "Fix production auth bug" project:Work priority:H due:today
```

If everything is `H`, nothing is.

## Due Dates

Set `due:` only for real deadlines — not aspirational target dates.

For target dates without hard consequences, use `scheduled:` instead:

```bash
# Hard deadline
task 5 modify due:friday

# Target start date (hidden until then)
task 5 modify scheduled:monday

# Hide until a future date
task 5 modify wait:2025-09-01
```

`wait:` makes the task invisible until the date — useful for future-dated work that would
clutter today's view.

## Dependencies

Declare dependencies explicitly to let Taskwarrior compute blocked status and urgency
inheritance.

```bash
# Task 5 cannot start until task 3 is done
task 5 modify depends:3

# View what is blocking what
task +BLOCKED list
task +BLOCKING list
```

## Urgency and the `next` Report

`task next` shows the highest-urgency pending tasks. Trust the algorithm — it factors in
due dates, priority, dependencies, active status, and age.

To understand why a task ranks where it does:
```bash
task <id> info
```

To boost a task to the top:
```bash
task <id> modify +next
# Removes itself visually once urgency.user.tag.next.coefficient is high
```

## Recurring Tasks

Use `recur:` for repeating work — Taskwarrior manages the series automatically.

```bash
task add "Weekly team standup" recur:weekly due:monday project:Work
task add "Pay rent" recur:monthly due:1st project:Personal
task add "Check email" recur:daily due:8am project:Work
```

Never add recurring tasks manually each time — let Taskwarrior spawn instances.

## Completing Tasks

**Mark done immediately.** The moment a task is complete, run:

```bash
task <id> done
```

Do not batch completions. Completed tasks provide historical urgency baselines and metrics.

## Reviews

Periodically review the backlog to prevent stale tasks from accumulating. A good review:

```bash
# Tasks not modified in 14 days
task modified.before:now-14d list

# Waiting tasks that should have resolved
task +waiting list

# Low priority tasks older than 60 days
task priority:L entry.before:now-60d list
```

For each stale task: update, delete, or add `+deferred` with an annotation explaining why.

## Contexts

Use contexts to focus on one area at a time without seeing unrelated tasks.

```bash
task context define work "project:Work or +work"
task context work       # narrow to work tasks
task context none       # full view
```

## Sync and Backup

```bash
# Export all tasks as JSON backup
task export > ~/backups/taskwarrior-$(date +%Y%m%d).json

# Sync with TaskChampion server (if configured)
task sync
```

## Anti-patterns to Avoid

| Anti-pattern | Problem | Fix |
|-------------|---------|-----|
| Tasks in two systems | Splits attention | Pick one source of truth |
| `priority:H` on everything | Loses signal | Use H for genuine urgency only |
| No project on tasks | Unorganized backlog | Always assign project on add |
| Editing done tasks | History pollution | Leave done, add new task |
| Huge single-line description | Hard to scan | One action per task |
| Due date = today for everything | Creates false urgency | Use scheduled: for targets |
