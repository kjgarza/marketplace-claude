# Plan: Openclaw Automation Patterns

## Context

The user wants to shift from manually triggering skills to a proactive system
where automation surfaces information and pushes actions without human initiation.
Three domains: daily task management, biweekly Berlin event discovery, and weekly
job search. 

The core problem identified: existing skills are stateless — every run re-discovers
the same items. Fix: add qurl custom tags as a decision ledger (distinct from its
role as a content cache) and Taskwarrior as the pipeline for actionable items.
gogcli closes the calendar write loop in headless mode.

The schedule metadata pattern already exists in the repo
(`plugins/readitlater-digest/.claude-plugin/schedule.json`).

---

## Files to Create or Modify

### 1. `plugins/berlin-events/skills/find-events/SKILL.md` — modify

**a. Update `argument-hint`** (frontmatter):
```
"[days ahead, e.g. '7' or 'this weekend' | --auto for headless cron mode]"
```

**b. Add Step 5.5 — Dedup gate** (insert after Step 5 / vsearch):
```
For each candidate URL returned by vsearch:
  qurl get "<url>"
  - exit 0 AND tags include "calendar-added" OR "reviewed" → drop this result
  - otherwise → keep as candidate
```
This filters the working set to only items not yet decided on.

**c. Add Step 9.5 — Commit decisions** (insert after Step 9, interactive mode only):
```bash
# for each event the user adds to calendar
qurl add "<url>" --source berlin-events --tags "calendar-added"

# for each event the user explicitly skips
qurl add "<url>" --source berlin-events --tags "reviewed"
```

**d. Add `## Auto Mode (--auto)` section** (new section at end):
Headless execution path invoked from cron. Skips user interaction.
1. Run Steps 1–5 (ingest, embed, vsearch) as normal
2. Run Step 5.5 dedup gate
3. Check calendar conflicts via `gog calendar events --from <today> --to <today+14>`
4. Pick top 3 non-conflicting candidates from ranked results
5. For each: `gog calendar create --summary "..." --from "..." --to "..."`
6. For each: `qurl add "<url>" --source berlin-events --tags "calendar-added"`
7. Write one-line digest to stdout:
   `Auto-added N events to calendar (YYYY-MM-DD). M candidates skipped (conflicts).`

---

### 2. `plugins/kjgarza-base/skills/find-jobs/SKILL.md` — modify

**a. Add Step 1.5 — qurl gate** (insert after Step 1 / search):
```bash
# for each job URL found
qurl get "<url>"
# exit 1 (not cached)           → new, continue processing
# exit 0 + tag "found"          → pending review, count in digest, skip reprocessing
# exit 0 + tag "applied"        → already applied, skip
# exit 0 + tag "skipped"        → user passed, skip
# exit 0 + tag "rejected"       → rejected/expired, skip
```

**b. Add Step 2.5 — Record new findings** (insert after Step 2 / scoring, for strong/good matches only):
```bash
qurl add "<url>" --source jobs --tags "found"
task add "Review: [Company] — [Role] ([score]%)" project:JobSearch +review
task <new-id> annotate "<url>"
```
Weak matches (<60%): tag qurl as `skipped`, no Taskwarrior task.

**c. Add `## Auto Mode (--auto)` section** (new section at end):
Headless execution path. Runs Steps 1, 1.5, 2, 2.5 only — no cover letter generation.
Output digest to stdout:
`Job scan complete (YYYY-MM-DD): N new tasks created, M pending review, P applied.`

Cover letter prep (Step 3) remains manual — triggered by starting the Taskwarrior
review task interactively.

---

### 3. `plugins/taskwarrior/skills/morning-briefing/SKILL.md` — create new

```yaml
---
name: morning-briefing
description: >
  Generate a morning briefing combining today's Google Calendar events with
  blocked, overdue, and due-today Taskwarrior tasks. Use when running the daily
  08:00 cron, or when asked "what does my day look like", "morning briefing",
  "daily digest". Designed for headless execution — no user confirmation required.
allowed-tools: ["Bash"]
---
```

Workflow:
1. `gog calendar events --today` → parse time blocks
2. `task +blocked list` → blocked tasks
3. `task +OVERDUE list` → overdue tasks
4. `task +TODAY list` → due today

Output format:
```
## Morning Briefing — [Day, Date]

### Calendar
- [HH:MM–HH:MM] Event title

### Due Today
- [id] Task description (project)

### Overdue
- [id] Task description (due: N days ago)

### Blocked
- [id] Task description — blocked by: [reason from annotation]
```

If all lists are empty, output: `Clear day — no tasks due, no blocks, no overdue.`

---

### 4. `plugins/berlin-events/.claude-plugin/schedule.json` — create new

```json
{
  "schedule": {
    "frequency": "biweekly",
    "days": [1, 15],
    "time": "10:00",
    "timezone": "Europe/Berlin",
    "skill": "find-events",
    "args": "--auto"
  }
}
```

---

### 5. `plugins/kjgarza-base/.claude-plugin/schedule.json` — create new

```json
{
  "schedule": {
    "frequency": "weekly",
    "day": "Monday",
    "time": "09:00",
    "timezone": "Europe/Berlin",
    "skill": "find-jobs",
    "args": "--auto"
  }
}
```

---

### 6. `plugins/taskwarrior/.claude-plugin/schedule.json` — create new

```json
{
  "schedule": {
    "frequency": "daily",
    "time": "08:00",
    "timezone": "Europe/Berlin",
    "skill": "morning-briefing"
  }
}
```

---

## What Is Not Changing

- `task-workflow/SKILL.md` — no changes; it's already a correct state machine
- `task-calendar/SKILL.md` — no changes; the "never write without confirmation" rule
  applies to interactive use; the morning-briefing skill is the auto path
- `bulletjournal` plugin — not touched; it's the weekly/monthly review layer, which
  sits above the daily automation
- `qurl` data model — relies on existing `--tags` and `--source` flags; no schema change

---

## Cron Schedule Summary

| Cadence | When | Skill | Output |
|---|---|---|---|
| Daily | 08:00 | `morning-briefing` | Calendar + task digest to stdout |
| Weekly | Mon 09:00 | `find-jobs --auto` | Taskwarrior review tasks + qurl tags |
| Biweekly | 1st & 15th, 10:00 | `find-events --auto` | Calendar events written + qurl tags |

---

## Verification

1. **find-events**: Run `find-events 14` interactively → confirm Step 5.5 drops
   already-tagged URLs → confirm Step 9.5 tags selected/skipped events → run again
   and confirm the previously tagged events no longer appear.

2. **find-events --auto**: Run `find-events --auto` → confirm `gog calendar create`
   is called for top 3 → confirm `calendar-added` tags written to qurl → confirm
   digest line printed to stdout.

3. **find-jobs**: Run `find-jobs --auto` → confirm new jobs get qurl `found` tag +
   Taskwarrior `+review` task → run again → confirm same URLs are gated out.

4. **morning-briefing**: Run skill → confirm `gog calendar events --today` output
   appears alongside `task +TODAY` and `task +blocked` output → confirm empty-day
   message when all lists are empty.

5. **schedule.json files**: Validate JSON syntax for all three new files.
