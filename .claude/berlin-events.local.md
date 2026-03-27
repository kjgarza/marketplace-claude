# Settings Template

Copy this file to `.claude/berlin-events.local.md` in your project or home directory and customize:

```markdown
---
neighborhood: Schonenberg
interests: art, food
calendar_id: primary
lookahead_days: 14
---

## Notes
Any additional preferences or notes for event discovery.
- Prefer free events
- Interested in photography exhibitions
- Like Asian food events
```

## Fields

| Field | Default | Description |
|-------|---------|-------------|
| neighborhood | Mitte | Your Berlin neighborhood for travel time estimates |
| interests | art, food | Comma-separated event categories |
| calendar_id | primary | Google Calendar ID to check for conflicts |
| lookahead_days | 14 | How many days ahead to search |
