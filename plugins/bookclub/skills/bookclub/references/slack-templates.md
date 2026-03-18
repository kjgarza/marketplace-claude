# Slack Message Templates

All Slack message templates for book club communications. Each template uses `{variable}` placeholders that map to fields in `book-profile.json`.

---

## Announcement

The flagship message introducing the book of the month.

### mrkdwn Template

```
:books: *Book of the Month: _{title}_ by {author}* :books:

{hook — 2-3 sentences on why this book is exciting, what makes it stand out}

:calendar: {reading_date} · Discussion: {discussion_date}

:brain: *Did you know?*
• {factoid_1}
• {factoid_2}

:link: *Get the book*
Amazon.de: {links.amazon_de}
buch7: {links.buch7}
Medimops: {links.medimops
Goodreads: {links.goodreads}

React with :book: if you're joining this month! :raised_hands:
```

### Block Kit Structure

```json
{
  "blocks": [
    {
      "type": "header",
      "text": { "type": "plain_text", "text": "Book of the Month: {title}" }
    },
    {
      "type": "section",
      "text": { "type": "mrkdwn", "text": "*_{title}_* by {author}\n\n{hook}" }
    },
    {
      "type": "section",
      "text": { "type": "mrkdwn", "text": ":calendar: {reading_date} · Discussion: {discussion_date}\n\n:brain: *Did you know?*\n• {factoid_1}\n• {factoid_2}" }
    },
    {
      "type": "actions",
      "elements": [
        { "type": "button", "text": { "type": "plain_text", "text": "Amazon.de" }, "url": "{links.amazon_de}" },
        { "type": "button", "text": { "type": "plain_text", "text": "buch7" }, "url": "{links.buch7}" },
        { "type": "button", "text": { "type": "plain_text", "text": "Medimops" }, "url": "{links.medimops}" },
        { "type": "button", "text": { "type": "plain_text", "text": "Goodreads" }, "url": "{links.goodreads}" }
      ]
    },
    {
      "type": "context",
      "elements": [
        { "type": "mrkdwn", "text": "React with :book: if you're joining this month! :raised_hands:" }
      ]
    }
  ]
}
```

---

## Reminder

Urgency-scaled reminders that adapt based on timing.

### Timing Variants

| Timing | Urgency | Tone |
|--------|---------|------|
| `1week` | Low | Encouraging, casual |
| `3days` | Medium | Motivating, specific |
| `tomorrow` | High | Urgent but friendly |
| `today` | Highest | Excited, it's happening! |

### mrkdwn Template

**1-week reminder:**
```
:alarm_clock: *One week until we discuss _{title}_!*

Still haven't started? No worries — at {page_count} pages, that's about {estimated_reading_hours} hours of reading. Totally doable this week.
:bulb: Keep in mind as you read: {factoid}

<{links.amazon_de}|Grab a copy> if you haven't yet. How far along are you? Drop your page number below! :book:
```

**3-day reminder:**
```
:alarm_clock: *3 days until our _{title}_ discussion!*

We're meeting on {discussion_date}. If you're not done yet, focus on the first half — you'll still have plenty to contribute.
> {theme_teaser — one-line thematic question to think about while reading}

Almost there! :raised_hands:
```

**Tomorrow reminder:**
```
:alarm_clock: *Tomorrow: _{title}_ discussion!*

Last chance to finish up! Even if you're not done, come anyway — the best conversations happen when people bring different perspectives.
:calendar: {discussion_date} | See you there!
```

**Day-of reminder:**
```
:books: *Today's the day! _{title}_ discussion happening now*

{discussion_time_and_location_if_available}
Bring your favorite passage, a burning question, or just your opinions. Let's go! :raised_hands:
```

---

## Spark Questions

Pre-reading conversation starters designed around themes, not plot.

### mrkdwn Template

```
:thought_balloon: *Before you read _{title}_ — let's warm up*

Themes: {theme_1}, {theme_2}, {theme_3}. Think about:
1. {spark_question_1}
2. {spark_question_2}
3. {spark_question_3}

Reply in thread — these are about *your* perspective, not the book's answers. :brain:
```

### Question Guidelines

- Questions must be answerable WITHOUT having read the book
- Focus on themes, not plot points
- Tie to personal experience or current events when possible
- Start with easier/more personal questions, build to abstract ones
- Example: For a book about AI consciousness: "At what point would you consider a machine to be 'alive'?"

---

## Articles Roundup

Curated related reading to deepen engagement.

### mrkdwn Template

```
:studio_microphone: *Going deeper with _{title}_*

Want more context? Great companion pieces:
:one: *<{article_1_url}|{article_1_title}>* ({article_1_source}) — {article_1_summary}
:two: *<{article_2_url}|{article_2_title}>* ({article_2_source}) — {article_2_summary}
:three: *<{article_3_url}|{article_3_title}>* ({article_3_source}) — {article_3_summary}

Found something else worth sharing? Drop it in the thread! :link:
```

### Article Selection Criteria

- Prioritize: author interviews, thematic essays, review round-ups, podcast episodes
- Avoid: spoiler-heavy plot summaries, academic papers (unless the book is nonfiction)
- Each article gets: title (as link), source name, 1-sentence summary

---

## Session Recap

Post-session summary to close the loop.

### mrkdwn Template

```
:memo: *_{title}_ — Discussion Recap*

Thanks to everyone who joined! Here's what we talked about:

*Key takeaways:*
• {takeaway_1}
• {takeaway_2}
• {takeaway_3}

*Standout quote:*
> "{quote_1}" — {quoter_1}

*Surprise of the session:* {surprise — something unexpected that came up}

:sparkles: *Coming up next month:* Stay tuned for our next pick announcement!
Missed the session? Reply in thread and we'll catch you up. :raised_hands:
```

### Recap Notes

- This template requires facilitator input — prompt the user to provide key takeaways, quotes, and surprises
- If no input provided, generate a blank template with placeholder prompts
- The "next month" teaser is optional — only include if the next book is known
