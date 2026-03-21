---
description: Set up a new book of the month with research and enrichment
argument-hint: "[book title] by [author]"
---

# Initialize Book of the Month

Set up: **$ARGUMENTS**

## Your Task

Research and enrich the book above, then save a structured `book-profile.json` to the workspace. This profile becomes the single source of truth for all subsequent bookclub commands.

## Steps

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

4. **Save `book-profile.json`**
   - Follow the schema in [book-profile-schema.md](../skills/bookclub/references/book-profile-schema.md)
   - Save to the current workspace directory
   - Display a summary of what was found

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

This creates a `book-profile.json` with all enriched metadata and proposes a communication timeline based on the dates.
