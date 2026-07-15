---
name: event-sources
description: This skill should be used when the user asks about "Berlin event websites", "where to find events in Berlin", "event sources", "Berlin art listings", "Berlin food events", "scrape Berlin events", "extract event data", or when needing to know which websites, APIs, or RSS feeds to use for Berlin event discovery. Provides a curated directory of Berlin event sources with qurl ingestion commands.
---

# Berlin Event Sources

A curated directory of Berlin event sources with validated Readability status and qurl ingestion commands. Full source details (URLs, RSS, API docs, language notes) are in `references/sources.md`.

## qurl Ingestion

The standard ingestion command for any registered source:

```bash
PLUGIN_ROOT="${CLAUDE_PLUGIN_ROOT:-plugins/berlin-events}"
BUN=$(command -v bun 2>/dev/null || echo "$HOME/.bun/bin/bun")

"$BUN" run "$PLUGIN_ROOT/scripts/extract-events.ts" "<slug-or-url>" \
  | qurl add "<canonical-url>" --source berlin-events --tags <art|food|art,food>
```

For all registered sources, keep qurl writes sequential:

```bash
while IFS=$'\t' read -r slug url category _kind; do
  [[ -z "$slug" ]] && continue
  "$BUN" run "$PLUGIN_ROOT/scripts/extract-events.ts" "$slug" \
    | qurl add "$url" --source berlin-events --tags "$category"
done < <("$BUN" run "$PLUGIN_ROOT/scripts/list-sources.ts")
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

## Registered Sources

The source registry in `scripts/sources.ts` is the canonical ingestion list. It routes sources
through Readability, generic Playwright rendering, or source-specific Playwright extractors.

Use `bun run scripts/list-sources.ts` to print `slug`, canonical URL, category, and strategy.

| Slug | Tags | Strategy | Notes |
|------|------|----------|-------|
| `indexberlin` | art | Readability | Day-of-week + date listings |
| `kw-berlin` | art | Readability | Dated institutional listings |
| `berlinischegalerie` | art | Readability | Month/year + German date listings |
| `artatberlin` | art | Readability | Openings/vernissages calendar |
| `co-berlin` | art | Readability | Slow, but useful German calendar terms |
| `kunstleben` | art | Readability | Slow event archive |
| `berlin-de` | food | Readability | Broad coverage; lower date signal |
| `visitberlin` | art,food | Readability | Broad city calendar |
| `tip-berlin` | art,food | source extractor | JS-rendered listings |
| `gropius-bau` | art | source extractor | JS-rendered institutional calendar |
| `mitvergnuegen` | food | source extractor | Cookie/JS-heavy; skipped if only consent text is visible |

## Relevance Keywords

A query result is relevant if its snippet contains any of:

- **EN dates/events**: `april`, `may`, `monday`–`sunday`, `vernissage`, `opening`, `exhibition`, `finissage`
- **DE events**: `ausstellung`, `veranstaltung`, `führung`, `kalender`, `programm`
- **Date patterns**: `2026`, `.04.26`, `.05.26`

## Source-Specific Extractors

These sources previously failed or produced low-signal output with Readability alone. They are
now registered with Playwright-backed source extractors plus rendered-text fallback:

| Source | Extractor |
|--------|-----------|
| Tip Berlin | `scripts/extractors/tip-berlin.ts` |
| Gropius Bau | `scripts/extractors/gropius-bau.ts` |
| Mit Vergnuegen | `scripts/extractors/mitvergnuegen.ts` (best effort; consent-only output is rejected) |

If Playwright reports a missing browser executable, run:

```bash
cd "$PLUGIN_ROOT/scripts" && bunx playwright install chromium
```

## Reference Files

- **`references/sources.md`** — Full source directory with URLs, RSS, API docs, Readability status, and ingestion notes for each source
