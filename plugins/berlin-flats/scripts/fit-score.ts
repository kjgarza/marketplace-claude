// fit-score.ts — desirability score (0–100) for a listing vs the user's search config.
// Complements scam-score.ts: scam answers "is it fraud?", fit answers "is it good for YOU?".
//
// Factor budget sums to 100:
//   VALUE 25 · SIZE 20 · RENT_MARGIN 15 · ROOMS 10 · KEYWORDS 10 · FEATURES 10 · NEBENKOSTEN 5 · FRESHNESS 5
// Weights are fixed by design (documented here) rather than config-tunable — revisit
// only if calibrate.ts learns per-user weights.
import type { Listing, PluginConfig, FitResult, FitFactor } from "./types.ts";
import { mietspiegelDelta } from "./mietspiegel.ts";

// Amenity vocabulary German portals actually use; 2 pts each, capped at 10.
const FEATURE_PATTERNS: Array<{ code: string; pattern: RegExp }> = [
  { code: "balcony", pattern: /balkon|terrasse/i },
  { code: "lift", pattern: /aufzug|fahrstuhl|\blift\b/i },
  { code: "kitchen", pattern: /einbauküche|\bebk\b/i },
  { code: "parquet", pattern: /parkett|dielen/i },
  { code: "cellar", pattern: /keller/i },
];

// (warm − cold)/sqm plausibility band. Berlin Betriebskosten+Heizung run roughly
// 2.0–5.0 €/m² (BBU Betriebskostenspiegel ~2.9 €/m² incl. heating, plus spread).
// Below 2.0 the advance is likely lowballed → Nachzahlung risk after year one.
const NEBENKOSTEN_MIN = 2.0;
const NEBENKOSTEN_MAX = 5.0;

// Berlin quality flats go in hours–days (see skills/berlin-context). ≤3 days old
// deserves speed; still listed after 21 days usually means overpriced or problematic.
const FRESH_DAYS = 3;
const STALE_DAYS = 21;

export function fitScore(listing: Listing, config: PluginConfig, now: Date = new Date()): FitResult {
  const search = config.search;
  const text = `${listing.title || ""} ${listing.description || ""}`;
  const factors: FitFactor[] = [];
  const add = (code: string, points: number, detail: string) => factors.push({ code, points, detail });

  // VALUE (max 25) — cold €/m² vs Mietspiegel median. Bands: ≤0% full; ≤10% is the
  // legal Mietpreisbremse ceiling; ≤25% negotiable; ≤40% expensive; beyond that
  // either an exempt new build or plain overpriced.
  const delta = mietspiegelDelta(listing);
  if (!delta) {
    add("VALUE", 10, "no rent/sqm data — neutral");
  } else if (delta.deltaPct <= 0) {
    add("VALUE", 25, `${delta.actualPerSqm}€/m² at/below ${delta.district} median (${delta.medianPerSqm}€/m²)`);
  } else if (delta.deltaPct <= 10) {
    add("VALUE", 20, `+${delta.deltaPct}% over median — within Mietpreisbremse band`);
  } else if (delta.deltaPct <= 25) {
    add("VALUE", 10, `+${delta.deltaPct}% over ${delta.district} median — above Mietpreisbremse +10%; negotiation lever`);
  } else if (delta.deltaPct <= 40) {
    add("VALUE", 5, `+${delta.deltaPct}% over median — expensive`);
  } else {
    add("VALUE", 0, `+${delta.deltaPct}% over median — exempt new build or overpriced`);
  }

  // SIZE (max 20) — full points at min_sqm; linear credit for near-misses down to
  // 70% of target (below that the flat is a different category, not a near-miss).
  if (listing.sqm && search.min_sqm) {
    const ratio = listing.sqm / search.min_sqm;
    if (ratio >= 1) {
      add("SIZE", 20, `${listing.sqm}m² meets the ${search.min_sqm}m² target`);
    } else if (ratio >= 0.7) {
      add("SIZE", Math.round(((ratio - 0.7) / 0.3) * 20),
        `${listing.sqm}m² is ${Math.round(ratio * 100)}% of the ${search.min_sqm}m² target — near miss`);
    } else {
      add("SIZE", 0, `${listing.sqm}m² well under the ${search.min_sqm}m² target`);
    }
  } else {
    add("SIZE", 10, "sqm unknown — neutral");
  }

  // RENT_MARGIN (max 15) — headroom under the warm-rent cap; full points at ≥25%
  // headroom (a flat 25% under budget leaves room for Nachzahlung/increases).
  if (listing.warm_rent && search.max_warm_rent_eur) {
    const margin = (search.max_warm_rent_eur - listing.warm_rent) / search.max_warm_rent_eur;
    if (margin < 0) {
      add("RENT_MARGIN", 0, `warm ${listing.warm_rent}€ exceeds the ${search.max_warm_rent_eur}€ cap`);
    } else {
      add("RENT_MARGIN", Math.min(15, Math.round((margin / 0.25) * 15)),
        `${Math.round(margin * 100)}% under the ${search.max_warm_rent_eur}€ warm-rent cap`);
    }
  } else {
    add("RENT_MARGIN", 7, "warm rent unknown — neutral");
  }

  // ROOMS (max 10) — in range full; half a room off gets half credit.
  if (listing.rooms) {
    const min = search.min_rooms ?? 0;
    const max = search.max_rooms ?? Infinity;
    if (listing.rooms >= min && listing.rooms <= max) {
      add("ROOMS", 10, `${listing.rooms} rooms within ${min}–${max === Infinity ? "∞" : max}`);
    } else if (listing.rooms >= min - 0.5 && listing.rooms <= max + 0.5) {
      add("ROOMS", 5, `${listing.rooms} rooms is half a room off the ${min}–${max} range`);
    } else {
      add("ROOMS", 0, `${listing.rooms} rooms outside ${min}–${max}`);
    }
  } else {
    add("ROOMS", 5, "rooms unknown — neutral");
  }

  // KEYWORDS (max 10) — proportional credit for configured required keywords.
  const keywords = search.keywords_required ?? [];
  if (keywords.length === 0) {
    add("KEYWORDS", 10, "no required keywords configured");
  } else {
    const hits = keywords.filter((k) => text.toLowerCase().includes(k.toLowerCase()));
    add("KEYWORDS", Math.round((hits.length / keywords.length) * 10),
      hits.length ? `matched: ${hits.join(", ")}` : `missing: ${keywords.join(", ")}`);
  }

  // FEATURES (max 10)
  const found = FEATURE_PATTERNS.filter((f) => f.pattern.test(text)).map((f) => f.code);
  add("FEATURES", Math.min(10, found.length * 2), found.length ? found.join(", ") : "none detected");

  // NEBENKOSTEN (max 5)
  if (listing.warm_rent && listing.cold_rent && listing.sqm && listing.sqm > 10) {
    const nkPerSqm = (listing.warm_rent - listing.cold_rent) / listing.sqm;
    if (nkPerSqm >= NEBENKOSTEN_MIN && nkPerSqm <= NEBENKOSTEN_MAX) {
      add("NEBENKOSTEN", 5, `${nkPerSqm.toFixed(2)}€/m² within the plausible band`);
    } else if (nkPerSqm < NEBENKOSTEN_MIN) {
      add("NEBENKOSTEN", 0, `${nkPerSqm.toFixed(2)}€/m² suspiciously low — Nachzahlung risk`);
    } else {
      add("NEBENKOSTEN", 0, `${nkPerSqm.toFixed(2)}€/m² unusually high — request the Betriebskosten breakdown`);
    }
  } else {
    add("NEBENKOSTEN", 2, "insufficient data — neutral");
  }

  // FRESHNESS (max 5)
  const posted = listing.posted_at ? new Date(listing.posted_at) : null;
  if (posted && !isNaN(posted.getTime())) {
    const ageDays = (now.getTime() - posted.getTime()) / 86_400_000;
    if (ageDays <= FRESH_DAYS) add("FRESHNESS", 5, `posted ${Math.max(0, Math.round(ageDays))}d ago — act fast`);
    else if (ageDays <= STALE_DAYS) add("FRESHNESS", 2, `posted ${Math.round(ageDays)}d ago`);
    else add("FRESHNESS", 0, `on market ${Math.round(ageDays)}d — stale; ask why / negotiate`);
  } else {
    add("FRESHNESS", 2, "posting date unknown — neutral");
  }

  // DEAL_BREAKER — hard zero; a match means the flat fails the user's own rules.
  let score = factors.reduce((sum, f) => sum + f.points, 0);
  const breakers = (search.deal_breakers ?? []).filter((b) => text.toLowerCase().includes(b.toLowerCase()));
  if (breakers.length) {
    add("DEAL_BREAKER", -score, `matched: ${breakers.join(", ")}`);
    score = 0;
  }

  return { score: Math.max(0, Math.min(100, score)), factors };
}
