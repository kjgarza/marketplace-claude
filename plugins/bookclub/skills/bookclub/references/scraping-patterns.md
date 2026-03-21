# Scraping Patterns

CSS selectors and structured data patterns for extracting book information from common websites. Use these when the user provides a URL or DOM snapshot.

## General Strategy

1. **JSON-LD first** — look for `<script type="application/ld+json">` containing schema.org Book data
2. **Meta tags second** — Open Graph (`og:title`, `og:description`), Dublin Core, Twitter cards
3. **Readability extraction** — use Mozilla Readability to get clean article content from JS-heavy or blocker-prone pages (see below)
4. **Site-specific selectors** — CSS selectors for known sites
5. **Shopify JSON endpoint** — for Shopify stores, append `.json` to the product URL
6. **Heuristic fallback** — heading + paragraph extraction for unknown sites

## Mozilla Readability

[Mozilla Readability](https://github.com/mozilla/readability) extracts the main readable content from a page, stripping navigation, ads, and boilerplate. This is especially useful for sites that block automated scrapers (e.g., Thalia.de returns 403) or rely heavily on JavaScript rendering.

### When to Use
- WebFetch returns 403/empty/partial content
- Page is JS-rendered and selectors fail
- You need a clean text extraction without site-specific selectors
- Processing user-provided DOM snapshots or saved HTML

### Usage (Node.js)

```javascript
const { Readability } = require('@mozilla/readability');
const { JSDOM } = require('jsdom');

const dom = new JSDOM(htmlString, { url: pageUrl });
const reader = new Readability(dom.window.document);
const article = reader.parse();

// article.title      — page/book title
// article.byline     — author (if detected)
// article.content    — clean HTML of main content
// article.textContent — plain text of main content
// article.excerpt    — short description
```

### Extracting Book Data from Readability Output
After getting `article.textContent`, scan for:
- **ISBN**: regex `978[-\s]?\d[-\s]?\d{2}[-\s]?\d{5}[-\s]?\d` or `979[-\s]?\d[-\s]?\d{2}[-\s]?\d{5}[-\s]?\d`
- **Page count**: regex `(\d+)\s*(Seiten|pages|Seite|p\.)` (German + English)
- **Price**: regex `€\s?\d+[.,]\d{2}` or `EUR\s?\d+[.,]\d{2}`
- **Publisher**: look for "Verlag:", "Publisher:", "Herausgeber:" followed by text
- **Publication date**: look for "Erscheinungsdatum:", "Published:", or date patterns

### Notes
- Readability works best when paired with JSDOM for server-side use
- Combine with JSON-LD extraction — run both and merge results
- For Thalia.de specifically: if a user provides the HTML (e.g., via browser copy or saved page), Readability can parse it even though direct fetching is blocked

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
- Goodreads is the best source for ratings and community data regardless of market
- Use WebSearch with `site:goodreads.com {title} {author}` to find the book page
- For German-language editions, Goodreads may list them separately — check both editions

## Amazon.de (Primary — German Market)

### Key Selectors

```
Title:          span#productTitle
Author:         span.author a.contributorNameID
                — or —
                a.a-link-normal[data-asin]  (in byline)
Rating:         span.a-icon-alt  (e.g., "4,5 von 5 Sternen")
Rating count:   span#acrCustomerReviewCount
Price:          span.a-price span.a-offscreen  (EUR, comma decimal: €12,99)
Page count:     div#detailBullets_feature_div  (search for "Seiten" or "pages")
Publisher:      div#detailBullets_feature_div  (search for "Herausgeber" or "Verlag")
Description:    div#bookDescription_feature_div span
                — or —
                div[data-a-expander-name="book_description_expander"]
Cover image:    img#imgBlkFront
                — or —
                img#landingImage
ISBN:           div#detailBullets_feature_div  (search for "ISBN-13")
Language:       div#detailBullets_feature_div  (search for "Sprache")
```

### Notes
- Same selectors as Amazon.com but with German labels in product details
- Product detail labels: "Seitenzahl" (page count), "Herausgeber" (publisher), "Sprache" (language), "Erscheinungstermin" (publication date)
- Rating format uses comma: "4,5 von 5 Sternen" instead of "4.5 out of 5 stars"
- Price uses EUR with comma decimal: `€12,99`
- Date format: DD. MONAT YYYY (e.g., "2. März 2021")
- URL pattern: `amazon.de/dp/{ASIN}` or `amazon.de/{slug}/dp/{ASIN}`
- Heavily JavaScript-dependent — WebFetch results may be limited
- When searching, use `amazon.de site:amazon.de {title} {author}` via WebSearch

## Amazon.com (Fallback)

Same selectors as Amazon.de but with English labels. Use Amazon.de as the primary source since the book club is Germany-based.

## Thalia.de (German Bookstore)

### Key Selectors

```
Title:          h1[class*="product-title"], h1[data-test="product-title"]
Author:         a[class*="product-author"], [data-test="product-author"]
Rating:         [class*="rating"], [data-test="product-rating"]
Price:          [class*="product-price"], [data-test="product-price"]
Page count:     Look in "Produktdetails" section for "Seitenanzahl"
Publisher:      Look in "Produktdetails" for "Verlag"
ISBN:           Look in "Produktdetails" for "ISBN"
Description:    [class*="product-description"], div[data-test="product-description"]
Cover image:    img[class*="product-image"], img[data-test="product-image"]
EAN:            Look in "Produktdetails" for "EAN"
```

### URL Patterns
- Product page: `thalia.de/shop/home/artikeldetails/A{id}`
- Search: `thalia.de/shop/home/suche/?sq={query}`

### Notes
- Thalia blocks automated scrapers (403) — prefer WebSearch with `site:thalia.de {title} {author}` to find the product URL, then provide it to the user
- If the user provides saved HTML or a DOM snapshot from Thalia, use **Mozilla Readability** to extract clean content, then scan for metadata with the regex patterns above
- Thalia likely uses JSON-LD structured data — always check `<script type="application/ld+json">` first
- Product details section ("Produktdetails") contains: Seitenanzahl (pages), Verlag (publisher), Erscheinungsdatum (publication date), Sprache (language), ISBN, EAN
- Prices in EUR with comma decimal: `€12,99`
- Good source for German-language editions and availability

## Shakespeare and Sons (Local Berlin Bookshop — Shopify)

### Platform
Shopify store (`shakespeare-sons.myshopify.com`, theme: Modular)

### Key Selectors

```
Title:          .product-title__wrapper h1, h1.product-title
Author/Vendor:  Look in Shopify product JSON for "vendor" field
Price:          .cart-product-price, [data-price]
                — data-price value is in cents (e.g., 1295 = €12,95)
Description:    .product-description.rte
Cover image:    .product-image img
                — URL pattern: /cdn/shop/products/{filename}.jpg
```

### Shopify Product JSON
Shakespeare and Sons exposes Shopify product data at:
```
https://www.shakespeareandsons.com/products/{handle}.json
```

This returns structured JSON with:
```json
{
  "id": 4681948627047,
  "title": "Book Title",
  "vendor": "Author Name",
  "body_html": "<p>Description...</p>",
  "product_type": "Books",
  "images": [{ "src": "https://cdn.shopify.com/..." }],
  "variants": [{ "price": "12.95" }]
}
```

### Notes
- **Best approach**: Fetch `{product_url}.json` for clean structured data — no scraping needed
- Vendor field = Author name in this store
- Prices in EUR
- Limited metadata compared to Amazon/Thalia — no ISBN, page count, or ratings
- Use for purchase links and availability, supplement metadata from other sources
- URL pattern: `shakespeareandsons.com/products/{slug}`
- Collections page: `shakespeareandsons.com/collections`

## Source Priority (Germany-Based Book Club)

When researching a book, query sources in this order:

1. **Goodreads** — best for ratings, reviews, metadata, and community data
2. **Thalia.de** — German availability, pricing, German-language editions
3. **Amazon.de** — German pricing, availability, additional metadata
4. **Shakespeare and Sons** — local Berlin bookshop, support local business
5. **Open Library API** — free structured fallback
6. **Publisher sites** — for author bios, press kits, and first-party info

When generating purchase links, always include:
- `thalia`: Thalia.de link (German bookstore)
- `amazon_de`: Amazon.de link
- `shakespeare_and_sons`: Shakespeare and Sons link (if book is in stock)
- `goodreads`: Goodreads link (for reviews/info)

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

### German Publishers
- **Suhrkamp/Insel**: `suhrkamp.de` — major German literary publisher
- **S. Fischer**: `fischerverlage.de` — part of Holtzbrinck
- **Kiepenheuer & Witsch**: `kiwi-verlag.de` — literary fiction
- **Rowohlt**: `rowohlt.de` — part of Holtzbrinck

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
