---
description: Generate and deliver any book-club timeline messages due today, then mark them sent
argument-hint: "[--book folder_slug] [--date YYYY-MM-DD] [--dry-run]"
allowed-tools: Bash, Read, Write, Edit, Skill
---

# Book Club Dispatch

Scans book-club timelines for messages due today that have not been sent, generates each one,
delivers it to Telegram (ready to paste into Slack), and marks it sent. Designed for the daily
`bookclub-dispatch` launchd job, but safe to run manually. **Idempotent** — re-running on the
same day does nothing for already-sent entries.

## Steps

1. **Resolve book folders.** Read `.claude/bookclub.local.md` for `output_root` (default `.`).
   With `--book`, target that one folder; otherwise scan every immediate child of `output_root`
   that contains a `bookclub-timeline.json` ([book_dir rules](../skills/bookclub/SKILL.md#configuration)).

2. **Determine target date.** Default today (Europe/Berlin). `--date YYYY-MM-DD` overrides.

3. **Find due, unsent entries.** For each timeline, select `schedule[]` entries where
   `date == target_date` AND `sent != true` AND `type` is a generatable message
   (`announce`, `remind`, `articles`, `eve`, `one-pager`). Skip session-day rows
   (e.g. `discussion`) — nothing to send.

4. **Generate each message.** For each due entry, run the matching generation via the `bookclub`
   skill / `/bookclub:generate <type>` for that `book_dir`. Produce the copy-paste **mrkdwn**
   form (the bookclub word-count hook validates message files on write).

5. **Deliver to Telegram.** Send each generated message so the user can paste it into Slack.
   Resolve the notifier relative to the marketplace root:

   ```bash
   NOTIFY="$(cd "$CLAUDE_PLUGIN_ROOT/../.." && pwd)/automation/notify-telegram.sh"
   printf '%s' "$MESSAGE_MRKDWN" | "$NOTIFY" --silent-fail --title "Book Club — <type> (<book_title>)"
   ```

   If `automation/notify-telegram.sh` is not found, fall back to printing the message and tell the
   user to send it manually.

6. **Mark sent.** Update the entry in `bookclub-timeline.json`: set `"sent": true` and
   `"sent_at": "<ISO timestamp>"`. Preserve all other fields and entries. Write the file back.

7. **Report.** Summarize per book: which types were dispatched, which were already sent, which
   are upcoming. With `--dry-run`, do steps 1–3 only and report what *would* be sent without
   generating, delivering, or modifying the timeline.

## Examples

```
/bookclub:dispatch                      # send today's due messages for all books
/bookclub:dispatch --dry-run            # preview only
/bookclub:dispatch --book klara_and_the_sun --date 2026-03-09
```
