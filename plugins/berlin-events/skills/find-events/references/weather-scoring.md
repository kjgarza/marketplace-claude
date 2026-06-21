# Weather Scoring Reference

## Script Output Shape

One object per day (representative fields; script also emits `precipitation_mm`, `weathercode`, `is_snowy`):

```json
{
  "date": "2026-06-24",
  "temp_max_c": 34,
  "temp_min_c": 20,
  "is_rainy": false,
  "mode": "score",
  "scores": { "outdoor_delta": -2.0, "indoor_delta": 1.0 },
  "drop_outdoor": false,
  "drop_indoor": false,
  "suggest_lake": true,
  "note": "hot day (34°C) — favour indoor/AC venues; very hot — consider a lake / Strandbad as an alternative"
}
```

## Scoring Algorithm (score mode — default)

1. Match each event to its day's weather object by `date`.
2. Classify each event as **indoor**, **outdoor**, or **unknown** using keyword search on `venue`,
   `name`, and `description` fields (case-insensitive):
   - **Indoor keywords**: `museum`, `gallery`, `galerie`, `kunsthalle`, `kunsthaus`, `theater`,
     `theatre`, `kino`, `cinema`, `philharmonie`, `konzerthaus`, `konzertsaal`, `bibliothek`,
     `library`, `atelier`, `studio`, `club`, `bar`, `restaurant`, `café`, `cafe`, `bistro`,
     `haus`, `halle`, `akademie`, `institut`
   - **Outdoor keywords**: `park`, `garten`, `garden`, `freilicht`, `freiluft`, `markt`, `market`,
     `platz`, `square`, `straße`, `strasse`, `festival`, `outdoor`, `open-air`, `open air`,
     `rooftop`, `dachterrasse`, `strand`
   - **Unknown** (no keyword match): neutral — no delta applied
   - **Dual match** (both lists): treat as Unknown
3. Apply score deltas per event:
   - Outdoor event: add `scores.outdoor_delta` to its ranking score
   - Indoor event: add `scores.indoor_delta` to its ranking score
   - If `drop_outdoor === true`: remove outdoor events for that date entirely (hard drop —
     precipitation makes outdoor incompatible)
   - `drop_indoor` is always `false` in score mode — indoor events are never hard-dropped
4. If `suggest_lake === true` for any date, append one entry at the top of that day's results:
   > 🏊 **Hot day suggestion**: Check out Berlin's Strandbäder / lakes (Wannsee, Müggelsee,
   > Weißensee) — great alternative to crowded indoor venues.
5. If no weather object exists for an event's date (beyond the 16-day OpenMeteo window): keep the
   event, apply no delta.

## Legacy Filter Mode

When `mode: "filter"` appears in user settings: `drop_outdoor` and `drop_indoor` are set directly;
apply as hard drops, ignore score deltas.

## Weather Note Header Format

Include one line per date using the `note` field from the script output. If `suggest_lake === true`,
append " + 🏊 lake/Strandbad suggestion added" after the note:

```
Weather 20 Jun: 34°C max — hot day (34°C) — favour indoor/AC venues; evening outdoor still good; very hot — consider a lake / Strandbad as an alternative + 🏊 lake/Strandbad suggestion added
Weather 21 Jun: 14°C max — rain expected — outdoor events hard-dropped
Weather 22 Jun: 18°C max — mild and dry (18°C) — all events shown
```
