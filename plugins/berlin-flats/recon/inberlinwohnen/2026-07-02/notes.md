# Inberlinwohnen Recon Notes — 2026-07-02

Supersedes the assumption in `ROBUST_HUNT_PROPOSAL.md` that the listing feed is
client-side rendered behind a Drupal jsonapi (401). It is not Drupal — it's a
Laravel + Livewire app, and the initial page load is fully server-rendered
with real listing data embedded in `wire:snapshot` HTML attributes. No DevTools
XHR sniffing or per-company fallback was needed.

## Layer A — Identity & Legal

### robots.txt
- Fetched from https://www.inberlinwohnen.de/robots.txt
- `User-agent: *` / `Disallow:` (empty) — fully open, no crawl restrictions

### ToS / API
- No public API found; this is the housing companies' own aggregator site,
  not a third-party scrape target — closer in spirit to a portal's own
  search page than an adversarial listing site
- No RSS/email alerts found on the page itself (Layer E)

## Layer B — Rendering

### Search page
- URL: `https://www.inberlinwohnen.de/wohnungsfinder/`
- Plain `fetch()` with a browser UA: HTTP 200, ~600KB HTML, no bot wall
- Stack: Laravel + `Livewire` (`data-update-uri="/livewire/update"`,
  `wire:id`, `wire:snapshot` attributes throughout)
- Rendering: SSR — the *first page* of listings is embedded directly in the
  initial HTML response, no JS execution required to read it
- Further pages/filters POST to `/livewire/update` (not implemented — out of
  scope for Phase 2; the first-page SSR data alone is enough for the DOD)

### Hydration blob location
Each listing card is a Livewire component whose `wire:snapshot="..."`
attribute value is HTML-entity-encoded JSON. Decoding it yields
`{"data": {"item": [<realItem>, {"s":"arr"}], ...}, "memo": {...}, "checksum": "..."}`.
The `{"s":"arr"}` sibling is Livewire's array-type marker in its Wireable
serialization format, not listing data — filter it out by checking for an
`id` key.

Sample decoded item (trimmed):
```json
{
  "id": 18588,
  "title": "Wir erneuern den Boden für Sie!",
  "deeplink": "https://www.gewobag.de/fuer-mietinteressentinnen/mietangebote/7100-74804-0301-0034",
  "rooms": "3,5",
  "area": "83,10",
  "rentNet": "670,03",
  "rentGross": 870.03,
  "createdAt": "2026-07-01T16:31:04.000000Z",
  "address": [
    { "street": "Leubnitzer Weg", "number": "11", "zipCode": "13593", "district": "Spandau", "lat": "52.52176794", "lon": "13.17211205" },
    { "s": "arr" }
  ],
  "company": [
    { "id": 3, "intern": "gewobag", "name": "Gewobag ", "website": "https://www.gewobag.de/" },
    { "s": "arr" }
  ]
}
```

Key finding: `address[0].district` gives the Berlin borough directly — no
geocoding or district inference needed, unlike every other portal in this
plugin.

### Field format notes
- `rentNet`, `area`: German-decimal-comma strings ("670,03", "83,10") —
  reuse `parseFloatDe` from `parse-listing.ts` (handles comma→dot, existing
  helper, no new format needed)
- `rentGross`: already a JS number in the source JSON (not a string) — use
  directly, no parsing
- `rooms`: German-decimal-comma string ("3,5") — `parseFloatDe`
- `deeplink`: direct URL to the housing company's own listing page — this
  *is* the real listing URL (companies observed live: gewobag.de, howoge.de,
  stadtundland.de)

## Layer C — Anti-Bot
- Provider: none observed
- Cold request works: yes, plain `fetch()` with standard browser UA and no
  special headers succeeded on the first attempt
- No rate-limit signal observed in a single fetch

## Layer D — Content Structure

### Self-check (2026-07-02 fetch)
- 10 unique listing items found in the initial SSR page load
- Companies represented: gewobag, howoge, stadtundland (3 of the ~7
  state-owned companies the aggregator covers — presumably the others had no
  open listings at fetch time, not a coverage gap)
- All 10 items had: id, title, deeplink, rooms, area, rentNet, rentGross,
  address[0].district, createdAt — field_count = 9, expected_field_count = 9,
  self-check PASS

## Layer E — Discovery
- RSS: none found
- Email alerts: none found on this aggregator (individual companies may
  offer their own — out of scope for Phase 2)
- Update frequency: unknown: single-fetch snapshot only; recommend the same
  poll cadence as Kleinanzeigen (120s) until observed otherwise
- No `posted_after` filter; `createdAt` field enables sort-by-recency
  client-side if needed later

## Decision

Primary integration: single plain `fetch()` of
`https://www.inberlinwohnen.de/wohnungsfinder/`, extract all `wire:snapshot`
JSON blobs, map directly to complete `Listing` records (no separate detail
fetch — the search page already has cold_rent, warm_rent, sqm, rooms,
district). This is Tier 1 only; no Jina/browser fallback tier needed for
Phase 2 given the page is unprotected SSR.
