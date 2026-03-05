---
description: Generate a full communication schedule for the book club cycle
argument-hint: "[cadence: weekly|bi-weekly|monthly]"
---

# Generate Book Club Timeline

Cadence: **$ARGUMENTS**

## Your Task

Generate a complete communication timeline for the current book club cycle, mapping out every message and material to produce with specific dates.

## Steps

1. **Read `book-profile.json`** from the workspace
   - Extract `reading_dates.announcement_date`, `reading_dates.reading_date`, `reading_dates.discussion_date`
   - If dates are missing, ask the user to provide them

2. **Determine cadence**
   - Default to `monthly` if no argument provided
   - `monthly`: ~4 weeks between announcement and discussion
   - `bi-weekly`: ~2 weeks, compressed schedule
   - `weekly`: ~1 week, minimal schedule

3. **Build the schedule**

   For a **monthly** cadence (adjust proportionally for others):

   | When | Day | Type | Command |
   |------|-----|------|---------|
   | Week 1 | Monday | Announcement | `/bookclub:generate announce` |
   | Week 1 | Wednesday | Spark questions #1 | `/bookclub:generate spark` |
   | Week 1 | Friday | Articles roundup | `/bookclub:generate articles` |
   | Week 2 | Monday | Spark questions #2 | `/bookclub:generate spark` |
   | Week 2 | Friday | 1-week reminder | `/bookclub:generate remind --timing 1week` |
   | Week 3 | Monday | Spark questions #3 | `/bookclub:generate spark` |
   | Week 3 | Wednesday | 3-day reminder | `/bookclub:generate remind --timing 3days` |
   | Week 3 | Thursday | Materials distributed | `/bookclub:generate guide` |
   | Week 3 | Friday | Discussion session | (session day) |
   | Week 4 | Monday | Session recap | `/bookclub:generate recap` |

4. **Output two formats**

   **Markdown table** — visual, human-readable schedule with dates, types, and commands

   **Structured JSON** — machine-readable schedule:
   ```json
   {
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

5. **Save outputs**
   - Save as `bookclub-timeline.md` and `bookclub-timeline.json`

## Example

```
/bookclub:timeline monthly
```

Generates a 4-week schedule with all message types mapped to specific dates based on the reading and discussion dates in `book-profile.json`.
