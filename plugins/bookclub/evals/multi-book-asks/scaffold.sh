#!/usr/bin/env bash
set -euo pipefail
mkdir -p the_glass_orchard
cat > the_glass_orchard/book-profile.json <<'JSON'
{
  "title": "The Glass Orchard",
  "author": "Mira Tallis",
  "page_count": 317,
  "links": {
    "amazon_de": "https://www.amazon.de/dp/EVALASENTINEL"
  },
  "factoids": [
    "The first draft was written in a lighthouse keeper's logbook."
  ],
  "reading_dates": {
    "announcement_date": "2026-11-02",
    "reading_date": "2026-11-23",
    "discussion_date": "2026-11-30"
  }
}
JSON
mkdir -p salt_and_static
cat > salt_and_static/book-profile.json <<'JSON'
{
  "title": "Salt and Static",
  "author": "Ana Reyes",
  "page_count": 204,
  "links": {
    "amazon_de": "https://www.amazon.de/dp/EVALBSENTINEL"
  },
  "factoids": [
    "The first draft was written in a lighthouse keeper's logbook."
  ],
  "reading_dates": {
    "announcement_date": "2026-11-02",
    "reading_date": "2026-11-23",
    "discussion_date": "2026-11-30"
  }
}
JSON
