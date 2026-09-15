# Spike: Newsletter discovery via Kill the Newsletter + Miniflux

**Status:** Afternoon block done; 7-day passive window open (started 2026-09-15)
**Time box:** One afternoon (~4h active), then a 7-day passive observation window
**Consumer:** find-kristian-jobs
**Related:** #33 (scrape-core PRD), #34 (URL discovery assessment)

## Why

#34 proposes building a discovery layer: a JSONL contract, cursor state, URL dedup, tracking-link unwrapping, and an IMAP-based `mail-source` CLI. Most of that is what a feed reader already does. This spike tests whether off-the-shelf tools cover it, before any code is written.

## Hypothesis

If job newsletters are delivered to Kill the Newsletter (KTN) and polled by Miniflux, then capture, dedup, and cursor state work with configuration only, and the remaining custom code is a small script that pulls unread entries and extracts job links.

## The main risk

**One email becomes one feed entry, not one job.** Miniflux dedups entries (emails). It does not know that the same job appears in two emails or two newsletters. The spike must measure how much job-level dedup is left over, because that decides whether this replaces #34 or only part of it.

## Questions to answer

| # | Question | Pass condition |
|---|----------|----------------|
| Q1 | **Capture.** Do newsletters arrive in KTN and show up in Miniflux? | Every test email appears as an entry, with HTML body intact |
| Q2 | **Entry dedup.** Does re-delivering the same email create a duplicate entry? | No duplicate entries after refresh or re-poll |
| Q3 | **Job dedup.** How often does the same job appear across entries? | Measured and recorded, not pass/fail. Note which ID (job ID, normalized URL) would dedup it |
| Q4 | **Cursor.** Can a script use unread/read status as the cursor? | Pull unread, mark read, re-run returns nothing new. A crash before marking read loses nothing |
| Q5 | **Links.** Can job URLs be recovered from entry HTML? | Job links separable from footer and unsubscribe noise; tracking links resolve to a stable job ID, ideally without following the redirect |
| Q6 | **Headless.** Does it run with no browser, Gmail MCP, or interactive auth? | Pull script runs under launchd with only an API token |
| Q7 | **Retention.** How long does KTN keep entries if Miniflux is down? | Retention noted; acceptable if longer than a plausible outage |

## Out of scope

- Fetching job detail pages (that's scrape-core, #33)
- Scoring, drafting, or any change to find-kristian-jobs' logic
- Self-hosting KTN (needs inbound SMTP and MX records; not an afternoon job)
- berlin-flats, find-events, bookclub (follow-up if this passes)
- Cross-plugin JSONL contract design

## Setup

1. **Miniflux:** run locally with Docker Compose (Miniflux + Postgres). Create an API key. Lower the polling interval so the spike doesn't wait an hour between checks.
2. **KTN:** create one inbox per newsletter on the hosted instance. Record address and feed URL.
3. **Subscribe:** point each newsletter at its KTN address. Where the source won't let you change the email, use a Gmail filter that forwards to the KTN address instead. Confirmation and forwarding-verification emails arrive in the feed; click through from there.
4. **Seed data:** forward ~20 past alert emails so there's enough volume to test Q3 and Q5 in one afternoon. Note that forwarded emails may wrap the original HTML and links differently from live delivery.
5. **Pull script:** a throwaway script (<100 lines) that fetches unread entries via the Miniflux API, extracts candidate job links, prints JSONL, and marks entries read.

### Sources

| Newsletter | Delivery (direct / Gmail forward) | KTN feed | Notes |
|------------|-----------------------------------|----------|-------|
| Glassdoor "Jobs for you" (`noreply@glassdoor.com`) | Gmail forward (pending) | Created 2026-09-15; address kept out of the repo | Only active job-alert source in the inbox. ~1–2 alerts/day, 5 jobs each, ~70 KB HTML |
| LinkedIn job alerts | — | — | LinkedIn turned the alert off on 2026-05-31 (not viewed in 90 days). Re-enable to test a second source |
| _TBD_ | | | |

## Afternoon plan

| Block | Work |
|-------|------|
| 0:00–0:45 | Miniflux up, KTN inboxes created, feeds added |
| 0:45–1:30 | Subscriptions and Gmail forwards; confirm Q1 with seed emails |
| 1:30–2:45 | Pull script; test Q4 (including kill-before-mark-read) and Q6 |
| 2:45–3:30 | Link extraction on seed data; record Q3 and Q5 findings |
| 3:30–4:00 | Write up results and decision |

**Days 1–7 (passive):** let live alerts accumulate. Run the pull script daily. Recheck Q2, Q3, Q7 on real delivery.

## Decision rules

- **Adopt:** Q1, Q2, Q4, Q5, Q6 pass and job-level duplicates are rare. Drop `mail-source` from #34. Discovery becomes KTN/Miniflux config plus the pull script. Update #33's open question on URL supply.
- **Adopt with plugin dedup:** everything passes except job-level duplicates are common. Keep Miniflux as transport and cursor; add a small seen-jobs store keyed on job ID inside find-kristian-jobs. Still drop IMAP.
- **Kill:** emails go missing, links can't be recovered reliably, or the setup can't run headless. Return to #34's `mail-source` design, with the measurements from this spike as input.

## Risks and notes

- **Privacy:** hosted KTN feed URLs are unguessable but public if leaked, and alerts may contain your name and email. Acceptable for a spike; revisit before depending on it.
- **Tracking clicks:** following redirect links may register as clicks with the sender. Prefer parsing job IDs from the link or body.
- **Forwarding distortion:** Gmail-forwarded emails may differ from direct delivery. Compare at least one source both ways if possible.
- **Seed bias:** historical emails won't reveal delivery gaps or timing; that's what the 7-day window is for.

## Output

A results section appended to this doc: the answer to each question, job-duplicate rate, the pull script (linked or committed), and the decision.

---

## Results (afternoon block, 2026-09-15)

### What ran

| Piece | Where |
|-------|-------|
| Miniflux 2.2.13 + Postgres 16 (polling every 1 min) | [`docker-compose.yml`](docker-compose.yml) |
| Pull script: unread entries to JSONL, fsync, then mark read (67 lines, stdlib only) | [`pull.py`](pull.py) |
| Link extraction and job-key rules (Glassdoor, LinkedIn, Indeed, StepStone, Greenhouse, Lever, generic) | [`extract.py`](extract.py) |
| Q3 metric | [`dedup_report.py`](dedup_report.py) |
| KTN-shaped Atom feed built from real emails, served inside the compose network | [`make_feed.py`](make_feed.py), [`clean_fixtures.py`](clean_fixtures.py) |
| Repeatable Q1/Q2/Q4/Q6 checks | [`run-checks.sh`](run-checks.sh) |
| launchd job for the daily pull | [`com.kjgarza.ktn-pull.plist.example`](com.kjgarza.ktn-pull.plist.example) |

**Seed data.** Six real Glassdoor "Jobs for you" alerts from 2026-09-08 to 2026-09-13, read through the Gmail API. Two of them (one thread) went end to end through a KTN-shaped feed into Miniflux and then the pull script. The job IDs in all six were used for Q3. The emails were not forwarded to KTN (see "Not yet tested").

**Fixture caveat.** The Gmail API output had quoted-printable damage: `jobListingId=1010…` came back with `=10` decoded to byte `0x10`. Miniflux's sanitizer then dropped that byte, and the link became `jobListingId10235089920=`. `clean_fixtures.py` restores the escapes before the feed is built. Live SMTP delivery to KTN decodes the email properly, so this is a fixture problem and not a pipeline problem. The raw fixture still showed that sanitized content is lossy in ways the extractor has to handle.

### Answers

| # | Result | Evidence |
|---|--------|----------|
| Q1 | **Pass on fixtures; live delivery not yet tested.** Every fixture email became one Miniflux entry. Links and text survived. Miniflux stripped styles and tables (70 KB of HTML became 12.7 KB) but kept all 12 anchors. Miniflux subscribed to the live hosted KTN feed without errors (HTTP 201). | `run-checks.sh`: `fixtures=2 entries_total=2`, `anchors=12 has_jobListingId=True` |
| Q2 | **Split.** Re-polling the same feed adds no entries, so Miniflux dedups by entry id. Re-delivering the same email creates a duplicate entry. KTN gives every received email a new random `publicId` (source: `application.mts`, `feedEntries` insert), so Miniflux sees two different entries. The Q2 pass condition fails for true re-delivery. In practice this is harmless because the job-key dedup that Q3 needs catches it anyway. | `Q2a entries_total=2`; `Q2b` after re-delivery: `entries_total=4 unread=2` |
| Q3 | **Common. 40% of job sightings are repeats.** Across 6 alerts in 5 days there were 30 sightings and 18 unique jobs. 6 jobs appeared in at least 2 alerts, and 3 of them appeared in 4. Two alerts on the same day (5 h apart) shared 3 of their 5 jobs. `glassdoor:<jobListingId>` dedups all exact repeats. One repost is missed by ID: the same title was listed as "Tigerless" (`1010233605781`) and "Tigerless Health, Inc." (`1010233621691`). Only a title plus normalized company key would catch it. | `dedup_report.py` on the 6-alert sample: `duplicate_sightings=12 (40%)`, `jobs_seen_in_2+_entries=6 (33%)` |
| Q4 | **Pass.** Unread/read works as the cursor. A simulated crash between the JSONL fsync and mark-read left both entries unread, and the next run re-emitted them. Delivery is at-least-once, so the JSONL gets duplicate lines, which job-key dedup absorbs. After mark-read, a re-run returned `entries=0`. | `unread_after_crash=2`, `unread_after_run1=0`, `run2: entries=0` |
| Q5 | **Pass for Glassdoor.** Job links separate cleanly from noise. Rules drop unsubscribe, settings, privacy, the tracking pixel, the "search for more jobs" CTA, and homepage links. After the fixes, the 2-alert run gave 10 job links and 0 noise. The job ID sits in the query string (`jobListingId`), so no redirect is needed. Miniflux strips `utm_*` parameters and reorders the query, so the `utm_content` fallback is gone after Miniflux but `jobListingId` survives. The tail of `jrtk` (for example `…-31a83e8206904db4`) is also stable per job and could be a second key. Other sources have rules in `extract.py` that are not yet tested on real email. | `run-checks.sh` Q3 block: every key is `glassdoor:<13-digit id>` and none are `url:` |
| Q6 | **Pass.** `pull.py` ran with `env -i` and only `MINIFLUX_URL` + `MINIFLUX_TOKEN` set, using the system `/usr/bin/python3` with no packages. The API key came from `POST /v1/api-keys`. Nothing needs a browser, Gmail MCP, or interactive auth. The plist has not been loaded into launchd yet. | `Q6 headless: entries=0` (no error; the cursor was already drained) |
| Q7 | **Retention is by size, not time. Budget about 7 Glassdoor alerts per inbox.** Hosted KTN keeps the newest entries until their combined title and content reach 2^19 characters (512 KiB), then deletes older ones. It also rejects any single email over 512 KiB at SMTP. At about 70 KB per Glassdoor alert that is roughly 7 alerts, or 4–7 days at the current 1–2 alerts/day. After Miniflux fetches an entry, Miniflux keeps its own copy, so this buffer only matters while Miniflux is down. One inbox per newsletter keeps a busy source from pushing out a quiet one. Hosted KTN is also rate-limited. | `application.mts`: `if (feedLength > 2 ** 19) break;` then `delete from "feedEntries"`; SMTP `size: 2 ** 19`; CHANGELOG 2.0.3 and 2.0.8 |

### Other findings

- **KTN feed creation can be scripted:** `curl -X POST -H 'CSRF-Protection: true' -H 'Accept: application/json' --data 'title=…' https://kill-the-newsletter.com/feeds` returns `{feedId, email, feed}`. A plain form POST without that header gets HTTP 403.
- **Miniflux API keys** can be created over the API with basic auth (`POST /v1/api-keys`), so setup can be scripted end to end.
- **Glassdoor alerts are recommendation emails** ("Jobs for you"), and they repeat jobs on purpose. Search-based alerts (LinkedIn, StepStone) may repeat less. Recheck Q3 once a second source is live.

### Decision (provisional): **Adopt with plugin dedup**

Q1 (fixtures), Q4, Q5, and Q6 pass. Job-level repeats are common (40% of sightings), and KTN turns true re-deliveries into new entries. Keep KTN and Miniflux as transport and cursor. Add a small seen-jobs store in find-kristian-jobs keyed on `<source>:<job id>`, with an optional title + normalized company key for reposts. Drop the IMAP `mail-source` from #34.

This becomes final only after the 7-day window confirms live delivery (Q1) and real re-delivery behavior (Q2). If live Gmail-forwarded email loses links or arrives late, go back to the Kill rule.

### Not yet tested (needs a human)

1. **Gmail forward to KTN.** Add the KTN address as a Gmail forwarding address. The verification email arrives in the KTN feed. Add a filter such as `from:noreply@glassdoor.com subject:"role at"` that forwards matches. The address is in the session report, not in the repo.
2. **Second source.** Re-enable a LinkedIn job alert, or add StepStone, on its own KTN inbox.
3. **Daily pull.** Copy the plist example, fill in the paths and token, and `launchctl bootstrap` it. Keep `docker compose -p ktnspike up -d` running.
4. **Day 7.** Run `dedup_report.py` on `~/.local/state/ktn-spike/jobs.jsonl`, confirm every forwarded alert appears as an entry, and finalize the decision above.

### Runbook

```bash
cd docs/spikes/ktn-miniflux
docker compose -p ktnspike up -d
# one-time: API key
curl -s -u admin:spike-admin-pw -X POST -H 'Content-Type: application/json' \
  -d '{"description":"spike-pull"}' http://localhost:8080/v1/api-keys
# subscribe Miniflux to a KTN feed
curl -s -H "X-Auth-Token: $MINIFLUX_TOKEN" -H 'Content-Type: application/json' \
  -d '{"feed_url":"https://kill-the-newsletter.com/feeds/<id>.xml","category_id":1}' http://localhost:8080/v1/feeds
# daily
MINIFLUX_TOKEN=… python3 pull.py --out ~/.local/state/ktn-spike/jobs.jsonl
python3 dedup_report.py ~/.local/state/ktn-spike/jobs.jsonl
# offline checks against real emails (fixtures jsonl of {id,date,subject,htmlBody})
MINIFLUX_TOKEN=… FIXTURES=… FIXTURE_WWW=… WORK=… bash run-checks.sh
```
