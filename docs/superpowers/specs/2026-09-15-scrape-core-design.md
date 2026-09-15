# scrape-core — PR/FAQ and PRD

- **Status:** Draft for review
- **Date:** 2026-09-15
- **Owner:** Kristian Garza
- **New repo:** `aves/scrape-core` (sibling of `aves/qurl`)

---

## Part 1 — PR/FAQ

### Press release

**scrape-core: one reliable way for every skill and agent to read the web**

*Berlin, 2026* — Kristian's skills and agents read the web all the time. They look for events, jobs, flats and books. Until now, each plugin had its own scraper. Each one handled timeouts, retries, blocked sites and messy HTML in its own way, and most handled them badly. When a site blocked a request or hung, a run failed with no clear message, or the agent quietly got nothing back.

scrape-core is a small command-line tool that gets the clean text of any web page. Give it a URL. It returns clean content as JSON, or a clear error code that explains why it failed. It tries a plain fetch first. If the site blocks that or needs JavaScript, it falls back to Jina Reader. It retries short network glitches, and it never hangs.

"I stopped fixing the same scraping bug in four places," said Kristian. "Now when berlin-events can't read a page, I get `HTTP_4XX` from tier `jina` instead of an empty list and a guess."

Skills call it the same way they call scripts today:

```bash
scrape-core "https://www.tip-berlin.de/kultur/" --json
```

The tool leaves the domain logic to each plugin. That covers job-board APIs, book metadata and flat-portal parsing. scrape-core only does the part that every plugin shares.

### External FAQ

**What does it do?**
It takes a URL and returns the page's main readable content, with a title, as JSON. On failure, it returns a structured error with a code.

**How do I call it?**
`scrape-core <url> [--json] [--timeout=<ms>] [--tiers=plain,jina]`. Agents call it from the Bash tool.

**What happens when a site blocks me?**
A persistent failure, such as HTTP 403 or a page with no extractable content, moves the request to the next tier. A transient failure, such as a network error, HTTP 5xx or HTTP 429, is retried in the same tier with backoff.

**Does it store anything?**
No. It has no state. To index content, pipe it into qurl:
`scrape-core "<url>" | qurl add "<url>" --source berlin-events`.

**Does it parse job postings, events or book data?**
No. It returns clean page content. Each plugin parses its own domain.

**Do I need a Jina API key?**
No. Without a key, Jina Reader is limited to 20 requests per minute. With `JINA_API_KEY` set, the limit is 100.

### Internal FAQ

**Why not add fetching to qurl?**
qurl stores and searches. It never touches the network. Three of the four consumers (berlin-flats, find-kristian-jobs, bookclub) do not use qurl. Putting fetching in qurl would make them install SQLite and an embeddings stack just to read a page. A later `qurl add <url> --fetch` can use scrape-core as a dependency. See Future work.

**Why a CLI and not an MCP server or a library?**
Every consumer today is a skill or agent that runs scripts through the Bash tool. A CLI keeps that pattern and needs no running process. The core package also exports a library API, so TypeScript scripts such as berlin-flats can import it directly.

**Why a separate repo and not a plugin?**
It is shared infrastructure, like qurl, not a Claude Code plugin with skills. The qurl repo layout is already proven: bun workspace, core + cli packages, tests, npm publish.

**Why start from berlin-flats' `scrape.ts`?**
It is the most mature of the four scrapers. It already has a tiered plain-to-Jina fetch, timeouts and tests.

**What is the biggest risk?**
Migration drift. A plugin can keep its old fetch code "just in case", and then there are two paths again. The PRD makes deleting the old fetch code part of each migration's definition of done.

**What does it cost?**
Jina Reader's free tier covers current volume. There is no other paid dependency.

---

## Part 2 — PRD

### 1. Problem

Four plugins each fetch and clean web pages with separate code:

| Consumer | Current code | Fetch strategy | Gaps |
|---|---|---|---|
| berlin-flats | `plugins/berlin-flats/scripts/scrape.ts` | plain fetch, then Jina Reader | No retry. Errors are swallowed and become `all tiers failed`. No content-type or size guard. |
| berlin-events | `plugins/berlin-events/scripts/extract-content.js` | plain fetch + Readability | No timeout, no retry, no fallback tier. Errors are free text. |
| find-kristian-jobs | `plugins/kjgarza-base/skills/find-kristian-jobs/scripts/fetch-job.sh` | Greenhouse/Lever API, then Jina, then curl | Bash. Failure is returned as empty content, not as an error. |
| bookclub | `plugins/bookclub/skills/bookclub/references/scraping-patterns.md` | Guidance only (JSON-LD, meta, Readability, selectors) | No shared script. The agent improvises each time. |

As a result, the same reliability bugs appear in several places. Failures are silent or hard to parse, and every fix has to be made more than once.

### 2. Goals

1. One fetch-and-extract implementation, used by all four consumers.
2. No run hangs. Every request has a bounded time.
3. Every failure has a machine-readable error code.
4. Transient failures recover without help. Blocked pages fall back to another tier.
5. The CLI works as a drop-in from the Bash tool, with no change to how agents run tools.

### 3. Non-goals

- Domain parsing: job ATS APIs, JSON-LD book data, portal CSS selectors, event date extraction.
- Storage, deduplication or search. That is qurl's job.
- A headless browser tier in v1. See Future work.
- Crawling or link following. One URL in, one result out.
- Rate limiting across processes that run in parallel.

### 4. Users

- **Agents and skills** (primary): event-scout, scout-recon and the berlin-flats scraper, find-kristian-jobs, bookclub-coordinator. They need predictable JSON and error codes they can branch on.
- **Kristian** (secondary): debugs failed runs. He needs to see which tier failed and why.

### 5. Requirements

#### 5.1 Functional

| ID | Requirement |
|---|---|
| F1 | Accept one URL. Return the main readable content, extracted with `@mozilla/readability` and `jsdom`. |
| F2 | Try tiers in order. The default is `plain`, then `jina`. `--tiers` overrides the order and the set. |
| F3 | Retry a tier on transient errors only: network error, HTTP 5xx, HTTP 429. Allow at most 2 retries, with 500 ms and 1500 ms backoff. Honor `Retry-After` on 429, capped at 5 s. |
| F4 | On persistent errors (HTTP 4xx other than 429, `NOT_HTML`, `NO_CONTENT`), skip retries and go to the next tier. |
| F5 | Time out each attempt. Defaults: 15 s for `plain`, 25 s for `jina`. `--timeout` sets both. |
| F6 | Before parsing, reject a response whose `Content-Type` is not HTML. Code: `NOT_HTML`. The `jina` tier also accepts `text/plain` and markdown. |
| F7 | Reject a body larger than 5 MB, by `Content-Length` or while streaming. Code: `TOO_LARGE`. |
| F8 | Treat extracted text shorter than 200 characters as `NO_CONTENT`. |
| F9 | Write exactly one JSON object to stdout with `--json`. Without it, print a markdown title and the text. |
| F10 | Exit with 0 on success and 1 on failure. On failure, always write the error JSON to stderr, even without `--json`. |
| F11 | Use `JINA_API_KEY` when it is set. |
| F12 | Export a library API from `packages/core`: `scrape(url, options): Promise<ScrapeResult>`. |

#### 5.2 Output contract

Success:

```json
{
  "ok": true,
  "url": "https://example.com/page",
  "finalUrl": "https://example.com/page/",
  "tier": "plain",
  "title": "Page title",
  "content": "Clean text…",
  "length": 5231,
  "attempts": [{ "tier": "plain", "status": 200, "ms": 812 }]
}
```

Failure:

```json
{
  "ok": false,
  "url": "https://example.com/page",
  "code": "ALL_TIERS_FAILED",
  "message": "plain: HTTP_4XX (403); jina: TIMEOUT",
  "attempts": [
    { "tier": "plain", "code": "HTTP_4XX", "status": 403, "ms": 240 },
    { "tier": "jina", "code": "TIMEOUT", "ms": 25000 }
  ]
}
```

Error codes: `TIMEOUT`, `NETWORK`, `HTTP_4XX`, `HTTP_5XX`, `NOT_HTML`, `TOO_LARGE`, `NO_CONTENT`, `ALL_TIERS_FAILED`, `INVALID_URL`.

If there is only one tier, the top-level `code` is that tier's code. With several tiers, the top-level `code` is `ALL_TIERS_FAILED`, and `attempts` records each tier's code.

The contract is versioned by the package's major version. Adding a field is a minor change. Removing or renaming a field is a major change.

#### 5.3 Non-functional

| ID | Requirement |
|---|---|
| N1 | Worst-case time for one URL with the default tiers is under 60 s. |
| N2 | No dependencies beyond `@mozilla/readability` and `jsdom`. |
| N3 | Bun-first, TypeScript, Biome, `bun:test`, matching qurl. |
| N4 | Unit tests use mocked `fetch`. No network in the default `bun test` run. |
| N5 | One opt-in live smoke test (`SCRAPE_CORE_LIVE=1`) against the berlin-events priority sources. |

### 6. Architecture

```
aves/scrape-core/
├── package.json            # bun workspace
├── biome.json
├── justfile
├── .github/workflows/ci.yml
└── packages/
    ├── core/
    │   └── src/
    │       ├── index.ts        # scrape(url, options)
    │       ├── types.ts        # ScrapeResult, Attempt, ErrorCode, Options
    │       ├── tiers/
    │       │   ├── plain.ts    # fetch with browser headers
    │       │   └── jina.ts     # r.jina.ai + optional API key
    │       ├── guards.ts       # timeout, content-type, size cap
    │       ├── retry.ts        # transient classification + backoff
    │       └── extract.ts      # Readability + NO_CONTENT threshold
    └── cli/
        ├── bin/scrape-core
        └── src/cli.ts          # args → scrape() → stdout/stderr + exit code
```

Each unit has one job:

- `tiers/*` gets a raw `Response`. A tier does not retry or parse.
- `guards.ts` turns a `Response` into HTML text or an error code.
- `retry.ts` decides whether to retry, fall through or stop.
- `extract.ts` turns HTML into `{title, content}` or `NO_CONTENT`.
- `index.ts` runs the loop over tiers and records `attempts`.

Data flow for one URL:

```
for tier in tiers:
  for attempt in 0..2:
    response  = tier.fetch(url, timeout)
    classify  → ok | transient | persistent
    transient  → backoff, retry this tier
    persistent → record attempt, go to next tier
    ok         → guards → extract → return success
return ALL_TIERS_FAILED with attempts
```

### 7. Migration plan

Each migration is done when the consumer calls scrape-core, its old fetch code is deleted, and its existing tests or a manual run still pass.

| Order | Consumer | Change | Kept in the plugin |
|---|---|---|---|
| 1 | berlin-flats | Move `scrape.ts` logic into `packages/core`. The plugin imports `scrape()`. | Portal profiles, CSS parsing, scam scoring |
| 2 | berlin-events | Replace `extract-content.js` with `scrape-core --json`. Update the error-handling edge cases in `event-scout.md` to use the error codes. | Source list, event parsing, qurl ingest |
| 3 | find-kristian-jobs | Keep the Greenhouse and Lever API branches. Replace the Jina and curl branches with `scrape-core --json`. | ATS API tiers, date and status regex |
| 4 | bookclub | Add a `scrape-core` step to `scraping-patterns.md` in place of improvised WebFetch and Readability. | JSON-LD, meta, and selector guidance |

### 8. Success metrics

- All four consumers use scrape-core. No other `fetch` or `curl` path to web pages remains in them.
- berlin-events DOD AC-1 passes: at least 3 of the 5 priority sources return content.
- Zero hung runs over 2 weeks of scheduled use.
- Every failed scrape in agent output carries an error code, never an empty result.

### 9. Risks

| Risk | Mitigation |
|---|---|
| Jina Reader is rate limited or has an outage | Error code shows the tier. `JINA_API_KEY` raises the limit. A future headless tier gives a third path. |
| Readability drops content on listing pages, such as event calendars | `NO_CONTENT` threshold is low (200 chars). A `--raw` flag is future work if a consumer needs the full HTML. |
| Consumers keep old fetch code | Deleting it is part of each migration's done criteria. |
| Output contract churn breaks agents | Semver on the contract. Agent docs pin to the error codes listed above. |

### 10. Future work

- `qurl add <url> --fetch`, with scrape-core as a qurl dependency.
- A headless browser tier (Playwright) for pages that need JavaScript.
- `--raw` output mode that returns the guarded HTML without Readability.
- Batch input (`--file urls.txt`) with per-host concurrency limits.
- Shared JSON-LD and Open Graph extraction, if two or more consumers need it.

### 11. Open questions

1. Publish to npm like qurl, or install locally only with `bun link`?
2. Should berlin-flats import the library or call the CLI? The library is proposed, because it is already TypeScript.
