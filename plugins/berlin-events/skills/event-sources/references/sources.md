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

### Berlin Art Link
- **URL**: https://www.berlinartlink.com/
- **RSS**: https://www.berlinartlink.com/feed
- **Categories**: Weekly art openings, exhibitions, gallery events
- **Language**: EN
- **Scraping**: RSS feed; also use Readability on weekly roundup pages

### ART@Berlin
- **URL**: https://www.artatberlin.com/en/calendar-for-vernissagen-exhibitions-events/
- **RSS**: https://www.artatberlin.com/en/feed
- **Categories**: Vernissages, exhibitions, art events
- **Language**: EN/DE
- **Scraping**: RSS feed for latest; calendar page via Readability

### Mit Vergnuegen
- **URL**: https://mitvergnuegen.com/category/ausgehen/events
- **RSS**: http://www.mitvergnuegen.com/category/hingehen/feed
- **Categories**: Food events, art, nightlife, lifestyle
- **Language**: DE (some EN)
- **Scraping**: RSS feed; food tips published biweekly
- **Notes**: Great for food event discovery

### Staatliche Museen zu Berlin (SMB)
- **URL**: https://www.smb.museum/
- **RSS**: https://www.smb.museum/rss-feed/pressemitteilungen.xml
- **Categories**: Museum exhibitions, tours, events
- **Language**: DE/EN
- **Scraping**: RSS for updates; institution pages via Readability

## Tier 3: Web Scraping via Readability

### Berlin.de Events
- **URL (DE)**: https://www.berlin.de/events/
- **URL (EN)**: https://www.berlin.de/en/events/
- **Categories**: Broad: festivals, arts, film, concerts, fairs
- **Language**: DE/EN
- **Scraping**: Use Readability on event listing pages; filter for art/food
- **Notes**: Official portal, daily/weekly editorial tips

### visitBerlin
- **URL**: https://www.visitberlin.de/en/event-calendar-berlin
- **Categories**: Mainstream culture, city highlights
- **Language**: EN/DE
- **Scraping**: Readability on calendar pages

### INDEX Berlin
- **URL**: https://www.indexberlin.com/events/list/
- **Categories**: Contemporary art openings, talks, performances
- **Language**: EN
- **Scraping**: Readability on events list; per-event iCal links available
- **Notes**: High signal for gallery openings

### Tip Berlin
- **URL**: https://www.tip-berlin.de/event/
- **Categories**: Curated listings, editorial picks (art, food, culture)
- **Language**: DE
- **Scraping**: Readability on event pages

### Rausgegangen
- **URL**: https://rausgegangen.de/berlin/
- **Categories**: Culture, nightlife, food, community
- **Language**: DE
- **Scraping**: Readability on Berlin event pages

### Kunstleben Berlin
- **URL**: https://www.kunstleben-berlin.de/
- **Categories**: Art calendar, vernissages, exhibitions
- **Language**: DE
- **Scraping**: Readability on calendar pages
- **Notes**: Newsletter 10-15x/year

## Tier 4: Institutional Calendars (Art-Specific)

### Berlinische Galerie
- **URL**: https://berlinischegalerie.de/programme/kalender/
- **Categories**: Tours, workshops, talks
- **Language**: DE
- **Scraping**: Readability

### Gropius Bau
- **URL**: https://www.berlinerfestspiele.de/en/gropius-bau/programm/veranstaltungen
- **Categories**: Exhibitions, tours, talks, screenings
- **Language**: EN/DE
- **Scraping**: Readability

### C/O Berlin
- **URL**: https://co-berlin.org/de/programm/kalender
- **Categories**: Photography, talks, screenings, workshops
- **Language**: DE/EN
- **Scraping**: Readability

### KW Institute for Contemporary Art
- **URL**: https://www.kw-berlin.de/en/events
- **Categories**: Contemporary art events, talks, openings
- **Language**: EN/DE
- **Scraping**: Readability

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
