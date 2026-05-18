# Monthly Note Template Reference

## File location

`journal/monthly/YYYY-MM.md` — e.g., `journal/monthly/2026-04.md`

## Full template with annotations

```markdown
---
type: monthly
month: 2026-04          ← used by qmd search "type:monthly 2026-04"
created: 2026-04-30     ← generation date
---

# April 2026

## Goals (from yearly plan)
- Goal 1 from journal/2026.md ## April
- Goal 2
- Goal 3

## Goals achieved
- **Goal 1** ✅ — evidence: completed [[Project X]] spec, shipped to team on Apr 12
- **Goal 3** ✅ — evidence: ran 3 sessions, logged in daily notes

## Goals missed / deferred
- **Goal 2** ⏳ — started but blocked by external dependency; carrying to May
- **Goal 4** ❌ — deprioritized; not relevant anymore

## Active projects
| Project | Status | Next action |
|---------|--------|-------------|
| [[PIDGraph MCP]] | active | Write integration tests |
| [[Bookclub app]] | seed | Define data model |

## Accomplishments
### Work
- Delivered X to stakeholders #progress
- Unblocked Y by resolving Z #progress

### Personal
- Completed A #progress
- Started B #progress

## Stalled work
- [[Project Name]] — no progress for 3 weeks; blocker: waiting on design review
- Task X — appeared in every weekly review, never acted on; consider dropping

## Reflection
2–4 sentences: what worked, what didn't, what to adjust next month.
```

## Field reference

| Field | Type | Description |
|-------|------|-------------|
| `type` | string | Always `monthly` — enables qmd search |
| `month` | string | `YYYY-MM` format |
| `created` | date | Generation date |

## Section guidance

### Goals (from yearly plan)
Pull verbatim from `journal/YYYY.md` under the matching month heading. These are the intentions set at the start of the year (or updated quarterly). Do not edit them here.

### Goals achieved / missed
For each planned goal, make a binary judgment: achieved or not. Evidence comes from:
- `## Wins` in weekly notes
- `#progress` bullets referencing the goal's theme
- Project `status` field changing to `archived` or similar

Use `✅` for achieved, `⏳` for partial/deferred, `❌` for dropped.

### Active projects
List only projects that appeared in at least one weekly or daily note this month. Pull `status` and `next-action` from each project's frontmatter via `qmd get`. Projects with no activity this month are omitted.

### Accomplishments
Aggregate all `#progress` bullets from the month's weekly notes (or daily notes if no weeklies). Deduplicate: if the same achievement appears across multiple notes, keep the most complete version. Group loosely by theme (Work, Personal, Learning, etc.).

### Stalled work
Pull from `## Stalled / blocked` sections of weekly notes. If the same item recurs across multiple weeks, flag it prominently. Note the blocker if known.

### Reflection
Write 2–4 honest sentences. Consider:
- Goals achieved vs. planned ratio
- Projects that moved vs. stalled
- Energy / focus quality this month
- One thing to change next month

## Yearly plan integration

The `monthly-review` skill reads `journal/YYYY.md` to pull planned goals. Structure of that file:

```markdown
# 2026

## January
- Goal 1
- Goal 2

## April
- Goal 1
- Goal 2
```

Each heading is `## MonthName` (full name, e.g. `## April`). The skill matches by month name.

If the yearly note exists but the month heading is missing, note "No planned goals for this month" and continue generating the review from actuals only.
