# Playbook: Google Maps via `gog` (Places only)

`gog maps` exposes the **Places API only** — search + details. There is **no directions /
commute endpoint**. For commute/transit times use WebSearch or claude-in-chrome, not gog.

## Find a spot (ratings, address, place_id)
    gog maps places search "<query>" -j
e.g. `gog maps places search "natural wine bar Navigli Milan" -j`
Extract: name, rating, user_ratings_total, formatted_address, place_id.

## Details for a known place
    gog maps places details "<place_id>" -j
Extract: opening_hours, website, rating, reviews summary, price_level.

## Use in discovery
- Rank candidates by rating × review count, filtered to the profile's taste
  (fresh ingredients, complex flavours; avoid tourist traps → deprioritize very high
  review counts in the tourist core if the user wants local).
- Write chosen spots into the trip file's `research{}` with the place_id so later
  lookups are free.

## Commute (fallback, since gog has no directions)
- Prefer WebSearch "how to get from <A> to <B> Milan public transport" or the
  claude-in-chrome Google Maps directions page. Record the result in `research{}`.
