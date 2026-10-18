# Playbook: Google Calendar via `gog`

Calendar is the ONLY write Ishmael performs. Kristian's `primary` calendar only.
Never pass `--attendees`. Claudia's calendar = read-only awareness (never create/edit).

## List calendars (find IDs)
    gog calendar calendars -j

## Read existing events across the trip window (conflict-check)
    gog calendar events primary --from <start-RFC3339> --to <end-RFC3339> -j
For a cross-calendar busy view (includes Claudia's shared calendars if subscribed):
    gog calendar conflicts --from <start> --to <end> -j     # busy-overlap report (read-only)
Surface clashes to the user; treat non-primary calendars as immovable context only.

## Create an event — ALWAYS dry-run first
    gog calendar create primary --summary "<title>" \
      --from "2026-07-18T20:00:00" --to "2026-07-18T23:30:00" \
      --start-timezone "Europe/Rome" --end-timezone "Europe/Rome" \
      --location "<place>" --description "<note>" -n
- `-n/--dry-run` prints the intended event WITHOUT creating it. Show that to the user.
- Only after an explicit "yes", re-run the SAME command WITHOUT `-n` (add `-j` to
  capture the created event id from JSON).
- All-day (e.g. lodging span): add `--all-day` and use date-only `--from/--to`.
- Store the returned event id into the trip file (`days[].blocks[].cal_event_id` or a
  `bookings[].cal_event_id`).

## Update a moved block
    gog calendar update primary <eventId> --from <new> --to <new> -n   # dry-run
Then re-run without `-n` after confirmation.

## Batch rule
When creating several events (flights, check-in/out, concert, anchors, deadlines),
present ALL dry-run lines as one list, get ONE explicit "yes", then execute the batch.
Never create silently.
