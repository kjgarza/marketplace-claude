# Book Profile Schema

The `book-profile.json` file is the single source of truth for all bookclub commands. It is created by `/bookclub:init` and read by `/bookclub:generate` and `/bookclub:timeline`.

## JSON Schema

```json
{
  "title": "string (required)",
  "author": "string (required)",
  "author_bio": "string — 2-3 sentences (required)",
  "publication_year": "number (required)",
  "genre": "string (required)",
  "page_count": "number (optional)",
  "isbn": "string (optional)",
  "synopsis": "string — 3-5 sentences, ORIGINAL PARAPHRASE (required)",
  "rating": {
    "score": "number — e.g., 4.2",
    "source": "string — e.g., 'Goodreads'"
  },
  "awards": ["string"],
  "themes": ["string — 3-5 key themes"],
  "factoids": ["string — 5 surprising/interesting facts, 1-2 sentences each"],
  "links": {
    "amazon": "url (optional)",
    "bookshop": "url (optional)",
    "goodreads": "url (optional)",
    "publisher": "url (optional)",
    "library": "url or search pattern (optional)"
  },
  "related_articles": [
    {
      "title": "string",
      "source": "string — publication name",
      "url": "url",
      "summary": "string — 1 sentence"
    }
  ],
  "reading_dates": {
    "announcement_date": "ISO date string (optional)",
    "reading_date": "ISO date string (optional)",
    "discussion_date": "ISO date string (optional)"
  },
  "cover_image_url": "url (optional)",
  "qr_target_url": "url — primary link for QR code (optional)"
}
```

## Field Notes

### Required Fields
- `title`, `author`, `author_bio`, `publication_year`, `genre`, `synopsis` — these are needed for all message types
- The researcher should always be able to find these via web search

### Synopsis
**Must be paraphrased in your own words.** Never copy publisher blurbs, jacket copy, or Goodreads descriptions. Write a fresh 3-5 sentence summary that captures the premise and appeal.

### Factoids
Aim for 5 interesting facts most readers wouldn't know. Good factoids:
- "Ishiguro wrote the first draft of this novel in just four weeks"
- "The book was banned in several countries upon publication"
- "The author originally trained as a musician before turning to writing"

Bad factoids (too obvious):
- "This book is a bestseller"
- "The author is well-known"

### Links
Construct URLs using known patterns when exact URLs aren't found:
- Amazon: `https://www.amazon.com/s?k={title}+{author}`
- Bookshop: `https://bookshop.org/search?keywords={title}+{author}`
- Goodreads: `https://www.goodreads.com/search?q={title}+{author}`

### Reading Dates
If the user doesn't provide dates, leave the `reading_dates` object with null values. The timeline command will prompt for them.

## Example

```json
{
  "title": "Klara and the Sun",
  "author": "Kazuo Ishiguro",
  "author_bio": "Kazuo Ishiguro is a British novelist born in Nagasaki, Japan. He won the Nobel Prize in Literature in 2017 for novels that 'uncovered the abyss beneath our illusory sense of connection with the world.' He is best known for The Remains of the Day and Never Let Me Go.",
  "publication_year": 2021,
  "genre": "Literary Fiction / Science Fiction",
  "page_count": 307,
  "isbn": "978-0571364886",
  "synopsis": "Told from the perspective of Klara, an Artificial Friend powered by solar energy, the novel follows her observations from a store window and eventually her life with a teenage girl named Josie. As Klara navigates human relationships and emotions, the story raises questions about consciousness, love, and what it means to truly understand another person. Set in a near-future America with subtle dystopian elements, it explores the boundaries between artificial and human devotion.",
  "rating": { "score": 3.82, "source": "Goodreads" },
  "awards": ["Nominated for the Booker Prize 2021"],
  "themes": [
    "Artificial intelligence and consciousness",
    "Love and sacrifice",
    "Social inequality",
    "The nature of the human heart",
    "Observation and understanding"
  ],
  "factoids": [
    "Ishiguro wrote Klara and the Sun partly as a companion piece to Never Let Me Go, exploring similar questions about what makes us human from a different angle.",
    "The novel's narration deliberately mimics how an AI might perceive the world — Klara describes visual scenes in geometric terms, as though processing images.",
    "Ishiguro has said he was inspired by watching his daughter interact with a stuffed animal, wondering what the toy would think if it were sentient.",
    "The book was the first novel Ishiguro published after winning the Nobel Prize, creating enormous expectations he described as 'paralyzing.'",
    "Klara's solar-powered nature is central to the plot — her relationship with the Sun is both literal (energy source) and spiritual."
  ],
  "links": {
    "amazon": "https://www.amazon.com/dp/0571364888",
    "bookshop": "https://bookshop.org/p/books/klara-and-the-sun-kazuo-ishiguro/14723188",
    "goodreads": "https://www.goodreads.com/book/show/54120408-klara-and-the-sun",
    "publisher": "https://www.faber.co.uk/product/9780571364886-klara-and-the-sun/",
    "library": "https://www.worldcat.org/search?q=klara+and+the+sun+ishiguro"
  },
  "related_articles": [
    {
      "title": "Kazuo Ishiguro on How His New Novel 'Klara and the Sun' Is a Mirror for Our Uncertain Age",
      "source": "Time",
      "url": "https://time.com/5943532/kazuo-ishiguro-klara-and-the-sun/",
      "summary": "Ishiguro discusses writing the novel during a period of global uncertainty and how it reflects our relationship with technology."
    },
    {
      "title": "Klara and the Sun Review: Ishiguro's Masterful Return",
      "source": "The Guardian",
      "url": "https://www.theguardian.com/books/2021/mar/01/klara-and-the-sun-review",
      "summary": "A glowing review exploring the novel's deceptively simple surface and emotional depth."
    },
    {
      "title": "What 'Klara and the Sun' Gets Right About AI",
      "source": "The Atlantic",
      "url": "https://www.theatlantic.com/books/archive/2021/03/klara-sun-ishiguro-review/618236/",
      "summary": "An analysis of how the novel's portrayal of artificial intelligence resonates with current AI developments."
    }
  ],
  "reading_dates": {
    "announcement_date": "2026-03-02",
    "reading_date": "2026-03-20",
    "discussion_date": "2026-03-22"
  },
  "cover_image_url": "https://images-na.ssl-images-amazon.com/images/I/81oBMNjFMVL.jpg",
  "qr_target_url": "https://bookshop.org/p/books/klara-and-the-sun-kazuo-ishiguro/14723188"
}
```
