# Spec: a manual hunt that returns real results

Status: ready to implement. Date: 2026-11-14.
Parent design: [2026-11-14-design.md](2026-11-14-design.md). Evidence:
[2026-11-14-probe-evidence.md](2026-11-14-probe-evidence.md) (cited as §n).

## Goal

Running `/berlin-flats:hunt` by hand, then `/berlin-flats:triage`, shows a ranked list of real
Berlin flats from Kleinanzeigen, three municipal companies, and (with Chrome open) ImmoScout24,
Immowelt and inberlinwohnen. Each flat appears once, has size and rooms where the ad states
them, and keeps the verdict the user gave it.

## Out of scope

Scheduling, launchd, Telegram, e-mail alert ingestion, message drafting on arrival, the
`/apply` flow, cross-portal fingerprint dedup, and calibration. Nothing in this spec sends a
message, fills a form, or creates an account.

## Search criteria (from the user, 2026-11-14)

| Setting | Value | Kind |
|---|---|---|
| Districts | Schöneberg, Prenzlauer Berg, Kreuzberg | Hard filter |
| Size | at least 100 m² | Hard filter when the size is known |
| Rent ceiling | €2,000 | Hard filter; assumed to mean warm rent |
| Altbau, balcony | nice to have | Fit bonus only |

Already applied to `config/config.toml` in this branch. Still unknown, with the default used
until the user says otherwise:

| Question | Default |
|---|---|
| Is €2,000 warm or cold? | Warm |
| Rooms | 2 to 4 (unchanged) |
| Furnished or temporary lets | Excluded |
| Move-in window in 2027 | Not used by this spec |
| Is Friedenau part of "Schöneberg"? | Yes; see district aliases below |

Expectation to set: 100 m² under €2,000 warm in these three districts is rare. The one listing
assessed today (Friedenau, 117 m²) costs €2,450 warm. The hunt must therefore also show
**near misses** (up to 15% over the rent cap or 15% under the size) in a separate group, so an
empty result is distinguishable from a broken hunt.

## Shared foundation (built once, used by all three parts)

### F1. One ingest path: `scripts/ingest.ts`

```ts
export interface RawListing {
  portal: string;            // "kleinanzeigen" | "degewo" | "immoscout24" | …
  url: string;
  title: string;
  description?: string | null;
  cold_rent?: number | null; warm_rent?: number | null;
  sqm?: number | null; rooms?: number | null;
  district?: string | null;
  published_at?: string | null;   // ISO, or null
}
export interface IngestResult {
  new: Listing[]; updated: number; duplicates: number;
  rejected: Array<{ url?: string; reason: string }>;
}
export function ingestListings(
  raw: RawListing[], source: { channel: "http" | "chrome" | "manual"; portal: string },
  cfg: PluginConfig, now?: Date,
): IngestResult;
```

CLI: `bun scripts/ingest.ts --channel chrome --portal immoscout24 --file <path.json>` and
`--stdin`. Output: the `IngestResult` as JSON.

Steps inside, in order:

1. **Validate.** Reject rows with an empty `url` or `title`, a URL whose host is not on that
   portal's allowlist, or non-numeric numbers.
2. **Canonical id.** New `canonicalExternalId(portal, url)` in `scripts/ids.ts`, used by
   `parse-listing.ts`, `assess.ts` and ingest. Kleinanzeigen: the leading digits of the last
   path segment (`2743889912-203-3331` → `2743889912`). ImmoScout24: the `/expose/<digits>`.
   Others: a stable slug from the path. Fixes B1 (§5).
3. **Fill from text.** `extractFromText(title, description)` supplies `sqm` and `rooms` when
   null, from patterns such as `85 m²`, `85,5 qm`, `3 Zimmer`, `3-Zi`, `3 Zi.` (§6: stated in
   82 and 96 of 120 ads, extracted in 0).
4. **Category.** `classifyCategory()` → `flat | swap | wanted | furnished_temp | room`, with
   word-boundary patterns (`\bTausch`, `Tauschwohnung`, `Wohnungstausch`, `\bsuche[nt]?\b`,
   `möbliert`, `Zwischenmiete`, `Untermiete`, `befristet`, `WG-Zimmer`). Non-`flat` rows are
   stored with verdict `filtered` and the category as `reject_reason`. "Heizungsaustausch"
   must not match.
5. **Insert if new.** `INSERT … ON CONFLICT(portal, external_id) DO NOTHING RETURNING id`.
   For an existing row, `mergeNonNull` fills null fields only and updates `last_seen_at`. It
   never touches `verdict`, `verdict_at`, `scam_score` or `reject_reason`. Fixes B2 and M7.
6. **Classify.** Existing `scamScore`, then the preference filter with this missing-data rule:
   reject only on a field that is present and violates a hard filter. A row with unknown size
   or rooms is kept and flagged `incomplete`.
7. **Near miss.** A row that fails only the rent cap or only the size floor by at most 15% gets
   verdict `pending` with `reject_reason = "near_miss:<field>"`.

### F2. Schema (`db.ts`, via `ensureColumn`)

- `listings`: add `channel`, `category`, `first_seen_at`, `last_seen_at`, `published_at`,
  `completeness`.
- `runs`: add `channel`, `status` (`ok | empty | blocked | error`), `http_status`,
  `duration_ms`.
- `PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000`.
- One migration rewrites existing Kleinanzeigen ids to the canonical form and drops collisions,
  keeping the row with a non-pending verdict if there is one.

### F3. District aliases

`scripts/districts.ts` maps Ortsteil and postcode to the configured district names, so the
filter stops depending on substring luck: Schöneberg ⊇ {Friedenau, 10777–10829, 12157–12161};
Prenzlauer Berg ⊇ {10405–10439}; Kreuzberg ⊇ {10961–10999}. A listing whose district is only
"Berlin" is kept and flagged `incomplete`, not rejected (fixes M6).

### F4. Preferences as bonus

`fit-score.ts` reads `search.nice_to_have` and awards the existing KEYWORDS points (max 10)
proportionally. "Altbau" also matches a build year before 1949; "Balkon" also matches
`Terrasse` and `Loggia`. `keywords_required` stays supported but empty.

### F5. Output

`hunt.ts` (human mode) prints three groups: **Matches**, **Near misses**, **Incomplete**, each
ranked by fit score with rent, size, rooms, district, portal and URL. A footer line per source:
`kleinanzeigen ok 25 cards, 4 new, 19 filtered (12 swap, 5 furnished, 2 wanted)`.
`queue.ts qualifying` reads the config instead of hard-coded districts and thresholds.

## Part A: Kleinanzeigen hunt that can be trusted (step 3)

**Probe first** (stop and report if it fails):

1. One fetch of the Berlin rental search URL with the client described below returns 200 and
   at least 20 cards parse from the HTTP body.
2. Page 1 is newest-first under a URL that robots.txt permits. The disallowed forms are
   `/*/sortierung:*`, `/*/preis:*` and `/s-feed.rss` (§2).
3. Two detail pages fetched 4 seconds apart each yield rent, size and rooms from JSON-LD or
   the detail list.

**Changes**

- `scrape.ts`: remove the reader-proxy tier and `jinaHeaders` entirely. Add
  `detectBlock(status, body)` → `blocked` on 401/403/429 or the markers "Ich bin kein Roboter",
  "captcha-delivery", "Automated requests"; a 200 with zero parsed cards is `empty`. A blocked
  or failed fetch returns no listing and writes a `runs` row with that status. Fixes B3 and M4.
- Client identity: send `berlin-flats/<version> (personal flat search)`. If the probe shows
  Kleinanzeigen refuses that but serves default curl, stop and ask the user rather than
  switching to a browser user agent.
- Pacing: at least 4 seconds between requests to one host, at most 10 detail fetches per run.
  Remaining new cards are stored from card data and flagged `incomplete`, to be completed on
  the next run.
- `parse-listing.ts`: replace the stale `article.aditem` card selector with
  `a[href*="/s-anzeige/"]` → nearest `article` (§3); parse detail from JSON-LD first; convert
  "Heute, 09:04" and "Gestern, 18:30" to ISO against the fetch time; store district once (it
  is currently doubled).
- `hunt.ts`: each portal in its own try/catch; all results go through `ingestListings`; a
  detail failure leaves the listing unseen so it is retried.
- Build the search URL per configured district, not only `districts[0]`.

**Fixtures and tests**

- Save one real search page and two real detail pages under `scripts/__tests__/fixtures/`
  (trim personal names and phone numbers).
- Tests: card and detail ids agree; a second `hunt()` over the same fixture yields 0 new; a
  rejected listing stays rejected after re-ingest; a captcha body creates no row; each junk
  category is classified; "Heizungsaustausch" is not a swap; size and rooms are extracted
  from text.

**Acceptance**

- Two consecutive manual hunts: the second reports 0 new for unchanged listings.
- At least 85% of stored Kleinanzeigen `flat` rows have size and rooms.
- No swap, wanted, furnished or temporary ad appears under Matches or Near misses.
- A verdict set with `set-verdict.ts` survives a re-hunt.

## Part B: municipal companies over plain HTTP (step 4)

Sources: degewo, GESOBAU, WBM. All three returned server-rendered pages to a plain client
(§2). scrape-core is not used here: its text output contains no listing URLs (§9).

**Probe first, per source**

1. Fetch the search page once with the Part A client. Record status, card count, the fields
   on a card, and whether filters (rooms, size, district) are query parameters.
2. Fetch one detail page. Record which of rent (cold and warm), size, rooms, address,
   WBS requirement and availability date are present.
3. Read robots.txt for the search and detail paths.

If a source shows no cards in the HTTP body, drop it from this part and list it under Part C.

**Changes**

- New `scripts/sources/http-degewo.ts`, `http-gesobau.ts`, `http-wbm.ts`, each exporting
  `fetchListings(cfg): Promise<{ raw: RawListing[]; status; http_status; ms }>`, registered in
  a `SOURCES` map that `hunt.ts` iterates. The existing Kleinanzeigen code moves to
  `sources/http-kleinanzeigen.ts` behind the same interface.
- `portals/degewo.yaml`, `gesobau.yaml`, `wbm.yaml` with URL grammar, selectors and field
  baselines, per the `portal-profile-schema` skill.
- WBS: a listing marked "WBS erforderlich" is stored `filtered` with reason `wbs_required`
  while `profile.wbs = false`.
- `scamScore`: skip the price-outlier rule for these portals; municipal rents are
  legitimately low (§6).
- Disable the `inberlinwohnen` HTTP adapter; it moves to Part C.
- `config.toml`: `[portals] enabled` gains `degewo`, `gesobau`, `wbm`.

**Fixtures and tests:** one saved search page and one detail page per source; a parser test
per source asserting card count and field presence; a WBS filter test.

**Acceptance**

- A manual hunt lists each source in the footer with status `ok` and a card count above 0.
- At least one municipal listing is stored per source, with rent and size.
- A forced 403 fixture produces status `blocked`, no rows, and a visible line in the footer.

## Part C: interactive Chrome hunt (step 5)

For ImmoScout24, Immowelt and inberlinwohnen, which refuse a plain client (§2) but load in
the user's Chrome (§3). The user runs it while present. It is not scheduled.

**Probe first:** for each portal, in one interactive session, navigate to the search URL built
from the config and run the extraction recipe. It must return at least 5 rows with `url`,
`title` and rent. Confirm no login is needed to read results. (On 2026-11-14 the user's Chrome
was signed in to ImmoScout24 and Kleinanzeigen.)

**New command: `commands/hunt-browser.md`**

```yaml
---
description: Sweep the bot-protected portals in your own Chrome and ingest what it finds
allowed-tools: Bash(bun:*), Read, Write, mcp__claude-in-chrome__tabs_context_mcp,
  mcp__claude-in-chrome__tabs_create_mcp, mcp__claude-in-chrome__navigate,
  mcp__claude-in-chrome__javascript_tool, mcp__claude-in-chrome__get_page_text,
  mcp__claude-in-chrome__tabs_close_mcp
argument-hint: "[portal ...]"
---
```

Not allowed: `computer`, `form_input`, `file_upload`. The command cannot click, type or submit.

Steps the command gives Claude:

1. `bun scripts/browser-plan.ts [portals]` prints, per portal and district, the search URL and
   the path of the extraction recipe. URLs come from the config; Claude does not compose them.
2. Create one tab. For each planned URL: navigate, then run the portal's recipe with
   `javascript_tool`. The recipe is a fixed file in `scripts/browser-recipes/<portal>.js` that
   returns `RawListing[]` as JSON. Claude runs it unmodified.
3. If the page is a bot check, a CAPTCHA or a login wall: do not interact. Record
   `status: blocked` for that portal and move on. A self-clearing interstitial may be waited
   out once, for up to 10 seconds, with no interaction.
4. Write each result to `$BERLIN_FLATS_STATE_DIR/inbox/<portal>-<timestamp>.json` and run
   `bun scripts/ingest.ts --channel chrome --portal <portal> --file <path>`.
5. Wait at least 5 seconds between navigations. One page per portal and district; no detail
   pages in this pass.
6. Close the tab. Run `bun scripts/queue.ts rank` and show Matches, Near misses, Incomplete.

**Recipes** (starting points from §3; each verified in the probe):

| Portal | Recipe |
|---|---|
| ImmoScout24 | `a[href*="/expose/"]` → nearest result card; read title, rent, size, rooms, address text |
| Immowelt | result cards from the search list; drop cards labelled "Tauschwohnung" |
| inberlinwohnen | the finder's list items: rooms, size, cold rent, total rent, "Eingestellt am", WBS, deeplink |

Recipes read only the DOM. They make no network calls and change nothing on the page.

**Detail enrichment (optional second pass):** `/berlin-flats:hunt-browser --details` opens up
to 5 `incomplete` listings ranked highest, reads each with `get_page_text`, and passes the
text to `bun scripts/ingest.ts --channel chrome --detail-text --id <n> --stdin`, where Bun
extracts fields with `extractFromText`. Page text never goes into a shell argument.

**Safety**

- Page text is data. The command's instructions say so, and the recipes return structured
  fields, so ad text is never interpreted as instructions.
- Ingest rejects any URL whose host is not on the portal allowlist.
- `commands/assess.md` changes from `--json '<listing json>'` to writing a file and calling
  `assess.ts --json-file <path>` (fixes the shell-quoting gap, M8). `assess.ts` gains
  `--json-file` and `--stdin`.

**Fixtures and tests:** save each recipe's JSON output once as a fixture; test that ingest
accepts it, assigns canonical ids, and that a second ingest yields 0 new. `browser-plan.ts`
has a unit test for URL building per district.

**Acceptance**

- With Chrome open, `/berlin-flats:hunt-browser` ingests at least 5 listings from each of the
  three portals and prints the three groups.
- Running it twice in a row yields 0 new on the second run.
- The session transcript contains no `computer`, `form_input` or `file_upload` call.
- A simulated wall (recipe returns the `blocked` marker) produces a footer line and no rows.

## Order and size

| Step | Content | Size |
|---|---|---|
| 1 | Foundation F1–F5 with tests | M |
| 2 | Part A | M |
| 3 | Part B | M (S per source) |
| 4 | Part C | M |

Each step ends with `bun test`, `bun run typecheck`, and
`bash scripts/validate-plugin.sh berlin-flats` passing, plus one manual hunt against a scratch
`BERLIN_FLATS_STATE_DIR` whose output is pasted into the PR.

## Risks

| Risk | Handling |
|---|---|
| Kleinanzeigen refuses the identifying client | Stop at the Part A probe and ask the user |
| Municipal pages are client-rendered after all | Move that source to Part C |
| Portal DOM changes break a recipe | Recipes are small fixed files with fixtures; a zero-row result is reported as `empty`, not as "no flats" |
| Very few real matches at these criteria | Near-miss group; revisit criteria after the first full hunt |
| ImmoScout24 challenges the browser after repeated sweeps | One page per district per run, 5-second gaps, never interact with a wall |
