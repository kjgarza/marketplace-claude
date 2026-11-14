# berlin-flats

A Claude Code plugin for hunting a Berlin rental flat. It collects listings from rental portals,
filters out scams and mismatches, ranks what is left by how well it fits you, tracks each flat
through the application pipeline, and drafts the German messages and document checklist you
need to apply.

Version 0.5.0. This README describes the plugin **as it is today**, including what does not
work. Where it is heading is in [PRFAQ.md](PRFAQ.md). The evidence behind the "status" notes is
in [docs/2026-11-14-probe-evidence.md](docs/2026-11-14-probe-evidence.md).

## Status at a glance (2026-11-14)

| Part | State |
|---|---|
| Scoring, ranking, pipeline tracking, dossier check | Works and is unit-tested (80 tests) |
| Kleinanzeigen fetching | Returns listings, but size and rooms are never extracted and the same ad would be re-notified every run |
| ImmoScout24 fetching | Has never returned a listing (0 cards in 5 of 5 recorded runs) |
| inberlinwohnen (municipal housing) fetching | Enabled, but has never recorded a run; the site now refuses scripted requests |
| Scheduled background hunting | Not installed on this machine. Last recorded hunt: 2026-08-17 |
| Telegram notifications | Script works; nothing currently triggers it |
| Applying | Drafts text only. Nothing is ever sent for you |

In short: the back half (judge, rank, track, draft) is sound; the front half (get fresh listings
reliably and tell you quickly) is not yet working.

## How it works

```
portals ──fetch──▶ parse ──▶ scam score ──▶ preference filter ──▶ state.db
                                                                     │
        /triage ◀── fit-score ranking ◀──────────────────────────────┤
           │                                                         │
           ├─ accept / reject / contact ──▶ scribe drafts a message  │
           └─ /assess, /prepare-application, /follow-up ◀────────────┘
```

1. **Fetch.** `scripts/hunt.ts` builds a search URL per portal, downloads page 1, and downloads
   the detail page of up to 20 new listings.
2. **Parse.** `scripts/parse-listing.ts` turns HTML into a `Listing` (rent, rooms, size,
   district, description).
3. **Scam score.** `scripts/scam-score.ts` applies rule-based checks (deposit before viewing,
   landlord abroad, WhatsApp-only, implausibly cheap). High scores are blocked; a middle band
   goes to the `scam-judge` agent for a second opinion.
4. **Preference filter.** Listings that break your criteria in `config/config.toml` are marked
   `filtered`.
5. **Store.** Everything lands in SQLite at `~/.claude/berlin-flats/state.db` (override with
   `BERLIN_FLATS_STATE_DIR`), along with per-run telemetry.
6. **Rank.** `scripts/fit-score.ts` scores each surviving listing from 0 to 100 on size, value
   against the Mietspiegel, rent headroom, running costs and freshness, with an explanation per
   factor.
7. **Act.** You review, set a verdict, and move the flat through
   `pending → accepted → contacted → viewing → applied → offer` (or `rejected` / `dead`).

## Commands

| Command | What it does | Uses an LLM? |
|---|---|---|
| `/berlin-flats:init` | Writes your search preferences into `config/config.toml` | Yes |
| `/berlin-flats:hunt` | Runs one hunt across the enabled portals and shows new matches | No (pure Bun) |
| `/berlin-flats:watch` | Explains continuous monitoring and runs one ad-hoc hunt | No |
| `/berlin-flats:triage` | Walks you through pending listings: accept, reject, snooze or contact | Yes (`scam-judge`) |
| `/berlin-flats:assess <id or url>` | Full report on one flat: fit, scam, Mietspiegel delta, qualitative checks | Yes |
| `/berlin-flats:prepare-application <id>` | Checks your documents are present and fresh, drafts a cover letter | Yes (`scribe`) |
| `/berlin-flats:follow-up` | Reviews contacted/viewing/applied flats and drafts nudges for stale ones | Yes (`scribe`) |

## Agents

| Agent | Model | Role |
|---|---|---|
| `scam-judge` | haiku | Decides ok / review / block when the rule score is inconclusive |
| `scribe` | sonnet | Drafts German inquiry, cover-letter and follow-up messages |
| `scout-recon` | sonnet | Profiles a portal (URL grammar, selectors, bot protection) into `portals/<name>.yaml` |

## Skills

Background knowledge the commands and agents load on demand: `berlin-context` (rental law and
market), `scam-patterns`, `flat-assessment`, `application-dossier`, `message-tone`,
`query-builder`, `portal-profile-schema`, `recon-checklist`.

## Configuration

`config/config.toml` holds four things:

- `[profile]`: name, move-in window, contract type, Schufa and WBS status, employer.
- `[search]`: districts, rooms, minimum size, rent caps, required keywords, deal-breakers.
- `[portals]`: which portals are enabled.
- `[scam_detection]`, `[contact]`, `[notifications]`: thresholds, message language and tone.

Two things to know before relying on it:

- **It is stale.** It currently asks for Schöneberg only, at least 100 m², "Altbau" required,
  moving in June to September 2026. That combination matched 2 of 120 fetched listings, and
  neither was a real candidate.
- **Some keys do nothing.** No script reads `move_in_earliest`, `move_in_latest`,
  `max_concurrent`, `cache_ttl_listing_s`, `auto_send`, `notifications.desktop` or
  `threshold_block`.

Application documents (Schufa, payslips, ID, Mieterselbstauskunft, employer letter,
Mietschuldenfreiheit) are declared in a `[documents]` block that is currently commented out, so
the dossier check reports all six as missing.

## Running it

```bash
cd plugins/berlin-flats
bun install
bun test                         # 80 tests, offline
bun scripts/hunt.ts --json       # one hunt; writes to the state DB
bun scripts/queue.ts pending     # what is waiting for you
bun scripts/queue.ts rank        # the same, ordered by fit score
bun scripts/queue.ts pipeline    # flats you have contacted or applied to
bun scripts/dossier.ts           # are your application documents ready?
```

To experiment without touching your real data, set `BERLIN_FLATS_STATE_DIR` to a scratch
directory first.

The scheduled job lives outside the plugin, in `automation/jobs/berlin-flats-hunt.sh` at the
repo root. It runs a hunt and sends new matches to Telegram. It is not installed, and its
install script and plugin path lookup both need fixing before it can run.

## Known problems

Ordered by how much they hurt.

1. **Three of four big portals refuse scripted requests.** ImmoScout24, Immowelt and
   inberlinwohnen block a plain HTTP client. The scraper gets partway round this by pretending to
   be Chrome and falling back to a third-party reader proxy, which is a workaround this project
   has decided not to use.
2. **Duplicate notifications.** Kleinanzeigen ads get two different IDs (search card versus
   detail page), so "already seen" never matches.
3. **Your verdicts can be overwritten.** Re-fetching a listing resets it to pending.
4. **Blocked pages look like perfect matches.** A CAPTCHA page parses to empty fields, and empty
   fields pass every filter.
5. **Noise.** About 82% of fetched Kleinanzeigen results are swap ads, furnished or temporary
   lets, or wanted-ads. Nothing filters these as categories.
6. **Size and rooms are missing on Kleinanzeigen**, so `min_sqm` does nothing there and fit
   scores bunch together.
7. **Failures are silent.** A dead portal, a crashed run or a failed Telegram send produces no
   alert, and nothing records what you were notified about.
8. **No speed measurement.** The plugin does not record when a listing was published, first
   seen, or notified.
9. **Applying is designed for after a viewing.** `/prepare-application` cannot pick a fresh
   listing, and message drafts hard-code a June 2026 move-in.

## What it will not do

- Send a message, submit a form or upload a document on your behalf. Drafts are text for you to
  send.
- Create accounts or sign up for alerts.
- Solve CAPTCHAs.

## Layout

```
.claude-plugin/plugin.json   manifest
commands/                    slash commands
agents/                      scam-judge, scribe, scout-recon
skills/                      background knowledge
scripts/                     Bun/TypeScript pipeline and tests
portals/                     per-portal profiles (URL grammar, selectors, baselines)
recon/                       raw notes from portal profiling
config/config.toml           your preferences
docs/                        probe evidence and design notes
DOD.md                       definition of done (outdated; see PRFAQ)
PLAN.md, TS_BUN_MIGRATION_PLAN.md   historical planning docs; do not match the code
```
