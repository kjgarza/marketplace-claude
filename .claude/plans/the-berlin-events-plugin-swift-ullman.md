# Plan: Berlin Events Weather Gating

## Context

The berlin-events plugin (`plugins/berlin-events/`) discovers art and food events in Berlin and returns a curated list. Currently it applies no environmental filter — on a 32°C sunny day it still recommends museum visits, and on a rainy day it recommends open-air markets. This change gates events by weather: fetch an OpenMeteo forecast for the target date range and discard events whose indoor/outdoor character is a mismatch for the conditions.

The user originally referenced [stormy](https://github.com/ashish0kumar/stormy) as a weather source, but stormy outputs ASCII art (not JSON) and has no date-forecast mode — so we go directly to **OpenMeteo** (the same API stormy uses internally), which is free, requires no API key, supports date ranges up to 16 days ahead, and returns clean JSON.

---

## Thresholds (user-confirmed)

| Condition | Action |
|-----------|--------|
| `temp_max > 27 °C` | `gate_indoor = true` — discard indoor events for that date |
| `temp_min < 5 °C` | `gate_outdoor = true` — discard outdoor events for that date |
| WMO rain codes (51–65, 80–82, 95–99) | `gate_outdoor = true` |
| WMO snow codes (71–77, 85–86) | `gate_outdoor = true` |
| 5–27 °C, no precipitation | no filtering |

Note: `gate_indoor` and `gate_outdoor` are independent flags — a 30 °C thunderstorm day sets both.

---

## Indoor / Outdoor Classification

Inferred from the event's `venue` and `name`/`description` fields (case-insensitive keyword match).

**Indoor keywords** — gate when `gate_indoor = true`:
`museum`, `gallery`, `galerie`, `kunsthalle`, `kunsthaus`, `theater`, `theatre`, `kino`, `cinema`, `philharmonie`, `konzerthaus`, `konzertsaal`, `bibliothek`, `library`, `atelier`, `studio`, `club`, `bar`, `restaurant`, `café`, `cafe`, `bistro`, `haus`, `halle`, `akademie`, `institut`

**Outdoor keywords** — gate when `gate_outdoor = true`:
`park`, `garten`, `garden`, `freilicht`, `freiluft`, `markt`, `market`, `platz`, `square`, `straße`, `strasse`, `festival`, `outdoor`, `open-air`, `open air`, `rooftop`, `dachterrasse`, `strand`

**Unknown** (no keyword match in either list): keep the event regardless of weather.

---

## Files to Create / Modify

### 1. NEW: `plugins/berlin-events/scripts/weather-gate.ts`

Bun script. Fetches the daily OpenMeteo forecast for Berlin (lat 52.52, lon 13.41) over a date range and outputs a JSON array of `DailyGate` objects.

**CLI interface:**
```bash
# Single date
bun run scripts/weather-gate.ts --date 2026-06-20

# Date range
bun run scripts/weather-gate.ts --from 2026-06-20 --to 2026-06-27
```

**Output (stdout):**
```json
[
  {
    "date": "2026-06-20",
    "temp_max_c": 29.1,
    "temp_min_c": 18.4,
    "precipitation_mm": 0.0,
    "weathercode": 1,
    "is_rainy": false,
    "is_snowy": false,
    "gate_outdoor": false,
    "gate_indoor": true,
    "reason": "hot (29.1°C > 27°C): indoor events filtered"
  }
]
```

**OpenMeteo endpoint:**
```
https://api.open-meteo.com/v1/forecast
  ?latitude=52.52&longitude=13.41
  &daily=temperature_2m_max,temperature_2m_min,precipitation_sum,weathercode
  &start_date=YYYY-MM-DD&end_date=YYYY-MM-DD
  &timezone=Europe/Berlin
```

Defaults to today if no flags are passed. Exits with status 1 and a message on API error.

---

### 2. MODIFY: `plugins/berlin-events/skills/find-events/SKILL.md`

Insert **Step 7.6: Weather Gate** between the existing Step 7.5 (dedup / taste) and Step 8 (rank & curate).

The step:
1. Runs `weather-gate.ts --from $DATE_FROM --to $DATE_TO` to get daily gate objects
2. For each remaining candidate event, checks the gate for its date
3. Classifies the event as indoor/outdoor using the keyword lists above
4. Discards events that match a gated category
5. Logs a one-line weather note per date in the final output header (e.g. `Weather 20 Jun: 29°C, hot — indoor events filtered`)

No new events are fetched; this step only reduces the candidate set assembled in Steps 3–7.5.

---

### 3. MODIFY: `plugins/berlin-events/.claude-plugin/plugin.json`

Bump `"version"` from `"0.2.1"` to `"0.2.2"`.

### 4. MODIFY: `.claude-plugin/marketplace.json`

Bump the berlin-events entry `"version"` from `"0.2.1"` to `"0.2.2"`.

---

## Key Reuse

- `$BUN` resolution pattern and `$PLUGIN_ROOT` variable — copy from Step 7.5 in the existing `find-events/SKILL.md` (lines 163–168)
- `events-db.ts` is unmodified — weather gating happens before ranking, same pipeline position as the existing dedup step

---

## Verification

1. **Unit-test the script:**
   ```bash
   bun run plugins/berlin-events/scripts/weather-gate.ts --date 2026-06-16
   # Expect: JSON array with one entry for today, Berlin forecast
   ```

2. **Boundary checks:**
   - Mock a date with `temp_max > 27`: confirm `gate_indoor: true`, `gate_outdoor: false`
   - Mock a date with rain code 61: confirm `gate_outdoor: true`, `gate_indoor: false`
   - Mock a date with 18°C dry: confirm both flags `false`

3. **End-to-end:** Run the `find-events` skill for "this weekend" and confirm:
   - Weather note appears in the output header
   - Events on hot days exclude museum/gallery suggestions
   - Events on rainy days exclude outdoor markets/parks
   - Mild-day runs show the full unfiltered set
