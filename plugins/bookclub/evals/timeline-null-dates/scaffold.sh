#!/usr/bin/env bash
set -euo pipefail
cat > book-profile.json <<'JSON'
{
  "title": "The Glass Orchard",
  "author": "Mira Tallis",
  "page_count": 317,
  "links": {
    "amazon_de": "https://www.amazon.de/dp/EVAL317SENTINEL"
  },
  "factoids": [
    "The first draft was written in a lighthouse keeper's logbook."
  ],
  "reading_dates": {
    "announcement_date": null,
    "reading_date": null,
    "discussion_date": null
  }
}
JSON
