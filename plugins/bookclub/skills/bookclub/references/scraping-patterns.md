# Scraping Patterns

CSS selectors and structured data patterns for extracting book information from common websites. Use these when the user provides a URL or DOM snapshot.

## General Strategy

1. **JSON-LD first** — look for `<script type="application/ld+json">` containing schema.org Book data
2. **Meta tags second** — Open Graph (`og:title`, `og:description`), Dublin Core, Twitter cards
3. **Site-specific selectors third** — CSS selectors for known sites
4. **Heuristic fallback** — heading + paragraph extraction for unknown sites

## JSON-LD / Schema.org

Many book pages include structured data. Look for:

```html
<script type="application/ld+json">
{
  "@type": "Book",
  "name": "Book Title",
  "author": { "@type": "Person", "name": "Author Name" },
  "isbn": "978-...",
  "numberOfPages": 307,
  "datePublished": "2021-03-02",
  "description": "...",
  "aggregateRating": { "ratingValue": "4.2", "ratingCount": "15000" },
  "genre": "Fiction",
  "publisher": { "@type": "Organization", "name": "Publisher Name" }
}
</script>
```

**Mapping to book-profile.json:**
| Schema.org field | Profile field |
|-----------------|---------------|
| `name` | `title` |
| `author.name` | `author` |
| `isbn` | `isbn` |
| `numberOfPages` | `page_count` |
| `datePublished` | `publication_year` (extract year) |
| `description` | Use as research input, but **paraphrase** for `synopsis` |
| `aggregateRating.ratingValue` | `rating.score` |
| `genre` | `genre` |

## Open Graph Meta Tags

```html
<meta property="og:title" content="Book Title" />
<meta property="og:description" content="..." />
<meta property="og:image" content="https://..." />
<meta property="og:url" content="https://..." />
<meta property="og:type" content="book" />
<meta property="book:author" content="Author Name" />
<meta property="book:isbn" content="978-..." />
```

## Goodreads

### Key Selectors

```
Title:          h1[data-testid="bookTitle"]
                — or —
                h1.Text__title1
Author:         span.ContributorLink__name
                — or —
                a.authorName span[itemprop="name"]
Rating:         div.RatingStatistics__rating
Rating count:   span[data-testid="ratingsCount"]
Page count:     p[data-testid="pagesFormat"]
                — or —
                span[itemprop="numberOfPages"]
Published:      p[data-testid="publicationInfo"]
Description:    div.BookPageMetadataSection__description span.Formatted
                — or —
                div#description span[style*="display:none"]  (hidden full text)
Genres:         span.BookPageMetadataSection__genreButton a
                — or —
                a.actionLinkLite.bookPageGenreLink
Cover image:    img.ResponsiveImage[alt*="cover"]
                — or —
                div.BookCover img
ISBN:           div[data-testid="contentContainer"] (look for "ISBN" text)
```

### Notes
- Goodreads renders dynamically — WebFetch may get a partial page
- The description often has a truncated version visible and full version hidden
- Genre links are more reliable than any single genre field

## Amazon

### Key Selectors

```
Title:          span#productTitle
Author:         span.author a.contributorNameID
                — or —
                a.a-link-normal[data-asin]  (in byline)
Rating:         span.a-icon-alt  (e.g., "4.5 out of 5 stars")
Rating count:   span#acrCustomerReviewCount
Price:          span.a-price span.a-offscreen
Page count:     Look in "Product details" or "Book details" section
                div#detailBullets_feature_div  (search for "pages")
Publisher:      div#detailBullets_feature_div  (search for "Publisher")
Description:    div#bookDescription_feature_div span
                — or —
                div[data-a-expander-name="book_description_expander"]
Cover image:    img#imgBlkFront
                — or —
                img#landingImage
ISBN:           div#detailBullets_feature_div  (search for "ISBN-13")
```

### Notes
- Amazon pages are heavily JavaScript-dependent — WebFetch results may be limited
- Product details are often in a structured bullet list, not clean selectors
- Multiple price formats exist; don't try to parse all of them

## Publisher Sites (Common CMS Patterns)

Many publisher sites use WordPress or custom CMS with predictable patterns:

```
Title:          h1.book-title, h1.product-title, h1[class*="title"]
Author:         .book-author, .product-author, [class*="author"]
Description:    .book-description, .product-description, [class*="synopsis"]
Cover:          .book-cover img, .product-image img
```

### Common Publishers
- **Penguin Random House**: `penguinrandomhouse.com` — well-structured with JSON-LD
- **HarperCollins**: `harpercollins.com` — JSON-LD and clean HTML
- **Macmillan**: `us.macmillan.com` — structured data available
- **Faber & Faber**: `faber.co.uk` — clean HTML structure

## Open Library API (Fallback)

When scraping fails, use the Open Library API:

```
Search:   https://openlibrary.org/search.json?title={title}&author={author}
Book:     https://openlibrary.org/works/{work_id}.json
Cover:    https://covers.openlibrary.org/b/isbn/{isbn}-L.jpg
```

This is a free, no-auth API that returns structured JSON with title, author, publish date, page count, subjects, and cover URLs.

## Confidence Scoring

When scraping, assign confidence to each extracted field:

| Confidence | Meaning |
|-----------|---------|
| High | Extracted from structured data (JSON-LD, API) or unambiguous selector |
| Medium | Extracted from expected location but may need verification |
| Low | Extracted via heuristic or from unexpected DOM structure |

Flag any fields with Low confidence and suggest supplementing with WebSearch.
