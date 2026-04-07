---
description: Generate any book club message or material type
argument-hint: "[type: ...] [--book folder_slug] [--timing ...] [--pdf]"
---

# Generate Book Club Content

Generate: **$ARGUMENTS**

## Your Task

Read plugin settings, resolve the **book folder** under `output_root`, read `book-profile.json`, and generate the requested content. Write outputs into that same book folder (not the bare `output_root`, except legacy single-file layout).

## Content Types

### Slack Messages
These produce TWO versions each: Slack Block Kit JSON + plain mrkdwn.

| Type | Description | Template |
|------|-------------|----------|
| `announce` | Book of the month announcement with hook, dates, factoids, links, CTA | [slack-templates.md](../skills/bookclub/references/slack-templates.md#announcement) |
| `remind` | Reading reminder with countdown, page count, factoid. Add `--timing [1week\|3days\|tomorrow\|today]` | [slack-templates.md](../skills/bookclub/references/slack-templates.md#reminder) |
| `spark` | 3-5 pre-reading thought-provoking questions (theme-based, no spoilers) | [slack-templates.md](../skills/bookclub/references/slack-templates.md#spark-questions) |
| `articles` | Curated roundup of 3-5 related articles/interviews/podcasts | [slack-templates.md](../skills/bookclub/references/slack-templates.md#articles-roundup) |
| `recap` | Post-session summary template with discussion highlights | [slack-templates.md](../skills/bookclub/references/slack-templates.md#session-recap) |

### Document Materials
These produce Markdown output. Add `--pdf` flag to also generate PDF using the pdf skill.

| Type | Description | Template |
|------|-------------|----------|
| `guide` | Full discussion guide with categorized questions, author background, recommendations | [document-templates.md](../skills/bookclub/references/document-templates.md#discussion-guide) |
| `intro` | 3-5 minute facilitator introduction script with stage directions | [document-templates.md](../skills/bookclub/references/document-templates.md#book-introduction) |
| `cards` | Individual question cards (one per card) for printing or screen-sharing | [document-templates.md](../skills/bookclub/references/document-templates.md#question-cards) |
| `one-pager` | Visual summary with synopsis, themes, dates, links, and QR code | [document-templates.md](../skills/bookclub/references/document-templates.md#one-pager) |

## Steps

1. **Load plugin settings and resolve `book_dir`**
   - Read `.claude/bookclub.local.md` if present (YAML frontmatter). Default `output_root` to `.` if missing.
   - If arguments include `--book <folder_slug>`, set `book_dir` = `<output_root>/<folder_slug>` (must contain `book-profile.json`).
   - Otherwise apply the **book_dir resolution** rules in [SKILL.md](../skills/bookclub/SKILL.md#configuration) (`current_book_folder`, legacy flat profile, or single child folder).

2. **Read `book-profile.json`**
   - Path = `<book_dir>/book-profile.json`
   - If missing, tell the user to run `/bookclub:init` or fix `--book` / `current_book_folder`

3. **Identify the content type** from the arguments
   - Parse the type keyword and any flags (`--timing`, `--pdf`, `--book`)

4. **Load the appropriate template** from the reference files

5. **Follow the style guide** for Slack messages
   - See [slack-style-guide.md](../skills/bookclub/references/slack-style-guide.md)
   - Use labeled full URLs in mrkdwn (not Slack-only `<url|label>` syntax)

6. **Generate the content**
   - Fill templates with data from the book profile and config (`bookclub_name`, `discussion_venue`, etc.)
   - For Slack types: output Block Kit JSON + mrkdwn
   - For document types: output Markdown (+ PDF if `--pdf` flag)
   - For `one-pager`: generate QR code per [qr-code-generation.md](../skills/bookclub/references/qr-code-generation.md)

7. **Save output files** under `book_dir`
   - Slack messages: `bookclub-{type}.json` and `bookclub-{type}.md`
   - Documents: `bookclub-{type}.md` (and `.pdf` if requested)

## Examples

```
/bookclub:generate announce
/bookclub:generate remind --timing 3days
/bookclub:generate spark
/bookclub:generate guide --pdf
/bookclub:generate one-pager
/bookclub:generate announce --book klara_and_the_sun
```
