# Slack Message Templates

All Slack message templates for book club communications. Each template uses `{variable}` placeholders that map to fields in `book-profile.json`.

When **filling** placeholders with real prose, follow [slack-style-guide.md](slack-style-guide.md#punctuation-in-generated-copy): member-facing text must not use em dashes (—).

**Plugin config** (`.claude/bookclub.local.md`): When `bookclub_name` is set, prefix the main announcement-style headline with `{bookclub_name} · ` before "Book of the Month" (see [SKILL.md](../SKILL.md#configuration)). Use `discussion_venue` from config in reminder bodies when the profile lacks a concrete location line.

---

## Announcement

The flagship message introducing the book of the month.

### mrkdwn Template

Default headline (no `bookclub_name` in config):

```
:books: *Book of the Month: _{title}_ by {author}* :books:
```

When `bookclub_name` is set in `.claude/bookclub.local.md`, use:

```
:books: *{bookclub_name} · Book of the Month: _{title}_ by {author}* :books:
```

Body:

```
{hook: 2-3 sentences on why this book is exciting, what makes it stand out}

:calendar: {reading_date} · Discussion: {discussion_date}

:brain: *Did you know?*
• {factoid_1}
• {factoid_2}

:link: *Get the book*
Amazon.de: {links.amazon_de}
buch7: {links.buch7}
Medimops: {links.medimops}
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

A single 1-week-out reminder, encouraging and casual.

### mrkdwn Template

```
:alarm_clock: *One week until we discuss _{title}_!*

Still haven't started? No worries. At {page_count} pages, that's about {estimated_reading_hours} hours of reading. Totally doable this week.
:bulb: Keep in mind as you read: {factoid}

Grab a copy if you need it: {links.amazon_de}
How far along are you? Drop your page number below! :book:
```

---

## Eve

Day-before reminder plus low-pressure spark questions. Structure: **one generic** (any book), **one or two** that need this title (~first half read), **one theme** (last). Avoid spoiling the back half. Sent the evening/day before the discussion session.

### mrkdwn Template

```
:alarm_clock: *Tomorrow: _{title}_ discussion!*

Last chance to wrap up, or at least get past the halfway point. Not quite there? Come anyway; the group is better with you in it.

:calendar: {discussion_date} | {discussion_venue}

:thought_balloon: *Warm up for tomorrow: a few questions to think about tonight:*
1. {spark_question_1}
2. {spark_question_2}
3. {spark_question_3}
4. {spark_question_4}

No wrong answers. Bring your thoughts tomorrow! :raised_hands:
```

### Block Kit Structure

```json
{
  "blocks": [
    {
      "type": "header",
      "text": { "type": "plain_text", "text": "Tomorrow: {title} discussion!" }
    },
    {
      "type": "section",
      "text": { "type": "mrkdwn", "text": "Last chance to wrap up, or at least get past the halfway point. Not quite there? Come anyway; the group is better with you in it.\n\n:calendar: {discussion_date} | {discussion_venue}" }
    },
    { "type": "divider" },
    {
      "type": "section",
      "text": { "type": "mrkdwn", "text": ":thought_balloon: *Warm up for tomorrow: a few questions to think about tonight:*\n1. {spark_question_1}\n2. {spark_question_2}\n3. {spark_question_3}\n4. {spark_question_4}" }
    },
    {
      "type": "context",
      "elements": [
        { "type": "mrkdwn", "text": "No wrong answers. Bring your thoughts tomorrow! :raised_hands:" }
      ]
    }
  ]
}
```

### Question Guidelines

- **Audience**: Assume people have read **at least ~the first 50%** for the book-specific prompts. The **generic** question must not require having read *this* book. Book-specific and theme prompts can reference early-to-mid setup, tone, and characters readers will have met by then. Do **not** spoil twists, endings, or major late-book reveals.
- **Count**: Use **3 or 4 numbered questions** total: **1 generic + 1 or 2 book-specific + 1 theme** (theme is always exactly one).
- **Mix (required)**  
  - **Question 1, generic:** One **super-generic** warm-up that could apply to **almost any** book club pick (reading habits, mood, format, where/when they read, snack-tier jokes, “one word for how it’s going,” etc.). **No** plot, setting, or character names from this title.  
  - **Questions 2 (and optionally 3), book-specific:** **One or two** prompts that only make sense if someone has **actually read this book** (a moment, voice, character choice, scene, or detail from roughly the first half).  
  - **Last question, theme:** **Exactly one** accessible **theme-level** prompt (patterns, what the story might be exploring, a light “what do you think the book is asking about…” angle). Put it **last** always.
- **Three-question set:** Drop the **second** book-specific slot: order is generic → book-specific → theme (use only `{spark_question_1}` through `{spark_question_3}`; omit line 4 or leave the fourth line out of the posted message).
- **Four-question set:** Use all four placeholders: generic → book-specific → book-specific → theme.
- **Tone**: **Easy to answer, low-pressure**: short Slack replies, no homework vibe. Favor curiosity over correctness.
- **Personality**: Invite voice: preferences, gut reactions, what stuck with them, light comparison to their own life (one-liners welcome, not essays).
- **Example** (four questions, AI companion novel): 1) “Book club month: are you a steady-pages person or a finish-the-night-before sprinter?” 2) “What’s one detail of Klara’s voice or point of view that stuck with you in the first half?” 3) “Which space she’s in so far (shop, street, home) felt most vivid to you, and why?” 4) “By halfway, what do you think the book is really asking about care or dependence, and does that match anything you’ve seen in real life?”

---

## Articles Roundup

Curated related reading to deepen engagement.

### mrkdwn Template

```
:studio_microphone: *Going deeper with _{title}_*

Want more context? Great companion pieces:
:one: *{article_1_title}* ({article_1_source}): {article_1_summary}
{article_1_url}
:two: *{article_2_title}* ({article_2_source}): {article_2_summary}
{article_2_url}
:three: *{article_3_title}* ({article_3_source}): {article_3_summary}
{article_3_url}

Found something else worth sharing? Drop it in the thread! :link:
```

### Article Selection Criteria

- Prioritize: author interviews, thematic essays, review round-ups, podcast episodes
- Avoid: spoiler-heavy plot summaries, academic papers (unless the book is nonfiction)
- Each article gets: **bold** title (use `*title*` not `_title_`), source name in parentheses, 1-sentence summary, then the full URL on its own line (copy-paste friendly; not `<url|title>` mrkdwn). Do NOT italicize article titles; they must be bold.

