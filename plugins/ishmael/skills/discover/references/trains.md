# Playbook: Trains + "install-app-now" alerts

Rail is where planning-ahead pays off. Two jobs: (1) find real train times, (2) tell the
user which app to install BEFORE the trip.

## Find times
- Italy regional: Trenord (`https://www.trenord.it`) for Milan-area regional (e.g. Como,
  Lake lines). Trenitalia (`https://www.trenitalia.com`) for national/high-speed.
- Germany: DB (`https://www.bahn.de`). France: SNCF Connect. Use WebSearch/WebFetch or
  claude-in-chrome.
- WATCH the Italy trap: Trenitalia route search may stitch slow suburban S-lines
  (e.g. S7) giving 2h+/2-change results when a direct RegioExpress (~1h) exists on
  Trenord. Cross-check both operators; prefer the direct regional.

## Install-app alert (core behavior)
When a trip needs local rail, append to the trip `apps[]`:
  { "name": "Trenord", "why": "buy Milan regional tickets, avoid slow S-lines", "installed": false }
Common: Trenord / Trenitalia (IT), DB Navigator (DE), SNCF Connect (FR).
`ishmael:plan` surfaces uninstalled apps as a pre-trip checklist. Ishmael never installs.

## Safety
Never buy tickets or enter payment/personal data. Provide the link/app; the human buys.
