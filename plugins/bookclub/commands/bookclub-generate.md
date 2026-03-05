---
description: Generate any book club message or material type
argument-hint: "[type: announce|remind|spark|articles|recap|guide|intro|cards|one-pager]"
---

# Generate Book Club Content

Generate: **$ARGUMENTS**

## Your Task

Read the `book-profile.json` from the workspace, select the appropriate template, and generate the requested content type.

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

1. **Read `book-profile.json`** from the workspace
   - If it doesn't exist, tell the user to run `/bookclub:init` first

2. **Identify the content type** from the arguments
   - Parse the type keyword and any flags (`--timing`, `--pdf`)

3. **Load the appropriate template** from the reference files

4. **Follow the style guide** for Slack messages
   - See [slack-style-guide.md](../skills/bookclub/references/slack-style-guide.md)

5. **Generate the content**
   - Fill templates with data from the book profile
   - For Slack types: output Block Kit JSON + mrkdwn
   - For document types: output Markdown (+ PDF if `--pdf` flag)
   - For `one-pager`: generate QR code per [qr-code-generation.md](../skills/bookclub/references/qr-code-generation.md)

6. **Save output files**
   - Slack messages: save as `bookclub-{type}.json` and `bookclub-{type}.md`
   - Documents: save as `bookclub-{type}.md` (and `.pdf` if requested)

## Examples

```
/bookclub:generate announce
/bookclub:generate remind --timing 3days
/bookclub:generate spark
/bookclub:generate guide --pdf
/bookclub:generate one-pager
```
