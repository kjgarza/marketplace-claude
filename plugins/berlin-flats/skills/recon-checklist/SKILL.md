---
name: Recon Checklist
description: Use as working document during scout-recon runs. Provides the Layer A-E checklist for profiling a new portal or re-verifying an existing one.
---

This is the working checklist for every portal recon run. Tick off items in evidence notes.md as completed.

## Layer A — Identity & Legal

- [ ] Fetch `<base>/robots.txt` — save raw. Note disallow rules for listing paths specifically.
- [ ] Fetch `<base>/sitemap.xml` — save raw. Count listing URLs.
- [ ] Locate ToS/AGB page. Search for: "automated", "scraping", "robot", "crawl", "automatisiert", "Bot".
- [ ] Search for developer/API docs: try `<base>/api`, `<base>/developers`, `<base>/partner`.
- [ ] Look for RSS/Atom in HTML `<link rel="alternate">` tags on homepage and search pages.
- [ ] Look for email-alert signup. Note URL and required fields.

**Decision gate:** If ToS forbids automation AND no permitted access path (no API, no RSS, no email alerts), warn the user before proceeding.

## Layer B — Rendering

- [ ] Fetch sample search page with plain HTTP. Save as `search-raw.html`.
- [ ] Fetch 3–5 listing detail pages with plain HTTP. Save as `detail-N-raw.html`.
- [ ] Grep raw HTML for known field values (a rent amount visible in browser) — present = SSR, absent = CSR.
- [ ] Search raw HTML for: `__NEXT_DATA__`, `__NUXT__`, `__INITIAL_STATE__`, `application/ld+json`.
- [ ] Validate JSON-LD blobs against schema.org RealEstateListing/Offer.
- [ ] Note Open Graph and Twitter Card metadata coverage.
- [ ] In Chrome DevTools Network tab: identify XHR/fetch calls returning JSON listing data.

**Output:** populate `rendering.*` and `rendering.ajax_endpoints` in portal YAML profile.

## Layer C — Anti-Bot (Budget: 100 requests total)

- [ ] Inspect response headers from Layer B. Identify protection: `cf-ray`, `x-datadome`, `x-akamai-*`.
- [ ] Determine if cold requests succeed (no prior cookies).
- [ ] Determine if session warming required: fresh cookies → homepage → search. Does it work vs. direct search?
- [ ] Probe rate limit conservatively: 5 req in 10s, then 10 req in 60s. Stop on first challenge.
- [ ] Test user-agent sensitivity: curl UA, bot UA, browser UA. Note which are accepted.
- [ ] If challenge appears, save challenge page HTML. Identify type: JS, hCaptcha, reCAPTCHA, behavioral, IP block.

**Output:** populate `anti_bot.*` in profile. Include confidence level for rate-limit estimate.

## Layer D — Content Structure

### Search page
- [ ] Document URL grammar: mutate one parameter at a time, observe results.
- [ ] Build district map for Berlin districts in config.
- [ ] Identify newest-first sort param. Verify with timestamps.
- [ ] Identify pagination scheme.
- [ ] List filters supported in URL vs. client-side only.

### Detail page
For each field: document source (DOM selector or JSON path), format, presence rate across samples:
- [ ] cold_rent, warm_rent, Nebenkosten, Heizkosten
- [ ] Kaution, Provision, Ablöse
- [ ] sqm, rooms, floor, year_built
- [ ] available_from, contract_type, furnished
- [ ] listing_id, posted_at, updated_at
- [ ] contact_name, contact_type, agency_name
- [ ] description, image_urls, address

**Output:** populate `extraction.*` and `query_grammar.*` in profile.

## Layer E — Discovery

- [ ] Confirm RSS/Atom presence.
- [ ] Confirm API presence and auth requirements.
- [ ] Document email-alert mechanics if available.
- [ ] Sample posted_at timestamps across 20+ recent listings. Estimate update frequency.
- [ ] Identify new-listing detection: "posted after X" filter? Newest-first sort? Relative timestamps?
- [ ] Recommend poll_interval_s based on observed update frequency.

**Output:** populate `discovery.*` in profile.

## Self-Check (Before Declaring Done)

- [ ] Fetch one fresh listing using `strategy.recommended_order[0]`.
- [ ] Parse with field map in `extraction.detail.fields`.
- [ ] Verify field count matches `expected_field_count` ± 1.
- [ ] If self-check fails: profile is wrong — go back and fix it.
- [ ] If passes: stamp `last_verified: <today>` and write final profile.

## Drift Detection (Re-Recon Mode)

- [ ] Read existing `portals/<portal>.yaml`.
- [ ] Run Layer B and D quickly using existing selectors.
- [ ] Diff: which fields now fail? Which selectors are stale?
- [ ] If drift > 20% of fields: full re-recon. If < 20%: targeted patch.
- [ ] Increment `revisions` counter and add `revision_notes` entry.
