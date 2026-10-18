---
name: weather
description: Use when planning or adjusting a trip's days around weather — fetches the forecast for the trip city/dates and produces per-day outfit/gear advice (umbrella, fan, cap+sunglasses, layers) plus suggestions to move outdoor blocks off rainy or peak-heat slots. Trigger on "check the weather for the trip", "what should I pack/wear", or during ishmael:plan/ishmael:check.
---

# weather (ishmael:weather)

Adapt a trip to the forecast. Read `.claude/ishmael/profile.json` for gear prefs
(heat_averse → fan matters; cap_and_sunglasses_default; umbrella_when_rain).

## Steps

1. Resolve the active trip file `.claude/ishmael/trips/<slug>.json` (ask if ambiguous).
   Read `city` and `dates`.
2. Run the forecast (script lives in the plugin; data lives in the project):
   `bun run "${CLAUDE_PLUGIN_ROOT:-.claude/plugins/ishmael}/scripts/forecast.ts" "<city>" <start> <end>`
   (dates capped to open-meteo's 16-day horizon; if the trip is further out, say so and
   give seasonal-normal guidance instead of a false forecast.)
3. For each day, translate `gear` flags into a one-line brief, e.g.:
   - `fan:true` → "Pack the handheld fan — 34°C peak."
   - `umbrella:true` → "Umbrella: 70% rain."
   - `cap_sunglasses:true` → "Cap + sunglasses."
   - `layers:true` → "Cool morning (9°C) — light layer for the AM run."
4. Plan-shift: cross-reference the trip `days[].blocks`. If an outdoor/walking block sits
   in a rainy or ≥30°C peak-afternoon slot, propose moving it to morning/evening. Present
   proposals; on user agreement, edit the trip file and append to `changes_log`
   (`{ "at": "<today>", "what": "..." }`).
5. Never fabricate numbers — if the forecast call fails, say so and fall back to
   WebSearch for the city's seasonal normals, clearly labeled as normals not forecast.

## Output
A compact day-by-day gear list + any plan-shift proposals. Terse.
