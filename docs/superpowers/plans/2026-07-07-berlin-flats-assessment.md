# berlin-flats Assessment + Application-Prep Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add flat-quality assessment (fit-score ranking, Mietspiegel value check) and application preparation (dossier readiness, pipeline states, scribe message modes) to the berlin-flats plugin.

**Architecture:** New pure-function scoring module (`fit-score.ts`) reusing an extracted shared Mietspiegel module; SQLite state machine extended with `verdict_at` + event log; new CLI (`dossier.ts`) for document readiness; markdown-layer additions (skill, two commands, scribe modes). All scripts are Bun TypeScript matching existing patterns in `plugins/berlin-flats/scripts/`.

**Tech Stack:** Bun, bun:sqlite, bun:test, @iarna/toml (already a dependency).

## Global Constraints

- All paths below relative to `plugins/berlin-flats/` unless noted.
- Skill descriptions MUST start with `"This skill should be used when"` (validator check #3).
- No hardcoded absolute paths in commands/hooks — use `$CLAUDE_PLUGIN_ROOT`.
- Every magic number gets a justifying comment (skill-standards §10).
- Run tests with `bun test` from `plugins/berlin-flats/`.
- Final gate: `bash scripts/validate-plugin.sh berlin-flats` from repo root.
- Commit trailer: `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`.

---

### Task 1: Extract shared Mietspiegel module

**Files:**
- Create: `scripts/mietspiegel.ts`
- Modify: `scripts/scam-score.ts` (remove local table, import shared)
- Test: `scripts/__tests__/mietspiegel.test.ts`

**Interfaces:**
- Produces: `MIETSPIEGEL: Record<string, number>`, `findDistrict(districtStr?: string | null): string`, `mietspiegelDelta(listing: Pick<Listing, 'cold_rent'|'sqm'|'district'>): MietspiegelDelta | null` where `MietspiegelDelta = { district: string; medianPerSqm: number; actualPerSqm: number; deltaPct: number }` (deltaPct positive = above median, rounded integer).

- [ ] **Step 1: Write failing test** `scripts/__tests__/mietspiegel.test.ts`:

```ts
import { describe, expect, test } from "bun:test";
import { MIETSPIEGEL, findDistrict, mietspiegelDelta } from "../mietspiegel.ts";

describe("findDistrict", () => {
  test("matches substring case-insensitively", () => {
    expect(findDistrict("Berlin Schöneberg")).toBe("Schöneberg");
  });
  test("falls back to default", () => {
    expect(findDistrict("Spandau")).toBe("default");
    expect(findDistrict(null)).toBe("default");
  });
});

describe("mietspiegelDelta", () => {
  test("computes positive delta for over-median listing", () => {
    // 1394 € / 83 m² = 16.80 €/m² vs Schöneberg median 13.5 → +24%
    const d = mietspiegelDelta({ cold_rent: 1394, sqm: 83, district: "Schöneberg" });
    expect(d).not.toBeNull();
    expect(d!.medianPerSqm).toBe(MIETSPIEGEL["Schöneberg"]);
    expect(d!.deltaPct).toBe(24);
  });
  test("returns null without rent or plausible sqm", () => {
    expect(mietspiegelDelta({ cold_rent: null, sqm: 80, district: "Mitte" })).toBeNull();
    expect(mietspiegelDelta({ cold_rent: 1000, sqm: 5, district: "Mitte" })).toBeNull();
  });
});
```

- [ ] **Step 2: Run** `bun test scripts/__tests__/mietspiegel.test.ts` → FAIL (module not found)

- [ ] **Step 3: Create** `scripts/mietspiegel.ts`:

```ts
// mietspiegel.ts — Berlin 2024 Mietspiegel approximate medians (cold €/sqm) by district.
// Single source of truth shared by scam-score.ts (under-price fraud signal) and
// fit-score.ts (over-price value signal).
import type { Listing } from "./types.ts";

export const MIETSPIEGEL: Record<string, number> = {
  'Mitte': 15.5,
  'Prenzlauer Berg': 14.8,
  'Friedrichshain': 14.2,
  'Kreuzberg': 13.9,
  'Neukölln': 11.8,
  'Charlottenburg': 14.0,
  'Schöneberg': 13.5,
  'Tempelhof': 11.2,
  'default': 13.0,
};

export function findDistrict(districtStr?: string | null): string {
  if (!districtStr) return 'default';
  for (const key of Object.keys(MIETSPIEGEL)) {
    if (key === 'default') continue;
    if (districtStr.toLowerCase().includes(key.toLowerCase())) return key;
  }
  return 'default';
}

export interface MietspiegelDelta {
  district: string;
  medianPerSqm: number;
  actualPerSqm: number;
  /** Percent above (+) or below (−) the district median, rounded. */
  deltaPct: number;
}

export function mietspiegelDelta(
  listing: Pick<Listing, 'cold_rent' | 'sqm' | 'district'>
): MietspiegelDelta | null {
  // sqm > 10 guard mirrors scam-score.ts: tiny/erroneous sqm produces absurd €/m².
  if (!listing.cold_rent || !listing.sqm || listing.sqm <= 10) return null;
  const district = findDistrict(listing.district);
  const medianPerSqm = MIETSPIEGEL[district];
  const actualPerSqm = listing.cold_rent / listing.sqm;
  return {
    district,
    medianPerSqm,
    actualPerSqm: Math.round(actualPerSqm * 100) / 100,
    deltaPct: Math.round((actualPerSqm / medianPerSqm - 1) * 100),
  };
}
```

- [ ] **Step 4: Refactor** `scripts/scam-score.ts` — delete its local `MIETSPIEGEL` const and `findDistrict` function; add `import { MIETSPIEGEL, findDistrict } from "./mietspiegel.ts";` at top. The `keyof typeof MIETSPIEGEL` return-type annotation on the old function goes away; `findDistrict` now returns `string`, and `MIETSPIEGEL[districtKey]` still type-checks against `Record<string, number>`.

- [ ] **Step 5: Run** `bun test` (whole suite — scam-score tests must stay green) → PASS

- [ ] **Step 6: Commit** `git commit -m "refactor(berlin-flats): extract shared mietspiegel module"`

---

### Task 2: fit-score module + real-ad fixtures

**Files:**
- Create: `scripts/fit-score.ts`
- Create: `scripts/__tests__/fixtures/immoscout-fixtures.ts`
- Modify: `scripts/types.ts` (add FitFactor, FitResult)
- Test: `scripts/__tests__/fit-score.test.ts`

**Interfaces:**
- Consumes: `mietspiegelDelta` from Task 1.
- Produces: `fitScore(listing: Listing, config: PluginConfig, now?: Date): FitResult` with `FitResult = { score: number; factors: FitFactor[] }`, `FitFactor = { code: string; points: number; detail: string }`. Score 0–100. Factor budget: VALUE 25 · SIZE 20 · RENT_MARGIN 15 · ROOMS 10 · KEYWORDS 10 · FEATURES 10 · NEBENKOSTEN 5 · FRESHNESS 5; DEAL_BREAKER zeroes the total.

- [ ] **Step 1: Add types** to `scripts/types.ts` (append):

```ts
export interface FitFactor {
  code: string;
  points: number;
  detail: string;
}

export interface FitResult {
  /** 0–100 desirability vs the user's search config. */
  score: number;
  factors: FitFactor[];
}
```

- [ ] **Step 2: Create fixtures** `scripts/__tests__/fixtures/immoscout-fixtures.ts` — three real Schöneberg ads captured 2026-07-07:

```ts
// Real ImmoScout24 Schöneberg listings captured 2026-07-07 — eval fixtures for fit-score.
import type { Listing, PluginConfig } from "../../types.ts";

export const AD_MANSTEIN: Listing = {
  portal: "immoscout24",
  external_id: "167850948",
  url: "https://www.immobilienscout24.de/expose/167850948",
  title: "MODERNISIERTE 3-ZIMMER DACHGESCHOSSWOHNUNG IN SCHÖNEBERG",
  description:
    "Modernisiertes Apartment in der sechsten Etage, 83 qm, hochwertige Ausstattung. " +
    "Moderne Einbauküche vorhanden, Aufzug, Kellerraum, Balkon. Erstbezug nach Sanierung. " +
    "Haustiere nicht gestattet. Nebenkosten 385 €, Heizkosten enthalten.",
  cold_rent: 1394, warm_rent: 1779, sqm: 83, rooms: 3,
  district: "Schöneberg", posted_at: "2026-05-19",
};

export const AD_RUBENS: Listing = {
  portal: "immoscout24",
  external_id: "168988987",
  url: "https://www.immobilienscout24.de/expose/168988987",
  title: "2.01: Parkett, Fußbodenheizung, Aufzug, EBK",
  description:
    "Zweitbezug: Aufzug mittels Chip direkt in die Wohnung. Parkettboden und Fußbodenheizung. " +
    "Einbauküche, Bad mit ebenerdiger Dusche, französischer Balkon, bodentiefe Fenster, " +
    "Fahrradkeller. Baujahr 2023. Kaution 4470 €.",
  cold_rent: 1490, warm_rent: 1790, sqm: 75, rooms: 2,
  district: "Schöneberg", posted_at: "2026-07-01",
};

export const AD_NOLLENDORF: Listing = {
  portal: "immoscout24",
  external_id: "169077787",
  url: "https://www.immobilienscout24.de/expose/169077787",
  title: "Schöne Altbauwohnung zur Übernahme | Suche Nachmieter",
  description:
    "Altbau im 3. Obergeschoss, Balkon und Kellerraum. Nachmieter gesucht, Einzug zum 01.08.2026. " +
    "Übernahme der Trockenbauwand für 1.000 € und der Hochebene für 1.500 € vorausgesetzt. " +
    "Nebenkosten 200 €, Kaution 4.000 €.",
  cold_rent: 1400, warm_rent: 1600, sqm: 104, rooms: 2.5,
  district: "Schöneberg", posted_at: "2026-07-05",
};

export const TEST_CONFIG: PluginConfig = {
  profile: { name: "Test" },
  portals: { enabled: ["immoscout24"] },
  search: {
    districts: ["Schöneberg"],
    min_rooms: 2, max_rooms: 4, min_sqm: 100,
    max_warm_rent_eur: 2200, max_cold_rent_eur: 2000,
    keywords_required: ["Altbau"],
    deal_breakers: ["Tausch", "Souterrain"],
  },
};
```

- [ ] **Step 3: Write failing test** `scripts/__tests__/fit-score.test.ts`:

```ts
import { describe, expect, test } from "bun:test";
import { fitScore } from "../fit-score.ts";
import { AD_MANSTEIN, AD_RUBENS, AD_NOLLENDORF, TEST_CONFIG } from "./fixtures/immoscout-fixtures.ts";

// Fixed clock: two days after the freshest fixture ad was posted.
const NOW = new Date("2026-07-07T12:00:00Z");

function factor(result: ReturnType<typeof fitScore>, code: string) {
  const f = result.factors.find((f) => f.code === code);
  if (!f) throw new Error(`missing factor ${code}`);
  return f;
}

describe("fitScore on real ImmoScout ads", () => {
  const nollendorf = fitScore(AD_NOLLENDORF, TEST_CONFIG, NOW);
  const manstein = fitScore(AD_MANSTEIN, TEST_CONFIG, NOW);
  const rubens = fitScore(AD_RUBENS, TEST_CONFIG, NOW);

  test("ranks Nollendorf (Altbau, 104sqm, at-median) first", () => {
    expect(nollendorf.score).toBeGreaterThan(manstein.score);
    expect(manstein.score).toBeGreaterThan(rubens.score);
  });

  test("Nollendorf: full VALUE points at/below median", () => {
    expect(factor(nollendorf, "VALUE").points).toBe(25);
    expect(factor(nollendorf, "SIZE").points).toBe(20);
    expect(factor(nollendorf, "KEYWORDS").points).toBe(10);
  });

  test("Nollendorf: lowball Nebenkosten flagged (1.92 €/m² < 2.0 floor)", () => {
    const nk = factor(nollendorf, "NEBENKOSTEN");
    expect(nk.points).toBe(0);
    expect(nk.detail).toContain("low");
  });

  test("Manstein: +24% over median lands in the 11–25% VALUE band", () => {
    expect(factor(manstein, "VALUE").points).toBe(10);
  });

  test("Manstein: 49 days on market scores zero freshness", () => {
    expect(factor(manstein, "FRESHNESS").points).toBe(0);
  });

  test("Manstein: 83sqm near-miss gets partial SIZE credit", () => {
    const size = factor(manstein, "SIZE").points;
    expect(size).toBeGreaterThan(0);
    expect(size).toBeLessThan(20);
  });

  test("Rubens: +47% over median scores zero VALUE", () => {
    expect(factor(rubens, "VALUE").points).toBe(0);
  });
});

describe("fitScore edge cases", () => {
  test("deal-breaker zeroes the score", () => {
    const listing = { ...AD_NOLLENDORF, description: "Schöner Altbau, nur im Tausch gegen 2-Zimmer." };
    const r = fitScore(listing, TEST_CONFIG, NOW);
    expect(r.score).toBe(0);
    expect(factor(r, "DEAL_BREAKER").detail).toContain("Tausch");
  });

  test("missing data yields neutral mid scores, not crashes", () => {
    const bare = { portal: "immoscout24", url: "x" };
    const r = fitScore(bare, TEST_CONFIG, NOW);
    expect(r.score).toBeGreaterThan(0);
    expect(r.score).toBeLessThan(60);
  });

  test("score is clamped to [0, 100]", () => {
    const r = fitScore(AD_NOLLENDORF, TEST_CONFIG, NOW);
    expect(r.score).toBeLessThanOrEqual(100);
  });
});
```

- [ ] **Step 4: Run** → FAIL (fit-score.ts missing)

- [ ] **Step 5: Create** `scripts/fit-score.ts`:

```ts
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
    if (ratio >= 1) add("SIZE", 20, `${listing.sqm}m² meets the ${search.min_sqm}m² target`);
    else if (ratio >= 0.7) {
      add("SIZE", Math.round(((ratio - 0.7) / 0.3) * 20),
        `${listing.sqm}m² is ${Math.round(ratio * 100)}% of the ${search.min_sqm}m² target — near miss`);
    } else add("SIZE", 0, `${listing.sqm}m² well under the ${search.min_sqm}m² target`);
  } else add("SIZE", 10, "sqm unknown — neutral");

  // RENT_MARGIN (max 15) — headroom under the warm-rent cap; full points at ≥25%
  // headroom (a flat 25% under budget leaves room for Nachzahlung/increases).
  if (listing.warm_rent && search.max_warm_rent_eur) {
    const margin = (search.max_warm_rent_eur - listing.warm_rent) / search.max_warm_rent_eur;
    if (margin < 0) add("RENT_MARGIN", 0, `warm ${listing.warm_rent}€ exceeds the ${search.max_warm_rent_eur}€ cap`);
    else add("RENT_MARGIN", Math.min(15, Math.round((margin / 0.25) * 15)),
      `${Math.round(margin * 100)}% under the ${search.max_warm_rent_eur}€ warm-rent cap`);
  } else add("RENT_MARGIN", 7, "warm rent unknown — neutral");

  // ROOMS (max 10) — in range full; half a room off gets half credit.
  if (listing.rooms) {
    const min = search.min_rooms ?? 0;
    const max = search.max_rooms ?? Infinity;
    if (listing.rooms >= min && listing.rooms <= max) {
      add("ROOMS", 10, `${listing.rooms} rooms within ${min}–${max === Infinity ? "∞" : max}`);
    } else if (listing.rooms >= min - 0.5 && listing.rooms <= max + 0.5) {
      add("ROOMS", 5, `${listing.rooms} rooms is half a room off the ${min}–${max} range`);
    } else add("ROOMS", 0, `${listing.rooms} rooms outside ${min}–${max}`);
  } else add("ROOMS", 5, "rooms unknown — neutral");

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
  } else add("NEBENKOSTEN", 2, "insufficient data — neutral");

  // FRESHNESS (max 5)
  const posted = listing.posted_at ? new Date(listing.posted_at) : null;
  if (posted && !isNaN(posted.getTime())) {
    const ageDays = (now.getTime() - posted.getTime()) / 86_400_000;
    if (ageDays <= FRESH_DAYS) add("FRESHNESS", 5, `posted ${Math.max(0, Math.round(ageDays))}d ago — act fast`);
    else if (ageDays <= STALE_DAYS) add("FRESHNESS", 2, `posted ${Math.round(ageDays)}d ago`);
    else add("FRESHNESS", 0, `on market ${Math.round(ageDays)}d — stale; ask why / negotiate`);
  } else add("FRESHNESS", 2, "posting date unknown — neutral");

  // DEAL_BREAKER — hard zero; a match means the flat fails the user's own rules.
  let score = factors.reduce((sum, f) => sum + f.points, 0);
  const breakers = (search.deal_breakers ?? []).filter((b) => text.toLowerCase().includes(b.toLowerCase()));
  if (breakers.length) {
    add("DEAL_BREAKER", -score, `matched: ${breakers.join(", ")}`);
    score = 0;
  }

  return { score: Math.max(0, Math.min(100, score)), factors };
}
```

- [ ] **Step 6: Run** `bun test scripts/__tests__/fit-score.test.ts` → PASS

- [ ] **Step 7: Commit** `git commit -m "feat(berlin-flats): add fit-score ranking with real-ad fixtures"`

---

### Task 3: Pipeline state machine (db + set-verdict)

**Files:**
- Modify: `scripts/db.ts` (verdict_at column, event log in setVerdict, getByVerdicts)
- Modify: `scripts/set-verdict.ts` (new verdicts)
- Modify: `scripts/types.ts` (Listing.verdict_at)
- Test: `scripts/__tests__/db.test.ts` (append)

**Interfaces:**
- Produces: `getByVerdicts(verdicts: string[]): Listing[]`; `setVerdict` now stamps `verdict_at` and inserts an `events` row (`event_type='verdict'`, payload JSON `{id, verdict, reason}`). CLI verdicts: `accepted|rejected|snoozed|contacted|viewing|applied|offer|dead|pending|block`.

- [ ] **Step 1: Append failing tests** to `scripts/__tests__/db.test.ts` (follow that file's existing setup pattern for temp DB):

```ts
describe("pipeline state machine", () => {
  test("setVerdict stamps verdict_at and logs an event", () => {
    upsertListing({ portal: "test", external_id: "sm1", url: "https://x/1" });
    const id = (getQueue("pending").find((l) => l.external_id === "sm1"))!.id!;
    setVerdict(id, "contacted", null);
    const row = getDb().query("SELECT verdict, verdict_at FROM listings WHERE id=$id").get({ $id: id }) as any;
    expect(row.verdict).toBe("contacted");
    expect(row.verdict_at).not.toBeNull();
    const ev = getDb().query(
      "SELECT payload FROM events WHERE event_type='verdict' ORDER BY id DESC LIMIT 1"
    ).get() as any;
    expect(JSON.parse(ev.payload)).toMatchObject({ id, verdict: "contacted" });
  });

  test("getByVerdicts returns listings across several states", () => {
    upsertListing({ portal: "test", external_id: "sm2", url: "https://x/2" });
    upsertListing({ portal: "test", external_id: "sm3", url: "https://x/3" });
    const rows = getQueue("pending").filter((l) => ["sm2", "sm3"].includes(l.external_id!));
    setVerdict(rows[0].id!, "viewing", null);
    setVerdict(rows[1].id!, "applied", null);
    const pipeline = getByVerdicts(["viewing", "applied"]);
    const ids = pipeline.map((l) => l.external_id);
    expect(ids).toContain("sm2");
    expect(ids).toContain("sm3");
    expect(getByVerdicts([])).toEqual([]);
  });
});
```

- [ ] **Step 2: Run** → FAIL (`getByVerdicts` not exported; verdict_at column missing)

- [ ] **Step 3: Implement in `scripts/db.ts`:**
  - In `getDb()`, after the existing `ensureColumn` call add: `ensureColumn(_db, 'listings', 'verdict_at', 'TEXT');`
  - Replace `setVerdict` with:

```ts
export function setVerdict(id: number, verdict: string, reason: string | null = null): void {
  const db = getDb();
  db.query(
    "UPDATE listings SET verdict=$verdict, reject_reason=$reason, verdict_at=datetime('now') WHERE id=$id"
  ).run({ $verdict: verdict, $reason: reason, $id: id });
  db.query('INSERT INTO events (event_type, payload) VALUES ($type, $payload)').run({
    $type: 'verdict',
    $payload: JSON.stringify({ id, verdict, reason }),
  });
}
```

  - Add:

```ts
export function getByVerdicts(verdicts: string[]): Listing[] {
  if (verdicts.length === 0) return [];
  const placeholders = verdicts.map((_, i) => `$v${i}`).join(', ');
  const params: Record<string, string> = {};
  verdicts.forEach((v, i) => { params[`$v${i}`] = v; });
  return getDb().query(
    `SELECT * FROM listings WHERE verdict IN (${placeholders}) ORDER BY verdict_at DESC, fetched_at DESC`
  ).all(params) as Listing[];
}
```

  - In `scripts/types.ts`, add `verdict_at?: string | null;` to `Listing`.

- [ ] **Step 4: Extend** `scripts/set-verdict.ts` allowed list:

```ts
const ALLOWED_VERDICTS = [
  'accepted', 'rejected', 'snoozed', 'contacted',
  'viewing', 'applied', 'offer', 'dead',
  'pending', 'block',
] as const;
```

- [ ] **Step 5: Run** `bun test` → PASS

- [ ] **Step 6: Commit** `git commit -m "feat(berlin-flats): extend pipeline states with viewing/applied/offer/dead + verdict_at"`

---

### Task 4: queue.ts rank / compare / pipeline modes

**Files:**
- Modify: `scripts/queue.ts`
- Test: `scripts/__tests__/queue-modes.test.ts` (new)

**Interfaces:**
- Consumes: `fitScore` (Task 2), `getByVerdicts` (Task 3), `loadConfig`.
- Produces: CLI modes `rank` (triage set sorted by fit desc, each row gains `fit: {score, top_factors}`), `compare` (accepted/contacted/viewing/applied/offer with fit), `pipeline` (contacted→offer with `days_in_state`). Refactor listing-shaping into exported `shapeListing(row)` and `rankListings(rows, config, now)` so tests avoid spawning the CLI.

- [ ] **Step 1: Write failing test** `scripts/__tests__/queue-modes.test.ts`:

```ts
import { describe, expect, test } from "bun:test";
import { rankListings, daysInState } from "../queue.ts";
import { AD_MANSTEIN, AD_NOLLENDORF, TEST_CONFIG } from "./fixtures/immoscout-fixtures.ts";

const NOW = new Date("2026-07-07T12:00:00Z");

describe("rankListings", () => {
  test("sorts by fit score descending and attaches top factors", () => {
    const ranked = rankListings([AD_MANSTEIN, AD_NOLLENDORF], TEST_CONFIG, NOW);
    expect(ranked[0].external_id).toBe("169077787");
    expect(ranked[0].fit.score).toBeGreaterThan(ranked[1].fit.score);
    expect(ranked[0].fit.top_factors.length).toBeGreaterThan(0);
  });
});

describe("daysInState", () => {
  test("computes whole days since verdict_at", () => {
    expect(daysInState("2026-07-03 12:00:00", NOW)).toBe(4);
    expect(daysInState(null, NOW)).toBeNull();
  });
});
```

- [ ] **Step 2: Run** → FAIL

- [ ] **Step 3: Rework** `scripts/queue.ts`:

```ts
#!/usr/bin/env bun
// queue.ts — print listings from the state DB as JSON for the triage/application commands.
//
// Usage:
//   bun scripts/queue.ts review     # only review-band listings
//   bun scripts/queue.ts pending    # only pending listings
//   bun scripts/queue.ts triage     # pending + review (default)
//   bun scripts/queue.ts rank       # triage set sorted by fit score (desc)
//   bun scripts/queue.ts compare    # accepted→offer listings with fit scores
//   bun scripts/queue.ts pipeline   # contacted/viewing/applied/offer with days_in_state
//   bun scripts/queue.ts qualifying # print the DOD qualifying_count (number)
import { getQueue, countQualifying, getByVerdicts } from './db.ts';
import { fitScore } from './fit-score.ts';
import { loadConfig } from './config.ts';
import type { Listing, PluginConfig } from './types.ts';

function shapeListing(r: Listing) {
  let description: string | null = null;
  try { description = JSON.parse(r.raw_json || '{}').description || null; } catch { /* keep null */ }
  return {
    id: r.id, portal: r.portal, title: r.title, url: r.url, district: r.district,
    cold_rent: r.cold_rent, warm_rent: r.warm_rent, rooms: r.rooms, sqm: r.sqm,
    scam_score: r.scam_score, verdict: r.verdict, verdict_at: r.verdict_at ?? null,
    posted_at: r.posted_at ?? null,
    description: description ?? r.description ?? null,
  };
}

export function rankListings(rows: Listing[], config: PluginConfig, now: Date = new Date()) {
  return rows
    .map((r) => {
      const shaped = shapeListing(r);
      const fit = fitScore({ ...r, description: shaped.description }, config, now);
      return {
        ...shaped,
        // Top 3 factors by |points| tell the triage reader WHY at a glance.
        fit: { score: fit.score, top_factors: [...fit.factors].sort((a, b) => Math.abs(b.points) - Math.abs(a.points)).slice(0, 3) },
      };
    })
    .sort((a, b) => b.fit.score - a.fit.score);
}

export function daysInState(verdictAt: string | null | undefined, now: Date = new Date()): number | null {
  if (!verdictAt) return null;
  const t = new Date(verdictAt.includes('T') ? verdictAt : verdictAt.replace(' ', 'T') + 'Z');
  if (isNaN(t.getTime())) return null;
  return Math.floor((now.getTime() - t.getTime()) / 86_400_000);
}

const PIPELINE_VERDICTS = ['contacted', 'viewing', 'applied', 'offer'];

if (import.meta.main) {
  const arg = process.argv[2] || 'triage';

  if (arg === 'qualifying') {
    process.stdout.write(countQualifying() + '\n');
    process.exit(0);
  }

  let out: unknown;
  if (arg === 'rank') {
    out = rankListings([...getQueue('review'), ...getQueue('pending')], loadConfig());
  } else if (arg === 'compare') {
    out = rankListings(getByVerdicts(['accepted', ...PIPELINE_VERDICTS]), loadConfig());
  } else if (arg === 'pipeline') {
    out = getByVerdicts(PIPELINE_VERDICTS).map((r) => ({ ...shapeListing(r), days_in_state: daysInState(r.verdict_at) }));
  } else if (arg === 'triage') {
    out = [...getQueue('review'), ...getQueue('pending')].map(shapeListing);
  } else {
    out = getQueue(arg).map(shapeListing);
  }
  process.stdout.write(JSON.stringify(out, null, 2) + '\n');
}
```

(Note: `shapeListing` gains `description ?? r.description` fallback so in-memory fixtures work; DB rows carry description in raw_json as before. Existing output fields unchanged plus `verdict_at`/`posted_at` — additive, triage.md unaffected.)

- [ ] **Step 4: Run** `bun test` → PASS

- [ ] **Step 5: Commit** `git commit -m "feat(berlin-flats): add rank/compare/pipeline queue modes"`

---

### Task 5: dossier.ts document readiness + config template

**Files:**
- Create: `scripts/dossier.ts`
- Modify: `scripts/types.ts` (PluginConfig.documents)
- Modify: `config/config.toml` (commented [documents] template)
- Test: `scripts/__tests__/dossier.test.ts`

**Interfaces:**
- Produces: `checkDossier(documents: DocumentsConfig | undefined, opts: { exists: (p: string) => boolean; now: Date }): DossierReport` where `DocumentsConfig = Record<string, { path?: string; issued?: string }>`, `DossierReport = { ready: boolean; items: Array<{ key: string; label: string; required: boolean; status: 'ok'|'missing'|'file_not_found'|'stale'; detail: string }> }`. CLI: `bun scripts/dossier.ts` prints the report JSON.

- [ ] **Step 1: Write failing test** `scripts/__tests__/dossier.test.ts`:

```ts
import { describe, expect, test } from "bun:test";
import { checkDossier } from "../dossier.ts";

const NOW = new Date("2026-07-07T12:00:00Z");
const allExist = { exists: () => true, now: NOW };

describe("checkDossier", () => {
  test("no config at all → every required doc missing, not ready", () => {
    const report = checkDossier(undefined, allExist);
    expect(report.ready).toBe(false);
    const schufa = report.items.find((i) => i.key === "schufa")!;
    expect(schufa.status).toBe("missing");
    expect(schufa.required).toBe(true);
  });

  test("fresh schufa with existing file is ok", () => {
    const report = checkDossier({ schufa: { path: "/docs/schufa.pdf", issued: "2026-06-20" } }, allExist);
    expect(report.items.find((i) => i.key === "schufa")!.status).toBe("ok");
  });

  test("schufa older than 90 days is stale", () => {
    const report = checkDossier({ schufa: { path: "/docs/schufa.pdf", issued: "2026-03-01" } }, allExist);
    const schufa = report.items.find((i) => i.key === "schufa")!;
    expect(schufa.status).toBe("stale");
    expect(schufa.detail).toContain("90");
  });

  test("configured path that does not exist is file_not_found", () => {
    const report = checkDossier(
      { schufa: { path: "/docs/schufa.pdf", issued: "2026-06-20" } },
      { exists: () => false, now: NOW }
    );
    expect(report.items.find((i) => i.key === "schufa")!.status).toBe("file_not_found");
  });

  test("ready only when all required docs are ok", () => {
    const docs = {
      schufa: { path: "/d/schufa.pdf", issued: "2026-06-20" },
      payslips: { path: "/d/payslips/" },
      id: { path: "/d/id.pdf" },
      selbstauskunft: { path: "/d/selbstauskunft.pdf" },
    };
    expect(checkDossier(docs, allExist).ready).toBe(true);
  });
});
```

- [ ] **Step 2: Run** → FAIL

- [ ] **Step 3: Create** `scripts/dossier.ts`:

```ts
#!/usr/bin/env bun
// dossier.ts — Bewerbungsmappe (application dossier) readiness report.
// Reads [documents] from config/config.toml and checks each expected document
// for presence and freshness. Prints a JSON report.
//
// Usage: bun scripts/dossier.ts
import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { loadConfig } from "./config.ts";

export interface DocumentEntry { path?: string; issued?: string }
export type DocumentsConfig = Record<string, DocumentEntry>;

export interface DossierItem {
  key: string;
  label: string;
  required: boolean;
  status: "ok" | "missing" | "file_not_found" | "stale";
  detail: string;
}

export interface DossierReport { ready: boolean; items: DossierItem[] }

// Freshness rules reflect what Berlin landlords/Hausverwaltungen expect:
// SCHUFA no older than 3 months (90d); payslips are "the last three" so the newest
// should be ≤ ~3 months old (100d gives one pay-cycle slack); a
// Mietschuldenfreiheitsbescheinigung is customarily accepted up to 6 months (180d).
const DOC_RULES: Record<string, { label: string; required: boolean; max_age_days?: number }> = {
  schufa: { label: "SCHUFA-BonitätsAuskunft", required: true, max_age_days: 90 },
  payslips: { label: "Last 3 payslips", required: true, max_age_days: 100 },
  id: { label: "ID / passport copy", required: true },
  selbstauskunft: { label: "Filled Mieterselbstauskunft", required: true },
  employer_letter: { label: "Employer confirmation (unbefristet)", required: false },
  mietschuldenfreiheit: { label: "Mietschuldenfreiheitsbescheinigung", required: false, max_age_days: 180 },
};

function expandHome(p: string): string {
  return p.startsWith("~/") ? p.replace("~", homedir()) : p;
}

export function checkDossier(
  documents: DocumentsConfig | undefined,
  opts: { exists: (path: string) => boolean; now: Date }
): DossierReport {
  const items: DossierItem[] = [];
  for (const [key, rule] of Object.entries(DOC_RULES)) {
    const entry = documents?.[key];
    if (!entry?.path) {
      items.push({ key, ...rule, status: "missing", detail: `no [documents.${key}] entry in config.toml` });
      continue;
    }
    if (!opts.exists(expandHome(entry.path))) {
      items.push({ key, ...rule, status: "file_not_found", detail: `${entry.path} does not exist` });
      continue;
    }
    if (rule.max_age_days && entry.issued) {
      const ageDays = (opts.now.getTime() - new Date(entry.issued).getTime()) / 86_400_000;
      if (isNaN(ageDays) || ageDays > rule.max_age_days) {
        items.push({ key, ...rule, status: "stale",
          detail: `issued ${entry.issued}, older than the ${rule.max_age_days}-day freshness window — renew` });
        continue;
      }
    }
    items.push({ key, ...rule, status: "ok", detail: entry.path });
  }
  const ready = items.filter((i) => i.required).every((i) => i.status === "ok");
  return { ready, items };
}

if (import.meta.main) {
  const config = loadConfig() as { documents?: DocumentsConfig };
  const report = checkDossier(config.documents, { exists: existsSync, now: new Date() });
  process.stdout.write(JSON.stringify(report, null, 2) + "\n");
}
```

  - In `scripts/types.ts` add to `PluginConfig`:

```ts
  documents?: Record<string, { path?: string; issued?: string }>;
```

- [ ] **Step 4: Append** commented template to `config/config.toml`:

```toml
# --- Application dossier (used by /prepare-application) -----------------
# Uncomment and point at your actual files. `issued` drives freshness checks
# (SCHUFA ≤ 90 days, payslips ≤ ~100 days, Mietschuldenfreiheit ≤ 180 days).
# [documents.schufa]
# path   = "~/Documents/wohnung/schufa.pdf"
# issued = "2026-06-15"
# [documents.payslips]
# path   = "~/Documents/wohnung/payslips/"
# issued = "2026-06-30"
# [documents.id]
# path   = "~/Documents/wohnung/id.pdf"
# [documents.selbstauskunft]
# path   = "~/Documents/wohnung/selbstauskunft.pdf"
# [documents.employer_letter]
# path   = "~/Documents/wohnung/arbeitgeber.pdf"
# [documents.mietschuldenfreiheit]
# path   = "~/Documents/wohnung/mietschuldenfrei.pdf"
# issued = "2026-04-01"
```

- [ ] **Step 5: Run** `bun test` → PASS; also `bun scripts/dossier.ts` → prints report with all `missing` (documents commented out)

- [ ] **Step 6: Commit** `git commit -m "feat(berlin-flats): add application dossier readiness check"`

---

### Task 6: Markdown layer — skill, commands, scribe modes, triage ranking

**Files:**
- Create: `skills/application-dossier/SKILL.md`
- Create: `commands/prepare-application.md`
- Create: `commands/follow-up.md`
- Modify: `agents/scribe.md` (message modes)
- Modify: `commands/triage.md` (ranked presentation)

- [ ] **Step 1: Create** `skills/application-dossier/SKILL.md`:

````markdown
---
name: application-dossier
description: This skill should be used when the user asks to "prepare an application", "prepare my Bewerbungsmappe", "what documents do I need for a flat application", or wants to apply for a Berlin rental after a viewing. Covers the standard Berlin application dossier, document freshness rules, and the applicant's legal rights (Selbstauskunft limits, Kaution cap, Abstandszahlung rules).
---

# Berlin Rental Application Dossier

## Standard Bewerbungsmappe contents (in the order landlords expect)

| # | Document | Freshness | Notes |
|---|----------|-----------|-------|
| 1 | Cover letter (Anschreiben) | per listing | Draft with the `scribe` agent, mode `application` |
| 2 | Mieterselbstauskunft | current | Landlord's own form if provided, else a standard one |
| 3 | SCHUFA-BonitätsAuskunft | ≤ 3 months | Consumer version (§ 34 BDSG copy is fine); landlords reject stale ones |
| 4 | Last 3 payslips | newest ≤ ~3 months | Rule of thumb: warm rent ≤ 1/3 net income |
| 5 | Employer confirmation | optional | Confirms unbefristet contract; strengthens the file |
| 6 | Mietschuldenfreiheitsbescheinigung | ≤ 6 months | From the current landlord; optional but Hausverwaltungen like it |
| 7 | ID / passport copy | current | — |

Run `bun scripts/dossier.ts` to check readiness against `config/config.toml` `[documents]`.

## Legal guardrails (protect the applicant)

- **Kaution**: max 3 months cold rent (§ 551 BGB), payable in 3 monthly installments. Demands above this are illegal.
- **Abstandszahlung / fixture takeover**: payment for furniture or fixtures (Trockenbauwand, Küche, Hochebene) may not noticeably exceed their actual value (§ 4a WoVermittG). A demand clearly above value is unenforceable — negotiate or walk.
- **Deposit before viewing**: never. Automatic scam signal (see skills/scam-patterns).
- **Selbstauskunft — questions the landlord may NOT ask** (answering falsely carries no consequence): pregnancy/family planning, religion, party or union membership, criminal record, illnesses, previous rent amount. Questions the landlord MAY ask: identity, income and employer, household size, pets, guarantors, ongoing insolvency proceedings.

## Workflow

1. Check readiness: `bun scripts/dossier.ts` → fix `missing`/`stale`/`file_not_found` items first.
2. Fill the landlord's Selbstauskunft (or the standard form) from `[profile]` facts — flag any illegal questions to the user instead of answering them.
3. Draft the cover letter with the `scribe` agent in `application` mode.
4. Assemble as ONE PDF in the table order above — Hausverwaltungen forward a single attachment more reliably than six.

The document order table is a sensible default, adapt if a landlord requests a specific format.
````

- [ ] **Step 2: Create** `commands/prepare-application.md`:

````markdown
---
description: Check application-document readiness and assemble an application package for a flat (dossier report + cover letter via scribe).
argument-hint: "[listing-id]"
allowed-tools: Bash, Read, Agent
---

Read the `skills/application-dossier` skill first — it defines the dossier contents, order, and legal guardrails.

Resolve Bun once:

```bash
BUN_BIN="$(command -v bun 2>/dev/null || true)"
for c in "${HOME:-}/.bun/bin/bun" /opt/homebrew/bin/bun /usr/local/bin/bun; do
  [ -n "$BUN_BIN" ] && break; [ -x "$c" ] && BUN_BIN="$c"
done
: "${BUN_BIN:=bun}"
```

## Step 1 — Dossier readiness

```bash
cd $CLAUDE_PLUGIN_ROOT && "$BUN_BIN" scripts/dossier.ts
```

Present the report as a checklist (✅ ok / ⚠️ stale / ❌ missing / ❌ file_not_found). For each non-ok item, tell the user concretely how to fix it (where to order a SCHUFA, what to ask the employer/landlord for) and which `[documents.<key>]` entry to add to `config/config.toml`.

## Step 2 — Target listing

If `$1` is a listing id, load it:

```bash
cd $CLAUDE_PLUGIN_ROOT && "$BUN_BIN" scripts/queue.ts compare
```

and pick the listing with `id == $1`. If no id was given, show the `compare` output and ask which listing to prepare for.

## Step 3 — Cover letter

Invoke the `scribe` agent with the listing JSON and `mode: application`. Include in the prompt which dossier documents are ready (from Step 1) so the letter can reference them truthfully.

## Step 4 — Package checklist

Output the final assembly checklist in the dossier order (cover letter → Selbstauskunft → SCHUFA → payslips → employer letter → Mietschuldenfreiheit → ID), marking what is ready now versus what the user must renew first. Recommend merging into a single PDF.

If the listing is in `viewing` state and the user confirms they applied, set:

```bash
cd $CLAUDE_PLUGIN_ROOT && "$BUN_BIN" scripts/set-verdict.ts --id <id> --verdict applied
```
````

- [ ] **Step 3: Create** `commands/follow-up.md`:

````markdown
---
description: Review the contact pipeline (contacted/viewing/applied/offer), draft nudges for stale contacts and next-step messages via scribe.
allowed-tools: Bash, Read, Agent
---

Resolve Bun once:

```bash
BUN_BIN="$(command -v bun 2>/dev/null || true)"
for c in "${HOME:-}/.bun/bin/bun" /opt/homebrew/bin/bun /usr/local/bin/bun; do
  [ -n "$BUN_BIN" ] && break; [ -x "$c" ] && BUN_BIN="$c"
done
: "${BUN_BIN:=bun}"
```

## Step 1 — Load the pipeline

```bash
cd $CLAUDE_PLUGIN_ROOT && "$BUN_BIN" scripts/queue.ts pipeline
```

Present a table: id | title | verdict | days_in_state | warm_rent | URL.

## Step 2 — Per-listing actions

Walk the listings oldest-first and suggest per state (thresholds: Berlin landlords answer within a few days or not at all, so nudge once after 4+ days; a viewing without an application within 2 days loses the flat):

- **contacted, days_in_state ≥ 4** → offer a nudge: invoke `scribe` with `mode: nudge`. On send, keep verdict `contacted` (a nudge is not a state change).
- **contacted, got a viewing invitation** (ask the user) → `set-verdict.ts --id <id> --verdict viewing`, then offer `scribe` `mode: viewing_confirm`.
- **viewing, days_in_state ≥ 1** → recommend running `/berlin-flats:prepare-application <id>` to submit the application; on confirmation set verdict `applied`.
- **applied, days_in_state ≥ 7** → offer a polite status inquiry (`scribe` `mode: nudge`).
- **offer** → congratulate; remind about Kaution cap (max 3 cold rents, § 551 BGB) and contract checks from `skills/berlin-context`.
- Dead-end (landlord declined / flat gone) → `set-verdict.ts --id <id> --verdict dead --reason "<why>"`.

Apply state changes only after the user confirms each one:

```bash
cd $CLAUDE_PLUGIN_ROOT && "$BUN_BIN" scripts/set-verdict.ts --id <id> --verdict <verdict> [--reason "..."]
```

## Step 3 — Summary

Show counts per state and the single most urgent action.
````

- [ ] **Step 4: Add modes to** `agents/scribe.md` — insert after the "**Your task:**" line, replacing it with:

```markdown
**Your task:** Draft a message for the listing provided, in the requested `mode` (default `inquiry`).

## Modes

- **inquiry** (default) — first-contact message. Hard constraints below apply unchanged.
- **viewing_confirm** — confirm a viewing appointment. ≤ 60 words: restate date/time, who attends, one logistics question at most. No selling.
- **application** — post-viewing application cover letter, 120–180 words. Open with one concrete impression from the viewing (ask for it if not provided). State intent plainly ("Ich möchte die Wohnung gerne mieten."), summarize the strongest profile facts (employment, income stability, Schufa), and list the dossier documents actually attached — only ones the caller says are ready. Close with availability for questions.
- **nudge** — polite follow-up on a message sent N days ago. ≤ 50 words: reference the original date, restate continued interest in one clause, no guilt-tripping, no new selling points.

The word-count and cliché rules below apply to **inquiry**; the other modes carry their own limits above. Tone rules from `skills/message-tone` apply to all modes.
```

- [ ] **Step 5: Update** `commands/triage.md` Step 2 — replace the `queue.ts triage` block and presentation list with:

```markdown
Load the remaining queue ranked by fit score (pending + any still-review listings):

```bash
cd $CLAUDE_PLUGIN_ROOT && "$BUN_BIN" scripts/queue.ts rank
```

For each listing (already sorted best-first), present:
- **Title** and URL
- District | Cold rent | Warm rent | Rooms | sqm
- **Fit score /100** with its top factors (one line, e.g. `fit 89 — VALUE: at median · SIZE: 104m² · NEBENKOSTEN: suspiciously low`)
- Scam score and verdict (note any scam-judge override)
- Description excerpt (first 200 chars)
```

- [ ] **Step 6: Run** `bash scripts/validate-plugin.sh berlin-flats` from repo root → must pass (checks skill frontmatter trigger phrase, marketplace entry)

- [ ] **Step 7: Commit** `git commit -m "feat(berlin-flats): application dossier skill, prepare-application/follow-up commands, scribe modes, ranked triage"`

---

### Task 7: Version bump + final verification

**Files:**
- Modify: `.claude-plugin/plugin.json` (version bump)
- Possibly: `.claude-plugin/marketplace.json` at repo root (version, description mention)

- [ ] **Step 1:** Bump `plugins/berlin-flats/.claude-plugin/plugin.json` version minor (e.g. x.y.z → x.(y+1).0). Check repo-root `.claude-plugin/marketplace.json` — if it carries a version/description for berlin-flats, update the version and extend the description with "fit-score ranking + application prep".

- [ ] **Step 2:** Full gate:

```bash
cd plugins/berlin-flats && bun test
cd ../.. && bash scripts/validate-plugin.sh berlin-flats
```

Expected: all tests pass; validator prints no errors.

- [ ] **Step 3:** Commit `git commit -m "chore(berlin-flats): bump version for assessment + application-prep release"`, push branch, open PR titled "feat(berlin-flats): fit-score ranking, pipeline states, application dossier".
</content>
