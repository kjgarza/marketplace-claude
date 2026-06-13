---
name: hunt
description: Search Berlin rental portals for flats matching your criteria. Runs the hunt loop across configured portals and shows new matching listings. Use when you want to search for flats now.
argument-hint: "[--portals=kleinanzeigen]"
allowed-tools: Bash, Read
---

Run the berlin-flats hunt script to search for flats matching config/config.toml criteria.
If you have not configured `config/config.toml` yet, run `/berlin-flats:init` first.

First, check that dependencies are installed:

```bash
cd $CLAUDE_PLUGIN_ROOT && ls node_modules 2>/dev/null || npm install
```

Then run the hunt:

```bash
cd $CLAUDE_PLUGIN_ROOT && bun scripts/hunt.ts 2>&1
```

After the hunt completes, present results in a table:

| # | Title | District | Cold Rent | Rooms | sqm | Scam Score | URL |
|---|-------|----------|-----------|-------|-----|------------|-----|

If no results were found:
1. Check if the scraper returned HTML with a focused `bun test` case or a temporary Bun smoke script that imports `./scripts/scrape.ts`.
2. Report the tier used and HTML length
3. Suggest running /triage if listings are pending in the queue

Run /triage after hunt to review and act on listings.
