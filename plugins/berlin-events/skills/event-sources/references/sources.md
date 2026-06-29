# Berlin Event Sources Directory

Distilled from the Berlin Event Research Report. Focus: art and food events in English.

## Tier 1: API-Driven Sources (Best for Automation)

### Eventbrite
- **URL**: https://www.eventbrite.com/d/germany--berlin/events/
- **Categories**: Art, food, workshops, community
- **API**: https://www.eventbrite.com/platform/api (OAuth)
- **Language**: EN/DE
- **Scraping**: Use API with `location.address=Berlin` and `categories=food,art`
- **Notes**: Strong for workshops, food events, community art events

### Meetup
- **URL**: https://www.meetup.com/find/?location=Berlin
- **Categories**: Art meetups, food tours, community events
- **API**: https://www.meetup.com/graphql/ (GraphQL, OAuth)
- **Language**: EN/DE
- **Scraping**: GraphQL queries filtered by Berlin + art/food topics

### Ticketmaster
- **URL**: https://developer.ticketmaster.com/products-and-docs/apis/discovery-api/v2/
- **Categories**: Concerts, theater, exhibitions
- **API**: Discovery API v2 with `city=Berlin` and `source` filter
- **Language**: EN
- **Scraping**: REST API, needs API key

## Tier 2: RSS-Enabled Sources

### Registry Note

The canonical scrape list lives in `scripts/sources.ts`. Run `bun run scripts/list-sources.ts`
to print registered source slugs, URLs, categories, and extraction strategies. Use
`scripts/extract-events.ts <slug-or-url>` for ingestion; it dispatches to Readability,
Playwright + Readability, or a source-specific extractor as configured.

### Berlin Art Link
- **URL**: https://www.berlinartlink.com/
- **RSS**: https://www.berlinartlink.com/feed
- **Categories**: Weekly art openings, exhibitions, gallery events
- **Language**: EN
- **Readability**: ⚠️ Home page returns cookie-consent banner — use RSS feed directly or fetch individual article URLs from the feed
- **qurl ingestion**: Fetch article URLs from RSS, pipe each via `extract-events.ts` or `extract-content.js`

### ART@Berlin
- **URL**: https://www.artatberlin.com/en/calendar-for-vernissagen-exhibitions-events/
- **RSS**: https://www.artatberlin.com/en/feed
- **Categories**: Vernissages, exhibitions, art events
- **Language**: EN/DE
- **Readability**: ✅ Calendar page extracts cleanly; snippet contains "openings/vernissages"
- **qurl ingestion**: `extract-events.ts artatberlin | qurl add "<url>" --source berlin-events --tags art`

### Mit Vergnuegen
- **URL**: https://mitvergnuegen.com/category/ausgehen/events
- **RSS**: http://www.mitvergnuegen.com/category/hingehen/feed
- **Categories**: Food events, art, nightlife, lifestyle
- **Language**: DE (some EN)
- **Readability**: ❌ Cookie-consent wall blocks extraction — only consent text returned
- **qurl ingestion**: Registered as `mitvergnuegen` with a Playwright source extractor; skip when the page returns consent-only text

### Staatliche Museen zu Berlin (SMB)
- **URL**: https://www.smb.museum/
- **RSS**: https://www.smb.museum/rss-feed/pressemitteilungen.xml
- **Categories**: Museum exhibitions, tours, events
- **Language**: DE/EN
- **Readability**: Not validated
- **qurl ingestion**: Use RSS feed

## Tier 3: Web Scraping via Readability

### Berlin.de Events
- **URL (EN)**: https://www.berlin.de/en/events/
- **Categories**: Broad: festivals, arts, film, concerts, fairs
- **Language**: DE/EN
- **Readability**: ⚠️ Extracts only generic intro paragraph ("There's never a dull moment in Berlin…"); no specific event dates in first chunk
- **qurl ingestion**: Include for broad coverage but expect low relevance signal; useful for food category

### visitBerlin
- **URL**: https://www.visitberlin.de/en/event-calendar-berlin
- **Categories**: Mainstream culture, city highlights
- **Language**: EN/DE
- **Readability**: ⚠️ First chunk is a featured article ("Weekend Club…"), not dated event list
- **qurl ingestion**: Include for breadth; low date-signal in top chunks

### INDEX Berlin
- **URL**: https://www.indexberlin.com/events/list/
- **Categories**: Contemporary art openings, talks, performances
- **Language**: EN
- **Readability**: ✅ Event dates (e.g. "Monday, April 6", "Friday, April 10") appear in first chunk
- **qurl ingestion**: High priority — `extract-events.ts indexberlin | qurl add "<url>" --source berlin-events --tags art`

### Tip Berlin
- **URL**: https://www.tip-berlin.de/event/
- **Categories**: Curated listings, editorial picks (art, food, culture)
- **Language**: DE
- **Readability**: ❌ JS-rendered; extraction fails entirely
- **qurl ingestion**: Registered as `tip-berlin` with a Playwright source extractor

### Rausgegangen
- **URL**: https://rausgegangen.de/berlin/
- **Categories**: Culture, nightlife, food, community
- **Language**: DE
- **Readability**: ⚠️ Loads but content doesn't surface in top vsearch results; low semantic signal
- **qurl ingestion**: Low priority

### Kunstleben Berlin
- **URL**: https://kunstleben-berlin.de/events/
- **Categories**: Art calendar, vernissages, exhibitions
- **Language**: DE
- **Readability**: ✅ Extracts event archive with "Veranstaltungen" keyword; slow to load (~60s)
- **qurl ingestion**: Include; use in pipeline with sufficient timeout

## Tier 4: Institutional Calendars (Art-Specific)

### Berlinische Galerie
- **URL**: https://berlinischegalerie.de/programme/kalender/
- **Categories**: Tours, workshops, talks
- **Language**: DE
- **Readability**: ✅ Extracts dated listings ("April 2026", "7.4.26 – 10.4.26", "Führung")
- **qurl ingestion**: High priority — `extract-events.ts berlinischegalerie | qurl add "<url>" --source berlin-events --tags art`

### Gropius Bau
- **URL**: https://www.berlinerfestspiele.de/en/gropius-bau/programm/veranstaltungen
- **Categories**: Exhibitions, tours, talks, screenings
- **Language**: EN/DE
- **Readability**: ❌ JS-rendered; only returns venue address ("Niederkirchnerstraße 7…")
- **qurl ingestion**: Registered as `gropius-bau` with a Playwright source extractor

### C/O Berlin
- **URL**: https://co-berlin.org/de/programm/kalender
- **Categories**: Photography, talks, screenings, workshops
- **Language**: DE/EN
- **Readability**: ✅ Extracts navigation with "Ausstellungen", "Kalender", "Führungen" — matches DE keyword set; slow (~90s)
- **qurl ingestion**: Include; use with sufficient timeout

### KW Institute for Contemporary Art
- **URL**: https://www.kw-berlin.de/en/events
- **Categories**: Contemporary art events, talks, openings
- **Language**: EN/DE
- **Readability**: ✅ Extracts dated listings ("Wed, 08.04.26, 16:00–18:00") — highest date-signal of all sources
- **qurl ingestion**: High priority — `extract-events.ts kw-berlin | qurl add "<url>" --source berlin-events --tags art`

## Data Hubs (For Building Aggregators)

### Berlin Open Data
- **URL**: https://daten.berlin.de/
- **RSS**: https://daten.berlin.de/drupal_feeds/custom.rss?fq=tags%3Dapi&q=
- **Notes**: Machine-readable datasets; CKAN API for metadata

### KulturDaten Berlin
- **URL**: https://kulturdaten.berlin/
- **API**: https://github.com/technologiestiftung/kulturdaten-api
- **Notes**: Culture-data backbone between institutions and portals

## Recommended Search Strategy

### For Art Events
1. Start with RSS: Berlin Art Link, ART@Berlin
2. Scrape: INDEX Berlin, KW Institute, Gropius Bau, Berlinische Galerie
3. API: Eventbrite (category: art)
4. Broad: Berlin.de/en/events, Tip Berlin

### For Food Events
1. RSS: Mit Vergnuegen (food tips biweekly)
2. API: Eventbrite (category: food), Meetup (food groups)
3. Scrape: Berlin.de/en/events (filter food), Rausgegangen
4. Search: Web search for "Berlin food events this week"

### Extraction Priority
1. **APIs first** (structured data, most reliable)
2. **RSS feeds** (semi-structured, easy to parse)
3. **Readability extraction** (unstructured, needs filtering)
4. **Web search** as fallback for discovery
