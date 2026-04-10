---
name: bookclub
description: "Book club management: generate Slack announcements, reminders, article roundups, eve (day-before + spark questions), one-pagers, and communication timelines. Use when user mentions book club, reading group, book of the month, or wants book-club-related communications or materials."
---

# Book Club Management

Automate every aspect of running a recurring book club: research books, generate Slack messages, create session materials, and plan communication schedules.

## Configuration

Read **`.claude/bookclub.local.md`** in the project root if it exists. Parse the **YAML frontmatter** for the fields below. If the file is missing, use the defaults. Do not block init or generate.

**Template to copy:** [settings-template.md](../../settings-template.md) → save as `.claude/bookclub.local.md`.

| Field | Default (no config file) | Description |
|-------|--------------------------|-------------|
| `output_root` | `.` | Root directory; each book is a subfolder `<folder_slug>/` with its own `book-profile.json` and `bookclub-*` files. Relative paths resolve from the workspace root. |
| `bookclub_name` | *(unset)* | Full name for branding (e.g. "Digital Science Reads"). See Slack headers below. |
| `bookclub_short_name` | *(unset)* | Short label for one-pagers or buttons when space is tight. |
| `slack_channel` | *(unset)* | e.g. `#book-club`; include in runbooks or timeline notes when useful. |
| `discussion_venue` | *(unset)* | Default "where / how we meet" line for reminders if not in the book profile. |
| `organizer_contact` | *(unset)* | Facilitator contact (Slack handle, email). |
| `timezone` | *(unset)* | IANA timezone for schedule wording when you need explicit TZ context. |
| `current_book_folder` | *(unset)* | Name of the book subfolder under `output_root` (e.g. `klara_and_the_sun`). **Required when more than one book folder exists**; optional when only one book. |

**Per-book layout**

Each book has its own directory under `output_root`:

- `book_dir` = `<output_root>/<folder_slug>/`
- `book_profile_path` = `<book_dir>/book-profile.json`
- Generated files (`bookclub-announce.md`, `bookclub-timeline.json`, etc.) live in the same `book_dir`.

**`folder_slug` (directory name)** is derived from the book `title` at init time:

1. Lowercase; replace `&` with ` and `.
2. Replace any sequence of non-alphanumeric characters with a single `_`.
3. Trim leading/trailing `_`. If the result is empty, use `book`.
4. **Collisions:** If `<output_root>/<folder_slug>/` already exists and contains a `book-profile.json` for a *different* book (different normalized title+author), append `_2`, `_3`, … until the path is free or matches the same book (then reuse the folder for re-init).

**Resolving `book_dir` for generate / timeline**

1. Read config: `output_root`, optional `current_book_folder`.
2. If `current_book_folder` is set: `book_dir` = `<output_root>/<current_book_folder>`; require `book-profile.json` there.
3. Else if `<output_root>/book-profile.json` exists **and** no immediate child directory of `output_root` contains a `book-profile.json`: **legacy layout**; then `book_dir` = `output_root`.
4. Else: collect each immediate child directory of `output_root` that contains `book-profile.json`. If exactly one, use it as `book_dir`. If zero, tell the user to run `/bookclub:init`. If more than one, tell the user to set `current_book_folder` or pass `--book <folder_slug>` on the command.

Create `output_root` and `book_dir` with `mkdir -p` before writing when they do not exist.

**Slack headers:** Prefix announcement-style titles with `{bookclub_name} · ` only when `bookclub_name` is set to a non-empty value in `bookclub.local.md` (e.g. `*DS Reads · Book of the Month: _{title}_*`). If there is no config file or the key is blank, use the template headline without that prefix. For generic copy in documents when no name is configured, you may use the words "book club" in normal sentence case.

## When to Use This Skill

Trigger when the user:
- Mentions "book club", "reading group", or "book of the month"
- Asks to generate Slack messages about a book
- Asks for discussion questions or session materials
- Wants to announce, remind, or promote a book reading
- Asks for a QR code, one-pager, or visual summary for a book
- Wants a timeline or schedule for book club communications
- Asks to scrape or look up book data from a URL

## Commands

| Command | Description |
|---------|-------------|
| `/bookclub:init [title] by [author]` | Set up book of the month: research, enrich, create `<output_root>/<folder_slug>/`, save profile there |
| `/bookclub:generate [type]` | Generate any message or material (optional `--book <folder_slug>` when multiple books) |
| `/bookclub:timeline [cadence]` | Generate full communication schedule (optional `--book <folder_slug>`) |

### Generate Types

**Slack messages** (output: Block Kit JSON + mrkdwn):
- `announce`: Book announcement with hook, dates, factoids, links
- `remind`: 1-week-out reading reminder with page count, factoid, purchase link
- `articles`: Related articles/interviews roundup
- `eve`: Day-before reminder plus 3 low-pressure spark questions (default): **1 generic** (any book), **1 book-specific** (~first half), **1 theme** (last). Only use 4 if message stays under 170 words. See [slack-templates.md Eve → Question Guidelines](references/slack-templates.md#eve)

**Documents** (output: Markdown, optionally PDF with `--pdf`):
- `one-pager`: Visual summary with QR code

## Workflow

```
1. /bookclub:init "Book Title" by Author Name
   → Researches book, creates `<output_root>/<folder_slug>/`, saves `book-profile.json` there

2. /bookclub:timeline monthly
   → Generates full schedule under that book folder

3. /bookclub:generate announce
   → Writes outputs into the same book folder (repeat for each type as scheduled)
```

The `book-profile.json` inside each book folder is the single source of truth for that title. Resolve which folder using config + rules above.

## Book Profile

The init command creates a `book-profile.json` containing:
- **Paths**: `folder_slug` is the directory name under `output_root` (snake_case from title; set at init)
- **Metadata**: title, author, author_bio, publication_year, genre, page_count, isbn
- **Content**: synopsis (paraphrased), themes, factoids, awards
- **Links**: amazon_de, buch7, medimops, goodreads, publisher, library
- **Articles**: 3-5 related articles with title, source, url, summary
- **Dates**: announcement_date, reading_date, discussion_date
- **Assets**: cover_image_url, qr_target_url

Full schema: [references/book-profile-schema.md](references/book-profile-schema.md)

## Handling Null Dates

If `reading_dates` fields in `book-profile.json` are `null` or missing, derive sensible defaults from today's date:
- `announcement_date` = today
- `reading_date` = 3 weeks from today
- `discussion_date` = 4 weeks from today
Never output "TBD" or leave date placeholders empty. Always show concrete dates.

## Slack Message Guidelines

- **Tone**: Enthusiastic but not cheesy. Smart-casual. The friend who always has great book recommendations
- **Structure**: Hook -> Body -> CTA. Every message ends with a clear call to action
- **Format**: Slack mrkdwn (`*bold*`, `_italic_`, `:emoji:`, `>` quotes)
- **Punctuation in generated copy**: Do not use em dashes (—) in member-facing Slack text. Use commas, periods, colons, or parentheses instead (see [slack-style-guide.md](references/slack-style-guide.md#punctuation-in-generated-copy)).
- **Length (STRICT hard limits — violations are failures)**:
  - Announcements: 120-220 words
  - Reminders: 80-115 words
  - Articles roundup: 100-145 words
  - Eve: 120-175 words
  Count every word in your final output before emitting it. If over the limit, remove words until compliant. URLs count as one word each. Emoji shortcodes (`:emoji:`) count as one word each.
- **Output only the message**: Never append explanations, notes, commentary, or instructions after the message. The output must be the Slack message and nothing else.
- **Emoji**: 2-4 relevant emojis per message. Prefer: :books: :book: :brain: :bulb: :calendar:
- **Links**: Use labeled full URLs (one per line) under a :link: section, not `<url|label>` mrkdwn, which breaks when copy-pasted outside Slack

Full style guide: [references/slack-style-guide.md](references/slack-style-guide.md)
All templates: [references/slack-templates.md](references/slack-templates.md)

## Timeline Generation

The `/bookclub:timeline` command produces a full communication schedule for a book club cycle. Output **both** formats:

1. **Markdown table** with columns: Date, Type, Command, Description. Must have at least 6 rows covering the full cycle.
2. **Structured JSON** in a ` ```json ` code block: an array of objects, each with `date`, `type`, `command`, and `description` fields. Must have at least 6 entries.

**Required schedule items** (all must appear in both the table and the JSON):
- `announcement` — book reveal
- `articles` — related articles roundup
- `remind` — 1-week-out reminder
- `eve` — day-before spark questions
- `one-pager` — printable summary
- `discussion` — discussion day

When dates are null in the book profile, derive them: announcement = today, articles = 1 week later, remind = 3 weeks later, one-pager = 3.5 weeks later, eve = day before discussion, discussion = 4 weeks from announcement.

## Document Generation

One-pagers are generated as Markdown by default. Use the `--pdf` flag to also produce PDF output via the pdf skill from kjgarza-product.

In **one-pager body copy** (synopsis, hooks, labels), follow the same rule as Slack: no em dashes (—) in generated member-facing text; prefer commas, periods, colons, or parentheses.

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

- Never reproduce publisher synopses or blurbs verbatim; always paraphrase
- Attribute ratings and awards to their source
- When citing articles, include title, source, and URL

## Examples

- [Example announcement (Block Kit JSON)](../../examples/example-announcement.json)
