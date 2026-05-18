# Weekly Note Template Reference

## File location

`journal/weekly/YYYY-[W]WW.md` — e.g., `journal/weekly/2026-W14.md`

## Full template with annotations

```markdown
---
type: weekly
week: 2026-W14          ← ISO week identifier; used by qmd search "type:weekly 2026-W14"
start: 2026-03-30       ← Monday of the week
end: 2026-04-04         ← Friday (or Saturday for full-week variants)
created: 2026-04-04     ← Date the note was generated
---

# Week 14 — Mar 30 – Apr 4, 2026

## Wins
- Completed X task for [[Project Name]]
- Shipped Y feature
- #progress bullets aggregated from the week's daily notes

## Still open
### [[Project Name]]
- [ ] Incomplete task 1
- [ ] Incomplete task 2

### No project
- [ ] Standalone task

## Migration decisions
| Task | Action |
|------|--------|
| Write the spec | carry → next week |
| Review PR for PIDGraph | move → [[PIDGraph MCP]] |
| Look into mystery dinner venues | drop |

## Next week focus
- Priority 1 (inferred from high-urgency open items)
- Priority 2 (inferred from project next-action fields)
- Priority 3
- Priority 4

## Stalled / blocked
- Task X — no progress for 3+ days; blocker: [reason if known]
- [[Project Name]] — status unchanged; next-action: [field from frontmatter]

## Week summary
2–3 sentence narrative: what moved, what didn't, overall character of the week.
```

## Field reference

| Field | Type | Description |
|-------|------|-------------|
| `type` | string | Always `weekly` — enables qmd search by type |
| `week` | string | ISO week label, e.g. `2026-W14` |
| `start` | date | Monday of the ISO week |
| `end` | date | Friday (or Sunday) of the ISO week |
| `created` | date | Generation date |

## Section guidance

### Wins
Aggregate from:
- `- [x]` lines across the week's daily notes
- Tasks with `✅` emoji
- `#progress` bullets

Group loosely by project if there are many items. Keep to the most meaningful 5–8 items.

### Still open
Group incomplete tasks (`- [ ]`) by `[[Project Name]]` if they reference one. Tasks with no project link go under "No project." Preserve emoji date metadata.

### Migration decisions
Propose a disposition for every open task. The user reviews and edits this table before acting. Do not auto-execute migrations here — this is a decision record, not automation.

Actions available:
- `carry → next week` — keep working on it
- `move → [[Note Name]]` — belongs in a project note
- `drop` — no longer relevant
- `delegate` — hand off (note to whom if known)
- `defer → [date]` — snooze to a specific date

### Next week focus
Infer 2–4 priorities from:
- High-urgency incomplete tasks (urgency ≥ 3 from frontmatter)
- Project `next-action` frontmatter fields for active projects
- Any items flagged "carry → next week" in Migration decisions

### Stalled / blocked
An item is stalled if it appeared incomplete in 3+ daily notes this week with no `#progress` bullet. Include brief context if the log reveals why.

### Week summary
Write a 2–3 sentence narrative. Aim for honesty over positivity. Examples:
- "Productive week on [[Project A]] — shipped the spec and unblocked the team. [[Project B]] stalled again due to waiting on external review. Good energy overall."
- "Fragmented week with many context switches. Little deep work. Next week: protect mornings."
