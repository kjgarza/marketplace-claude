---
name: bookclub
description: "Book club management: generate Slack announcements, reminders, spark questions, article roundups, recaps, discussion guides, one-pagers, and communication timelines. Use when user mentions book club, reading group, book of the month, or wants book-club-related communications or materials."
---

# Book Club Management

Automate every aspect of running a recurring book club: research books, generate Slack messages, create session materials, and plan communication schedules.

## When to Use This Skill

Trigger when the user:
- Mentions "book club", "reading group", or "book of the month"
- Asks to generate Slack messages about a book
- Asks for discussion questions, reading guides, or session materials
- Wants to announce, remind, or promote a book reading
- Asks for a QR code, one-pager, or visual summary for a book
- Wants a timeline or schedule for book club communications
- Asks to scrape or look up book data from a URL

## Commands

| Command | Description |
|---------|-------------|
| `/bookclub:init [title] by [author]` | Set up book of the month — research, enrich, save `book-profile.json` |
| `/bookclub:generate [type]` | Generate any message or material (see types below) |
| `/bookclub:timeline [cadence]` | Generate full communication schedule |

### Generate Types

**Slack messages** (output: Block Kit JSON + mrkdwn):
- `announce` — Book announcement with hook, dates, factoids, links
- `remind` — Reading reminder (use `--timing 1week|3days|tomorrow|today`)
- `spark` — Pre-reading thought-provoking questions
- `articles` — Related articles/interviews roundup
- `recap` — Post-session summary template

**Documents** (output: Markdown, optionally PDF with `--pdf`):
- `guide` — Discussion guide with categorized questions
- `intro` — Facilitator introduction script (3-5 min)
- `cards` — Individual question cards for printing
- `one-pager` — Visual summary with QR code

## Workflow

```
1. /bookclub:init "Book Title" by Author Name
   → Researches book, saves book-profile.json

2. /bookclub:timeline monthly
   → Generates full schedule of messages and materials

3. /bookclub:generate announce
   → Generates announcement (repeat for each type as scheduled)
```

The `book-profile.json` is the single source of truth. All generate commands read from it.

## Book Profile

The init command creates a `book-profile.json` containing:
- **Metadata**: title, author, author_bio, publication_year, genre, page_count, isbn
- **Content**: synopsis (paraphrased), themes, factoids, awards
- **Links**: amazon_de, buch7, medimops, goodreads, publisher, library
- **Articles**: 3-5 related articles with title, source, url, summary
- **Dates**: announcement_date, reading_date, discussion_date
- **Assets**: cover_image_url, qr_target_url

Full schema: [references/book-profile-schema.md](references/book-profile-schema.md)

## Slack Message Guidelines

- **Tone**: Enthusiastic but not cheesy. Smart-casual. The friend who always has great book recommendations
- **Structure**: Hook -> Body -> CTA. Every message ends with a clear call to action
- **Format**: Slack mrkdwn (`*bold*`, `_italic_`, `:emoji:`, `>` quotes)
- **Length**: Announcements ~120-180 words, reminders ~80-120 words
- **Emoji**: 2-4 relevant emojis per message. Prefer: :books: :book: :brain: :bulb: :calendar:
- **Links**: Format as `<url|Display Text>`, group in a links section

Full style guide: [references/slack-style-guide.md](references/slack-style-guide.md)
All templates: [references/slack-templates.md](references/slack-templates.md)

## Document Generation

Discussion guides, introductions, and one-pagers are generated as Markdown by default. Use the `--pdf` flag to also produce PDF output via the pdf skill from kjgarza-product.

For QR codes on one-pagers, use the Python `qrcode` library. See [references/qr-code-generation.md](references/qr-code-generation.md).

All document templates: [references/document-templates.md](references/document-templates.md)

## Web Scraping

When the user provides a book URL or DOM snapshot:
1. Use WebFetch to retrieve the page (or parse provided DOM directly)
2. Look for JSON-LD structured data and schema.org Book markup first
3. Fall back to site-specific CSS selectors (Goodreads, Amazon, etc.)
4. Fall back to meta tags (Open Graph, Dublin Core)
5. Supplement any missing fields with WebSearch

Scraping patterns: [references/scraping-patterns.md](references/scraping-patterns.md)

## Copyright

- Never reproduce publisher synopses or blurbs verbatim — always paraphrase
- Attribute ratings and awards to their source
- When citing articles, include title, source, and URL

## Examples

- [Example announcement (Block Kit JSON)](../../examples/example-announcement.json)
- [Example discussion guide](../../examples/example-discussion-guide.md)
