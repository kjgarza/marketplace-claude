---
name: hunt
description: Search Berlin rental portals for flats matching your criteria. Runs the hunt loop across configured portals and shows new matching listings. Use when you want to search for flats now.
argument-hint: "[--portals=kleinanzeigen]"
allowed-tools: Bash, Read
---

Run the berlin-flats hunt script to search for flats matching config/config.toml criteria.

First, check that dependencies are installed:

```bash
cd $CLAUDE_PLUGIN_ROOT && ls node_modules 2>/dev/null || npm install
```

Then run the hunt:

```bash
cd $CLAUDE_PLUGIN_ROOT && node scripts/hunt.js 2>&1
```

After the hunt completes, present results in a table:

| # | Title | District | Cold Rent | Rooms | sqm | Scam Score | URL |
|---|-------|----------|-----------|-------|-----|------------|-----|

If no results were found:
1. Check if the scraper returned HTML by running: `node -e "import('./scripts/scrape.js').then(async ({scrapeUrl}) => { const r = await scrapeUrl('https://www.kleinanzeigen.de/s-wohnung-mieten/berlin/c203l3331r15+anzeige:angebote+preis::2000+zimmer:2:4/k0'); console.log('tier:', r.tier, 'len:', r.html.length, 'snippet:', r.html.slice(0,300)); })" 2>&1`
2. Report the tier used and HTML length
3. Suggest running /triage if listings are pending in the queue

Run /triage after hunt to review and act on listings.
