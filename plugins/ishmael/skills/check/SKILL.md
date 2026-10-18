---
name: check
description: Use on the day (or day before) to re-check a trip and adjust — re-pulls the weather, re-reads the plan and its research memory, surfaces what changed, and proposes minimal edits, syncing any moved blocks to the calendar. Cheap because it reuses stored research instead of re-researching. Trigger on "check my trip", "re-plan today", "did anything change", "adjust today's plan".
---

# check (ishmael:check)

Fast, cheap re-plan for the active trip. Reuse memory; don't re-research.

## Steps
1. Load the active `trips/<slug>.json` and `profile.json`.
2. Re-run `ishmael:weather` for today/remaining days. Compare to what the plan assumed.
3. Diff sources of change:
   - weather shift (rain now likely / hotter) → propose moving affected `days[].blocks`.
   - `bookings[]` deadlines newly inside the window / still unbooked → re-surface.
   - `apps[]` still uninstalled with travel imminent → re-surface.
   - Read `research{}` for the relevant topic INSTEAD of re-searching. Only go external if
     the user explicitly wants fresh data.
4. For any block the user agrees to move that already has a `cal_event_id`, update the
   event via `gog calendar update primary <eventId> ... -n` (dry-run), then execute after
   an explicit yes. Append every change to `changes_log`.
5. Output: a terse "what changed / what I moved / what still needs you" summary.

## Rules
- Minimal edits only — don't rebuild the plan. Never book/pay/install. Calendar update is
  the only write, guarded by confirmation.
