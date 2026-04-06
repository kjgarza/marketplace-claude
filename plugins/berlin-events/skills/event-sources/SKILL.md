---
name: event-sources
description: This skill should be used when the user asks about "Berlin event websites", "where to find events in Berlin", "event sources", "Berlin art listings", "Berlin food events", "scrape Berlin events", "extract event data", or when needing to know which websites, APIs, or RSS feeds to use for Berlin event discovery. Provides a curated directory of Berlin event sources organized by extraction method with scraping strategies.
---

# Berlin Event Sources

A curated directory of websites, APIs, and RSS feeds for discovering art and food events in Berlin. Sources are organized by extraction method reliability.

## Source Tiers

Sources are ranked by data extraction reliability (validated with Readability + qurl vsearch):

1. **API-driven** (Eventbrite, Meetup, Ticketmaster) - structured JSON, most reliable
2. **RSS-enabled** (Berlin Art Link, ART@Berlin, SMB) - semi-structured XML
3. **Web scraping — confirmed working** (use Mozilla Readability):
   - https://www.indexberlin.com/events/list/ — event dates appear in first chunk
   - https://www.artatberlin.com/en/calendar-for-vernissagen-exhibitions-events/ — vernissage calendar
   - https://berlinischegalerie.de/programme/kalender/ — dated German workshop/tour listings
   - https://www.kw-berlin.de/en/events — dated event listings (EN/DE)
   - https://co-berlin.org/de/programm/kalender — German exhibition calendar
   - https://kunstleben-berlin.de/events/ — German art event archive
   - https://www.berlin.de/en/events/ — broad coverage (generic intro, but useful for food)
   - https://www.visitberlin.de/en/event-calendar-berlin — city-wide calendar
4. **Avoid — extraction fails or returns only boilerplate:**
   - `mitvergnuegen.com` — cookie-consent wall blocks Readability
   - `berlinerfestspiele.de/gropius-bau` — JS-rendered, only returns address text
   - `tip-berlin.de/event/` — JS-rendered, extraction fails

## Extraction Methods

### APIs
Query with location=Berlin and category filters for art/food. Eventbrite and Meetup are strongest for food events. Ticketmaster covers concerts and exhibitions.

### RSS Feeds
Parse XML feeds for latest entries. Berlin Art Link and ART@Berlin are best for art. Mit Vergnuegen covers food events biweekly.

### Readability Extraction
Use the `extract-content.js` script at `${CLAUDE_PLUGIN_ROOT}/scripts/extract-content.js` to extract clean text from event pages. Pass the URL as argument:

```bash
bun run ${CLAUDE_PLUGIN_ROOT}/scripts/extract-content.js "https://www.indexberlin.com/events/list/"
```

The script uses Mozilla's Readability library to strip navigation, ads, and boilerplate, returning only the main content.

## Search Strategy

### Art Events
1. Scrape: INDEX Berlin, ART@Berlin calendar, Berlinische Galerie, KW Institute, C/O Berlin, Kunstleben Berlin
2. RSS: Berlin Art Link feed, ART@Berlin feed
3. API: Eventbrite art category
4. Fallback: Web search "Berlin art events this week"

### Food Events
1. Scrape: Berlin.de/en/events, visitBerlin event calendar
2. API: Eventbrite food category, Meetup food groups in Berlin
3. Fallback: Web search "Berlin food events this week"

## Additional Resources

### Reference Files
- **`references/sources.md`** - Complete source directory with URLs, RSS endpoints, API docs, language, and scraping notes for each source
