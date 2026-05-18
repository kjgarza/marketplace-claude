# Daily Note Structure Reference

## File location

`daily/YYYY-MM-DD.md`

## Full template

Periodic-notes creates new daily notes from `Templates/daily-template.md`, which contains no nav line and no date-offset math — only `{{date:…}}` substitutions that core Templates supports. The `daily-migrate` skill injects the nav line when it creates tomorrow's note.

```markdown
---
type: daily
created: YYYY-MM-DD
---

# Weekday, Month D, YYYY

<< [[YYYY-MM-DD (yesterday)]] | [[YYYY-MM-DD (tomorrow)]] >>   ← injected by daily-migrate

## Log

- 

## Tasks

### Due / overdue

```tasks
not done
(due on or before YYYY-MM-DD)
short mode
```

### Open from last 7 days

```tasks
not done
happens before YYYY-MM-DD
short mode
```

### New

- 

### Carried

(carry-forward tasks from daily-migrate go here)

## Progress

- 

## Notes

- 
```

## Section descriptions

| Section | Purpose | Notes |
|---------|---------|-------|
| Nav line | `<< [[prev]] | [[next]] >>` | Written by `daily-migrate`, not in the template |
| `## Log` | Rapid capture — thoughts, observations, quick notes | Bullet journal rapid logging style |
| `## Tasks` | New tasks created today + Tasks plugin query blocks | Use Tasks plugin format with emoji dates |
| `### Due / overdue` | Auto-query: tasks due today or earlier | Do not edit; rendered by Tasks plugin |
| `### Open from last 7 days` | Auto-query: recent uncompleted tasks | Do not edit; rendered by Tasks plugin |
| `### New` | Tasks added manually today | Plain `- [ ]` bullets |
| `### Carried` | Tasks migrated forward by `daily-migrate` skill | Written by skill, reviewed by user |
| `## Progress` | 1–3 accomplishment bullets tagged `#progress` | Plain bullets + `#progress` tag |
| `## Notes` | Longer entries, meeting notes, references | Free-form |

## Task format (Tasks plugin)

```
- [ ] Write the spec 📅 2026-04-07              ← due date
- [ ] Draft weekly email ⏳ 2026-04-06           ← scheduled date
- [ ] Review PR 📅 2026-04-04 ✅ 2026-04-04     ← completed
- [x] Finished first draft                       ← simple done (no dates)
```

Emoji key:
- `📅` due
- `⏳` scheduled
- `🛫` start
- `✅` done date
- `❌` cancelled

## Progress bullet format

```
- Identified blocker on [[PIDGraph MCP]] #progress
- Finished draft of bookclub announcement #progress
- Clarified scope with team #progress
```

Plain bullets, tagged `#progress`, optionally linked to a project.

## Migration log format

The `daily-migrate` skill appends this section at the bottom of today's note:

```markdown
## Migration — YYYY-MM-DD

Carried forward:
- [ ] Task text 📅 2026-04-07

Suggested for project notes:
- Task text → [[Project Name]]

Dropped (stale):
- Task text that is 5+ days old with no progress

Informational (not migrated):
- https://example.com/reference
```
