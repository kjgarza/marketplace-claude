---
name: event-sources
description: This skill should be used when the user asks about "Berlin event websites", "where to find events in Berlin", "event sources", "Berlin art listings", "Berlin food events", "scrape Berlin events", "extract event data", or when needing to know which websites, APIs, or RSS feeds to use for Berlin event discovery. Provides a curated directory of Berlin event sources with qurl ingestion commands.
---

# Berlin Event Sources

A curated directory of Berlin event sources with validated Readability status and qurl ingestion commands.

- **Machine-readable registry** (authoritative for routing): `scripts/sources.ts` — typed `SourceConfig[]` with extraction strategy per source.
- **Human-readable directory** (URLs, RSS, API docs, language notes): `references/sources.md`.

## qurl Ingestion

The standard ingestion command for any registered source — pass a slug or URL from `sources.ts` and the dispatcher picks the right strategy:

```bash
BUN=$(command -v bun 2>/dev/null || echo "$HOME/.bun/bin/bun")
$BUN run ${CLAUDE_PLUGIN_ROOT}/scripts/extract-events.ts "<slug-or-url>" \
  | qurl add "<url>" --source berlin-events --tags <art|food>
```

Strategies (declared in `sources.ts`):
- `readability` — fetch + Mozilla Readability (fast, used for working sources below).
- `playwright` — chromium + Readability for JS-rendered pages.
- `source-extractor` — chromium + per-source `extract(page)` returning typed `Event[]` JSON (used for tip-berlin, gropius-bau, mitvergnuegen).

After ingesting all sources, embed and search:

```bash
qurl embed
qurl vsearch "April 2026 Berlin exhibition opening vernissage workshop event calendar art food" \
  --source berlin-events \
  --limit 20
```

## Priority Sources (confirmed working with Readability)

Ingest these first — they produce date-containing chunks that rank well in vsearch:

| URL | Tags | What the snippet contains |
|-----|------|--------------------------|
| https://www.indexberlin.com/events/list/ | art | Day-of-week + date ("Monday, April 6") |
| https://www.kw-berlin.de/en/events | art | Dated listings ("Wed, 08.04.26, 16:00–18:00") |
| https://berlinischegalerie.de/programme/kalender/ | art | Month/year + German dates ("April 2026", "7.4.26") |
| https://www.artatberlin.com/en/calendar-for-vernissagen-exhibitions-events/ | art | "openings/vernissages" keyword |
| https://co-berlin.org/de/programm/kalender | art | "Ausstellungen", "Führungen", "Kalender" |
| https://kunstleben-berlin.de/events/ | art | "Veranstaltungen" (slow: ~60s) |
| https://www.berlin.de/en/events/ | food | Broad coverage; low date-signal but useful for food |
| https://www.visitberlin.de/en/event-calendar-berlin | food,art | City-wide calendar; featured articles in top chunk |

## Relevance Keywords

A vsearch result is relevant if its snippet contains any of:

- **EN dates/events**: `april`, `may`, `monday`–`sunday`, `vernissage`, `opening`, `exhibition`, `finissage`
- **DE events**: `ausstellung`, `veranstaltung`, `führung`, `kalender`, `programm`
- **Date patterns**: `2026`, `.04.26`, `.05.26`

## JS-Rendered Sources (Playwright source-extractors)

These three sources used to fail under Readability; they now have typed extractors that render the page with chromium and emit `Event[]` JSON:

| Source | Slug | Extractor |
|--------|------|-----------|
| Tip Berlin | `tip-berlin` | `scripts/extractors/tip-berlin.ts` |
| Gropius Bau | `gropius-bau` | `scripts/extractors/gropius-bau.ts` |
| Mit Vergnügen | `mitvergnuegen` | `scripts/extractors/mitvergnuegen.ts` |

If extraction returns `[]` (no datable cards), the agent falls back to `WebFetch`/`WebSearch`.

## Reference Files

- **`../../scripts/sources.ts`** — Authoritative routing/extraction registry
- **`references/sources.md`** — Full human-readable source directory with URLs, RSS, API docs, and language notes
