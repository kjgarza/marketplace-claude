# Trip file schema — `.claude/ishmael/trips/<slug>.json`

    {
      "slug": "milan-2026-07",
      "city": "Milan",
      "country": "IT",
      "dates": { "start": "2026-07-17", "end": "2026-07-20" },
      "lodging": { "name": "", "address": "", "checkin": "", "checkout": "" },
      "flights": [ { "code": "", "from": "", "to": "", "dep": "", "arr": "" } ],
      "days": [
        { "date": "2026-07-17",
          "blocks": [ { "time": "afternoon", "place": "", "note": "", "cal_event_id": null } ] }
      ],
      "bookings": [
        { "item": "", "needs_advance": true, "deadline": "", "url": "", "booked": false,
          "cal_event_id": null }
      ],
      "apps": [ { "name": "", "why": "", "installed": false } ],
      "research": { "<topic>": { "researched_at": "", "findings": "" } },
      "changes_log": [ { "at": "", "what": "" } ]
    }

Rules: `slug` = kebab `<city>-<yyyy>-<mm>`. Dates ISO `YYYY-MM-DD`. Times in `days` are
coarse labels (morning/afternoon/evening) or `HH:MM`. `cal_event_id` filled only after a
real calendar create.
