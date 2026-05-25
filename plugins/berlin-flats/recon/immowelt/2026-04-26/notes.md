# Immowelt Recon Notes — 2026-04-26

## Layer A — Identity & Legal

### robots.txt
- Fetched from https://www.immowelt.de/robots.txt
- Listing paths (/expose/*) are NOT disallowed for `User-agent: *`
- Blocked paths relevant to scraping:
  - `/liste/getlistitems` — old AJAX endpoint, now 410
  - `/*/classified-search` — blocked
  - `/classifiedList/` — blocked
  - `*bff/*` — BFF API blocked
- Sitemap: https://www.immowelt.de/sitemaps/sitemap_index.xml

### ToS (AGB)
- URL: https://www.immowelt.de/immoweltag/agb/agb___immowelt
- Section 9.3 explicitly forbids downloading/duplicating platform content without permission
- No scraping API or partner program found for flat hunters
- Verdict: tos_automation = forbidden

### API / Developer
- No public API for consumers found
- BFF endpoints exist but are blocked in robots.txt

### RSS/Atom
- No `<link rel="alternate">` RSS/Atom feeds found on search page or homepage
- No RSS feed exists

### Email Alerts
- `/suchauftrag/` returns 404 (old URL)
- Login-gated alert system exists via user account, not publicly documented
- Not viable for automated discovery

## Layer B — Rendering

### Search Page
- URL: https://www.immowelt.de/suche/mieten/wohnung/berlin/berlin-10115/ad08de8634
- Response: HTTP/2 200, SSR HTML, ~1.2MB uncompressed
- Rendering: HYBRID SSR — full listing cards in HTML
- Hydration blob: `window["__UFRN_FETCHER__"]` contains navigation metadata, NOT listing data
- Listing cards ARE in SSR HTML in `<div id="root">` rendered by SERP MFE
- Expose URLs found in search HTML: full UUID format (e.g., `/expose/1970c7ae-3f1f-4e2f-9d76-5fcbb4fb0127`)
- 30 listing cards per page

### Detail Page
- URL: https://www.immowelt.de/expose/{uuid}
- Response: HTTP/2 200, SSR HTML, ~720KB uncompressed
- Rendering: HYBRID SSR — listing data IS in HTML
- `window["__UFRN_FETCHER__"]` is EMPTY `{"data":{},"errors":{}}` on detail pages
- All listing data comes through SSR DOM
- JSON-LD `RealEstateListing` present but `datePosted` is always empty
- Key data-testid selectors confirmed:
  - `rent-price-value-active` → Kaltmiete
  - `rent-price-value-inactive` → Warmmiete
  - `cdp-hardfacts-keyfacts` → "N Zimmer • X m² • Y. Geschoss"
  - `cdp-location-address` → full address string
  - `cdp-classified-keys` → Online-ID (alphanumeric, e.g. "2623ZFI3RQS6")
  - `cdp-main-description-expandable-text` → description text
  - `cdp-price` → Nebenkosten, Heizkosten, Kaution breakdown
  - `aviv.CDP.Contacting.ProviderSection.ContactCard.Title` → contact name
  - `mms.immowelt.de/*.jpg` → image URLs (preload links)

### JSON-LD on Detail
```json
{
  "@type": "RealEstateListing",
  "datePosted": "",  // always empty
  "description": "Wohnung 104.16 m² 2290 € zur Miete Archenholdstrasse 19,Friedrichsfelde,Berlin (10315)",
  "name": "Wohnung 104.16 m² 2290 € zur Miete..."
}
```
Description in JSON-LD is a compact summary string (price + area + address), NOT the full description.

### Open Graph
- `og:url`: expose UUID URL
- `og:title`: compact summary (same format as JSON-LD name)
- `og:image`: first listing photo URL

## Layer C — Anti-Bot

### Provider
- DataDome confirmed via:
  1. `<script src="https://dd.immowelt.de/tags.js">` (custom DataDome domain)
  2. `*.datadome.co` in Content-Security-Policy
  3. `x-datadome: protected` header in 403 responses
  4. `*.captcha-delivery.com` in CSP

### Cold Request Behavior
- Search page: cold requests succeed (200) with browser UA
- Detail page: cold requests succeed initially, but DataDome triggers 403 after rapid sequential requests
- Rate limit observed: ~3 rapid requests to same detail page → 403
- After backoff, requests succeed again

### Headers
- CDN: CloudFront (server: CloudFront, x-amz-cf-*)
- No `cf-ray` (not Cloudflare, is AWS CloudFront)
- No x-datadome header on successful responses

### User-Agent Sensitivity
- Browser UA required — curl default UA was not tested explicitly but bot UAs likely blocked
- Browser UA alone was sufficient for most requests

## Layer D — Content Structure

### URL Grammar

Base pattern:
```
https://www.immowelt.de/suche/mieten/wohnung/{filters}/{city}/{city-postcode}/{geo_id}
```

Filter segments (path-based, in any order before city):
- `zimmer-N` → minimum N rooms (e.g., `zimmer-2`)
- `preis--N` → max price N EUR (e.g., `preis--1500`)
- `kein-erdgeschoss` → exclude ground floor
- `balkon-terrasse` → balcony/terrace
- `einbaukueche` → built-in kitchen
- `moebliert` → furnished
- `jahr--1949` → Altbau (pre-1949)
- `erdgeschoss` → ground floor only
- `dachgeschoss` → top floor/penthouse

Sort: `?sort=createdate_desc` or `?sort=price_asc` or `?sort=relevance`
Pagination: `?page=N` (N=1,2,3...)

Berlin geo_id: `ad08de8634` (whole Berlin)
City-postcode prefix: `berlin-10115`

### District Map (Berlin Neighborhoods / Stadtteile)

Format: `/suche/mieten/wohnung/berlin-10115/{district-slug}/{nbh_code}`

```
kreuzberg-10969: nbh2de91302090
friedrichshain-10247: nbh2de91302026
prenzlauer-berg-10407: nbh2de91302099
charlottenburg-13627: nbh2de91302007
schoneberg-12103: nbh2de91302112
moabit-10557: nbh2de91302083
wedding-13347: nbh2de91302124
wilmersdorf-14197: nbh2de91302130
gesundbrunnen-13347: nbh2de91302030
tiergarten-10785: nbh2de91302119
neukölln-12049: nbh2de91302063 (confirmed)
steglitz-12169: nbh2de91302116
tempelhof-12105: nbh2de91302118
weissensee-13088: nbh2de91302125
tegel-13509: nbh2de91302117
```
Note: Mitte district code not yet confirmed — it's not surfaced in standard link boxes.

### Search Card Fields (SSR)
- `a[data-testid="card-mfe-covering-link-testid"][title]` → compact summary (price, rooms, sqm, floor)
- `a[href]` → expose UUID URL
- `[data-testid="cardmfe-price-testid"]` → price + Kaltmiete/Warmmiete label
- `[data-testid="cardmfe-keyfacts-testid"]` → N Zimmer, X m², Floor
- `[data-testid="cardmfe-description-box-address"]` → Street, District, Berlin (PLZ)
- `[data-testid="cardmfe-description-text-testid"]` → description excerpt
- `[data-testid="classified-card-mfe-{id}"]` → card container with short tracking ID

### Detail Page Field Map
- Kaltmiete: `[data-testid="rent-price-value-active"]` inner text
- Warmmiete: `[data-testid="rent-price-value-inactive"]` inner text
- Rooms/Sqm/Floor: `[data-testid="cdp-hardfacts-keyfacts"]` inner div text (• separated)
- Address: `[data-testid="cdp-location-address"] span.css-wpv6zq` inner text
- Online-ID: `[data-testid="cdp-classified-keys"] b:contains("Online-ID") + text`
- Description: `[data-testid="cdp-main-description-expandable-text"]` inner text
- Nebenkosten: within `[data-testid="cdp-price"]` — span containing "Nebenkosten"
- Kaution: within `[data-testid="cdp-price"]` — div after "Kaution" label
- Contact name: `[data-testid="aviv.CDP.Contacting.ProviderSection.ContactCard.Title"]`
- Images: `<link rel="preload" as="image" href="https://mms.immowelt.de/...">` in head

### posted_at
- NOT available in SSR HTML
- JSON-LD datePosted field is always empty
- Only available via XHR/AJAX after JS execution
- Workaround: use search order position as proxy for recency when sort=createdate_desc

## Layer E — Discovery

### RSS: None
### API: None (BFF blocked)
### Email alerts: Login-gated only

### Update Frequency
- 5,551 total Berlin rental listings as of 2026-04-26
- sort=createdate_desc works and returns results in date order
- No posted_after filter available
- Polling newest-first is the only viable discovery method

### Poll Interval Estimate
- New listings appear continuously (high-volume portal)
- Estimated 50-100 new Berlin listings per day based on total count
- Recommended poll: 300s (5 minutes) for sort=createdate_desc with dedup by listing_id

## Self-Check

Fetched: https://www.immowelt.de/expose/77c6e9fa-2fb1-4cf5-93a9-28b0b6042a3c

Fields extracted:
- cold_rent: "2.490 €" ✓
- warm_rent: "2.920 €" ✓
- listing_id: "26DJS3WPDRQZ" ✓
- description: "In der Archenholdstraße 19/21..." ✓
- contact_name: "Stefan Prill" ✓
- nebenkosten: "292 €" ✓
- kaution: "3 Nettokaltmieten" ✓
- image_count: 39 ✓
- keyfacts: "4 Zimmer • 110,4 m² • 1. Geschoss" ✓ (via cdp-hardfacts-keyfacts)
- address: "Archenholdstraße 19, Friedrichsfelde, Berlin (10315)" ✓

Fields missing from SSR:
- posted_at: always empty in JSON-LD, CSR-only
- rooms/sqm/floor as separate fields (available as combined keyfacts string — needs split)

Field count: 10 found, expected_field_count = 9
Self-check: PASS (10 >= 9 ± 1)
