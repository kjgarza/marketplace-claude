# Adding Events to Google Calendar

## Google Calendar Link Format

Use compact ISO 8601 dates (`YYYYMMDDTHHmmssZ`):

```
https://calendar.google.com/calendar/render?action=TEMPLATE&text=[title]&dates=20260325T190000Z/20260325T210000Z&location=[venue]&details=[description+link]
```

## gogcli Command

With gogcli (RFC3339 times), the user can add directly from the terminal:

```bash
gog calendar create primary --summary "[title]" --from "2026-03-25T19:00:00+01:00" --to "2026-03-25T21:00:00+01:00" --location "[venue]"
```

## gogcli Setup (first time only)

Install:
```bash
brew install openclaw/tap/gogcli
```

Authenticate:
```bash
gog auth add you@gmail.com --services calendar
```
