---
name: init
description: Initialize berlin-events user settings by creating .claude/berlin-events.local.md from provided arguments
argument-hint: "[neighborhood=<name>] [interests=art|food|art,food] [calendar_id=<id>] [lookahead_days=<n>]"
allowed-tools: Read, Write, Edit, Bash(mkdir:*), Bash(cat:*)
---

# Initialize Berlin Events Settings

Create `.claude/berlin-events.local.md` in the current project root using user-provided arguments and safe defaults.

## Steps

1. Parse `$ARGUMENTS` as optional `key=value` pairs:
   - `neighborhood`
   - `interests`
   - `calendar_id`
   - `lookahead_days`

2. If `neighborhood` or `interests` is missing, ask the user for the missing values.

3. Apply defaults for any remaining unset values:
   - `neighborhood: Mitte`
   - `interests: art, food`
   - `calendar_id: primary`
   - `lookahead_days: 14`

4. Ensure the `.claude/` directory exists in the workspace root.

5. Write `.claude/berlin-events.local.md` with YAML frontmatter:

```yaml
---
neighborhood: <resolved neighborhood>
interests: <resolved interests>
calendar_id: <resolved calendar_id>
lookahead_days: <resolved lookahead_days>
weather:
  mode: score                  # score (soft weighting) | filter (legacy hard gate)
  warm_from_c: 20              # dry days at/above this favour outdoor (Berlin spring/summer)
  evening_start: "18:00"       # outdoor events at/after this get the strongest warm-weather boost
  hot_from_c: 30               # at/above this, redirect: penalise daytime outdoor, favour indoor
  cold_outdoor_below_c: 8      # below this, penalise outdoor events
  rain_penalises_outdoor: true
  suggest_water_from_c: 30     # surface lake / Strandbad suggestions on very hot dry days
  weights:
    outdoor_warm_bonus: 2.0
    outdoor_evening_bonus: 1.5
    outdoor_daytime_heat_penalty: -2.0
    indoor_heat_bonus: 1.0
    outdoor_rain_penalty: -3.0
    outdoor_cold_penalty: -2.0
---
```

6. Confirm the file path and echo the resolved values.

