# Definition of Done — berlin-flats Plugin

## Goal

The `/hunt` command (`bun scripts/hunt.ts`) must return at least **1 real Berlin apartment listing** matching all qualifying criteria.

## Qualifying Criteria

A listing PASSES the DOD if it meets ALL of the following:

| Field | Requirement |
|-------|-------------|
| `portal` | Any enabled portal (kleinanzeigen, immoscout24) |
| `verdict` | `pending` (not `block`, `filtered`, or `rejected`) |
| `district` | Contains one of: Mitte, Prenzlauer Berg, Friedrichshain, Kreuzberg, Neukölln, Charlottenburg, Schöneberg, Wilmersdorf, Pankow, or "Berlin" (city-wide fallback) |
| `warm_rent` | ≤ 2000 € (if present), OR `cold_rent` ≤ 1600 € (proxy when warm rent missing) |
| `rooms` | ≥ 2 (if present), OR title/description mentions "2-Zimmer", "3-Zimmer", "2 Zimmer", etc. |
| Real listing | URL matches `kleinanzeigen.de/s-anzeige/` or `immobilienscout24.de/expose/` |

## DOD Pass Condition

```
qualifying_count = count of listings in state.db WHERE verdict='pending'
                   AND (district LIKE '%Mitte%' OR district LIKE '%Berlin%' OR ...)
                   AND (cold_rent <= 1600 OR warm_rent <= 2000)
                   AND url LIKE '%s-anzeige%' OR url LIKE '%expose%'

PASS if qualifying_count >= 1
FAIL if qualifying_count == 0
```

## Measurement Command

```bash
cd plugins/berlin-flats
bun scripts/queue.ts pending
```

## Baseline

- **Date established:** 2026-04-26
- **First run result:** 13 listings queued, including Mitte and Prenzlauer Berg listings
- **Status:** PASS ✅

## Iteration History

| Run | Date | Qualifying | Status | Notes |
|-----|------|------------|--------|-------|
| 1 | 2026-04-26 | 13 | PASS ✅ | First successful run after fixing Kleinanzeigen URL |
