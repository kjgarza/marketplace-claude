---
name: plan
description: Use to start or refine a trip plan. Creates/updates the trip file, builds a day-by-day itinerary to the traveler's pace and taste, checks the calendar for conflicts, drafts calendar events (created only after an explicit yes), and produces a pre-trip alerts checklist for advance bookings and app installs. Trigger on "plan my trip to <city>", "set up the <trip>", "block my calendar for the trip", "what do I need to book/install".
---

# plan (ishmael:plan)

Orchestrate a trip end to end. Plugin code under `.claude/plugins/ishmael/`; runtime
state (profile + trips) under `.claude/ishmael/`.

## Steps
1. Identify/create the trip file `trips/<slug>.json` (schema: `references/trip-schema.md`).
   Gather city, dates, lodging, flights from the user or an existing plan file.
2. Read `profile.json`. Build/refine `days[]` honoring pace (morning run, midday siesta in
   heat, public-transport default) and interests.
   - **Refine the profile** when the user states a *standing* preference (one that holds
     across trips, not just this trip — e.g. "I always want a gym near the hotel",
     "I don't do museums"). Confirm it's standing, then update the matching key in
     `.claude/ishmael/profile.json` (add to `wants`/`avoid`/`interests` or set a `pace`/
     `gear` flag). Trip-specific wishes go in the trip file, not the profile.
3. Weather pass: invoke `ishmael:weather` for the window; apply its gear + plan-shift
   output to `days[]`.
4. Discovery: invoke `ishmael:discover` for gaps (food, sights, day trips). Merge picks.
5. CALENDAR CONFLICT-CHECK (read-only): per
   `../discover/references/gogcli-calendar.md` run
   `gog calendar events primary --from <start> --to <end> -j` (and `conflicts` for a
   cross-calendar busy view). Surface clashes; treat non-primary (incl. Claudia's) as
   immovable context.
6. CALENDAR CREATE (guarded write): draft events for flights, lodging check-in/out,
   concert/anchor blocks, and booking-deadline reminders. Present ALL as `-n` dry-run
   lines in one list. Get ONE explicit "yes". Then execute the batch WITHOUT `-n`,
   capturing each event id (`-j`) into the trip file. Kristian's `primary` only; never
   `--attendees`; never touch Claudia's calendar.
7. ALERTS PASS: scan `bookings[]` for `needs_advance && !booked` (sorted by `deadline`,
   flag any within ~14 days or past) and `apps[]` where `!installed`. Emit a dated
   checklist: "Book X by <date> — <url>", "Install <app> before travel — <why>".
8. Save the trip file. Summarize: plan + calendar result + checklist.

## Rules
- Never book, pay, submit, install, or invite. Calendar events are the only write, and
  only after explicit confirmation.
- Keep re-runs cheap: reuse `research{}`; don't re-fetch what's fresh.
