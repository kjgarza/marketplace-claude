---
description: Generate a full communication schedule for the book club cycle
argument-hint: "[cadence: weekly|bi-weekly|monthly] [--book folder_slug]"
---

# Generate Book Club Timeline

Cadence: **$ARGUMENTS**

## Your Task

Generate a complete communication timeline for the current book club cycle, mapping out every message and material to produce with specific dates.

## Steps

1. **Load plugin settings and resolve `book_dir`**
   - Read `.claude/bookclub.local.md` if present; resolve `output_root` (default `.`).
   - Use `--book <folder_slug>` if provided; else the same **book_dir** rules as `/bookclub:generate` ([SKILL.md](../skills/bookclub/SKILL.md#configuration)).
   - Read `<book_dir>/book-profile.json`

2. **Read dates from the book profile**
   - Extract `reading_dates.announcement_date`, `reading_dates.reading_date`, `reading_dates.discussion_date`
   - If dates are missing, ask the user to provide them

3. **Determine cadence**
   - Default to `monthly` if no argument provided
   - `monthly`: ~4 weeks between announcement and discussion
   - `bi-weekly`: ~2 weeks, compressed schedule
   - `weekly`: ~1 week, minimal schedule

4. **Build the schedule**

   For a **monthly** cadence (adjust proportionally for others):

   | When | Day | Type | Command |
   |------|-----|------|---------|
   | Week 1 | Monday | Announcement | `/bookclub:generate announce` |
   | Week 1 | Friday | Articles roundup | `/bookclub:generate articles` |
   | Week 2 | Friday | 1-week reminder | `/bookclub:generate remind` |
   | Week 3 | Thursday | Eve + one-pager | `/bookclub:generate eve` + `/bookclub:generate one-pager` |
   | Week 3 | Friday | Discussion session | (session day) |

5. **Output two formats**

   **Markdown table** — visual, human-readable schedule with dates, types, and commands

   **Structured JSON** — machine-readable schedule:
   ```json
   {
     "bookclub_name": "...",
     "output_root": "...",
     "folder_slug": "...",
     "book_title": "...",
     "cadence": "monthly",
     "schedule": [
       {
         "date": "2026-03-02",
         "day_of_week": "Monday",
         "type": "announce",
         "command": "/bookclub:generate announce",
         "description": "Book of the month announcement"
       }
     ]
   }
   ```

6. **Save outputs** under `book_dir`
   - `bookclub-timeline.md` and `bookclub-timeline.json`
   - Optionally mention `slack_channel` from config in the Markdown table footer when set

## Example

```
/bookclub:timeline monthly
```

Generates a 4-week schedule under the resolved book folder with all message types mapped to specific dates from `book-profile.json`.
