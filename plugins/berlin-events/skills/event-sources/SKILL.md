---
name: event-sources
description: This skill should be used when the user asks about "Berlin event websites", "where to find events in Berlin", "event sources", "Berlin art listings", "Berlin food events", "scrape Berlin events", "extract event data", or when needing to know which websites, APIs, or RSS feeds to use for Berlin event discovery. Provides a curated directory of Berlin event sources with qurl ingestion commands.
portable: false
---

> `<plugin_dir>` = this plugin's root directory (two levels above this SKILL.md).

# Berlin Event Sources

A curated directory of Berlin event sources with validated Readability status and qurl ingestion commands. Full source details (URLs, RSS, API docs, language notes) are in `references/sources.md`.

## qurl Ingestion

The standard ingestion command for any source:

```bash
bun run <plugin_dir>/scripts/extract-content.js "<url>" \
  | qurl add "<url>" --source berlin-events --tags <art|food>
```

After ingesting all sources, embed and search:

```bash
qurl embed
# Primary: `qurl search` (pure BM25, honors --source/--tag/--limit).
# Keep the query SHORT (3-5 words) — BM25 needs term overlap, so a
# verbose keyword-stuffed query returns "No results".
qurl search "Berlin art exhibition opening" --source berlin-events --limit 20
```

**Choose the qurl command by behaviour (verified against qurl source):**

- `qurl search` — pure BM25 keyword (FTS5); exact terms, needs term overlap. Honors `--source`/`--tag`/`--limit`.
- `qurl query` — **alias for `search`** (identical, pure BM25). Not hybrid/rerank despite the name.
- `qurl vsearch` — pure vector/semantic; tolerates verbose queries, honors `--limit`, but **ignores `--source`/`--tag`** (whole DB) — grep hosts to filter.

For broad recall with a verbose query, use vsearch + a host grep:

```bash
qurl vsearch "$(date '+%B %Y') Berlin exhibition opening vernissage workshop event calendar art food" 2>&1 \
  | grep -E -i 'indexberlin|kw-berlin|berlinischegalerie|artatberlin|co-berlin|kunstleben-berlin|berlin\.de|visitberlin'
```

> **Use `qurl`, not `qmd`.** `qurl` is the event-scrape DB. `qmd` is a separate notes search
> engine and holds no events — never substitute it here, despite shared subcommand names.

## Priority Sources (confirmed working with Readability)

Ingest these first — they produce date-containing chunks that rank well in `qurl query`:

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

A query result is relevant if its snippet contains any of:

- **EN dates/events**: `april`, `may`, `monday`–`sunday`, `vernissage`, `opening`, `exhibition`, `finissage`
- **DE events**: `ausstellung`, `veranstaltung`, `führung`, `kalender`, `programm`
- **Date patterns**: `2026`, `.04.26`, `.05.26`

## Sources to Avoid

| Source | Reason |
|--------|--------|
| `mitvergnuegen.com` | Cookie-consent wall — Readability returns only consent text |
| `berlinerfestspiele.de/gropius-bau` | JS-rendered — returns only venue address |
| `tip-berlin.de/event/` | JS-rendered — extraction fails entirely |

## Reference Files

- **`references/sources.md`** — Full source directory with URLs, RSS, API docs, Readability status, and ingestion notes for each source
