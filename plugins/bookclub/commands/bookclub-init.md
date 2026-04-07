---
description: Set up a new book of the month with research and enrichment
argument-hint: "[book title] by [author]"
---

# Initialize Book of the Month

Set up: **$ARGUMENTS**

## Your Task

Research and enrich the book above, then create **a book folder** under `output_root` and save `book-profile.json` inside it. The folder name is a **snake_case slug** from the book title (e.g. `the_great_gatsby`). That folder holds this book’s profile and all later `bookclub-*` outputs.

## Steps

0. **Load plugin settings**
   - If `.claude/bookclub.local.md` exists in the project root, read its YAML frontmatter (see [SKILL.md](../skills/bookclub/SKILL.md#configuration)).
   - Resolve `output_root` (default `.`). Ensure the directory exists (`mkdir -p` when needed).
   - Remember `bookclub_name`, `discussion_venue`, and other fields for later generate steps (e.g. use `discussion_venue` in reminders when the profile has no explicit meeting line).

1. **Parse the input**
   - Extract book title and author from the arguments
   - If the user provides additional info (reading date, discussion date, purchase link, URL), capture those too

2. **Research the book**
   - Use WebSearch to find comprehensive metadata:
     - Full title, author, author bio (2-3 sentences)
     - Publication year, genre, page count, ISBN
     - Synopsis (3-5 sentences, **paraphrased in your own words**)
     - Average rating and source (e.g., Goodreads)
     - Notable awards
     - Key themes (3-5)
     - 5 interesting factoids (surprising things most readers wouldn't know)
   - Find purchase/info links (prioritize German/local sources):
     - Thalia.de (German bookstore)
     - Amazon.de (German Amazon)
     - Shakespeare and Sons (local Berlin bookshop — check `shakespeareandsons.com/products/{slug}`)
     - Goodreads (for reviews and community info)
     - Publisher page
   - Find 3-5 related articles: reviews, author interviews, thematic essays

3. **Optionally scrape a provided URL**
   - If the user provides a Goodreads/Amazon/Thalia/Shakespeare and Sons URL or DOM snapshot, use WebFetch to extract data
   - Apply scraping patterns from [scraping-patterns.md](../skills/bookclub/references/scraping-patterns.md)
   - Supplement with web search for any missing fields

4. **Create the book folder and save `book-profile.json`**
   - Compute `folder_slug` from the book title per [SKILL.md path rules](../skills/bookclub/SKILL.md#configuration) (snake_case; resolve `_2`, `_3`, … on collision with a different book)
   - `book_dir` = `<output_root>/<folder_slug>/` — `mkdir -p` as needed
   - Follow the schema in [book-profile-schema.md](../skills/bookclub/references/book-profile-schema.md); include **`folder_slug`** in the JSON
   - Save to `<book_dir>/book-profile.json`
   - If no config file exists, mention that the user can add `.claude/bookclub.local.md` from [settings-template.md](../settings-template.md)
   - If multiple books may live under `output_root`, suggest setting `current_book_folder: <folder_slug>` in `bookclub.local.md`
   - Display a summary, including **`book_dir`** and the profile path

5. **Propose a timeline**
   - If reading/discussion dates are provided, suggest a communication schedule
   - Show which `/bookclub:generate` types to run and when
   - Ask if the user wants to generate the full timeline with `/bookclub:timeline`

## Reference Files

- [Book profile schema](../skills/bookclub/references/book-profile-schema.md) — JSON structure and field descriptions
- [Scraping patterns](../skills/bookclub/references/scraping-patterns.md) — CSS selectors for common book sites

## Example

```
/bookclub:init "The Great Gatsby" by F. Scott Fitzgerald, reading date March 15, discussion March 20
```

This creates `<output_root>/<folder_slug>/book-profile.json` with all enriched metadata and proposes a communication timeline based on the dates.
