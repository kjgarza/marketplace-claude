# berlin-flats: probe evidence, 2026-11-14

Digest of five parallel probes (Chrome, anti-bot posture, Claude Code runtime, post-fetch
pipeline, code review) plus two main-session probes. It is the evidence base for
`2026-11-14-design.md`. Everything not run live is marked UNVERIFIED.

Ground rules for every probe: read-only towards the outside world (no landlord messages, no
form submissions, no signups, no personal data entered), no circumvention (no CAPTCHA solving,
proxies, spoofing or reader-proxy fallback on a blocked site), isolated state via
`BERLIN_FLATS_STATE_DIR`.

## 1. Current state

- No scheduler is running. No berlin launchd agent is loaded; `~/Scripts/claude-jobs` and
  `~/Logs/berlin-flats-hunt` do not exist, so `automation/install.sh` was never run here.
- Last recorded hunt: 2026-08-17. Ten run rows, roughly weekly, likely from a Desktop scheduled
  task (inference).
- Real DB: 120 listings, all Kleinanzeigen. Verdicts: 117 filtered, 2 pending, 1 block. Zero
  human verdict events. The 2 pending are a wanted-ad and a flat with no size.
- ImmoScout24: 5 of 5 runs returned 0 cards, all through the Jina reader tier. inberlinwohnen:
  enabled, no run rows.
- Installed plugin cache is 0.4.0; repo is 0.5.0.
- `config.toml` is stale: Schöneberg only, `min_sqm=100`, `keywords_required=["Altbau"]`,
  move-in 2026-06-01..09-01 (past). Seven keys are read by no script: `move_in_earliest`,
  `move_in_latest`, `max_concurrent`, `cache_ttl_listing_s`, `auto_send`,
  `notifications.desktop`, `threshold_block`.

## 2. Plain HTTP with an honest client (default curl, about 4 requests per site)

| Source | Result | Listing data |
|---|---|---|
| ImmoScout24 | 401, Imperva "Ich bin kein Roboter" (repo YAML says DataDome: wrong) | No |
| Immowelt | 403, DataDome | No |
| inberlinwohnen.de | 403, "Automated requests are not permitted" (robots.txt fully open) | No |
| Kleinanzeigen | 200, 942 KB, Akamai cookie passive | Yes, 27 ads; detail page has JSON-LD |
| WG-Gesucht | 200 | Yes, 28 ads, mostly Zwischenmiete/WG |
| degewo | 200, server-rendered | Yes, "97 Ergebnisse" |
| GESOBAU | 200 | Probably yes (detail links present) |
| WBM | 200 | Yes (many need a WBS) |
| Gewobag | 200 | Unclear; has an official "Suchauftrag anlegen" form |
| HOWOGE, Stadt und Land | 200 | No cards; client-rendered (UNVERIFIED) |
| Vonovia, Deutsche Wohnen | not established | UNVERIFIED |

- The state-owned companies hold about 404,000 flats, roughly one in four Berlin flats.
- Kleinanzeigen robots.txt disallows `/s-feed.rss`, `/*/sortierung:*` and `/*/preis:*`.
- `scripts/scrape.ts` is not an honest client: tier 1 sends a hard-coded Chrome 124 UA, and any
  failure, including a block, falls back to `r.jina.ai`. Both conflict with the no-circumvention
  rule. The July inberlinwohnen recon ("no anti-bot posture") held only for a browser-like UA.
- `hunt.ts` fires up to 20 detail fetches back to back with no delay, jitter or backoff.

## 3. The user's logged-in Chrome (claude-in-chrome, one tab, read-only)

| Portal | Load | Logged in | Per page | Publication time |
|---|---|---|---|---|
| inberlinwohnen | no wall | n/a | 10 of 558 | none |
| ImmoScout24 | interstitial on first cold load, self-cleared in ≤6 s; none on 2 later loads | no | 20 | date only |
| Kleinanzeigen | no wall in 3 loads | yes | 25–27 | date, detail page only |
| Immowelt | no wall (1 load) | no | ~30 | "Neu" badge only |
| WG-Gesucht | no wall (1 load) | no | 28 | minute resolution |

- Extraction: `get_page_text` on inberlinwohnen, ImmoScout24, Immowelt; a `javascript_tool` DOM
  query on Kleinanzeigen (`a[href*="/s-anzeige/"]` → `closest('article')`), ImmoScout24
  (`a[href*="/expose/"]`), WG-Gesucht (`.offer_list_item`).
- Repo selectors are stale: `__NEXT_DATA__` is absent on ImmoScout24; `article.aditem` matches
  nothing on Kleinanzeigen.
- Repeat polling sample is tiny: 3 loads over ~15 minutes on two portals. Faster than 5–10
  minutes is UNVERIFIED.
- Same Westend flat seen on ImmoScout24 and Immowelt: cross-portal dedup needed.
- Apply path, stopped before any input:
  - HOWOGE via inberlinwohnen: 4-step wizard, no login (WBS acknowledgement, household net
    income, Bonitätsauskunft, send).
  - Kleinanzeigen: inline message textarea, no attachment field seen.
  - Immowelt: form with salutation, name, e-mail, address, household type, employment, net
    income, move-in date; message prefilled.
  - ImmoScout24: form not reached (Google One-Tap overlay). Login and Plus gating UNVERIFIED.
  - WG-Gesucht: login required.
- "Suche speichern" exists on ImmoScout24 and Kleinanzeigen, "Suchauftrag speichern" on
  Immowelt. Alert timing UNVERIFIED.

## 4. Claude Code runtime

- VERIFIED: `claude -p --chrome --model haiku --allowedTools mcp__claude-in-chrome__list_connected_browsers`
  listed all Chrome tools and returned the connected local browser. No navigation was done
  headless.
- VERIFIED (main session): a plain `claude -p --model haiku` run lists the
  `mcp__claude_ai_Gmail__*` connector tools. The July proposal assumed Gmail was
  interactive-only.
- VERIFIED (main session): a headless Haiku run called `search_threads` for mail from the six
  portal domains over 30 days. The call succeeded and returned 0 threads, so no portal alerts
  exist yet. 6 s, $0.012. Run from a terminal, not from launchd.
- VERIFIED (main session): a headless `claude -p --chrome` Haiku run, with only tab, navigate
  and `get_page_text` tools allowed, loaded the Kleinanzeigen Berlin rental search with no
  wall. 16 s, 8 turns, $0.022, no permission denials. The model reported 1 listing from a page
  that holds about 25, so the transport works but model-read extraction is unreliable.
- Preconditions for headless Chrome: Chrome running with the extension signed in to the same
  claude.ai account; Claude Code logged in via `/login` (not an API key); `--chrome`; Chrome
  tools in `--allowedTools`; Mac awake.
- Cloud routines cannot reach local Chrome or local files. launchd works. Desktop scheduled
  tasks probably work (UNVERIFIED).
- Token cost per 5-portal Chrome sweep: ~15k input if a DOM query returns only card fields,
  ~65k if full pages are read. ESTIMATE, not measured.
- `validate-plugin.sh berlin-flats`: 5 passed, 0 failed. Six skill `name` fields break
  skill-standards (title case; one contains a personal name).

## 5. Code review: defects that bite on a schedule

Tests: 80 pass. Typecheck clean. Neither covers these.

Blockers
- B1 Kleinanzeigen dedup key mismatch (`hunt.ts:184,203-209,228`, `parse-listing.ts:103,207`):
  card id is `2743889912`, stored id is `2743889912-203-3331`; `isSeen` never matches. At a
  30-minute cadence every page-1 listing is re-fetched and re-notified each run.
- B2 Upsert overwrites `verdict`, `scam_score`, `warm_rent` (`db.ts:138-143`): a rejected or
  applied listing reverts to pending on re-upsert.
- B3 A failed or blocked detail fetch is stored as a clean `pending` listing
  (`hunt.ts:203-225`, `scrape.ts:29-31,42-45`): null fields skip the filters; a 200 captcha page
  scores 100 on prefs.

Major
- M1 Installed layout broken: `install.sh` flattens jobs so `../lib/headless-claude.sh` does not
  resolve, and `berlin-flats-summary.ts` is never copied.
- M2 Plugin-cache path bug still present: wrapper expects `$PLUGIN_CACHE/plugins/berlin-flats`,
  real path is `…/marketplace-claude/berlin-flats/<version>/`. The job would also read the
  cache copy of `config.toml`.
- M3 Silent failures: exit status discarded, `errors[]` ignored, no `notified_at`, Telegram
  failure loses the alert, summary truncates at 10.
- M4 No block detection: any 200 body over 500 characters is content; health labels ImmoScout24
  "access", not blocked; nothing unattended calls health.
- M5 No `busy_timeout`/WAL; `isSeen`-then-upsert is not atomic.
- M6 ImmoScout24 listings with district "Berlin" fail the district filter; only `districts[0]`
  is searched.
- M7 Detail merge overwrites good card fields with nulls.
- M8 Ad text reaches a shell argument (`commands/assess.md:27-30`) and the scam-judge and scribe
  prompts with no data framing.

Minor: negated deposit phrase scored as fraud; "Tausch" matches "Heizungsaustausch"; quiet
hours skip scraping, not just notifying; `cards.slice(0,20)`; no log rotation; `config.toml`
with name and employer is git-tracked.

Solid, keep: pure scoring modules with injected `now`, parameterised SQL, state outside the
plugin cache, the `runs` telemetry table and drift classes, the Telegram script.

Recommended seam: `scripts/ingest.ts` exporting
`ingestListings(raw: RawListing[], source: {channel: "scrape"|"chrome"|"email"|"manual"}, cfg)`
→ `{new, duplicates, rejected}`; a shared `canonicalExternalId(portal, url)`; atomic
`insertIfNew`; a `notified_at` column with a separate `notify.ts`; `channel` on `runs`.

## 6. Post-fetch pipeline (real DB copy and offline probes; live hunt NOT run)

- Kleinanzeigen detail parsing yields sqm on 0 of 120 and rooms on 0 of 120, though 82 and 96
  ads state them in title or text.
- Of 120 fetched: 73 swap, 22 furnished/temporary, 3 wanted, 2 rooms, 20 plausible flats.
- Funnel, config as-is: 120 → 2. Relaxed (inner ring, 2–3 rooms, ≥55 m², ≤1800 warm): 120 → 13,
  about 3 plausible by title.
- Fit scores on real data span 46–52 (noise without size). With complete synthetic data the
  ranking is sensible (88 / 45 / 46 / 40).
- Fit ignores scam risk. Scam rules: 8 regexes plus a price rule that needs `sqm`, so it never
  fires on real ads. False negatives on advance-payment phrasing; false positive risk on
  "im Urlaub" and on legitimately cheap municipal rents.
- No cross-portal dedup. No `first_seen_at`, `notified_at`, `draft_at`. `posted_at` is
  "Heute, 09:04".
- `calibrate.ts` counts machine `filtered` as human rejection and suggests removing 16 districts.
- `queue.ts qualifying` hard-codes districts and rent thresholds instead of reading config.
- Application path: `/prepare-application` only selects post-viewing states; `dossier.ts`
  reports all six documents missing; scribe hardcodes move-in "1. Juni 2026" and household
  facts in prose.

## 7. History

- `ROBUST_HUNT_PROPOSAL.md` (2026-07-01, only in git: `bf1e45f`) already decided: ImmoScout24
  and Immowelt via saved-search e-mail alerts, enrichment via logged-in Chrome, a
  `/berlin-flats:ingest-alerts` command. Only Phase 1 (telemetry) and Phase 2 (inberlinwohnen)
  shipped. Phases 3–5 were never built.
- PR #34 (closed, doc only): generic mail-source design; IMAP credential storage left open.

## 8. Skipped or degraded

- Live `hunt.ts` run: denied by the permission system for the pipeline probe and not re-run,
  because the script's reader-proxy fallback is the workaround ruled out above.
- ImmoScout24 contact form, all alert timings and caps, degewo/gewobag/Vonovia in Chrome,
  Genossenschaften, portal ToS texts: not probed.
- Headless Chrome and headless Gmail were each exercised once, from a terminal. Neither was
  run from launchd, and Chrome was not tried headless on a protected portal.
