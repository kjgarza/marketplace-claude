---
name: discover
description: Use when the user wants things to do / where to eat / day-trip ideas / lodging options for a trip. Finds candidates that fit the taste profile (fresh ingredients, complex flavours, art/music), flags advance-booking and pre-trip apps, and saves finds into the trip's research memory so it isn't re-researched. Trigger on "what should we do in <city>", "find a restaurant/bar", "day trip ideas", "where to stay".
---

# discover (ishmael:discover)

Find things worth doing for the active trip, cheaply and to taste.

## Steps
1. Load `.claude/ishmael/profile.json` and the active `trips/<slug>.json`.
2. Check `research{}` FIRST. If a fresh (≤ ~5 days old) entry answers the ask, reuse it —
   do not re-research. Only go external if missing, stale, or the user asks for fresh.
3. For a new ask, dispatch the `ishmael:travel-scout` agent with the scoped query,
   the profile, and the applicable playbooks (see `references/`).
4. Merge the scout's JSON:
   - write candidates under `research{"<topic>": { researched_at, findings }}`
   - append `needs_advance` items to `bookings[]`
   - append rail/city apps to `apps[]` (dedupe by name)
5. Present a terse shortlist with why-it-fits. Offer to add picks to the trip `days[]`.

## Rules
- Respect the profile: prefer local, high-quality, complex flavours; avoid tourist traps.
- Never book/pay/login. Advance-booking and app items are for the human to action.
