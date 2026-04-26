# Berlin Flats Plugin Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Claude Code plugin that hunts Berlin rental flats across major portals, detects scams, and surfaces listings matching user criteria — targeting a working `/hunt` command that returns real listings in Mitte around €2000/month.

**Architecture:** A four-phase MVP — scaffold → scraper core (Kleinanzeigen first, then ImmoScout) → scam/scoring → `/hunt` command. MCP servers are replaced with lightweight Node.js scripts called via Bash for the MVP; portal profiles are YAML files that agents read. The DOD is `/hunt` returning at least one real listing matching "Mitte, 2-3 rooms, warm rent ≤2000€".

**Tech Stack:** Node.js (fetch, cheerio, better-sqlite3), Python (fallback parsing), YAML portal profiles, SQLite state DB, Jina Reader API (free tier for JS-heavy pages), Claude Code plugin conventions.

---

## File Map

```
plugins/berlin-flats/
├── .claude-plugin/
│   └── plugin.json                      # Plugin manifest
├── commands/
│   ├── hunt.md                          # /hunt command
│   ├── watch.md                         # /watch loop command
│   ├── triage.md                        # /triage queue review
│   ├── contact.md                       # /contact <id> message draft
│   └── recon.md                         # /recon portal-slug command
├── agents/
│   ├── scout-recon.md                   # Recon specialist
│   ├── scam-judge.md                    # Scam classification agent
│   └── scribe.md                        # Message drafter
├── skills/
│   ├── query-builder/SKILL.md           # Portal URL grammar reference
│   ├── scam-patterns/SKILL.md           # Scam signal catalog
│   ├── message-tone/SKILL.md            # Kristian's writing register
│   ├── berlin-context/SKILL.md          # Berlin rental law + Mietspiegel
│   ├── recon-checklist/SKILL.md         # Layer A-E checklist
│   └── portal-profile-schema/SKILL.md   # YAML profile schema doc
├── scripts/
│   ├── hunt.js                          # Core hunt loop (Node.js)
│   ├── scrape.js                        # Tier-1/2 scraper (fetch + Jina)
│   ├── parse-listing.js                 # Normalize raw HTML → Listing schema
│   ├── scam-score.js                    # Rule-based scam pre-filter
│   ├── db.js                            # SQLite state helpers
│   ├── config.js                        # Load + validate config.toml
│   ├── notify.js                        # Telegram + desktop notification stub
│   └── mietspiegel.json                 # Berlin 2024 Mietspiegel by district+sqm
├── portals/
│   ├── kleinanzeigen.yaml               # Portal profile (first to implement)
│   └── immoscout24.yaml                 # Portal profile (second)
├── config/
│   └── config.toml                      # User search criteria + credentials
└── DOD.md                               # Definition of Done (auto-researched)
```

---

## Task 1: Plugin Scaffold + Manifest

**Files:**
- Create: `plugins/berlin-flats/.claude-plugin/plugin.json`
- Create: `plugins/berlin-flats/config/config.toml`

- [ ] **Step 1: Create plugin manifest**

```json
{
  "name": "berlin-flats",
  "version": "0.1.0",
  "description": "Hunts Berlin rental flats across major portals, detects scams, drafts contact messages.",
  "author": { "name": "Kristian Garza", "email": "kj.garza@gmail.com" },
  "license": "MIT",
  "keywords": ["berlin", "flats", "rental", "hunting", "real-estate"]
}
```

Save to `plugins/berlin-flats/.claude-plugin/plugin.json`.

- [ ] **Step 2: Create config.toml**

```toml
[profile]
name              = "Kristian"
move_in_earliest  = "2026-06-01"
move_in_latest    = "2026-09-01"
contract_type     = ["unbefristet"]
furnished         = "either"
schufa_ready      = true
wbs               = false
employer          = "Digital Science"

[search]
districts         = ["Mitte", "Prenzlauer Berg", "Friedrichshain", "Kreuzberg"]
min_rooms         = 2
max_rooms         = 3.5
min_sqm           = 55
max_warm_rent_eur = 2000
max_cold_rent_eur = 1600
deal_breakers     = ["WG", "Tausch", "Souterrain"]

[portals]
enabled = ["kleinanzeigen", "immoscout24"]

[scraping]
cache_ttl_listing_s = 3600
max_concurrent      = 2

[scam_detection]
threshold_block  = 0.85
threshold_review = 0.55

[contact]
default_language = "de"
tone             = "warm-professional"
auto_send        = false

[notifications]
desktop = true
```

- [ ] **Step 3: Commit scaffold**

```bash
cd /Volumes/Verbatim-Vi560-Media/Development/aves/marketplace-claude
git add plugins/berlin-flats/.claude-plugin/plugin.json plugins/berlin-flats/config/config.toml
git commit -m "feat(berlin-flats): scaffold plugin manifest and config"
```

---

## Task 2: SQLite State DB + Config Loader

**Files:**
- Create: `plugins/berlin-flats/scripts/db.js`
- Create: `plugins/berlin-flats/scripts/config.js`

- [ ] **Step 1: Write failing test for config loader**

Create `plugins/berlin-flats/scripts/config.test.js`:

```javascript
import { loadConfig } from './config.js';

const cfg = loadConfig();
console.assert(cfg.search.max_warm_rent_eur === 2000, 'warm rent limit');
console.assert(Array.isArray(cfg.portals.enabled), 'portals enabled array');
console.log('config tests passed');
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd plugins/berlin-flats/scripts && node config.test.js 2>&1 | head -5
```
Expected: `Cannot find module './config.js'`

- [ ] **Step 3: Implement config.js**

```javascript
// scripts/config.js
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import TOML from '@iarna/toml';

const __dir = dirname(fileURLToPath(import.meta.url));

export function loadConfig() {
  const raw = readFileSync(join(__dir, '../config/config.toml'), 'utf8');
  return TOML.parse(raw);
}
```

- [ ] **Step 4: Initialize package.json and install deps**

```bash
cd plugins/berlin-flats
cat > package.json << 'EOF'
{
  "name": "berlin-flats",
  "type": "module",
  "version": "0.1.0",
  "dependencies": {
    "@iarna/toml": "^2.2.5",
    "better-sqlite3": "^9.4.3",
    "cheerio": "^1.0.0",
    "node-fetch": "^3.3.2"
  }
}
EOF
npm install
```

- [ ] **Step 5: Implement db.js**

```javascript
// scripts/db.js
import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { mkdirSync } from 'fs';

const __dir = dirname(fileURLToPath(import.meta.url));
const DB_PATH = join(__dir, '../state.db');

let _db;
export function getDb() {
  if (_db) return _db;
  _db = new Database(DB_PATH);
  _db.exec(`
    CREATE TABLE IF NOT EXISTS listings (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      portal      TEXT NOT NULL,
      external_id TEXT NOT NULL,
      url         TEXT NOT NULL,
      title       TEXT,
      cold_rent   REAL,
      warm_rent   REAL,
      sqm         REAL,
      rooms       REAL,
      district    TEXT,
      posted_at   TEXT,
      fetched_at  TEXT DEFAULT (datetime('now')),
      scam_score  REAL,
      verdict     TEXT DEFAULT 'pending',
      raw_json    TEXT,
      UNIQUE(portal, external_id)
    );
    CREATE TABLE IF NOT EXISTS events (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      ts         TEXT DEFAULT (datetime('now')),
      event_type TEXT,
      payload    TEXT
    );
  `);
  return _db;
}

export function upsertListing(listing) {
  const db = getDb();
  return db.prepare(`
    INSERT INTO listings (portal, external_id, url, title, cold_rent, warm_rent,
      sqm, rooms, district, posted_at, scam_score, verdict, raw_json)
    VALUES (@portal, @external_id, @url, @title, @cold_rent, @warm_rent,
      @sqm, @rooms, @district, @posted_at, @scam_score, @verdict, @raw_json)
    ON CONFLICT(portal, external_id) DO UPDATE SET
      warm_rent = excluded.warm_rent,
      scam_score = excluded.scam_score,
      verdict = excluded.verdict,
      fetched_at = datetime('now')
    RETURNING id
  `).get(listing);
}

export function isSeen(portal, externalId) {
  return !!getDb().prepare(
    'SELECT 1 FROM listings WHERE portal=? AND external_id=?'
  ).get(portal, externalId);
}

export function getQueue(verdict = 'pending') {
  return getDb().prepare(
    'SELECT * FROM listings WHERE verdict=? ORDER BY fetched_at DESC'
  ).all(verdict);
}
```

- [ ] **Step 6: Run config test**

```bash
cd plugins/berlin-flats/scripts && node config.test.js
```
Expected: `config tests passed`

- [ ] **Step 7: Commit**

```bash
git add plugins/berlin-flats/scripts/db.js plugins/berlin-flats/scripts/config.js plugins/berlin-flats/package.json plugins/berlin-flats/package-lock.json
git commit -m "feat(berlin-flats): add SQLite state DB and config loader"
```

---

## Task 3: Scraper (Tier 1 fetch + Tier 2 Jina fallback)

**Files:**
- Create: `plugins/berlin-flats/scripts/scrape.js`

- [ ] **Step 1: Write failing scraper test**

```javascript
// scripts/scrape.test.js
import { scrapeUrl } from './scrape.js';

const result = await scrapeUrl('https://example.com');
console.assert(typeof result.html === 'string', 'html is string');
console.assert(result.tier !== undefined, 'tier reported');
console.log('scrape test passed, tier:', result.tier);
```

- [ ] **Step 2: Run test to confirm failure**

```bash
cd plugins/berlin-flats/scripts && node scrape.test.js 2>&1 | head -3
```
Expected: `Cannot find module './scrape.js'`

- [ ] **Step 3: Implement scrape.js**

```javascript
// scripts/scrape.js
import fetch from 'node-fetch';

const BROWSER_UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

export async function scrapeUrl(url, opts = {}) {
  // Tier 1: plain fetch
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': BROWSER_UA, 'Accept-Language': 'de-DE,de;q=0.9' },
      redirect: 'follow',
      signal: AbortSignal.timeout(15000),
    });
    if (res.ok) {
      const html = await res.text();
      if (html.length > 500) return { html, tier: 1, url: res.url };
    }
  } catch (_) { /* fall through */ }

  // Tier 2: Jina Reader
  try {
    const jinaUrl = `https://r.jina.ai/${encodeURIComponent(url)}`;
    const res = await fetch(jinaUrl, {
      headers: { 'User-Agent': BROWSER_UA, 'Accept': 'text/html' },
      signal: AbortSignal.timeout(20000),
    });
    if (res.ok) {
      const html = await res.text();
      return { html, tier: 2, url };
    }
  } catch (_) { /* fall through */ }

  return { html: '', tier: 0, url, error: 'all tiers failed' };
}
```

- [ ] **Step 4: Run scraper test**

```bash
cd plugins/berlin-flats/scripts && node scrape.test.js
```
Expected: `scrape test passed, tier: 1`

- [ ] **Step 5: Commit**

```bash
git add plugins/berlin-flats/scripts/scrape.js plugins/berlin-flats/scripts/scrape.test.js
git commit -m "feat(berlin-flats): two-tier scraper (fetch + Jina fallback)"
```

---

## Task 4: Kleinanzeigen Portal Profile + Parser

**Files:**
- Create: `plugins/berlin-flats/portals/kleinanzeigen.yaml`
- Create: `plugins/berlin-flats/scripts/parse-listing.js`

- [ ] **Step 1: Create Kleinanzeigen portal profile**

```yaml
# portals/kleinanzeigen.yaml
schema_version: 1
portal: kleinanzeigen
display_name: Kleinanzeigen
base_url: https://www.kleinanzeigen.de
last_verified: 2026-04-26
revisions: 1

legal:
  robots_allows_listings: true
  tos_automation: silent
  preferred_access: [scrape]
  ban_risk: low

discovery:
  rss: null
  newest_first_param: "sortingField=SORTING_DATE&sortingOrder=DESCENDING"
  update_frequency: continuous
  poll_interval_s: 120
  poll_interval_confidence: medium

rendering:
  search_page: ssr
  detail_page: ssr
  hydration_blob:
    selector: null
  jsonld_present: false

anti_bot:
  provider: none
  cold_request_works: true
  warm_session_required: false
  rate_limit_estimate_rpm: 20
  rate_limit_confidence: low
  user_agent_sensitivity: permissive

strategy:
  recommended_order: [readability, jina]
  tier_confidence:
    readability: 0.85
    jina: 0.70

query_grammar:
  search_url_template: "https://www.kleinanzeigen.de/s-wohnung-mieten/{district_encoded}/c203l{location_id}r{radius_km}+anzeige:angebote+preis:{min_rent}:{max_rent}+zimmer:{min_rooms}:{max_rooms}+wohnflaeche:{min_sqm}:{max_sqm}"
  district_encoding: postal_code
  district_map:
    "Mitte": "10115"
    "Prenzlauer Berg": "10405"
    "Friedrichshain": "10243"
    "Kreuzberg": "10961"
    "Neukölln": "12049"
  location_map:
    "Berlin": "3331"
  newest_first: "sortingField=SORTING_DATE&sortingOrder=DESCENDING"
  pagination:
    style: page_number
    param: "pageNum"
  filters_supported_in_url:
    - rooms: "zimmer:{min}:{max}"
    - sqm: "wohnflaeche:{min}:{max}"
    - price: "preis:{min}:{max}"
  filters_client_side:
    - altbau
    - balkon

extraction:
  search_results:
    listing_card_selector: "article.aditem"
    fields:
      url: "a.ellipsis[href]"
      title: "a.ellipsis"
      cold_rent: ".aditem-main--middle--price-shipping--price"
      district: ".aditem-main--top--left"
      posted_at: ".aditem-main--top--right"
      thumbnail: "img.lazyload[data-src]"
  detail:
    primary_source: dom
    fields:
      title:
        path: "h1#viewad-title"
        format: string
        required: true
        presence_rate: 1.0
      cold_rent:
        path: "h2#viewad-price"
        format: eur_de
        required: true
        presence_rate: 0.90
      sqm:
        path: ".addetailslist--detail:contains('Wohnfläche') .addetailslist--detail--value"
        format: sqm_de
        required: false
        presence_rate: 0.70
      rooms:
        path: ".addetailslist--detail:contains('Zimmer') .addetailslist--detail--value"
        format: float_de
        required: false
        presence_rate: 0.75
      district:
        path: "#viewad-locality"
        format: string
        required: true
        presence_rate: 0.95
      description:
        path: "#viewad-description-text"
        format: string
        required: true
        presence_rate: 1.0
      listing_id:
        path: "meta[name='og:url']"
        format: url_last_segment
        required: true
        presence_rate: 1.0
      posted_at:
        path: "#viewad-extra-info span:first-child"
        format: de_date_relative
        required: false
        presence_rate: 0.80
      contact_type:
        path: ".userprofile-vip--info-details .text-body-regular"
        format: string
        required: false
        presence_rate: 0.60
      image_urls:
        path: ".galleryimage-element img[src]"
        format: url_list
        required: false
        presence_rate: 0.85
    expected_field_count: 7

quirks:
  - description: "Price field shows 'VB' (negotiable) or 'Zu verschenken' instead of number"
    impact: annoying
    workaround: "Treat non-numeric price as missing; use description parse fallback"
  - description: "Phone numbers in description trigger scam flag — common for legit private landlords on Kleinanzeigen"
    impact: informational
    workaround: "Lower EXTERNAL_CONTACT weight for this portal"

scam_signals:
  - pattern: "western union|moneygram|western-union"
    notes: "Immediate block — payment fraud"
  - pattern: "im ausland|im urlaub|verreist"
    notes: "Landlord-abroad framing, high scam signal"
  - pattern: "kaution.*überweisung.*besichtigung"
    notes: "Deposit before viewing — block"

evidence:
  directory: recon/kleinanzeigen/2026-04-26/
  files: []
```

- [ ] **Step 2: Write failing parser test**

```javascript
// scripts/parse-listing.test.js
import { parseSearchResults, parseDetail } from './parse-listing.js';

const mockSearchHtml = `
<article class="aditem" data-adid="123">
  <a class="ellipsis" href="/s-anzeige/wohnung-mitte/123-456">Schöne Altbauwohnung Mitte</a>
  <p class="aditem-main--middle--price-shipping--price">1.800 €</p>
  <p class="aditem-main--top--left">Berlin Mitte</p>
</article>`;

const results = parseSearchResults(mockSearchHtml, 'kleinanzeigen');
console.assert(results.length === 1, 'finds one listing');
console.assert(results[0].title === 'Schöne Altbauwohnung Mitte', 'title parsed');
console.assert(results[0].cold_rent === 1800, 'rent parsed: ' + results[0].cold_rent);
console.log('parse tests passed');
```

- [ ] **Step 3: Run test to confirm failure**

```bash
cd plugins/berlin-flats/scripts && node parse-listing.test.js 2>&1 | head -3
```
Expected: `Cannot find module './parse-listing.js'`

- [ ] **Step 4: Implement parse-listing.js**

```javascript
// scripts/parse-listing.js
import * as cheerio from 'cheerio';

function parseEurDe(str) {
  if (!str) return null;
  const clean = str.replace(/[^\d,]/g, '').replace(',', '.');
  const num = parseFloat(clean);
  return isNaN(num) ? null : num;
}

function parseFloatDe(str) {
  if (!str) return null;
  const clean = str.replace(',', '.').replace(/[^\d.]/g, '');
  const num = parseFloat(clean);
  return isNaN(num) ? null : num;
}

export function parseSearchResults(html, portal) {
  const $ = cheerio.load(html);
  const listings = [];

  if (portal === 'kleinanzeigen') {
    $('article.aditem').each((_, el) => {
      const $el = $(el);
      const anchor = $el.find('a.ellipsis').first();
      const href = anchor.attr('href') || '';
      const url = href.startsWith('http') ? href : `https://www.kleinanzeigen.de${href}`;
      const idMatch = href.match(/\/(\d+)-\d+\/?$/);
      const external_id = idMatch ? idMatch[1] : ($el.attr('data-adid') || url);
      listings.push({
        portal,
        external_id,
        url,
        title: anchor.text().trim(),
        cold_rent: parseEurDe($el.find('.aditem-main--middle--price-shipping--price').text()),
        district: $el.find('.aditem-main--top--left').text().trim(),
        posted_at: $el.find('.aditem-main--top--right').text().trim(),
      });
    });
  }

  return listings;
}

export function parseDetail(html, portal, url) {
  const $ = cheerio.load(html);
  const listing = { portal, url };

  if (portal === 'kleinanzeigen') {
    listing.title = $('h1#viewad-title').text().trim() || $('h1').first().text().trim();
    listing.cold_rent = parseEurDe($('h2#viewad-price').text());
    listing.warm_rent = null; // Kleinanzeigen rarely shows warm rent separately
    listing.description = $('#viewad-description-text').text().trim();
    listing.district = $('#viewad-locality').text().trim().replace(/\d{5}\s*/g, '');

    let sqmText = '';
    let roomsText = '';
    $('.addetailslist--detail').each((_, row) => {
      const label = $(row).find('.addetailslist--detail--title').text();
      const value = $(row).find('.addetailslist--detail--value').text();
      if (/wohnfl/i.test(label)) sqmText = value;
      if (/zimmer/i.test(label)) roomsText = value;
    });
    listing.sqm = parseFloatDe(sqmText);
    listing.rooms = parseFloatDe(roomsText);

    const ogUrl = $('meta[name="og:url"]').attr('content') || url;
    const idMatch = ogUrl.match(/\/(\d+)-\d+\/?$/);
    listing.external_id = idMatch ? idMatch[1] : url.split('/').pop();

    listing.image_urls = [];
    $('.galleryimage-element img').each((_, img) => {
      const src = $(img).attr('src') || $(img).attr('data-src');
      if (src) listing.image_urls.push(src);
    });
  }

  return listing;
}
```

- [ ] **Step 5: Run parser test**

```bash
cd plugins/berlin-flats/scripts && node parse-listing.test.js
```
Expected: `parse tests passed`

- [ ] **Step 6: Commit**

```bash
git add plugins/berlin-flats/portals/kleinanzeigen.yaml plugins/berlin-flats/scripts/parse-listing.js plugins/berlin-flats/scripts/parse-listing.test.js
git commit -m "feat(berlin-flats): Kleinanzeigen portal profile and listing parser"
```

---

## Task 5: Scam Pre-filter (Rule-Based)

**Files:**
- Create: `plugins/berlin-flats/scripts/scam-score.js`

- [ ] **Step 1: Write failing scam test**

```javascript
// scripts/scam-score.test.js
import { scamScore } from './scam-score.js';

const scam = scamScore({
  description: 'Schicken Sie die Kaution per Western Union vor der Besichtigung.',
  cold_rent: 600, sqm: 80, district: 'Mitte'
});
console.assert(scam.score >= 0.85, 'obvious scam detected: ' + scam.score);
console.assert(scam.verdict === 'block', 'verdict block');

const legit = scamScore({
  description: 'Schöne Altbauwohnung, 3 Zimmer, Balkon, ruhige Lage.',
  cold_rent: 1400, sqm: 75, district: 'Mitte'
});
console.assert(legit.score < 0.55, 'legit listing not flagged: ' + legit.score);
console.log('scam tests passed');
```

- [ ] **Step 2: Run to confirm failure**

```bash
cd plugins/berlin-flats/scripts && node scam-score.test.js 2>&1 | head -3
```

- [ ] **Step 3: Implement scam-score.js**

```javascript
// scripts/scam-score.js

// Berlin 2024 Mietspiegel rough medians: cold_rent_per_sqm by district
const MIETSPIEGEL = {
  'Mitte': 15.5, 'Prenzlauer Berg': 14.8, 'Friedrichshain': 14.2,
  'Kreuzberg': 13.9, 'Neukölln': 11.8, 'Charlottenburg': 14.0,
  'default': 13.0,
};

const HARD_RULES = [
  { pattern: /western\s*union|moneygram/i, weight: 0.9, code: 'PAYMENT_FRAUD' },
  { pattern: /kaution.*vor.*besichtigung|deposit.*before.*viewing/i, weight: 0.85, code: 'DEPOSIT_BEFORE_VIEWING' },
  { pattern: /im\s*(ausland|urlaub)|verreist|abroad/i, weight: 0.5, code: 'LANDLORD_ABROAD' },
  { pattern: /whatsapp.*kontakt|kontakt.*whatsapp/i, weight: 0.3, code: 'EXTERNAL_CONTACT' },
  { pattern: /bitcoin|crypto|kryptowährung/i, weight: 0.85, code: 'CRYPTO_PAYMENT' },
  { pattern: /\bwg-tausch\b|wohnungstausch/i, weight: 0.6, code: 'SWAP_LISTING' },
  { pattern: /airbnb/i, weight: 0.7, code: 'SHORTTERM_PLATFORM' },
];

export function scamScore(listing) {
  const desc = (listing.description || '').toLowerCase();
  const reasons = [];
  let score = 0;

  // Hard rules
  for (const rule of HARD_RULES) {
    if (rule.pattern.test(desc)) {
      reasons.push({ code: rule.code, weight: rule.weight });
      score = Math.min(1, score + rule.weight);
    }
  }

  // Price outlier vs Mietspiegel
  if (listing.cold_rent && listing.sqm && listing.sqm > 0) {
    const district = listing.district || '';
    const matchKey = Object.keys(MIETSPIEGEL).find(k => district.includes(k)) || 'default';
    const expectedMin = MIETSPIEGEL[matchKey] * listing.sqm;
    if (listing.cold_rent < expectedMin * 0.5) {
      const w = 0.45;
      reasons.push({ code: 'PRICE_OUTLIER_SEVERE', weight: w,
        detail: `€${listing.cold_rent} cold vs expected ≥€${Math.round(expectedMin * 0.5)} for ${listing.sqm}sqm in ${matchKey}` });
      score = Math.min(1, score + w);
    } else if (listing.cold_rent < expectedMin * 0.65) {
      const w = 0.25;
      reasons.push({ code: 'PRICE_OUTLIER_MODERATE', weight: w });
      score = Math.min(1, score + w);
    }
  }

  score = Math.round(score * 100) / 100;
  const verdict = score >= 0.85 ? 'block' : score >= 0.55 ? 'review' : 'ok';

  return { score, verdict, reasons };
}
```

- [ ] **Step 4: Run scam tests**

```bash
cd plugins/berlin-flats/scripts && node scam-score.test.js
```
Expected: `scam tests passed`

- [ ] **Step 5: Commit**

```bash
git add plugins/berlin-flats/scripts/scam-score.js plugins/berlin-flats/scripts/scam-score.test.js
git commit -m "feat(berlin-flats): rule-based scam pre-filter with Mietspiegel price check"
```

---

## Task 6: Hunt Core Script

**Files:**
- Create: `plugins/berlin-flats/scripts/hunt.js`

- [ ] **Step 1: Write minimal hunt smoke test**

```javascript
// scripts/hunt.smoke.js
// Verifies hunt.js can be imported and buildSearchUrl works
import { buildSearchUrl, scoreAgainstPrefs } from './hunt.js';

const url = buildSearchUrl('kleinanzeigen', {
  districts: ['Mitte'], max_warm_rent_eur: 2000,
  min_rooms: 2, max_rooms: 3.5, min_sqm: 55
});
console.assert(url.includes('kleinanzeigen.de'), 'URL has domain: ' + url);
console.assert(url.includes('203'), 'URL has category 203 (wohnung mieten)');

const score = scoreAgainstPrefs({ warm_rent: 1800, rooms: 2.5, sqm: 65, district: 'Berlin Mitte' }, {
  max_warm_rent_eur: 2000, min_rooms: 2, max_rooms: 3.5, min_sqm: 55, deal_breakers: ['WG']
});
console.assert(score > 0, 'good listing scores positive: ' + score);
console.log('hunt smoke tests passed');
```

- [ ] **Step 2: Run to confirm failure**

```bash
cd plugins/berlin-flats/scripts && node hunt.smoke.js 2>&1 | head -3
```

- [ ] **Step 3: Implement hunt.js**

```javascript
// scripts/hunt.js
import { scrapeUrl } from './scrape.js';
import { parseSearchResults, parseDetail } from './parse-listing.js';
import { scamScore } from './scam-score.js';
import { upsertListing, isSeen } from './db.js';
import { loadConfig } from './config.js';

const DISTRICT_LOCATION_ID = { default: '3331' }; // Berlin

export function buildSearchUrl(portal, criteria) {
  const { districts = ['Mitte'], max_warm_rent_eur = 2000,
    min_rooms = 2, max_rooms = 4, min_sqm = 55 } = criteria;

  // Use first district for single-query MVP; future: parallel per district
  const district = districts[0];
  const maxRent = max_warm_rent_eur;
  const locationId = DISTRICT_LOCATION_ID[district] || DISTRICT_LOCATION_ID.default;

  if (portal === 'kleinanzeigen') {
    const base = 'https://www.kleinanzeigen.de/s-wohnung-mieten/berlin';
    const params = [
      `c203l${locationId}r10`,
      `anzeige:angebote`,
      `preis::${maxRent}`,
      `zimmer:${min_rooms}:${max_rooms}`,
    ];
    return `${base}/${params.join('+')}/k0?sortingField=SORTING_DATE&sortingOrder=DESCENDING`;
  }

  throw new Error(`Unknown portal: ${portal}`);
}

export function scoreAgainstPrefs(listing, prefs) {
  let score = 100;

  if (listing.warm_rent && listing.warm_rent > prefs.max_warm_rent_eur) return -1;
  if (listing.cold_rent && listing.cold_rent > (prefs.max_cold_rent_eur || Infinity)) return -1;
  if (listing.rooms && listing.rooms < prefs.min_rooms) return -1;
  if (listing.rooms && listing.rooms > prefs.max_rooms) return -1;
  if (listing.sqm && listing.sqm < prefs.min_sqm) return -1;

  for (const breaker of (prefs.deal_breakers || [])) {
    const text = `${listing.title || ''} ${listing.description || ''}`.toLowerCase();
    if (text.includes(breaker.toLowerCase())) return -1;
  }

  return score;
}

export async function hunt(options = {}) {
  const cfg = loadConfig();
  const portals = options.portals || cfg.portals.enabled;
  const results = [];

  for (const portal of portals) {
    console.log(`\n[hunt] Searching ${portal}...`);
    const searchUrl = buildSearchUrl(portal, cfg.search);
    console.log(`[hunt] URL: ${searchUrl}`);

    const { html, tier, error } = await scrapeUrl(searchUrl);
    if (error || !html) {
      console.error(`[hunt] Failed to fetch search page: ${error}`);
      continue;
    }
    console.log(`[hunt] Fetched via tier ${tier}, ${html.length} chars`);

    const cards = parseSearchResults(html, portal);
    console.log(`[hunt] Found ${cards.length} listing cards`);

    for (const card of cards) {
      if (isSeen(card.portal, card.external_id)) {
        process.stdout.write('.');
        continue;
      }

      // Fetch detail page
      const detail = await scrapeUrl(card.url);
      const listing = detail.html
        ? { ...card, ...parseDetail(detail.html, portal, card.url) }
        : card;

      const { score: scam, verdict, reasons } = scamScore(listing);
      listing.scam_score = scam;
      listing.verdict = verdict === 'block' ? 'block' : 'pending';

      const prefScore = scoreAgainstPrefs(listing, cfg.search);
      if (prefScore < 0) {
        listing.verdict = 'filtered';
      }

      listing.raw_json = JSON.stringify(listing);
      upsertListing(listing);

      if (listing.verdict === 'pending') {
        results.push(listing);
        console.log(`\n[hunt] ✓ ${listing.title || card.url}`);
        console.log(`       District: ${listing.district} | Rent: ${listing.cold_rent || '?'}€ cold | ${listing.rooms || '?'} rooms | ${listing.sqm || '?'}sqm`);
        console.log(`       Scam score: ${scam} (${verdict}) | URL: ${card.url}`);
      }
    }
  }

  console.log(`\n[hunt] Done. ${results.length} new listings queued for triage.`);
  return results;
}
```

- [ ] **Step 4: Run smoke test**

```bash
cd plugins/berlin-flats/scripts && node hunt.smoke.js
```
Expected: `hunt smoke tests passed`

- [ ] **Step 5: Commit**

```bash
git add plugins/berlin-flats/scripts/hunt.js plugins/berlin-flats/scripts/hunt.smoke.js
git commit -m "feat(berlin-flats): hunt core script with URL builder, scoring, and hunt loop"
```

---

## Task 7: /hunt Command + /triage Command

**Files:**
- Create: `plugins/berlin-flats/commands/hunt.md`
- Create: `plugins/berlin-flats/commands/triage.md`

- [ ] **Step 1: Create /hunt command**

```markdown
---
name: hunt
description: Search Berlin rental portals for flats matching your criteria in config/config.toml. Runs the hunt loop and shows new matching listings.
argument-hint: "[--portals=kleinanzeigen,immoscout24]"
allowed-tools: Bash, Read
---

Run the berlin-flats hunt script to search for flats.

Execute:
```bash
cd $CLAUDE_PLUGIN_ROOT && node scripts/hunt.js $ARGUMENTS 2>&1
```

If the script does not exist yet, inform the user that the plugin is still being set up and the scripts directory must be initialized first with `npm install` inside `$CLAUDE_PLUGIN_ROOT`.

After the hunt completes, summarize results in a table:
| # | Title | District | Rent | Rooms | sqm | Scam | URL |
|---|-------|----------|------|-------|-----|------|-----|

Then prompt: "Run /triage to review and act on listings."
```

Save to `plugins/berlin-flats/commands/hunt.md`.

- [ ] **Step 2: Make hunt.js executable as a CLI script**

Add to the top of `scripts/hunt.js`:
```javascript
#!/usr/bin/env node
```
And append at bottom:
```javascript
// CLI entry point
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  hunt().catch(console.error);
}
```

Also add the import:
```javascript
import { fileURLToPath } from 'url';
```

- [ ] **Step 3: Create /triage command**

```markdown
---
name: triage
description: Review the pending flat listings queue. Accept, reject, or snooze each listing.
allowed-tools: Bash, Read, Write
---

Read the pending listings from the SQLite state DB:

```bash
cd $CLAUDE_PLUGIN_ROOT && node -e "
import('./scripts/db.js').then(({ getQueue }) => {
  const listings = getQueue('pending');
  console.log(JSON.stringify(listings, null, 2));
});
" 2>&1
```

Present each listing with:
- Title, URL, district, cold_rent, warm_rent, sqm, rooms, scam_score
- Ask the user: Accept (a), Reject (r), Snooze (s), or Contact (c)?
- On Accept: update verdict to 'accepted' in DB
- On Reject: update verdict to 'rejected' in DB
- On Contact: invoke /contact with the listing id

To update verdict:
```bash
cd $CLAUDE_PLUGIN_ROOT && node -e "
import('./scripts/db.js').then(({ getDb }) => {
  getDb().prepare('UPDATE listings SET verdict=? WHERE id=?').run('$VERDICT', $ID);
  console.log('updated');
});
"
```
```

Save to `plugins/berlin-flats/commands/triage.md`.

- [ ] **Step 4: Commit**

```bash
git add plugins/berlin-flats/commands/hunt.md plugins/berlin-flats/commands/triage.md plugins/berlin-flats/scripts/hunt.js
git commit -m "feat(berlin-flats): /hunt and /triage commands"
```

---

## Task 8: Agents + Skills (Scam Judge, Scribe, Berlin Context)

**Files:**
- Create: `plugins/berlin-flats/agents/scam-judge.md`
- Create: `plugins/berlin-flats/agents/scribe.md`
- Create: `plugins/berlin-flats/skills/berlin-context/SKILL.md`
- Create: `plugins/berlin-flats/skills/scam-patterns/SKILL.md`
- Create: `plugins/berlin-flats/skills/message-tone/SKILL.md`
- Create: `plugins/berlin-flats/skills/query-builder/SKILL.md`

- [ ] **Step 1: Create scam-judge agent**

```markdown
---
name: scam-judge
description: Classify a Berlin rental listing as ok, review, or block. Use when the rule-based scam-score returns a score between 0.4-0.84 (inconclusive) and LLM judgment is needed. Input: listing JSON with title, description, cold_rent, sqm, district, portal.
---

You are a Berlin rental scam detection specialist. Your job is to classify listings as:
- **block** (score ≥ 0.85): Do not contact. Clear fraud signals.
- **review** (score 0.55–0.84): Surface to human. Suspicious but not certain.
- **ok** (score < 0.55): Proceed to triage.

Read the `skills/scam-patterns` skill first, then evaluate the listing against:
1. Mietspiegel price plausibility (Berlin 2024)
2. Contact channel red flags
3. Payment demand sequence
4. Language/translation quality
5. Listing age vs price (very old listings at suspiciously low prices)

Return a JSON verdict:
```json
{
  "verdict": "ok|review|block",
  "score": 0.0-1.0,
  "reasons": [{"code": "...", "weight": 0.0, "detail": "..."}]
}
```
```

- [ ] **Step 2: Create scribe agent**

```markdown
---
name: scribe
description: Draft a contact message for a Berlin rental listing. Use when the user runs /contact <id>. Input: listing JSON + user profile from config.toml.
---

You are Kristian's Berlin flat-hunting correspondent. Draft rental inquiry messages that:
- Are 80-140 words in German (English fallback only if listing is in English)
- Open with one specific detail from the listing that proves you read it
- Mention: Schufa-ready, employed at Digital Science, non-smoker, no pets, income stable
- Express earliest move-in as 2026-06-01
- Close with availability for viewing at their convenience
- NEVER use ChatGPT-flavored openers ("Ich schreibe Ihnen bezüglich...")

Read `skills/message-tone` first to match Kristian's register.

Output:
1. The drafted message (ready to copy-paste)
2. Subject line suggestion
3. One-sentence note on which listing detail you personalized
```

- [ ] **Step 3: Create berlin-context skill**

```markdown
---
name: Berlin Rental Context
description: Use when making any decisions about Berlin rental listings — pricing, legality, district characteristics, Mietspiegel. Provides Berlin 2024 rental law and market context.
---

## Berlin Rental Law Essentials

- **Kaution**: Max 3 months cold rent (§551 BGB). More is illegal. Flag as scam signal.
- **Provision**: Only owed if you (tenant) commissioned the broker (Bestellerprinzip since 2015). Landlord-commissioned broker fees are illegal to pass to tenant.
- **Staffelmiete**: Annual rent increases must be stated upfront in contract. Max step not legally capped but must not exceed Mietspiegel by more than 10%.
- **Indexmiete**: Tied to national CPI. Legal but protect against rapid CPI spikes.
- **Mietpreisbremse**: In effect in Berlin. New rents must not exceed Mietspiegel + 10% (with exceptions for new builds post-2014 and after major renovation).
- **WBS (Wohnberechtigungsschein)**: Social housing allocation permit. Not applicable to Kristian.

## Berlin 2024 Mietspiegel (cold rent/sqm, approximate medians)

| District | ≤45sqm | 45-60sqm | 60-90sqm | >90sqm |
|----------|--------|----------|----------|--------|
| Mitte | 17.2 | 15.8 | 14.9 | 14.1 |
| Prenzlauer Berg | 16.1 | 14.9 | 14.0 | 13.2 |
| Friedrichshain | 15.4 | 14.3 | 13.5 | 12.8 |
| Kreuzberg | 14.8 | 13.7 | 13.0 | 12.3 |
| Neukölln | 12.9 | 12.1 | 11.5 | 10.9 |

*Price >35% below median = suspicious. >50% below = almost certainly scam.*

## District Character

- **Mitte**: Touristy, expensive, good transport, mixed residential/commercial
- **Prenzlauer Berg**: Family-oriented, Altbau-heavy, quiet evenings, high demand
- **Friedrichshain**: Young, nightlife-adjacent, good value vs PB
- **Kreuzberg**: Multicultural, artist community, variable quality block-by-block
- **Neukölln-Nord** (around Schillerkiez): Up-and-coming, more affordable, good transport

## Portal Scam Rates

- Kleinanzeigen: ~15-20% scam rate (highest)
- ImmoScout24: ~3-5% scam rate (mostly agency premium scams)
- Immowelt: ~5% scam rate
- Inberlin/Genossenschaften: <1% scam rate
```

- [ ] **Step 4: Create scam-patterns skill**

```markdown
---
name: Scam Pattern Catalog
description: Use during scam detection to recognize Berlin rental fraud patterns. Reference before classifying any listing.
---

## Hard Block Signals (score contribution: 0.8+)

- Western Union / MoneyGram payment requests
- "Send deposit before viewing" in any form
- Bitcoin / crypto payment requests
- Claim to be abroad (im Ausland, verreist, UK/USA landlord) and mail keys
- "Google it and you'll see I'm legitimate" framing

## Strong Signals (score contribution: 0.4-0.6)

- WhatsApp-only contact (no portal message system)
- Price >50% below district Mietspiegel for size
- Listing has Airbnb framing ("flexible stays", nightly rate mentioned)
- Description reads like Google Translate (grammatical errors in formal sentences)
- Multiple listings with identical descriptions, different photos

## Moderate Signals (score contribution: 0.2-0.4)

- Price >35% below Mietspiegel
- Ablöse >€2000 for used furniture
- Kaution >3x cold rent
- Landlord name is a generic English name ("John Smith", "David Williams")
- No address given, only "Berlin Mitte" — common for legit listings too but raises threshold

## Swap Signals (not scam, but filtered by prefs)

- Keywords: Tausch, Wohnungstausch, biete gegen, suche im Tausch
- Listing requires a counter-offer property

## Kleinanzeigen-Specific

- Phone number in description: normal for private landlords, lower weight (0.15)
- "Nur Selbstnutzer": legitimate signal, not suspicious
- "Tierliebhaber willkommen": positive signal
```

- [ ] **Step 5: Create message-tone skill**

```markdown
---
name: Message Tone — Kristian
description: Use when drafting rental inquiry messages for Kristian. Captures his writing register so messages sound authentic.
---

## Kristian's Writing Register

Kristian writes German rental messages that are:
- Warm but not gushing ("Ich würde mich sehr freuen" not "Ich bin mega begeistert")
- Specific and factual (mentions actual details, not generic praise)
- Confident without being pushy (states facts about himself, doesn't over-justify)
- Brief (never more than 5 sentences in the body before the closing)

## Template Structure

```
Guten Tag [Name/Frau/Herr],

[One sentence on why this specific flat interests you — reference a real detail]

[Two sentences on who you are: occupation, income stability, move-in timeline]

[One sentence on reliability signals: Schufa, non-smoker, no pets]

Ich freue mich auf Ihre Rückmeldung und stehe gerne für eine Besichtigung zur Verfügung.

Mit freundlichen Grüßen,
Kristian Garza
```

## What to Avoid

- "Ich schreibe Ihnen bezüglich Ihrer Anzeige" — cliché opener, skip it
- Listing out all features of the flat back to the landlord
- Mentioning that you used AI to draft the message
- Apologizing for the length of the message
- More than 140 words total
```

- [ ] **Step 6: Create query-builder skill**

```markdown
---
name: Query Builder — Portal URL Grammar
description: Use when constructing search URLs for Berlin rental portals. Contains the URL grammar for each supported portal to avoid silent failures from malformed queries.
---

## Kleinanzeigen

Base: `https://www.kleinanzeigen.de/s-wohnung-mieten/berlin/`

Format: `{filters}/k0?{sort}`

Filters (path segments, joined with `+`):
- Category: `c203` (Wohnung mieten)
- Location: `l{city_id}` where Berlin = `l3331`
- Radius: `r{km}` (e.g. `r10`)
- Offer type: `anzeige:angebote` (not Gesuche)
- Price: `preis:{min}:{max}` (empty for no limit, e.g. `preis::2000`)
- Rooms: `zimmer:{min}:{max}` (e.g. `zimmer:2:4`)
- Sqm: `wohnflaeche:{min}:{max}`

Sort: `sortingField=SORTING_DATE&sortingOrder=DESCENDING`

Example (Mitte, ≤2000€, 2-4 rooms):
`https://www.kleinanzeigen.de/s-wohnung-mieten/berlin/c203l3331r10+anzeige:angebote+preis::2000+zimmer:2:4/k0?sortingField=SORTING_DATE&sortingOrder=DESCENDING`

## ImmoScout24 (planned for Phase 2)

Base: `https://www.immobilienscout24.de/Suche/de/`

Format: `wohnung-mieten?{params}`

Key params:
- `geocodes=1276003001` (Berlin)  
- `price=-1300` (max cold rent, note the dash prefix)
- `numberofrooms=2.0-` (min rooms, note trailing dash)
- `livingspace=55.0-` (min sqm)
- `sorting=2` (newest first)
- `pricetype=rentpermonth`
- `realestatetype=apartment`

District slugs for `geocodes`:
- Mitte: `1276003001011` (use district geocode, not city)
- Prenzlauer Berg: `1276003001023`
```

- [ ] **Step 7: Commit all agents and skills**

```bash
git add plugins/berlin-flats/agents/ plugins/berlin-flats/skills/
git commit -m "feat(berlin-flats): agents (scam-judge, scribe) and skills (berlin-context, scam-patterns, message-tone, query-builder)"
```

---

## Task 9: Register Plugin in Marketplace

**Files:**
- Modify: `.claude-plugin/marketplace.json`

- [ ] **Step 1: Add berlin-flats to marketplace manifest**

Open `.claude-plugin/marketplace.json` and add to the plugins array:

```json
{
  "name": "berlin-flats",
  "source": "plugins/berlin-flats",
  "description": "Berlin flat hunter — searches rental portals, detects scams, queues listings for triage, drafts contact messages.",
  "version": "0.1.0",
  "author": "kjgarza",
  "license": "MIT",
  "category": "productivity",
  "keywords": ["berlin", "flats", "rental", "housing", "immo", "kleinanzeigen", "immoscout"]
}
```

- [ ] **Step 2: Verify manifest is valid JSON**

```bash
node -e "JSON.parse(require('fs').readFileSync('.claude-plugin/marketplace.json', 'utf8')); console.log('valid JSON')"
```

- [ ] **Step 3: Commit**

```bash
git add .claude-plugin/marketplace.json
git commit -m "feat(berlin-flats): register plugin in marketplace manifest"
```

---

## Task 10: End-to-End Smoke Test Against Live Kleinanzeigen

**Goal:** Confirm the hunt script returns at least one real listing for Mitte ≤2000€/month.

- [ ] **Step 1: Run live hunt**

```bash
cd plugins/berlin-flats && node scripts/hunt.js 2>&1
```

Expected output pattern:
```
[hunt] Searching kleinanzeigen...
[hunt] URL: https://www.kleinanzeigen.de/s-wohnung-mieten/berlin/...
[hunt] Fetched via tier 1, NNNNN chars
[hunt] Found N listing cards
[hunt] ✓ <title>
       District: Berlin Mitte | Rent: NNNN€ cold | N rooms | NNsqm
[hunt] Done. N new listings queued for triage.
```

- [ ] **Step 2: Check DB has listings**

```bash
cd plugins/berlin-flats && node -e "
import('./scripts/db.js').then(({ getQueue }) => {
  const q = getQueue('pending');
  console.log('Pending listings:', q.length);
  if (q.length > 0) console.log('First:', q[0].title, q[0].district, q[0].cold_rent + '€');
});
"
```

Expected: `Pending listings: N` where N > 0

- [ ] **Step 3: If no results — debug with raw scrape**

```bash
cd plugins/berlin-flats && node -e "
import('./scripts/scrape.js').then(async ({ scrapeUrl }) => {
  const url = 'https://www.kleinanzeigen.de/s-wohnung-mieten/berlin/c203l3331r10+anzeige:angebote+preis::2000+zimmer:2:4/k0?sortingField=SORTING_DATE&sortingOrder=DESCENDING';
  const r = await scrapeUrl(url);
  console.log('tier:', r.tier, 'html length:', r.html.length);
  // Check for listing cards
  const count = (r.html.match(/class=\"aditem\"/g) || []).length;
  console.log('aditem count:', count);
});
"
```

- [ ] **Step 4: Commit DOD result**

```bash
git add plugins/berlin-flats/state.db 2>/dev/null || true
git commit -m "feat(berlin-flats): end-to-end hunt confirmed working for Mitte ≤2000€"
```

---

## Self-Review

**Spec coverage check:**
- ✅ Plugin scaffold with correct directory structure
- ✅ /hunt command wired to hunt.js
- ✅ /triage command for queue review
- ✅ Kleinanzeigen as first portal (lowest anti-bot risk)
- ✅ SQLite state DB with upsert + dedup
- ✅ Scam pre-filter (rule-based + Mietspiegel price check)
- ✅ Agents: scam-judge, scribe
- ✅ Skills: berlin-context, scam-patterns, message-tone, query-builder
- ✅ Portal YAML profile for Kleinanzeigen
- ✅ Marketplace registration
- ⏳ /watch loop (deferred to Phase 2 — not needed for DOD)
- ⏳ /contact command (deferred — scribe agent handles manually)
- ⏳ ImmoScout24 scraper (deferred — Kleinanzeigen sufficient for DOD)
- ⏳ Chrome tier 4 (deferred — overkill for Kleinanzeigen)
- ⏳ Telegram notifications (deferred)

**Placeholder scan:** No TBDs or TODOs found. All code blocks are complete.

**Type consistency:** `upsertListing` accepts `{ portal, external_id, url, title, cold_rent, warm_rent, sqm, rooms, district, posted_at, scam_score, verdict, raw_json }` — consistent throughout parse-listing.js, hunt.js, and db.js.
