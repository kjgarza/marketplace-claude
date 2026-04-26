# Berlin Flat Hunter — Claude Code Plugin Architecture

Before diving in, a few clarifying thoughts on scope: Berlin's flat market has some unique mechanics (WBS, *Staffelmiete*, *Schufa*, *Mietspiegel*, *Wohnungsgenossenschaften*) and the major portals (ImmoScout24, Immowelt, WG-Gesucht, Kleinanzeigen, Inberlin, Immobilien.de) each have very different anti-bot postures. The architecture below is designed around those realities.

---

## 1. High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                  Claude Code Plugin: berlin-flats               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐   ┌──────────────┐   ┌──────────────────┐     │
│  │  Slash Cmds  │   │  Sub-agents  │   │  Skills (MD)     │     │
│  │  /hunt       │   │  scout       │   │  query-builder   │     │
│  │  /watch      │   │  scam-judge  │   │  scam-patterns   │     │
│  │  /contact    │   │  scribe      │   │  message-tone    │     │
│  │  /triage     │   │  triage      │   │  berlin-context  │     │
│  └──────────────┘   └──────────────┘   └──────────────────┘     │
│         │                  │                    │               │
│         └──────────────────┼────────────────────┘               │
│                            ▼                                    │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │              MCP Servers (local)                        │    │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌─────────────┐ │    │
│  │  │  qurl    │ │ scraper  │ │ portals  │ │ chrome-     │ │    │
│  │  │ (cache)  │ │ (4-tier) │ │ (query)  │ │ messenger   │ │    │
│  │  └──────────┘ └──────────┘ └──────────┘ └─────────────┘ │    │
│  └─────────────────────────────────────────────────────────┘    │
│                            │                                    │
│                            ▼                                    │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │         Storage: SQLite + qurl cache + JSONL log        │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

The plugin is structured as a single Claude Code plugin with **four MCP servers** doing the heavy lifting, **four sub-agents** owning distinct cognitive tasks, and a small set of **slash commands** as the user interface. Sub-agents matter here because scam detection needs a different system prompt and tool surface than message drafting — keeping them isolated also keeps context windows clean during long watch loops.

---

## 2. Configuration (`~/.claude/plugins/berlin-flats/config.toml`)

```toml
[profile]
name              = "Kristian"
move_in_earliest  = "2026-06-01"
move_in_latest    = "2026-09-01"
contract_type     = ["unbefristet"]      # avoid Zwischenmiete unless set
furnished         = "either"
schufa_ready      = true
wbs               = false
income_net_eur    = 0                    # used for affordability sanity check
employer          = "Digital Science"

[search]
districts         = ["Prenzlauer Berg", "Friedrichshain", "Mitte", "Kreuzberg", "Neukölln-Nord"]
exclude_areas     = ["Marzahn", "Hellersdorf"]
min_rooms         = 2
max_rooms         = 3.5
min_sqm           = 55
max_warm_rent_eur = 1600
max_cold_rent_eur = 1300
must_have         = ["Altbau", "Balkon|Terrasse"]   # regex-OR groups
nice_to_have      = ["Aufzug", "EBK", "Parkett"]
deal_breakers     = ["WG", "Tausch", "Souterrain", "Hochparterre"]

[portals]
enabled = ["immoscout24", "immowelt", "kleinanzeigen", "wg_gesucht", "inberlin", "immobilien_de"]

[portals.immoscout24]
strategy_order    = ["readability", "jina", "playwright", "chrome"]
poll_interval_s   = 90
respect_robots    = true

[scraping]
default_strategy_order = ["readability", "jina", "playwright", "chrome"]
cache_ttl_listing_s    = 3600
cache_ttl_search_s     = 120
max_concurrent         = 3
user_agent_pool        = "rotating"

[scam_detection]
threshold_block       = 0.85   # auto-discard
threshold_review      = 0.55   # surface for human review
qurl_dedup_window_d   = 30     # cross-portal duplicate window

[contact]
default_language      = "de"
fallback_language     = "en"
tone                  = "warm-professional"   # see message-tone skill
include_attachments   = ["schufa.pdf", "income_proof.pdf", "self_intro.pdf"]
send_via              = "chrome"   # or "draft_only"
auto_send             = false      # ALWAYS require approval first

[notifications]
telegram_chat_id      = "..."
desktop               = true
quiet_hours           = "22:00-07:00"
```

Config is loaded once per session and validated against a JSON schema; bad config fails fast with a friendly diff against the schema rather than a stack trace.

---

## 3. The Four-Tier Scraping Strategy

Every fetch goes through `qurl` first (folder ..aves/qurl). If it's cached and fresh, we never hit the network. On cache miss, the **scraper MCP/CLI** walks the strategy ladder in order, escalating only on failure:

| Tier | Tool | When it works | When it fails | Cost |
|------|------|---------------|---------------|------|
| 1 | **Readability** (via qurl + readability-rs/mozilla-readability) | Static HTML, server-rendered listings (Inberlin, some Immowelt) | JS-rendered content, paywalls, captchas | ~free |
| 2 | **Jina Reader** (`r.jina.ai/<url>`) | Most public pages, decent at JS-light SPAs | Aggressive bot detection (ImmoScout often), login walls | Low (rate-limited free tier) |
| 3 | **Playwright headless** (with stealth plugin, residential proxy optional) | JS-heavy pages, ImmoScout24, Immowelt detail pages | Cloudflare challenges, behavioral captchas | Medium |
| 4 | **Real Chrome via CDP** (your existing browser session, cookies intact) | Anything you can see logged in; defeats most anti-bot | Slow, blocks the browser, manual captcha solve | High |

Key design rules:
- **Each tier reports a confidence score** (`extracted_fields_count / expected_fields_count`). If readability returns a page but only extracts 2 of 8 expected fields, we escalate rather than trust it.
- **Failures are sticky per-domain**: if ImmoScout fails readability 3 times in a row, the scheduler skips tier 1 for that domain for 24h (stored in qurl metadata).
- **Chrome tier is rate-limited hard** (max 1 fetch / 30s) and pauses if the user is actively typing in the browser.
- **All tiers normalize to the same `Listing` schema** so downstream agents don't care which tier produced the data.

---

## 4. qurl Integration

`qurl` is used three ways here, not just one:

1. **HTTP cache** — every outbound fetch is `qurl get <url>`, with TTLs from config. This is the obvious use.
2. **Content-hash dedup** — qurl stores a normalized hash of each listing body. Cross-portal duplicates (same flat re-listed on ImmoScout and Immowelt) are detected by comparing hashes of the description's normalized text (whitespace-collapsed, lowercased, contact info stripped). A hash hit within `qurl_dedup_window_d` = duplicate.
3. **Fingerprint store** — beyond the page hash, we store a "listing fingerprint" in qurl's metadata layer: `(sqm, rooms, cold_rent, district, first_3_image_phashes)`. Two listings with matching fingerprints but different URLs are flagged as either swap-bait or duplicate, depending on other signals.

The MCP server exposes `qurl.fetch`, `qurl.get_hash`, `qurl.find_similar(fingerprint)`, and `qurl.mark_seen`.

---

## 5. Query Construction (the often-overlooked hard part)

Each portal has its own URL grammar, and getting this wrong silently returns garbage. A dedicated `portals` MCP server owns one `build_search_url(portal, criteria)` function per portal, plus a small **query-builder skill** (Markdown reference doc) that documents each portal's quirks:

- **ImmoScout24**: uses geo-coded district IDs (`Berlin/Berlin/Prenzlauer-Berg`), `wohnflaeche=55.0-` (open-ended ranges have a trailing dash), `preis=-1300`, room counts as floats with dots not commas, sorted by `sorting=2` for newest-first.
- **Immowelt**: different district slugs (`berlin-prenzlauer-berg`), `prima` query params, `&order=DateDesc`.
- **Kleinanzeigen**: location-as-postal-code-radius, separate URL for "Wohnung mieten" vs "WG"; needs an explicit `&distanceKm=0` to avoid surrounding Brandenburg leaking in.
- **WG-Gesucht**: stateful — requires a session cookie even for anonymous search; filters via a multi-step form, not URL params alone.
- **Inberlin**: simple, but only updates Mon-Fri mornings (genossenschaft listings).

The skill file documents these so when a portal changes its grammar (they all do, every 6-12 months), I can patch one Markdown file and the agent re-learns the rules without code changes.

---

## 6. Scam, Swap, and Red Flag Detection

This deserves its own sub-agent (`scam-judge`) because it's a classification task that benefits from a focused system prompt and benefits from being separable for evals. It runs on every new listing post-extraction and produces a structured verdict:

```json
{
  "verdict": "ok" | "review" | "block",
  "score": 0.73,
  "reasons": [
    {"code": "PRICE_OUTLIER", "weight": 0.35, "detail": "1100€ warm for 95sqm Mitte: 42% below Mietspiegel median"},
    {"code": "EXTERNAL_CONTACT", "weight": 0.25, "detail": "WhatsApp number in description"},
    {"code": "REVERSE_IMAGE_HIT", "weight": 0.20, "detail": "Image phash matches a listing in Hamburg from 2024"}
  ]
}
```

Detection layers, roughly in order of cost:

1. **Hard rules** (cheap, deterministic): WhatsApp/Telegram contact requests, "Western Union", "send deposit before viewing", landlord-abroad framing, payment to private account before key handover, Bitcoin mentions, Google Translate-flavored German, Airbnb-as-rental-platform claims.
2. **Statistical outliers**: rent vs. *Mietspiegel* by district + sqm + year-built. Anything >35% below median is suspicious; >50% below is almost always a scam. Berlin's Mietspiegel is published; we keep a local copy and refresh annually.
3. **Hidden fee patterns**: *Ablöse* over 2000€, mandatory furniture purchase, "renovation contribution," *Kaution* >3 months' cold rent (illegal — § 551 BGB), *Möblierungszuschlag* not separately disclosed, *Staffelmiete* steps above the legal cap.
4. **Swap/Tausch detection**: keywords (`Tausch`, `Wohnungstausch`, `biete gegen`, `suche im Tausch`), plus structural signal (listing requires a counter-offer property).
5. **Image-based**: perceptual hash of listing photos compared against (a) other current listings via qurl fingerprints, (b) a local cache of known scam image sets, (c) optionally a reverse-image API for high-suspicion cases only (cost gate).
6. **LLM judgment** for the long tail: the sub-agent reads description + extracted metadata and returns a structured assessment with reasons. Crucially, **the LLM is the last layer, not the first** — it's expensive and non-deterministic, so we only invoke it when rules are inconclusive.

Dedup happens here too, using qurl fingerprints (§4). A duplicate with a *better* price than its prior sighting is interesting (price drop); a duplicate at the *same* price across 4 portals from different "agents" is a red flag.

---

## 7. The Hunt Loop

```
┌─────────────────────────────────────────────────────────┐
│  /hunt                                                  │
│    │                                                    │
│    ▼                                                    │
│  load config                                            │
│    │                                                    │
│    ▼                                                    │
│  for each enabled portal (parallel, capped at 3):       │
│     1. portals.build_search_url(criteria)               │
│     2. scraper.fetch(url)  ── via qurl ──> tier ladder  │
│     3. parse → list of (url, snippet, posted_at)        │
│     4. filter: already-seen? → skip                     │
│     5. for each new listing:                            │
│        a. scraper.fetch(detail_url)                     │
│        b. normalize → Listing schema                    │
│        c. qurl.fingerprint → dedup check                │
│        d. scam-judge sub-agent → verdict                │
│        e. score against preferences (must/nice/breaker) │
│        f. if verdict=ok and score>threshold:            │
│              → /triage queue                            │
│              → notify (Telegram/desktop)                │
│    │                                                    │
│    ▼                                                    │
│  log run summary, sleep poll_interval, repeat (or exit) │
└─────────────────────────────────────────────────────────┘
```

`/watch` is just `/hunt` in a loop with backoff and quiet hours. `/triage` shows the queue and lets you accept/reject/snooze each. `/contact <id>` invokes the `scribe` sub-agent.

---

## 8. Contact & Chrome Messaging

The `scribe` sub-agent drafts messages with three constraints: speed (good listings die in 2-4 hours in Berlin, so latency matters), trust signals (mention Schufa, employment, no pets, non-smoker — the things landlords filter on), and authenticity (no AI-flavored boilerplate; the `message-tone` skill captures your literary register so messages don't read like ChatGPT). Each message is generated in German by default with English fallback, is 80-140 words, references one specific detail from the listing to prove human reading, and includes your standard attachments list.

The **chrome-messenger MCP** then takes over. It uses Chrome DevTools Protocol against your already-running Chrome (so you're logged into all portals), navigates to the listing's contact form, fills it, and **stops before submitting** unless `auto_send=true` *and* this listing is below a configured "auto-send confidence" threshold. By default, you approve every send. The submission step is screenshotted and logged.

For ImmoScout's "Premium contact" wall and similar paywalls, the messenger detects them and falls back to drafting a message you can paste manually, plus surfacing the landlord's name/agency for a parallel email if findable.

---

## 9. Storage & State

- **SQLite** (`~/.claude/plugins/berlin-flats/state.db`): listings, verdicts, contact log, run history. Indexed on `(portal, external_id)`, `(fingerprint)`, `(first_seen)`.
- **qurl cache**: HTTP bodies, content hashes, fingerprints (its native storage).
- **JSONL event log** (`events.jsonl`): append-only audit trail of every fetch, verdict, and message sent. Useful for debugging and for building evals later.
- **Skills** are plain Markdown in the plugin's `skills/` directory and version-controlled with the rest of the plugin.

---

## 10. Risks & Things Worth Deciding Up Front

A few things to weigh before building, since they shape the architecture meaningfully:

The **legal/ToS posture** matters. ImmoScout and Immowelt explicitly forbid scraping in their ToS; the practical risk is account/IP bans rather than legal action for personal use, but the Chrome-via-CDP tier specifically uses your logged-in session, so a ban is a real consequence. Worth deciding whether tier 4 should be opt-in per-run rather than default-enabled.

**Auto-send is dangerous** even with a high confidence threshold. I'd recommend keeping it off entirely for the first few weeks and reviewing the scribe's drafts in `/triage` until you've calibrated trust. The architecture supports this via `auto_send=false` as the default.

**The Mietspiegel data** is the backbone of price-outlier detection and needs to be refreshed; the 2024 *Mietspiegel* is current but a new one is published periodically. Worth building a one-shot `/refresh-mietspiegel` command rather than hard-coding values.

**WG-Gesucht's session-cookie requirement** complicates the parallel scrape model — it should probably get its own serialized worker rather than sharing the concurrency pool.




# Website Reconnaissance — What We Need to Know First

You're right that this is the keystone task. Get the recon wrong and every downstream component (scraping tier selection, query builder, scam detection, dedup) inherits the error. Below is what I'd want to know about each portal *before* writing a single line of scraper code, organized from cheapest-to-determine to most expensive.

---

## 1. The Recon Question Set

For each portal, we need answers in roughly five layers. The order matters — cheap layers gate expensive ones, and answers from earlier layers change what we need to ask later.

### Layer A — Identity & Legal Posture

Before anything technical, three things determine whether we should even be looking:

- **`robots.txt` contents** for the listing paths specifically, not just `/`. Many portals allow `/` but disallow `/expose/` or `/suche/`.
- **ToS clauses** on automated access — not to be scared off, but to know what tier we're operating in. Some portals explicitly permit RSS/feeds; some have undocumented public APIs; some forbid all automation. This determines whether tier 4 (Chrome-via-CDP) is acceptable for that portal.
- **Sitemaps** — `sitemap.xml` and any nested sitemap indexes. A good sitemap can replace search-page scraping entirely for some portals (Inberlin likely; Genossenschaften almost always). This is the single highest-leverage thing to check first.

### Layer B — How the Site Renders

The four-tier ladder only makes sense if we know which tier *should* work. The recon needs to determine:

- **SSR vs CSR vs hybrid**: does `curl` of a listing URL contain the rent, sqm, address in the HTML, or are those injected by JS after load? Easy test: fetch with no JS, grep for known field values.
- **Hydration pattern**: is there a `<script id="__NEXT_DATA__">` or similar JSON blob with the full listing data? This is the jackpot — it means we skip HTML parsing entirely and read structured JSON. ImmoScout has historically had this; worth confirming current state.
- **JSON-LD / schema.org markup**: many real-estate sites embed `RealEstateListing` or `Offer` schema in `<script type="application/ld+json">`. This is portable, stable across redesigns, and trivially parseable.
- **Open Graph / Twitter Card metadata**: the bare minimum fallback (title, image, sometimes price).
- **AJAX endpoints used by the page itself**: open DevTools Network tab on a listing, identify XHR/fetch calls returning JSON. These are often more stable than HTML and sometimes don't need auth. This is the second-highest-leverage finding.

### Layer C — Anti-Bot Posture

This decides which tier actually *succeeds*, regardless of which one *should* work technically:

- **Cloudflare / DataDome / PerimeterX / Akamai presence** — detectable from response headers (`server`, `cf-ray`, `x-datadome`) and challenge page signatures. ImmoScout uses DataDome; Immowelt has used Akamai; Kleinanzeigen has its own.
- **Challenge type when triggered**: JS challenge (Playwright handles), behavioral captcha (needs Chrome + human), hCaptcha/reCAPTCHA (needs solver or human), IP-based block (needs proxy rotation).
- **Rate limit thresholds** — empirically, how many requests per minute from one IP before challenges appear? Worth probing carefully with a small budget per portal.
- **Cookie/session requirements**: does the search page work cold, or does it need a session warmed by visiting the homepage first? WG-Gesucht is the obvious case here.
- **User-agent sensitivity**: do they block obvious bot UAs but accept any plausible browser UA? Or do they fingerprint via TLS/JA3?
- **Geo-fencing**: do non-DE IPs see different content or get challenged faster? Relevant if we ever route through a proxy.

### Layer D — Content Structure

Once we know how to fetch, we need to know what we're parsing. For both **search results pages** and **listing detail pages** separately:

- **URL grammar** — every parameter, what values it accepts, what the canonical form looks like, how pagination works (offset? page number? cursor token?), how sorting is expressed, and crucially **what the "newest first" sort key is** since that's our primary use case.
- **District/location encoding** — slugs vs IDs vs geo-polygons vs postal codes. Berlin is split inconsistently across portals: ImmoScout uses hierarchical slugs, Immowelt uses different slugs, Kleinanzeigen uses postal codes with radius, WG-Gesucht uses internal numeric city IDs. We need the full mapping per portal, stored as data not code.
- **Filter expressivity** — which of our criteria can be expressed in the URL/query and which must be filtered client-side after fetching. For example, "Altbau" is a real filter on ImmoScout but a free-text search on Kleinanzeigen.
- **Field inventory on listing pages** — exhaustive list: cold rent, warm rent, *Nebenkosten*, *Heizkosten*, *Kaution*, *Provision*, sqm, rooms, floor, year built, *Energieausweis* details, available-from date, contract type, furnished, contact name, contact type (private/agency), agency name, listing ID, posted date, last updated date. For each: what's the DOM selector or JSON path, what's the format (string? number with €? localized German number?), is it always present.
- **Listing ID stability** — does the same flat keep the same ID if reposted? Across portals there's no shared ID, but within a portal, ID stability matters for dedup vs. repost-detection.
- **Image URLs** — pattern, resolution variants available, whether they're hotlink-protected (relevant for perceptual hashing).
- **Posted-at timestamp** — is it absolute ("2026-04-25 14:32") or relative ("vor 2 Stunden")? Relative timestamps need parsing logic and a fetched-at reference.

### Layer E — Discovery Mechanics

How do new listings actually surface? This determines polling strategy:

- **Is there an RSS/Atom feed?** Some portals quietly expose them. Free, polite, no anti-bot. Worth searching for.
- **Is there a public/semi-public API?** ImmoScout has had a partner API; some Genossenschaften publish JSON endpoints.
- **Email alerts** — every major portal offers them. Could be received in a dedicated mailbox and parsed; this sidesteps scraping entirely for the discovery step (but you still need to fetch detail pages).
- **Update frequency and timing** — Inberlin updates business-hours weekday mornings; ImmoScout is continuous; Genossenschaften are weekly. This sets per-portal poll intervals far more accurately than a global default.
- **New-listing detection signal** — sort-by-newest + first-seen-tracking, or is there a true "posted after X" filter? The latter is much cheaper to poll.

---

## 2. The Recon Output — Per-Portal Profile

The deliverable from this phase isn't prose, it's a structured profile per portal that the scraper, query-builder, and scam-judge all read. Something like:

```yaml
# portals/immoscout24.yaml
portal: immoscout24
base_url: https://www.immobilienscout24.de
legal:
  robots_allows_listings: true|false|conditional
  tos_automation: forbidden|silent|permitted
  preferred_access: [api, rss, scrape]   # in order

discovery:
  rss: null
  api: null
  email_alerts: true
  sitemap: https://...
  newest_first_param: "sorting=2"
  poll_interval_s: 90

rendering:
  search_page: csr_with_hydration
  detail_page: ssr_with_hydration
  hydration_blob: 'script#__NEXT_DATA__'   # nullable
  jsonld_present: true
  ajax_endpoints:
    - {path: /Suche/de/wohnung-mieten, method: GET, returns: json, auth: none}

anti_bot:
  provider: datadome
  cold_request_works: true|false
  warm_session_required: false
  rate_limit_estimate_rpm: 20
  challenges_seen: [js, captcha]
  geo_sensitivity: low

strategy:
  recommended_order: [hydration_blob, jina, playwright_stealth, chrome]
  tier_confidence:
    readability: 0.2   # low — page is JS-heavy
    hydration_blob: 0.95
    jina: 0.6
    playwright: 0.85
    chrome: 0.99
  per_tier_cooldown_s:
    chrome: 30

query_grammar:
  district_encoding: hierarchical_slug
  district_map: {...}    # full Berlin mapping
  rent_param: "preis"
  rent_format: "min-max"     # "0-1300", "-1300", "800-"
  sqm_param: "wohnflaeche"
  rooms_param: "zimmer"
  rooms_format: "float_dot"
  newest_first: "sorting=2"
  filters_supported: [altbau, balkon, ebk, aufzug, ...]
  filters_client_side: [genossenschaft_only, ...]

extraction:
  search_results:
    selector: "..." # or json_path
    fields: {...}
  detail:
    primary_source: hydration_blob
    fallback_source: dom
    fields:
      cold_rent: {path: "...", format: "eur_de"}
      warm_rent: {path: "...", format: "eur_de"}
      sqm: {...}
      # ... full inventory
    expected_field_count: 18

quirks:
  - "Premium-only contact form for some agencies; detect class .premium-only"
  - "Listings older than 14d return 410 instead of 404"
  - "Address often hidden until contact request — only district guaranteed"

last_verified: 2026-04-26
```

This profile is what the recon phase produces. Every other component reads it. When a portal changes its grammar, we re-run recon and patch one file.

---

## 3. How to Actually Do the Recon

Three modes, used together:

**Static recon** is cheapest and comes first. For each portal: fetch homepage, fetch a sample search page, fetch 3-5 sample listing detail pages with plain HTTP. Inspect headers, body, embedded scripts. Run `robots.txt` and sitemap discovery. Look for JSON-LD, hydration blobs, RSS link tags. This alone answers maybe 60% of the questions and takes minutes per portal.

**Dynamic recon** is next. Open Chrome DevTools manually on each portal, with Network tab recording. Perform a real search, click into a listing, contact a listing (don't submit). Record every XHR, every cookie set, every challenge page if one appears. This reveals AJAX endpoints, session warming requirements, and anti-bot triggers. This is genuinely manual the first time per portal — automating it loses too much signal — but it's a one-time cost.

**Probing recon** is last and most careful. Once we think we understand a portal, we run a small calibration script: 20 fetches over 10 minutes via each tier, measuring success rate, latency, and challenge frequency. This empirically validates the `tier_confidence` numbers before we trust them in production. Probing budget should be small (e.g., 100 requests total per portal across the whole calibration) to avoid burning the IP.

---

## 4. What I'd Want to Decide Before Starting

A few choices that shape how recon should run, worth settling first:

The **portal priority order** matters because recon takes real time per portal and you'll likely want to start hunting on the top two before the others are profiled. My guess for Berlin: ImmoScout24 and Immowelt first (volume), Inberlin and Genossenschaften next (quality, low scam rate, easy to scrape), Kleinanzeigen and WG-Gesucht last (high scam rate, harder anti-bot — Kleinanzeigen — and stateful — WG-Gesucht). Worth confirming this matches your intuition.

The **recon-as-code question**: do we want recon to produce a static YAML profile that humans review and commit, or a live profile that the plugin re-validates on each run and self-heals when fields go missing? I'd recommend static-first (simpler, debuggable) with a `/recon-verify` command that detects drift and warns when re-recon is needed. The self-healing version is tempting but creates failure modes that are hard to debug.

The **manual-step boundary**: Layer A and Layer D can be fully automated. Layer B and Layer E are mostly automatable. Layer C (anti-bot probing) really benefits from a human watching the first run on each portal to interpret odd responses. Worth budgeting 30-45 minutes of your attention per portal for the initial recon, with everything after that automated.

The **storage of recon artifacts**: alongside the YAML profile, we should keep raw evidence — saved HTML snapshots, captured XHR responses, sample JSON-LD blobs — in a `recon/<portal>/<date>/` directory. When a portal changes and the scraper breaks, comparing old-vs-new evidence is the fastest path to a fix.



# `scout-recon` Sub-Agent

Below is the complete sub-agent definition plus the supporting skill it relies on. I'll structure it as drop-in files for the plugin.

---

## File 1: `agents/scout-recon.md`

```markdown
---
name: scout-recon
description: Reconnaissance specialist for real estate portals. Use this agent when a new portal needs to be profiled before scraping, when an existing portal profile shows drift (extraction failures, unexpected field counts, new challenge pages), or when the user explicitly asks to "recon", "profile", or "analyze" a portal. Produces a structured YAML profile at portals/<portal>.yaml plus raw evidence artifacts at recon/<portal>/<date>/. Does not scrape for listings — only characterizes how a portal works so other agents can scrape it correctly.
tools: Bash, Read, Write, Edit, Glob, Grep, WebFetch, mcp__qurl__fetch, mcp__qurl__get_metadata, mcp__scraper__try_tier, mcp__chrome__devtools_inspect
model: sonnet
---

You are **scout-recon**, the reconnaissance specialist for the berlin-flats plugin. Your single job is to characterize a real estate portal thoroughly enough that downstream agents (scraper, query-builder, scam-judge) can work against it reliably without further investigation.

You do not hunt for flats. You do not contact landlords. You do not extract listings for the user. You produce **portal profiles** — structured YAML files that document how a portal works.

## Your Output

For every recon run, you produce exactly two things:

1. **A portal profile** at `portals/<portal_slug>.yaml` following the schema in `skills/portal-profile-schema.md`.
2. **An evidence directory** at `recon/<portal_slug>/<YYYY-MM-DD>/` containing raw HTML snapshots, captured JSON responses, sample listing pages, and a `notes.md` with observations that didn't fit the schema.

The profile is the contract. The evidence is the audit trail. Both are required — a profile without evidence cannot be trusted, and evidence without a profile cannot be consumed by other agents.

## Your Method

You work through five layers in order. Earlier layers gate later ones — if Layer A reveals the portal forbids automation entirely, you stop and report rather than proceeding to Layer C anti-bot probing. Read `skills/recon-checklist.md` for the full layered checklist; use it as your working document for each run.

**Layer A — Identity & Legal Posture.** Fetch and read `robots.txt`, `sitemap.xml`, ToS, and any API documentation. Determine the portal's stance on automation. If automation is explicitly forbidden, note this prominently in the profile's `legal` section and set `legal.preferred_access` to reflect what the portal *does* permit (often: email alerts, RSS, partner API). Continue recon, but flag the portal so the user can decide whether to enable it.

**Layer B — Rendering.** Fetch a sample search page and 3–5 sample listing detail pages with plain HTTP (no JS). Determine SSR vs CSR, hunt for hydration blobs (`__NEXT_DATA__`, `__NUXT__`, `window.__INITIAL_STATE__`, etc.), JSON-LD, Open Graph metadata. The single most valuable finding at this layer is a hydration blob or JSON-LD with full listing data — this lets the scraper skip HTML parsing entirely. Document the location precisely.

**Layer C — Anti-Bot Posture.** Identify the protection provider from response headers and challenge page signatures (DataDome, Cloudflare, Akamai, PerimeterX, custom). Determine whether cold requests work, whether session warming is required, and what triggers escalation. Probe rate limits *carefully* — your total request budget for Layer C is 100 requests across the whole portal, not per page. If you trigger a challenge, stop probing immediately and document the threshold reached.

**Layer D — Content Structure.** Map URL grammar exhaustively for both search and detail pages. Build the district/location encoding map for Berlin (every district we care about, in the portal's encoding). Inventory every field on a detail page with its DOM selector or JSON path, format, and presence rate across your samples. Distinguish filters expressible in the URL from filters that must be applied client-side.

**Layer E — Discovery.** Find RSS feeds, public APIs, email-alert mechanisms, sitemaps. Determine update frequency by sampling timestamps across multiple listings. Identify the "newest first" sort key — this is the primary discovery mechanism for the hunt loop and getting it wrong silently breaks everything downstream.

## Your Tools

- **`mcp__qurl__fetch`** is your default fetcher. Always go through qurl so evidence is cached and re-runnable. Set appropriate TTLs — recon evidence should be cached aggressively (24h+) since you'll re-fetch the same pages while iterating on the profile.
- **`mcp__scraper__try_tier`** lets you test each scraping tier (readability, jina, playwright, chrome) against a sample URL and reports back success/failure plus extracted fields. Use this to populate `strategy.tier_confidence` empirically rather than guessing. This could be just a cli in scripts/
- **`mcp__chrome__devtools_inspect`** opens a real Chrome session against a URL and captures the network log, cookies, and console output. This is your tool for finding AJAX endpoints and characterizing anti-bot challenges. Use sparingly — it's slow and uses the user's actual browser.
- **`WebFetch`** is acceptable for one-off fetches outside the qurl-cached corpus (e.g., reading the portal's developer documentation).
- **`Bash`** for filesystem operations, `jq` on captured JSON, `xmllint` on sitemaps.
- **`Read/Write/Edit/Glob/Grep`** for everything else.

## Your Style

You work methodically and write down what you find as you find it. You do not skip layers. You do not guess where evidence is missing — you fetch it or you mark it `unknown` in the profile.

When a finding is uncertain (e.g., "rate limit appears to be ~20 rpm but only one probe was run"), you say so explicitly in the profile and the notes. Confidence calibration matters because downstream agents will trust your numbers.

You prefer small, cheap, reversible probes over large definitive ones. If you're not sure whether a fetch will trigger a challenge, you fetch one page and wait, not fifty. You treat the user's IP reputation as a finite resource.

You produce evidence even when it's redundant. If a JSON-LD blob and a hydration blob both contain the rent, you save both — because one of them will silently disappear in 6 months and the redundancy is what lets us notice.

## Your Constraints

- **Never submit a contact form, never log in as the user, never create an account.** Recon is read-only.
- **Never store credentials** even if you encounter them in the user's browser session.
- **Never run more than one portal's recon concurrently** — anti-bot systems sometimes correlate traffic across portals on the same IP, and concurrent probes confuse the rate-limit measurements.
- **Always stamp the profile with `last_verified: <today>`** and increment `schema_version` if you change the schema shape.
- **Always commit evidence before declaring the profile complete.** A profile referencing missing evidence is worse than no profile.
- **If a portal's anti-bot posture suggests serious consequences** (account ban risk, legal letters in ToS, geo-fencing that suggests legal restrictions), surface this prominently to the user and do not enable Chrome-tier probing without explicit confirmation.

## Your Workflow

1. Read `skills/recon-checklist.md` and `skills/portal-profile-schema.md` to refresh the working contract.
2. Read any existing profile at `portals/<portal>.yaml` — if one exists, you're doing a re-recon, not a fresh one. Diff your findings against the existing profile and report drift.
3. Create the evidence directory `recon/<portal>/<today>/`.
4. Work Layer A → E. After each layer, write findings to `notes.md` in the evidence directory and update the in-progress profile.
5. After Layer C, decide whether to continue. If anti-bot posture is hostile and the legal posture is also hostile, stop and report to the user.
6. After Layer E, run a self-check: fetch one more sample listing using the strategy you've recommended, parse it using the field map you've documented, and verify you get the expected fields. If self-check fails, the profile is wrong — go back and fix it before declaring done.
7. Write the final profile, write a one-page summary in `notes.md`, and report to the user with: what you found, what you're confident about, what you're not, and what you recommend they do next.

## Reporting Back

When you finish a recon run, your final message to the user is short and structured:

```
Profile written: portals/<portal>.yaml
Evidence: recon/<portal>/<date>/ (N files)

Recommended strategy: <tier>
Confidence: <high|medium|low>

Key findings:
  - <one-line bullet>
  - <one-line bullet>

Concerns:
  - <if any>

Recommended next step:
  - <one concrete action>
```

You do not pad reports. You do not summarize what the user already knows. You do not propose unrelated work. If recon went well, the report is six lines. If recon hit a wall, the report says so directly and proposes one path forward.

---

When you're ready to start, ask the user which portal to recon (if not specified) and whether this is a fresh recon or a re-verification of an existing profile.
```

---

## File 2: `skills/recon-checklist.md`

```markdown
# Recon Checklist

This is the working document scout-recon uses for every portal recon run. Treat it as a checklist, not prose. Tick items off in your evidence `notes.md` as you complete them.

## Layer A — Identity & Legal Posture

- [ ] Fetch `<base>/robots.txt`. Save raw. Note disallow rules for listing paths specifically.
- [ ] Fetch `<base>/sitemap.xml` and any nested sitemap indexes. Save raw. Count listing URLs.
- [ ] Locate ToS / AGB / Nutzungsbedingungen page. Save raw. Search for: "automated", "scraping", "robot", "crawl", "automatisiert", "Bot".
- [ ] Search for developer/API documentation: try `<base>/api`, `<base>/developers`, `<base>/partner`, Google `site:<base> api`.
- [ ] Look for RSS/Atom in HTML `<link rel="alternate">` tags on homepage and search pages.
- [ ] Look for email-alert signup form. Note URL and required fields.

**Decision gate:** If ToS forbids automation AND no permitted access path exists (no API, no RSS, no email alerts), set `legal.preferred_access: []` and warn the user before proceeding.

## Layer B — Rendering

- [ ] Fetch sample search page with plain HTTP (no JS). Save as `search-raw.html`.
- [ ] Fetch 3–5 sample listing detail pages with plain HTTP. Save as `detail-N-raw.html`.
- [ ] Grep raw HTML for known field values (a rent amount visible in the rendered page) — present means SSR, absent means CSR.
- [ ] Search raw HTML for: `__NEXT_DATA__`, `__NUXT__`, `__INITIAL_STATE__`, `window.__`, `application/ld+json`. Save any matches as separate files.
- [ ] Validate JSON-LD blobs against schema.org `RealEstateListing` / `Offer` / `Place`. Note completeness.
- [ ] Note Open Graph and Twitter Card metadata coverage on detail pages.
- [ ] Open one detail page in Chrome DevTools, record Network tab. Save HAR file. Identify XHR/fetch endpoints returning JSON listing data.

**Output:** populate `rendering.*` and `rendering.ajax_endpoints` in profile.

## Layer C — Anti-Bot Posture

**Budget: 100 requests total across this layer. Track count in notes.md.**

- [ ] Inspect response headers from Layer B fetches. Identify protection provider from: `server`, `cf-ray`, `x-datadome`, `x-akamai-*`, `x-px-*`.
- [ ] Determine if cold requests succeed (no prior cookies, fresh IP if possible).
- [ ] Determine if session warming is required: clear cookies, fetch homepage, then fetch search — does it work? Compare to fetching search directly.
- [ ] Probe rate limit conservatively: 5 requests in 10s, then 10 requests in 60s. Stop on first challenge. Note threshold reached.
- [ ] Test user-agent sensitivity: fetch with `curl/8.0`, with a bot UA (`Mozilla/5.0 (compatible; Googlebot/2.1)`), with a plausible browser UA. Note which are accepted.
- [ ] If a challenge appears, save the challenge page HTML/screenshot. Identify type: JS challenge, hCaptcha, reCAPTCHA, behavioral, IP block.
- [ ] Note whether geo-fencing is suspected (run optional only if the user has confirmed proxy access).

**Output:** populate `anti_bot.*` in profile. Include the empirical rate-limit number with explicit confidence ("estimated from one probe of 15 requests over 60s — reliability: low").

## Layer D — Content Structure

### Search page

- [ ] Document URL grammar by mutating one parameter at a time and observing results. Cover: location, price, rooms, sqm, sort, pagination, filters.
- [ ] Build full district map: for each Berlin district in the user's `search.districts` config, find the portal's encoding and verify it returns expected results.
- [ ] Identify newest-first sort param. Verify it works by sampling timestamps from results.
- [ ] Identify pagination scheme: page number, offset, cursor token, infinite scroll. Note max page reachable.
- [ ] List filters supported in URL. List filters NOT supported in URL (must be client-side).

### Detail page

- [ ] For each field in the standard inventory below, document: source (DOM selector or JSON path), format, presence rate across samples, fallback source if any.
  - cold rent (Kaltmiete)
  - warm rent (Warmmiete)
  - Nebenkosten
  - Heizkosten (separate from NK?)
  - Kaution
  - Provision (courtage / commission)
  - Ablöse (separate field or only mentioned in description?)
  - sqm (Wohnfläche)
  - rooms (Zimmer)
  - floor (Etage / Geschoss)
  - year built (Baujahr)
  - Energieausweis (type, value, class)
  - available from (frei ab)
  - contract type (befristet / unbefristet, Staffelmiete, Indexmiete)
  - furnished (möbliert)
  - listing ID (portal-internal)
  - posted date / first seen
  - last updated date
  - contact name
  - contact type (private / agency)
  - agency name (if applicable)
  - description (full text)
  - image URLs (with available resolution variants)
  - address (full / street-only / district-only / hidden)
- [ ] Compute `expected_field_count` = number of fields present in ≥80% of samples.
- [ ] Note quirks: paywalled fields, "Premium" contact gates, listings that 410 instead of 404, address-hidden listings.

**Output:** populate `extraction.*` and `query_grammar.*` in profile.

## Layer E — Discovery

- [ ] Confirm RSS/Atom presence (or absence) from Layer A finding.
- [ ] Confirm API presence (or absence) from Layer A finding. Document auth requirements.
- [ ] Document email-alert mechanics if available: signup URL, frequency options, format of received emails.
- [ ] Sample posted-at timestamps across 20+ recent listings to estimate update frequency. Note diurnal/weekly patterns.
- [ ] Determine new-listing detection mechanism:
  - Best: a true "posted after X" filter
  - Good: stable newest-first sort with reliable timestamps
  - Acceptable: newest-first sort with relative timestamps that need parsing
  - Worst: no sort by date — fall back to first-seen tracking
- [ ] Recommend `poll_interval_s` based on update frequency observed.

**Output:** populate `discovery.*` in profile.

## Self-Check (Before Declaring Done)

- [ ] Fetch one fresh listing detail page using the recommended tier from `strategy.recommended_order[0]`.
- [ ] Parse it using the field map in `extraction.detail.fields`.
- [ ] Verify field count matches `extraction.expected_field_count` ± 1.
- [ ] If self-check fails: profile is wrong. Go back and fix the failing layer.
- [ ] If self-check passes: stamp `last_verified: <today>` and commit profile + evidence.

## Drift Detection (Re-Recon Mode)

When re-reconning an existing portal:

- [ ] Read existing `portals/<portal>.yaml`.
- [ ] Run Layer B and Layer D quickly using existing selectors/paths.
- [ ] Diff: which fields previously extracted now fail? Which selectors are stale?
- [ ] If drift > 20% of fields: full re-recon required. If < 20%: targeted patch.
- [ ] Either way, increment a `revisions` counter in the profile and append a `revision_notes` entry describing what changed.
```

---

## File 3: `skills/portal-profile-schema.md`

```markdown
# Portal Profile Schema

The canonical structure for `portals/<portal>.yaml`. scout-recon writes these. Other agents read them. The schema is versioned — bump `schema_version` if you change the shape.

```yaml
schema_version: 1
portal: <slug>                    # immoscout24, immowelt, kleinanzeigen, etc.
display_name: <human-readable>
base_url: https://...
last_verified: <YYYY-MM-DD>
revisions: <int>
revision_notes:
  - {date: <YYYY-MM-DD>, change: <one-line description>}

legal:
  robots_allows_listings: true | false | conditional
  robots_notes: <string>
  tos_automation: forbidden | silent | permitted
  tos_quote: <verbatim relevant clause, if any>
  preferred_access:               # ordered list of permitted access paths
    - api | rss | email_alerts | sitemap | scrape
  ban_risk: low | medium | high
  notes: <string>

discovery:
  rss: <url> | null
  api: {url: <url>, auth: <type>, docs: <url>} | null
  email_alerts:
    available: true | false
    signup_url: <url>
    frequency_options: [instant, hourly, daily]
  sitemap: <url> | null
  newest_first_param: <string> | null
  posted_after_filter: true | false
  update_frequency: continuous | hourly | business_hours_weekday | weekly | unknown
  poll_interval_s: <int>
  poll_interval_confidence: high | medium | low

rendering:
  search_page: ssr | csr | hybrid_ssr | hybrid_csr
  detail_page: ssr | csr | hybrid_ssr | hybrid_csr
  hydration_blob:
    selector: <css selector> | null
    json_path_to_listing: <jq-style path>
    field_completeness: <float 0-1>
  jsonld_present: true | false
  jsonld_completeness: <float 0-1>
  opengraph_completeness: <float 0-1>
  ajax_endpoints:
    - path: <url path>
      method: GET | POST
      auth: none | session | bearer
      returns: html | json
      stability: stable | unstable | unknown
      notes: <string>

anti_bot:
  provider: cloudflare | datadome | akamai | perimeterx | custom | none
  cold_request_works: true | false
  warm_session_required: true | false
  warm_session_steps:
    - <ordered list of URLs to fetch to warm session>
  rate_limit_estimate_rpm: <int>
  rate_limit_confidence: high | medium | low
  challenges_seen:
    - type: js | captcha_hcaptcha | captcha_recaptcha | behavioral | ip_block
      trigger: <description>
      saved_evidence: <path under recon/>
  user_agent_sensitivity: strict | moderate | permissive
  geo_sensitivity: low | medium | high | unknown
  notes: <string>

strategy:
  recommended_order:              # ordered list of tiers to attempt
    - hydration_blob | jsonld | readability | jina | playwright_stealth | chrome
  tier_confidence:                # empirically measured success rate
    readability: <float 0-1>
    hydration_blob: <float 0-1>
    jsonld: <float 0-1>
    jina: <float 0-1>
    playwright_stealth: <float 0-1>
    chrome: <float 0-1>
  per_tier_cooldown_s:
    chrome: <int>
    playwright_stealth: <int>
  tier_calibration:
    sample_size_per_tier: <int>
    measured_at: <YYYY-MM-DD>

query_grammar:
  search_url_template: <string with {placeholders}>
  district_encoding: hierarchical_slug | flat_slug | numeric_id | postal_code | geo_polygon
  district_map:
    "Prenzlauer Berg": <encoded value>
    "Friedrichshain": <encoded value>
    # ... full Berlin map for districts in user config
  rent_param: <string>
  rent_format: <example: "min-max", "-max", "min-">
  sqm_param: <string>
  sqm_format: <string>
  rooms_param: <string>
  rooms_format: <string>
  newest_first: <param=value>
  pagination:
    style: page_number | offset | cursor | infinite_scroll
    param: <string>
    max_reachable: <int> | null
  filters_supported_in_url:
    - <filter name>: <param=value mapping>
  filters_client_side:
    - <filter name>

extraction:
  search_results:
    listing_card_selector: <css selector or json path>
    fields:
      url: <selector / path>
      title: <selector / path>
      cold_rent: <selector / path>
      sqm: <selector / path>
      rooms: <selector / path>
      district: <selector / path>
      posted_at: <selector / path>
      thumbnail: <selector / path>
  detail:
    primary_source: hydration_blob | jsonld | dom
    fallback_sources:
      - <ordered list>
    fields:
      cold_rent:
        path: <selector / json path>
        format: eur_de | eur_int | string
        required: true | false
        presence_rate: <float 0-1>
      warm_rent: { ... }
      nebenkosten: { ... }
      heizkosten: { ... }
      kaution: { ... }
      provision: { ... }
      ablose: { ... }
      sqm: { ... }
      rooms: { ... }
      floor: { ... }
      year_built: { ... }
      energieausweis_type: { ... }
      energieausweis_value: { ... }
      energieausweis_class: { ... }
      available_from: { ... }
      contract_type: { ... }
      furnished: { ... }
      listing_id: { ... }
      posted_at: { ... }
      updated_at: { ... }
      contact_name: { ... }
      contact_type: { ... }
      agency_name: { ... }
      description: { ... }
      image_urls: { ... }
      address: { ... }
      address_visibility: full | street | district | hidden
    expected_field_count: <int>

quirks:
  - description: <string>
    impact: blocking | annoying | informational
    workaround: <string>

scam_signals:
  # Portal-specific scam patterns observed during recon, fed to scam-judge
  - pattern: <string>
    notes: <string>

evidence:
  directory: recon/<portal>/<last_verified>/
  files:
    - <path>: <description>
```

## Required vs Optional

Required at minimum (profile is unusable without these): `schema_version`, `portal`, `base_url`, `last_verified`, `legal.preferred_access`, `rendering.search_page`, `rendering.detail_page`, `strategy.recommended_order`, `query_grammar.search_url_template`, `query_grammar.district_map`, `extraction.detail.primary_source`, `extraction.detail.fields` (with at least cold_rent, sqm, rooms, district, listing_id, posted_at).

Everything else is recommended but the profile is consumable without it. scout-recon should fill in as much as possible; when a field is genuinely unknowable, set it to `unknown` rather than omitting it, so consumers can distinguish "we didn't check" from "we checked and it's not there".
```

---

## File 4: `commands/recon.md` (slash command wrapper)

```markdown
---
description: Profile a real estate portal so the plugin can scrape it correctly. Runs the scout-recon sub-agent.
argument-hint: <portal_slug> [--re-verify]
allowed-tools: Task
---

Invoke the **scout-recon** sub-agent to profile portal: `$1`.

Mode: $2 (defaults to fresh recon if not specified; pass `--re-verify` to diff against existing profile).

Hand off to the sub-agent with these instructions:
- Portal to recon: `$1`
- If `--re-verify` was passed, read existing `portals/$1.yaml` first and run drift detection.
- Otherwise, full Layer A → E recon.
- Produce profile at `portals/$1.yaml` and evidence at `recon/$1/<today>/`.
- Report back in the structured format defined in your agent definition.

Before starting, confirm with the user:
1. The portal slug is correct.
2. Whether Chrome-tier probing is permitted for this portal (default: ask first if `legal.ban_risk` is unknown or non-low).
```

---

## How This Fits Into the Plugin

The four files above slot into the plugin layout I sketched in the architecture step:

```
berlin-flats/
├── plugin.json
├── agents/
│   └── scout-recon.md          ← new
├── commands/
│   └── recon.md                ← new
├── skills/
│   ├── recon-checklist.md      ← new
│   ├── portal-profile-schema.md ← new
│   ├── query-builder.md        (later)
│   ├── scam-patterns.md        (later)
│   └── message-tone.md         (later)
├── portals/                    ← scout-recon writes here
│   └── (one yaml per portal, version-controlled)
├── recon/                      ← scout-recon writes here
│   └── <portal>/<date>/        (raw evidence, gitignored or kept lean)
└── mcp-servers/
    ├── qurl/
    ├── scraper/
    ├── portals/
    └── chrome-messenger/
```

A few design choices worth flagging since they shape what comes next:

**The agent owns the contract, the skill owns the method.** The agent definition tells scout-recon *what it is* and *what it produces*; the checklist skill tells it *how to do it step by step*. This split means you can refine the methodology (the checklist) without retraining the agent's identity, and you can swap methodologies for different portal classes later (e.g., a `recon-checklist-genossenschaft.md` for Wohnungsgenossenschaften which work very differently from commercial portals).

**The schema is versioned and lives as a skill, not as code.** Other agents will read the YAML profiles via plain file reads and validate against the schema doc. When the schema changes, you bump `schema_version` and write a migration note — no code recompile, no MCP server restart. This is the same pattern that worked well for your `finance-de` plugin's compliance validator.

**Tools are scoped tightly.** scout-recon gets read-mostly tools — it cannot use the chrome-messenger's send capability, cannot trigger the scraper's full extraction pipeline, cannot write to the SQLite state DB. Recon is a pure function: portal → profile + evidence. This makes it safe to run unattended and easy to evaluate later (you can replay any recon run from the saved evidence).

**The self-check at the end of the checklist is doing real work.** Without it, scout-recon could produce confident-looking profiles that silently fail when the scraper agent tries to use them. The self-check forces an end-to-end validation using the profile's own claims, which is how you catch the "I documented the wrong selector" failure mode before it pollutes downstream agents.

**One thing I'd flag for your decision:** the `mcp__chrome__devtools_inspect` tool I gave scout-recon doesn't exist yet — it's a capability the chrome-messenger MCP server would need to expose for recon use. We could either build that as part of the chrome MCP server (cleaner, lets recon and messaging share session state) or split it into a separate recon-only MCP server (safer isolation, but duplicates browser-control code). I'd lean toward the first since the chrome session is the expensive resource and sharing it makes sense, but it's worth making the call before building the MCP servers.

Want me to design the `chrome-messenger` MCP server next (so scout-recon has its tooling), or would you rather pressure-test scout-recon by walking through a manual recon of ImmoScout24 together to see whether the checklist actually catches the things that matter?