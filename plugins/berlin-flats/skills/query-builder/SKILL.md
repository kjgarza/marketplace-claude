---
name: Query Builder — Portal URL Grammar
description: This skill should be used when constructing or debugging search URLs for Berlin rental portals. Documents the URL grammar for each supported portal so malformed queries don't silently return garbage.
---

## Kleinanzeigen

**Base:** `https://www.kleinanzeigen.de/s-wohnung-mieten/berlin/`

**Format:** `{category}{location}{filters}/k0?{sort}`

**Filters** (path segments, `+`-joined, no spaces):
| Filter | Format | Example |
|--------|--------|---------|
| Category | `c203` | `c203` (Wohnung mieten) |
| Location | `l{city_id}` | `l3331` (Berlin) |
| Radius | `r{km}` | `r15` |
| Offer type | `anzeige:angebote` | exclude Gesuche |
| Max price | `preis::{max}` | `preis::2000` |
| Rooms | `zimmer:{min}:{max}` | `zimmer:2:4` |
| sqm | `wohnflaeche:{min}:{max}` | `wohnflaeche:55:` |

**Sort:** `sortingField=SORTING_DATE&sortingOrder=DESCENDING`

**Full example** (Mitte, ≤€2000, 2–4 rooms, ≥55sqm):
```
https://www.kleinanzeigen.de/s-wohnung-mieten/berlin/c203l3331r15+anzeige:angebote+preis::2000+zimmer:2:4+wohnflaeche:55:/k0?sortingField=SORTING_DATE&sortingOrder=DESCENDING
```

**Quirks:**
- Empty range side is fine: `preis::2000` = no minimum
- Location ID `3331` = all Berlin. No district-level IDs that work reliably — filter by district client-side after fetching
- Pagination: `&pageNum=2` appended to query string

---

## ImmoScout24

**Base:** `https://www.immobilienscout24.de/Suche/de/wohnung-mieten`

**Key params:**
| Param | Format | Example |
|-------|--------|---------|
| Geocode | `geocodes={id}` | `geocodes=1276003001011` (Mitte) |
| Max cold rent | `price=-{max}` | `price=-1300` (note dash prefix) |
| Min rooms | `numberofrooms={min}.0-` | `numberofrooms=2.0-` (note trailing dash) |
| Min sqm | `livingspace={min}.0-` | `livingspace=55.0-` |
| Sort | `sorting=2` | newest first |
| Price type | `pricetype=rentpermonth` | |
| Type | `realestatetype=apartment` | |

**Geocodes for Berlin districts:**
| District | Geocode |
|----------|---------|
| Mitte | `1276003001011` |
| Prenzlauer Berg | `1276003001023` |
| Friedrichshain | `1276003001008` |
| Kreuzberg | `1276003001012` |
| Neukölln | `1276003001018` |
| All Berlin | `1276003001` |

**Full example** (Mitte, ≤€1300 cold, ≥2 rooms, ≥55sqm):
```
https://www.immobilienscout24.de/Suche/de/wohnung-mieten?geocodes=1276003001011&price=-1300&numberofrooms=2.0-&livingspace=55.0-&sorting=2&pricetype=rentpermonth&realestatetype=apartment
```

**Feature filters** (append as extra params):
- Altbau: `constructionyear=-1949`
- Balkon: `features=BALCONY`
- EBK: `features=BUILT_IN_KITCHEN`
- Aufzug: `features=LIFT`

---

## Common Mistakes

1. **ImmoScout price format**: use `-1300` not `1300` — the dash is required for max-price semantics
2. **ImmoScout rooms format**: `2.0-` not `2` — the decimal and trailing dash are both required
3. **Kleinanzeigen location**: use `l3331` (Berlin city), not postal codes — district filtering is client-side
4. **Kleinanzeigen category**: `c203` must be present or you get all categories
5. **Pagination**: always start at page 1 / k0. Don't jump to later pages without processing earlier ones first.
