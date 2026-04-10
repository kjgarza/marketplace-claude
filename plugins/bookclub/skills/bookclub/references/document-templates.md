# Document Templates

Templates for session materials generated as Markdown (and optionally PDF).

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
- [Amazon.de]({links.amazon_de})
- [buch7]({links.buch7})
- [Medimops]({links.medimops})
- [Goodreads]({links.goodreads})

---

[QR Code: {qr_target_url}]
*Scan to get the book*
```

### Guidelines
- Keep it to one page when printed (aim for ~300 words max)
- **Synopsis**: Must be exactly 3-4 sentences. No more, no less. Paraphrase; do not copy publisher copy.
- **Reading Schedule dates**: If `announcement_date`, `reading_date`, or `discussion_date` is null or missing in `book-profile.json`, derive sensible dates from today: announcement = today, reading finish = 3 weeks from today, discussion = 4 weeks from today. Never output "TBD" or leave date fields blank.
- QR code is generated via Python `qrcode` library; see [qr-code-generation.md](qr-code-generation.md)
- Generated body copy (synopsis, hooks, badges text): no em dashes (—); use commas, periods, colons, or parentheses
- When generating PDF, use clean layout with generous whitespace
- Themes displayed as inline badges/tags
