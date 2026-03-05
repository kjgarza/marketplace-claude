# Document Templates

Templates for session materials generated as Markdown (and optionally PDF).

---

## Discussion Guide

A comprehensive guide for facilitating a book club discussion session.

### Structure

```markdown
# Discussion Guide: {title} by {author}

## Book Overview
- **Title**: {title}
- **Author**: {author}
- **Genre**: {genre}
- **Pages**: {page_count}
- **Published**: {publication_year}
- **Themes**: {themes as comma-separated list}

## About the Author
{2-3 paragraphs on the author's background, career, and what led them to write
this book. Include relevant context about their other works and perspective.}

## Historical & Cultural Context
{1-2 paragraphs placing the book in its cultural moment. What was happening in
the world when it was written? What traditions or movements does it respond to?}

## Discussion Questions

### Opening Questions (warm-up)
1. {easy, personal question to get people talking}
2. {question about first impressions or reading experience}
3. {question about expectations vs. reality}

### Theme Exploration
4. {deep dive into theme 1}
5. {deep dive into theme 1, different angle}
6. {deep dive into theme 2}
7. {deep dive into theme 2, different angle}
8. {deep dive into theme 3}

### Character Questions
9. {question about main character motivations}
10. {question about character arcs or relationships}
11. {question about a secondary character's role}
12. {question about character relatability}

### Broader Connections
13. {how does this book connect to current events?}
14. {how does it connect to personal experience?}
15. {how does it relate to other books or media?}

## If You Liked This, Try...
1. **{rec_title_1}** by {rec_author_1} — {1-sentence reason}
2. **{rec_title_2}** by {rec_author_2} — {1-sentence reason}
3. **{rec_title_3}** by {rec_author_3} — {1-sentence reason}
```

### Guidelines
- Questions should be open-ended, not yes/no
- Opening questions should require no deep analysis — just personal reaction
- Theme questions should invite disagreement and multiple perspectives
- Broader connections ground the book in lived experience
- Recommendations should share thematic DNA, not just genre

---

## Book Introduction

A 3-5 minute spoken introduction script for the session facilitator.

### Structure

```markdown
# Introduction: {title} by {author}

## Opening Hook
[Deliver with energy, standing if possible]

{1-2 sentences that hook the audience — a surprising factoid, a provocative
question, or a vivid scene-setting moment related to the book's themes.}

## Why This Book
[Conversational tone]

{2-3 sentences on why this book was chosen. What makes it relevant now?
What's the conversation it sparks?}

## About the Author
[Brief, human, not a Wikipedia entry]

{3-4 sentences on the author. Focus on what shaped their perspective
and how it connects to this book.}

## What to Pay Attention To
[Lean in, slightly conspiratorial]

{2-3 specific things to notice or think about. These aren't questions —
they're lenses for the discussion.}

- {lens_1}
- {lens_2}
- {lens_3}

## Opening Question
[Pause after asking, give people time to think]

{One strong opening question that everyone can answer regardless of how
much they read. Should be personal, not analytical.}

[Wait for 2-3 responses before moving to the discussion guide]
```

### Guidelines
- Write in natural spoken language, not essay prose
- Include stage directions in square brackets: `[pause]`, `[show cover]`, `[make eye contact]`
- Target 3-5 minutes when read at a natural speaking pace (~130 words/minute)
- The opening question should be the bridge into the discussion guide

---

## Question Cards

Individual question cards suitable for printing, cutting, or screen-sharing.

### Structure

Generate as a Markdown table with one question per row:

```markdown
# Question Cards: {title} by {author}

| # | Category | Question | Hint |
|---|----------|----------|------|
| 1 | Opening | {question} | {optional context or follow-up prompt} |
| 2 | Opening | {question} | {hint} |
| 3 | Theme | {question} | {hint} |
| 4 | Theme | {question} | {hint} |
| 5 | Theme | {question} | {hint} |
| 6 | Character | {question} | {hint} |
| 7 | Character | {question} | {hint} |
| 8 | Connection | {question} | {hint} |
| 9 | Connection | {question} | {hint} |
| 10 | Wildcard | {question} | {hint} |
```

### Guidelines
- Include 10-12 cards total
- Shuffle categories — don't group all theme questions together
- Hints should be brief prompts, not answers: "Think about chapter 3" or "Consider the ending"
- Wildcard questions are fun/creative: "If this book were a meal, what would it be?"
- Cards should work independently — each is self-contained

---

## One-Pager

A single-page visual summary for printing or digital sharing.

### Structure

```markdown
# {title}
### by {author}

---

**Genre**: {genre} | **Pages**: {page_count} | **Published**: {publication_year}

## Synopsis
{3-4 sentence synopsis, paraphrased}

## Key Themes
`{theme_1}` `{theme_2}` `{theme_3}` `{theme_4}` `{theme_5}`

## Did You Know?
- {factoid_1}
- {factoid_2}
- {factoid_3}

## Reading Schedule
- **Start reading by**: {announcement_date}
- **Finish by**: {reading_date}
- **Discussion**: {discussion_date}

## Get the Book
- [Amazon]({links.amazon})
- [Bookshop.org]({links.bookshop})
- [Goodreads]({links.goodreads})

---

[QR Code: {qr_target_url}]
*Scan to get the book*
```

### Guidelines
- Keep it to one page when printed (aim for ~300 words max)
- QR code is generated via Python `qrcode` library — see [qr-code-generation.md](qr-code-generation.md)
- When generating PDF, use clean layout with generous whitespace
- Themes displayed as inline badges/tags
