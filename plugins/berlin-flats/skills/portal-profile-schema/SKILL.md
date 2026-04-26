---
name: Portal Profile Schema
description: Use when reading or writing portal YAML profiles in portals/<portal>.yaml. Defines the canonical structure that scout-recon writes and scraper/query-builder reads. Reference before creating or validating any portal profile.
---

The canonical structure for `portals/<portal>.yaml`. scout-recon writes these. Scripts and agents read them. Bump `schema_version` if you change the shape.

## Required Fields (profile is unusable without these)

```yaml
schema_version: 1
portal: <slug>                    # kleinanzeigen, immoscout24, etc.
display_name: <human-readable>
base_url: https://...
last_verified: <YYYY-MM-DD>
revisions: <int>

legal:
  preferred_access: [scrape|api|rss|email_alerts]
  ban_risk: low|medium|high

rendering:
  search_page: ssr|csr|hybrid_ssr|hybrid_csr
  detail_page: ssr|csr|hybrid_ssr|hybrid_csr

strategy:
  recommended_order: [readability|hydration_blob|jina|playwright_stealth|chrome]

query_grammar:
  search_url_template: <string with {placeholders}>
  district_map:
    "<District Name>": <encoded value>

extraction:
  detail:
    primary_source: hydration_blob|jsonld|dom
    fields:
      cold_rent: {path: ..., format: ..., required: true, presence_rate: 0.0}
      sqm: {path: ..., format: ..., required: false, presence_rate: 0.0}
      rooms: {path: ..., format: ..., required: false, presence_rate: 0.0}
      district: {path: ..., format: ..., required: true, presence_rate: 0.0}
      listing_id: {path: ..., format: ..., required: true, presence_rate: 0.0}
      posted_at: {path: ..., format: ..., required: false, presence_rate: 0.0}
    expected_field_count: <int>
```

## Full Schema (all fields)

See `portals/kleinanzeigen.yaml` for a complete filled example. Key sections:

- `legal`: robots_allows_listings, tos_automation, preferred_access, ban_risk, notes
- `discovery`: rss, api, email_alerts, sitemap, newest_first_param, update_frequency, poll_interval_s
- `rendering`: page types, hydration_blob selector, jsonld_present, ajax_endpoints
- `anti_bot`: provider, cold_request_works, rate_limit_estimate_rpm, challenges_seen
- `strategy`: recommended_order, tier_confidence (0-1 float per tier), per_tier_cooldown_s
- `query_grammar`: search_url_template, district_encoding, district_map, rent/sqm/rooms params
- `extraction`: search_results card selector + fields; detail primary_source + all fields
- `quirks`: array of {description, impact: blocking|annoying|informational, workaround}
- `scam_signals`: portal-specific patterns fed to scam-judge
- `evidence`: directory path and file list

## Formats Reference

| Format | Meaning | Example input | Parsed value |
|--------|---------|--------------|--------------|
| `eur_de` | German euro string | "1.350 €" | 1350 |
| `sqm_de` | German sqm string | "65 m²" | 65 |
| `float_de` | German float | "2,5" | 2.5 |
| `url_last_segment` | Last path segment | ".../789-101" | "789" |
| `de_date_relative` | German relative date | "vor 2 Stunden" | requires fetched_at reference |
| `url_list` | List of src attrs | multiple img tags | ["url1", "url2"] |

## Versioning

When changing the schema shape:
1. Bump `schema_version`
2. Add a `revision_notes` entry with the change description
3. Update any parsing code that reads specific paths
4. Do NOT silently rename fields — old profiles break if consumers expect old names
