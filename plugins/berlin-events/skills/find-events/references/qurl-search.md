# qurl Search Reference

## Command Comparison

| Command | Engine | Behaviour |
|---------|--------|-----------|
| `qurl search`  | **pure BM25 / FTS5 keyword** | exact terms; **needs term overlap** — a long/verbose query returns "No results". Honors `--source`/`--tag`/`--limit`. |
| `qurl query`   | **alias for `search`** (identical, also pure BM25) | same as `search`. Despite the name, the CLI does **not** do hybrid/RRF/rerank. |
| `qurl vsearch` | **pure vector / semantic** | tolerates long verbose queries (good recall); honors `--limit` but **ignores `--source`/`--tag`** — filter hosts yourself. |

## Using vsearch (semantic fallback)

When `qurl search` yields fewer than 5 relevant hits, switch to vector search with a verbose query,
then grep to the known event hosts (vsearch ignores `--source`):

```bash
QUERY="$(date '+%B %Y') Berlin exhibition opening vernissage workshop event calendar art food"
qurl vsearch "$QUERY" 2>&1 | grep -E -i \
  'indexberlin|kw-berlin|berlinischegalerie|artatberlin|co-berlin|kunstleben-berlin|berlin\.de|visitberlin'
```

## Relevance Filter

Derive date tokens from **today's date** — do not hardcode months:

- `MONTH_NAMES` — lowercased full English + German names of the current month and next month
  (e.g. for June: `june`, `juni`, `july`, `juli`)
- `MONTH_NUMS` — zero-padded numeric forms for the same two months bracketed by dots
  (e.g. `.06.`, `.07.`)
- `YEAR` — current year (and next year if the lookahead window crosses into January)

A result counts as relevant if its snippet contains any of:

- EN/DE month names from `MONTH_NAMES`
- `monday`–`sunday`, `vernissage`, `opening`, `exhibition`, `finissage`
- DE: `ausstellung`, `veranstaltung`, `führung`, `kalender`, `programm`
- Dates: any token in `MONTH_NUMS`, or `YEAR`

If fewer than 5 results pass this filter, proceed to Step 5b (web search fallback).

## Tag Narrowing

`--source berlin-events` excludes docs ingested by other plugins. Optionally add `--tag art`
**or** `--tag food` if the user's `interests` is a single category — but tags can over-narrow
(food docs are sparse) and return 0; drop the tag and re-run if so.
