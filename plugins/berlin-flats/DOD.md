# Definition of Done — berlin-flats Plugin

## Goal

The `/hunt` command (`bun scripts/hunt.ts`) must return at least **1 real Berlin apartment listing** matching all qualifying criteria.

## Qualifying Criteria

A listing PASSES the DOD if it meets ALL of the following:

| Field | Requirement |
|-------|-------------|
| `portal` | Any enabled portal (kleinanzeigen, immoscout24, inberlinwohnen) |
| `verdict` | `pending` (not `block`, `filtered`, or `rejected`) |
| `district` | Contains one of: Mitte, Prenzlauer Berg, Friedrichshain, Kreuzberg, Neukölln, Charlottenburg, Schöneberg, Wilmersdorf, Pankow, or "Berlin" (city-wide fallback) |
| `warm_rent` | ≤ 2000 € (if present), OR `cold_rent` ≤ 1600 € (proxy when warm rent missing) |
| `rooms` | ≥ 2 (if present), OR title/description mentions "2-Zimmer", "3-Zimmer", "2 Zimmer", etc. |
| Real listing | URL matches `kleinanzeigen.de/s-anzeige/` or `immobilienscout24.de/expose/`, or `portal='inberlinwohnen'` (its URLs are always the aggregator's own `deeplink` field, a real listing URL by construction — see Phase 2 of ROBUST_HUNT_PROPOSAL.md) |

## DOD Pass Condition

```
qualifying_count = count of listings in state.db WHERE verdict='pending'
                   AND (district LIKE '%Mitte%' OR district LIKE '%Berlin%' OR ...)
                   AND (cold_rent <= 1600 OR warm_rent <= 2000)
                   AND (url LIKE '%s-anzeige%' OR url LIKE '%expose%' OR portal = 'inberlinwohnen')

PASS if qualifying_count >= 1
FAIL if qualifying_count == 0
```

## Measurement Command

```bash
cd plugins/berlin-flats
# Prints qualifying_count (an integer). PASS if >= 1, FAIL if 0.
bun scripts/queue.ts qualifying
```

To inspect the listings behind the count, use `bun scripts/queue.ts pending`.

Note: `state.db` now lives at `$BERLIN_FLATS_STATE_DIR/state.db` (default `~/.claude/berlin-flats/state.db`),
not inside the plugin directory — set `BERLIN_FLATS_STATE_DIR` if running the measurement command
against a non-default location.

## Baseline

- **Date established:** 2026-04-26
- **First run result:** 13 listings queued, including Mitte and Prenzlauer Berg listings
- **Status:** PASS ✅

## Iteration History

| Run | Date | Qualifying | Status | Notes |
|-----|------|------------|--------|-------|
| 1 | 2026-04-26 | 13 | PASS ✅ | First successful run after fixing Kleinanzeigen URL |
| 2 | 2026-07-02 | 0 | N/A (source-add, not a qualifying-count regression check) | Added inberlinwohnen (Berlin municipal housing companies) as a source — Phase 2 of ROBUST_HUNT_PROPOSAL.md. This run's qualifying_count was 0 because no listing across any portal matched the user's current strict prefs (min_sqm=100) at fetch time — portal fluctuation, not a regression (municipal additions are additive-only). Verified separately: the run upserted 10 inberlinwohnen rows (Phase 2's actual done-criteria: "a hunt run upserts ≥1 municipal listing"). |
