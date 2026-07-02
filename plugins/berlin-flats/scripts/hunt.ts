#!/usr/bin/env bun
import { fileURLToPath } from "node:url";
import { scrapeUrl } from './scrape.ts';
import { parseSearchResults, parseDetail } from './parse-listing.ts';
import { scamScore } from './scam-score.ts';
import { upsertListing, isSeen, recordRun } from './db.ts';
import { loadConfig } from './config.ts';
import { evaluatePortalHealth } from './health.ts';
import type { Listing, SearchCriteria } from "./types.ts";

const JSON_MODE = process.argv.includes('--json');
const HEALTH_MODE = process.argv.includes('--health');

// Kleinanzeigen: all Berlin (district filtering is client-side only per portal YAML)
const KA_LOCATION_ID = '3331';

// ImmoScout24: district slug for path-based URL (more reliable than geocodes for sub-districts)
const IS24_DISTRICT_SLUGS: Record<string, string | null> = {
  'Mitte':           'mitte',
  'Prenzlauer Berg': 'prenzlauer-berg',
  'Friedrichshain':  'friedrichshain',
  'Kreuzberg':       'kreuzberg',
  'Neukölln':        'neukoelln',
  'Schöneberg':      'schoeneberg',
  'Charlottenburg':  'charlottenburg',
  'Wilmersdorf':     'wilmersdorf',
  'Steglitz':        'steglitz',
  'Tempelhof':       'tempelhof',
  'default':         null, // null = search all Berlin
};

export function buildSearchUrl(portal: string, criteria: SearchCriteria): string {
  const {
    districts = ['Mitte'],
    max_warm_rent_eur = 2000,
    max_cold_rent_eur = 1600,
    min_rooms = 2,
    min_sqm = 55,
  } = criteria;

  if (portal === 'kleinanzeigen') {
    // Query-param format (path-based format is broken; wohnflaeche is post-filtered via scoreAgainstPrefs)
    const params = new URLSearchParams({
      locationId: KA_LOCATION_ID,
      categoryId: '203',
      sortingField: 'SORTING_DATE',
      sortingOrder: 'DESCENDING',
      maxPrice: String(max_warm_rent_eur),
      minRooms: String(min_rooms),
    });
    return `https://www.kleinanzeigen.de/s-wohnungen/k0?${params}`;
  }

  if (portal === 'immoscout24') {
    const district = districts[0] || "default";
    const slug = IS24_DISTRICT_SLUGS[district] ?? IS24_DISTRICT_SLUGS.default;
    const locationPath = slug ? `berlin/${slug}` : 'berlin';
    const params = new URLSearchParams({
      price: `-${max_cold_rent_eur}`,
      numberofrooms: `${min_rooms}.0-`,
      livingspace: `${min_sqm}.0-`,
      sorting: '2',
      pricetype: 'rentpermonth',
      realestatetype: 'apartment',
    });
    return `https://www.immobilienscout24.de/Suche/de/${locationPath}/wohnung-mieten?${params}`;
  }

  if (portal === 'inberlinwohnen') {
    // No server-side filtering — fetch the unfiltered first page and rely on
    // the existing scoreAgainstPrefs post-filter, same as every other portal.
    return 'https://www.inberlinwohnen.de/wohnungsfinder/';
  }

  throw new Error(`Unknown portal: ${portal}`);
}

// Fields tracked for the field-presence health signal — mirrors the keys
// declared as `extraction.detail.fields` in portals/<portal>.yaml.
const TRACKED_DETAIL_FIELDS = ['title', 'cold_rent', 'sqm', 'rooms', 'district', 'description', 'posted_at'] as const;

export function computeFieldPresence(listings: Listing[]): Record<string, number> {
  if (listings.length === 0) return {};
  const presence: Record<string, number> = {};
  for (const field of TRACKED_DETAIL_FIELDS) {
    const present = listings.filter((l) => {
      const value = l[field as keyof Listing];
      return value !== null && value !== undefined && value !== '';
    }).length;
    presence[field] = present / listings.length;
  }
  return presence;
}

export function scoreAgainstPrefs(listing: Listing, prefs: SearchCriteria): number {
  if (listing.warm_rent && listing.warm_rent > prefs.max_warm_rent_eur) return -1;
  if (listing.cold_rent && prefs.max_cold_rent_eur && listing.cold_rent > prefs.max_cold_rent_eur) return -1;
  if (listing.rooms != null && listing.rooms < prefs.min_rooms) return -1;
  if (prefs.max_rooms != null && listing.rooms != null && listing.rooms > prefs.max_rooms) return -1;
  if (listing.sqm != null && listing.sqm < prefs.min_sqm) return -1;

  const text = `${listing.title || ''} ${listing.description || ''}`.toLowerCase();

  for (const breaker of (prefs.deal_breakers || [])) {
    if (text.includes(breaker.toLowerCase())) return -1;
  }

  // District post-filter: applies after detail fetch when listing.district is known
  if (prefs.districts?.length && listing.district) {
    const d = listing.district.toLowerCase();
    const match = prefs.districts.some(district => d.includes(district.toLowerCase()));
    if (!match) return -1;
  }

  // keywords_required: all listed keywords must appear somewhere in title+description
  for (const kw of (prefs.keywords_required || [])) {
    if (!text.includes(kw.toLowerCase())) return -1;
  }

  return 100;
}

interface HuntOptions {
  portals?: string[];
  jsonMode?: boolean;
}

export async function hunt(options: HuntOptions = {}): Promise<Listing[]> {
  const cfg = loadConfig();
  const portals = options.portals || cfg.portals.enabled;
  const jsonMode = options.jsonMode ?? JSON_MODE;

  // results = listings surfaced to triage (pending + review), newListings = newly upserted this run
  const results: Listing[] = [];
  const newListings: Array<Record<string, unknown>> = [];
  const errors: Array<{ portal?: string; message: string }> = [];
  const counts: Record<string, number> = { pending: 0, review: 0, block: 0, filtered: 0 };

  for (const portal of portals) {
    if (!jsonMode) console.log(`\n[hunt] Searching ${portal}...`);
    let searchUrl;
    try {
      searchUrl = buildSearchUrl(portal, cfg.search);
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      if (!jsonMode) console.error(`[hunt] Skipping ${portal}: ${message}`);
      errors.push({ portal, message });
      recordRun({ portal, tier: null, http_ok: 0, html_length: null, cards_found: 0, new_count: 0, detail_ok: 0, detail_total: 0, field_presence: null, error: message });
      continue;
    }
    if (!jsonMode) console.log(`[hunt] URL: ${searchUrl}`);

    const { html, tier, error } = await scrapeUrl(searchUrl);
    if (error || !html) {
      if (!jsonMode) console.error(`[hunt] Failed to fetch search page: ${error}`);
      errors.push({ portal, message: error || 'empty html' });
      recordRun({ portal, tier, http_ok: 0, html_length: html?.length ?? null, cards_found: 0, new_count: 0, detail_ok: 0, detail_total: 0, field_presence: null, error: error || 'empty html' });
      continue;
    }
    if (!jsonMode) console.log(`[hunt] Fetched via tier ${tier}, ${html.length} chars`);

    const cards = parseSearchResults(html, portal);
    if (!jsonMode) console.log(`[hunt] Found ${cards.length} listing cards`);

    if (cards.length === 0 && !jsonMode) {
      console.log(`[hunt] No cards found for ${portal}.`);
    }

    let newCount = 0;
    let detailOkCount = 0;
    const processedListings: Listing[] = [];
    for (const card of cards.slice(0, 20)) {
      if (!card.external_id) continue;

      const alreadySeen = isSeen(card.portal, card.external_id);
      if (alreadySeen) {
        if (!jsonMode) process.stdout.write('.');
        continue;
      }

      // Some portals (e.g. inberlinwohnen) return complete records straight
      // from the search page — skip the redundant detail fetch for those.
      let listing = { ...card };
      const cardIsComplete = card.cold_rent != null && card.district != null;
      if (cardIsComplete) {
        detailOkCount++;
      } else {
        const detail = await scrapeUrl(card.url);
        if (detail.html && detail.html.length > 200) {
          const parsed = parseDetail(detail.html, portal, card.url);
          listing = { ...card, ...parsed };
          detailOkCount++;
        }
      }

      const { score: scam, verdict: scamVerdict, reasons } = scamScore(listing);
      listing.scam_score = scam;

      // Map scam verdicts: block→block, review→review, ok→pending
      if (scamVerdict === 'block') {
        listing.verdict = 'block';
      } else if (scamVerdict === 'review') {
        listing.verdict = 'review';
      } else {
        listing.verdict = 'pending';
      }

      // Pref filtering overrides to 'filtered' (but not block)
      const prefScore = scoreAgainstPrefs(listing, cfg.search);
      if (prefScore < 0 && listing.verdict !== 'block') listing.verdict = 'filtered';

      listing.raw_json = JSON.stringify({ ...listing, raw_json: undefined });
      upsertListing({
        portal:      listing.portal,
        external_id: listing.external_id || card.external_id,
        url:         listing.url,
        title:       listing.title || null,
        cold_rent:   listing.cold_rent || null,
        warm_rent:   listing.warm_rent || null,
        sqm:         listing.sqm || null,
        rooms:       listing.rooms || null,
        district:    listing.district || null,
        posted_at:   listing.posted_at || null,
        scam_score:  listing.scam_score,
        verdict:     listing.verdict,
        raw_json:    listing.raw_json,
      });

      newCount++;
      counts[listing.verdict] = (counts[listing.verdict] || 0) + 1;

      // Track new listings for --json output
      newListings.push({
        title:      listing.title || null,
        district:   listing.district || null,
        cold_rent:  listing.cold_rent || null,
        rooms:      listing.rooms || null,
        sqm:        listing.sqm || null,
        scam_score: listing.scam_score,
        verdict:    listing.verdict,
        url:        listing.url || card.url,
      });

      if (listing.verdict === 'pending' || listing.verdict === 'review') {
        results.push(listing);
        if (!jsonMode) {
          const marker = listing.verdict === 'review' ? '?' : '✓';
          console.log(`\n[hunt] ${marker} [${listing.verdict.toUpperCase()}] ${listing.title || card.url}`);
          console.log(`       District : ${listing.district || '?'}`);
          console.log(`       Cold rent: €${listing.cold_rent || '?'} | Warm rent: €${listing.warm_rent || '?'}`);
          console.log(`       Rooms    : ${listing.rooms || '?'} | sqm: ${listing.sqm || '?'}`);
          console.log(`       Scam     : ${scam} (${scamVerdict}) | Reasons: ${reasons.map(r => r.code).join(', ') || 'none'}`);
          console.log(`       URL      : ${card.url}`);
        }
      } else {
        if (!jsonMode) {
          console.log(`\n[hunt] ✗ ${listing.verdict?.toUpperCase()}: ${listing.title || card.url} (scam=${scam})`);
        }
      }

      processedListings.push(listing);
    }

    if (!jsonMode && newCount === 0 && cards.length > 0) {
      console.log(`\n[hunt] All ${cards.length} listings already seen.`);
    }

    recordRun({
      portal,
      tier,
      http_ok: 1,
      html_length: html.length,
      cards_found: cards.length,
      new_count: newCount,
      detail_ok: detailOkCount,
      detail_total: processedListings.length,
      field_presence: processedListings.length > 0 ? JSON.stringify(computeFieldPresence(processedListings)) : null,
      error: null,
    });
  }

  if (HEALTH_MODE) {
    const health = portals.map((portal) => evaluatePortalHealth(portal));
    process.stdout.write(JSON.stringify({ health }, null, 2) + '\n');
  }

  if (jsonMode) {
    process.stdout.write(JSON.stringify({ new: newListings, counts, errors }, null, 2) + '\n');
  } else {
    const surfaced = results.filter(r => r.verdict === 'pending').length;
    const inReview = results.filter(r => r.verdict === 'review').length;
    console.log(`\n[hunt] Done. ${surfaced} pending + ${inReview} review listings queued for triage.`);
  }

  return results;
}

// CLI entry point
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  hunt().catch(err => {
    if (!JSON_MODE) console.error('[hunt] Fatal:', err.message);
    else process.stdout.write(JSON.stringify({ new: [], counts: {}, errors: [{ message: err.message }] }) + '\n');
    process.exit(1);
  });
}
