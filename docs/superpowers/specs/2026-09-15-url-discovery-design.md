# URL discovery — design assessment

- **Status:** Draft for review
- **Date:** 2026-09-15
- **Owner:** Kristian Garza
- **Assesses:** scrape-core PRD (PR #33, `docs/superpowers/specs/2026-09-15-scrape-core-design.md`)
- **Related:** `aves/qurl`

---

## 1. Summary

The scrape-core PRD defines how a page is fetched. qurl defines how content is stored and searched. Neither defines where URLs come from.

This document assesses that gap. It proposes:

1. Keep web discovery inside each plugin. It is domain logic, like parsing.
2. Define one small URL-list contract that every discovery step emits.
3. Treat email newsletters as a first-class discovery source, and build it as a shared component, because its semantics are the same for every consumer.

No code changes. This is a design doc for review.

---

## 2. The pipeline has three stages

```
1. DISCOVER   where do URLs come from?   unowned — lives in each plugin
2. FETCH      url -> clean text          scrape-core
3. STORE      text -> index + search     qurl
```

scrape-core rules discovery out on purpose. PRD §3 Non-goals: "Crawling or link following. One URL in, one result out."

qurl is keyed by URL, but it is an index, not a queue. It has no pending state, no claim operation and no retry counter.

So no component owns URL supply.

---

## 3. How discovery works today

| Plugin | Discovery method |
|---|---|
| berlin-events | Static seed list in `skills/*/references/sources.md`, plus Eventbrite and Meetup APIs |
| berlin-flats | Portal profiles, listing-page HTML |
| find-kristian-jobs | Greenhouse and Lever ATS APIs |
| bookclub | No method. The agent improvises each time. |

Each method is different: ATS API pagination, portal CSS selectors, event-calendar pages and RSS do not share semantics.

---

## 4. Assessment of the scrape-core PRD

### 4.1 Discovery is two scrape-core calls, not zero

To find links, a plugin must fetch a listing page. So the loop for web sources is:

```
scrape-core <listing-url>
  -> plugin parses links
  -> scrape-core <detail-url>   (per link)
  -> plugin parses domain data
  -> qurl add
```

scrape-core is used twice. The plugin owns both parse steps. This fits the PRD without change, but the PRD does not say it.

### 4.2 Success metric §8 is unachievable as written

§8 says: "No other `fetch` or `curl` path to web pages remains in them."

If plugins still fetch listing pages with their own code to find links, this metric fails. Fix one of two ways:

- State that listing-page fetches also go through scrape-core. They can, because a listing page is a web page.
- Or scope the metric to detail-page fetches only.

The first option is recommended.

### 4.3 Readability can drop the links discovery needs

PRD §9 notes that Readability can drop content on listing pages. For discovery, the risk is sharper: Readability strips navigation and repeated cards, which is often where the links are. A listing-page fetch needs the `--raw` mode that the PRD lists as future work. `--raw` should move into v1, or discovery cannot use scrape-core for listing pages.

### 4.4 No push or pull primitive for URLs

- **Push:** the documented path is one URL at a time: `scrape-core "<url>" | qurl add "<url>" --source <name>`. qurl already has `add-batch`. scrape-core batch input (`--file urls.txt`) is future work.
- **Pull:** there is no way to ask "which URLs are not yet fetched?". `qurl search` and `qurl query` return content, not a frontier.

### 4.5 Missing open question

PRD §11 should add: "Who supplies URLs, and in what format?"

---

## 5. Options for the discovery layer

### Option A — qurl as the frontier

Add a URL to qurl with empty content and tag `status:pending`. A worker runs `qurl search --tag status:pending`, scrapes each URL, and re-adds it with content.

- **For:** no new infrastructure. Cross-run deduplication by URL comes free.
- **Against:** qurl is not a queue. It has no atomic claim and no retry counter, so parallel workers collide. It also forces SQLite on plugins that do not use qurl today.

### Option B — files as the contract (recommended)

Each plugin has its own discovery step. Every discovery step emits the same JSONL format. scrape-core gains `--file`.

```jsonl
{"url": "https://example.com/job/123", "source": "find-kristian-jobs", "tags": ["newsletter:berlin-startup-jobs"], "discoveredAt": "2026-09-15T08:00:00Z"}
```

- **For:** stateless, fits the Bash-tool pattern, no new repo. Discovery stays with the domain logic that owns it.
- **Against:** no shared cross-run deduplication. Each plugin already has its own seen-state (berlin-flats state dir, berlin-events shown-dedup, readitlater-digest SQLite), so this cost is low.

### Option C — a shared `discover-core`

A fourth component owns seeds, link extraction, deduplication and scheduling.

- **For:** correct long-term shape.
- **Against:** most work. Premature, because the four consumers do not share discovery semantics (§3).

### Recommendation

Adopt Option B now. The only shared piece is the JSONL contract and `scrape-core --file`. Add Option A later if centralized deduplication becomes necessary. Build Option C only when three or more plugins need the same crawl semantics.

---

## 6. Email newsletters as a discovery source

### 6.1 Why

Many job boards and event sites do not allow search or scraping. They do offer a newsletter. Joining the newsletter delivers the links by email.

This changes the posture:

- The content is consented and delivered to Kristian's own inbox. There is no 403, no bot wall and no terms-of-service conflict.
- Delivery is push-based. The source decides when to send.
- For some sources, the newsletter is the only reliable path.

### 6.2 Same shape, different transport

A newsletter is a listing page delivered by email instead of HTTP. The loop is the same as §4.1. Only stage 1 changes:

```
mail label (new messages since cursor)
  -> parse links from message body
  -> scrape-core <detail-url>
  -> plugin parses domain data
  -> qurl add
```

scrape-core does not change. Its non-goal still holds. Email discovery emits the same JSONL contract as Option B.

### 6.3 New problems email brings

**Tracking-link wrapping.** Newsletter links go through redirect hosts such as `list-manage.com`, `sendgrid.net` and `link.mail.beehiiv.com`. The real URL is hidden.

- scrape-core already returns `finalUrl`, so one fetch both resolves the redirect and gets the content.
- Side effect: the sender records a click for each resolved link. Click rates for Kristian's address will look non-human. This is acceptable, but a sender could flag or unsubscribe the address.

**Deduplication across newsletters.** The same job appears in several newsletters behind different tracking URLs. Normalize after the redirect resolves:

- lowercase the host
- strip `utm_*`, `fbclid`, `gclid`, `mc_cid`, `mc_eid`
- drop the trailing slash and the fragment

qurl keys documents by URL, so the normalized URL gives deduplication at ingest.

**Cursor state.** Each run processes only new messages. Use a mail label plus a stored cursor (last message date or UID) in the plugin's state directory.

**Content with no URL.** Some newsletters describe a job fully in the email and ask for applications by `mailto:`. There is nothing to fetch. Ingest the message body directly into qurl under a pseudo-URL, for example `mailto:` or `message-id:`, and skip scrape-core.

**Link noise.** Messages contain unsubscribe, preferences, social and footer links. Each consumer supplies an allow-list of URL patterns (for example `/jobs/`, `/job/`, known ATS hosts). Links that match none are dropped.

### 6.4 User contract

Kristian maintains one mail filter that applies one label, for example `feeds/jobs`. Discovery reads that label only.

There is no heuristic "is this a newsletter?" classifier. The behavior is deterministic, controlled by the user and easy to debug.

### 6.5 Shared or per-plugin?

Email discovery has likely consumers in find-kristian-jobs, bookclub (publisher lists), berlin-events (gallery mailing lists) and readitlater-digest. Their semantics are the same: read a label, advance a cursor, extract and normalize links, filter by pattern.

That meets the "three or more consumers with the same semantics" bar from §5. Web discovery does not meet it.

**Assessment:** a shared `mail-source` component is justified. A shared `discover-core` is not.

### 6.6 Headless constraint

The Gmail MCP server runs inside an interactive Claude session. The automation layer (`AUTOMATION.md`, launchd runs that report to Telegram) runs headless and has no MCP session. Email discovery must work without MCP.

| Option | Setup | Headless | Notes |
|---|---|---|---|
| IMAP with an app password, from a bun script | Low | Yes | Read-only use. Store the password in the macOS keychain, never in the repo. |
| Gmail API with a stored refresh token | Medium | Yes | Narrower scopes (`gmail.readonly`). Token refresh to handle. |
| Forward the label to a dedicated mailbox and poll it | Medium | Yes | Isolates the main account from automation. |
| Gmail MCP | None | No | Interactive runs only. |

**Recommendation:** IMAP with an app password for the prototype. Revisit the Gmail API if scope isolation becomes a concern.

---

## 7. Proposed contract for `mail-source`

CLI, same style as scrape-core:

```bash
mail-source --label feeds/jobs --since-cursor <state-file> --match '/jobs?/' --json
```

Output: one JSONL line per discovered link, using the Option B format, plus `messageId`, `from` and `subject` for traceability. Messages with no matching link and inline content emit a line with `"url": "message-id:<id>"` and `"content"` set.

Exit 0 on success, 1 on failure, with a structured error on stderr, matching scrape-core's F10. Suggested error codes: `AUTH_FAILED`, `LABEL_NOT_FOUND`, `NETWORK`, `TIMEOUT`.

`mail-source` does not fetch web pages. It emits URLs. scrape-core fetches them.

---

## 8. Prototype plan

Validate the email path before promoting anything to shared code.

1. Scope: find-kristian-jobs only, one newsletter, IMAP path.
2. Run for two weeks next to the existing ATS API discovery.
3. Measure:
   - unique jobs found per week by email vs by ATS API
   - jobs found only by email
   - share of links that resolve and scrape successfully
   - duplicates removed by URL normalization
4. Decide:
   - If email finds jobs the APIs miss, promote `mail-source` to a shared component and add it to the scrape-core PRD §7 as a fifth migration row.
   - If not, keep it as a find-kristian-jobs script or drop it.

---

## 9. Requested changes to the scrape-core PRD (PR #33)

1. §3 or §6: state that discovery is out of scope and owned by each plugin, and that listing-page fetches go through scrape-core.
2. §8: fix the "no other fetch path" metric (§4.2 above).
3. §10: move `--raw` into v1, because discovery needs the links Readability removes (§4.3).
4. §10: keep `--file` batch input, and reference the JSONL contract from §5 Option B.
5. §11: add the open question "Who supplies URLs, and in what format?"

---

## 10. Open questions

1. Is the JSONL contract owned by scrape-core (as its `--file` input format) or documented separately?
2. Should `mail-source` live in `aves/scrape-core` as a third package, or in its own repo?
3. Is a click recorded by a tracking-link resolve acceptable for every newsletter, or should some links be resolved by pattern (without a request) where the real URL is in the query string?
4. Where does the IMAP credential live for launchd runs: macOS keychain via `security find-generic-password`, or an env file outside the repo?
