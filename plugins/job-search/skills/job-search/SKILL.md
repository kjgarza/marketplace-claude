---
name: job-search
description: This skill should be used when the user asks to "find jobs for me", "run a job search", "search job boards", "analyze this job posting", "score this role against my profile", "prepare an application for [company]", or "write a cover letter for this job". Searches career pages, LinkedIn and the web for senior roles, scores them against a locally configured candidate profile and target-company list, and writes leads and application packages to a configured leads directory.
allowed-tools: ["Bash", "Read", "Write", "WebSearch", "WebFetch", "ToolSearch"]
argument-hint: "[company | analyze <url> | prepare <url>]"
---

# Job Search

Find, analyze, and prepare application materials for roles that match **the candidate** described in the user's local profile. The skill ships no candidate data: who the candidate is, what to search for, and how to score live in files outside the plugin.

## Step 0 — Load Context (required, every mode)

Run the loader before anything else:

```bash
bash ${CLAUDE_PLUGIN_ROOT}/skills/job-search/scripts/load-context.sh
```

It finds the config (`$JOB_SEARCH_CONFIG`, then `./.claude/job-search.local.md`, then `~/.claude/job-search.local.md`), checks that `leads_dir`, `profile` and `target_companies` all resolve, and prints the resolved paths (including `scripts_dir`) followed by the full profile and target-company list.

**How to write every Bash command below.** `<scripts_dir>` means the absolute `scripts_dir` path Step 0 printed: write it out literally, and put job URLs in literally too. Pipes into `jq` and quoted arguments are fine. Do **not** use shell variables (`S=…; bash $S`, `$JOB_URL`, `${CLAUDE_PLUGIN_ROOT}`), command substitution (`$(…)`) or `for` loops: unattended runs (`run-job-search.sh`) reject those before they execute. Run one script call per Bash command.

- **Exit 2** → **stop** and show the user the error. It names the missing piece. Do not guess a profile, fall back to the cwd, or create a `leads/` tree elsewhere. For a first-time setup, tell the user to run `load-context.sh --init`, which copies `templates/` into `~/.claude/job-search/` and never overwrites.
- **Exit 0** → treat the printed profile and companies as the source of truth for everything below. Everywhere below, `leads/` means the printed `leads_dir`.

Profile sections referenced by name below (see `templates/profile.md`): **Target Role Parameters**, **Case Study Proof Points**, **Dynamic Positioning Frames**, **Search Plan** (Career Pages, LinkedIn Searches, Track A/B Queries), **Scoring Scales**, **Hidden Fit Signals**, **Proof Points Quick Reference**, **Notes for the Agent**. If a section the current mode needs is missing, say so in the output and continue with what is there.

## Scripts

Bundled helper scripts live in the `scripts/` subfolder of this skill:

| Script | Purpose |
|--------|---------|
| `scripts/load-context.sh [--init]` | Resolve config and print the candidate context (Step 0); `--init` scaffolds a user config from `templates/`. |
| `scripts/fetch-board.sh <ats> <board>` | List an **entire company job board** in one call: `{ats, board, count, jobs[]}` with `posted_date`, `location`, `listed` and `apply_url` per role. `ats` = `ashby` \| `greenhouse` \| `lever` \| `google`. Slugs come from the **Board** column of the target-companies list. Google mode takes a keyword + location instead of a slug. Free: not counted against the career-page budget. |
| `scripts/fetch-job.sh <url> [<url> ...]` | Fetch job postings and return `{url, posted_date, status, content, questions}` JSON: an object for one URL, an array (in argument order) for several. Auto-selects: Greenhouse API → Lever API → Ashby single-posting API → Jina Reader → plain curl. **Pass the whole shortlist in one call**: it fetches concurrently (`--jobs N`, default 6). |
| `scripts/fetch-application-form.sh <url>` | Find the **apply deep link** and extract the real application form questions. Returns `{url, ats, apply_url, source, needs_browser, questions, form_text}` JSON. Structured questions via Greenhouse/Workable/Ashby public APIs; apply-page scraping for Lever and others. `needs_browser: true` means the form wasn't captured: open `apply_url` with browser tools. |
| `scripts/run-job-search.sh <repo-dir>` | Run a full unattended search (cron/launchd). Runs Claude with `acceptEdits` and an explicit tool allowlist (no permission bypass); optional `NOTIFY_CMD` env var is run when done. |

## Search Budget (Hard Limits)

**Stop and present results when any limit is hit — do not continue searching.**

| Limit | Cap |
|-------|-----|
| Total WebSearch queries (across all agents) | 15 |
| Total job postings fetched & parsed | 20 |
| Total subagents spawned (Mode 1) | 3 |
| Career pages fetched **in a browser** per agent | 4 |
| Board API calls (`fetch-board.sh ashby\|greenhouse\|lever`) | **unlimited: one curl each; never skip one to save budget** |
| Google Careers keyword queries (`fetch-board.sh google`) | 3 per run |

If limits are reached before finding enough matches, report what was found and note the cap was hit.

## Freshness Rules (Hard Filters)

**Apply these before scoring — discard any posting that fails either check.**

| Rule | Action |
|------|--------|
| Posting is marked **Closed**, **Filled**, **No longer accepting**, or equivalent | Discard immediately |
| Posting date is **older than 5 months** from today | Discard immediately |
| No date is visible and content signals the role is no longer available | Discard with a note |

When parsing a posting with Jina Reader, always look for: `Posted`, `Date posted`, `Listed`, `Apply by`, `Closes`, or any timestamp field. If the posting date cannot be determined, flag it as **date unknown** and deprioritize — do not include it in scored results unless it is the only option for a strong domain match.

### Source-specific overrides

| Source | Override |
|--------|----------|
| **Ashby** boards | `publishedAt` is a true publish date: apply the 5-month rule strictly. Also discard `listed: false`. Ashby boards keep **zombie postings** (still listed, published years ago); the date rule catches these, so don't trust `listed` alone. |
| **Greenhouse** boards | Only `updated_at` is exposed. Read it as "not older than": a role can be older than its `updated_at` but never newer. Don't report it as a publish date. |
| **Google Careers** | Google publishes **no date anywhere**. The "deprioritize unknown dates" rule would silently drop every Google role, so it does **not** apply here. `fetch-board.sh google` sorts by date: treat the returned order as the freshness proxy, take the top results, and score them with `posted_date: unknown (Google — no date published)`. |

### Geography pre-filter

Run this **before** fetching a posting's full content, so budget isn't spent on roles that can't score. Use the location and work-arrangement lines in the profile's **Target Role Parameters**:

- **Discard** roles locked to a region the candidate can't work in, including remote roles restricted to another country or timezone band (e.g. "remote within US timezones" for a candidate based in Europe).
- **Keep** anything that names the candidate's region, an acceptable relocation target, or "remote (global)".
- Report what the filter dropped per company: never silently drop an entire employer.

If the profile names no location, skip this filter and say so in the output.

## Tool Stack

| Task | Tool |
|------|------|
| Search for jobs | `WebSearch` |
| **List a whole company board (preferred)** | `Bash`: `bash <scripts_dir>/fetch-board.sh <ats> <board>` |
| Fetch application form + questions | `Bash`: `bash <scripts_dir>/fetch-application-form.sh "<job-url>"` |
| Fetch career pages (JS-heavy, **only when the company has no board API**) | `mcp__chrome-devtools__navigate_page` + `mcp__chrome-devtools__take_snapshot` (or `evaluate_script` with `document.body.innerText` for plain text) |
| Search LinkedIn Jobs (authenticated) | `mcp__chrome-devtools__*` browser tools |
| Parse job posting content | `Bash`: `bash <scripts_dir>/fetch-job.sh "<job-url>"` |
| Fallback fetch | `WebFetch` |

Browser tools are deferred — load schemas first with `ToolSearch` (`select:mcp__chrome-devtools__navigate_page,mcp__chrome-devtools__take_snapshot`). If the chrome-devtools MCP server is unavailable, skip browser steps and rely on WebSearch + fetch-job.sh — do not fail the run.

**Fetching a posting:** `fetch-job.sh` is the single path for every job posting URL (below). It does not consult qurl, so for the `WebFetch`/browser fallbacks (career pages, company about/team pages) check the cache first with `qurl get "<url>"` (exit 0 = cached content, use it; exit 1 = fetch, then `echo "<content>" | qurl add "<url>"`). Skip qurl for posting URLs: `fetch-job.sh` already returns fresh `posted_date`/`status`.

**Job fetch pattern** — the only way to fetch a job posting URL. Returns structured JSON with `posted_date` and `status` pre-extracted:

```bash
bash <scripts_dir>/fetch-job.sh "<job-url>"
```

Read `posted_date` (YYYY-MM-DD or `unknown`), `status` (`open`, `closed` or `unknown`) and `content` from the JSON it prints. To see only the header fields, pipe it: `bash <scripts_dir>/fetch-job.sh "<job-url>" | jq '{posted_date, status}'`.

The script auto-selects the best source: **Greenhouse API → Lever API → Ashby single-posting API → Jina Reader → plain curl**. Do not call raw `curl`, Jina or `WebFetch` for posting URLs; the script already falls back through them (Jina is used with `JINA_API_KEY` when set).

**Fetching more than one posting? Pass them all to a single call.** It fetches concurrently and returns an array in argument order, instead of paying each round-trip serially:

```bash
bash <scripts_dir>/fetch-job.sh "<url-a>" "<url-b>" "<url-c>" | jq -r '.[] | "\(.posted_date) \(.status) \(.url)"'
```

## Output

Always save results to a markdown file under `<leads_dir>/` (see Configuration), in addition to displaying them in the conversation.

### Directory Structure

```
leads/
  YYYY-MM-DD-search.md             # Full Search results
  [company-slug]/                  # One folder per company (kebab-case, e.g. "chan-zuckerberg")
    YYYY-MM-DD-search.md           # Company Search results
    YYYY-MM-DD-[role-slug]-analysis.md      # Deep Analysis output
    YYYY-MM-DD-[role-slug]-application.md   # Application Package output
    YYYY-MM-DD-[role-slug]-contacts.md      # find-linkedin-contacts output (written by that skill)
```

### Path Rules

| Mode | Output Path |
|------|-------------|
| **Full Search** | `leads/YYYY-MM-DD-search.md` |
| **Company Search** | `leads/[company-slug]/YYYY-MM-DD-search.md` |
| **Deep Analysis** | `leads/[company-slug]/YYYY-MM-DD-[role-slug]-analysis.md` |
| **Application Package** | `leads/[company-slug]/YYYY-MM-DD-[role-slug]-application.md` |

- `[company-slug]` = company name in kebab-case (e.g. `digital-science`, `chan-zuckerberg`)
- `[role-slug]` = job title in kebab-case (e.g. `staff-ai-engineer`, `head-of-platform`)
- Create parent directories as needed (`mkdir -p`).
- After writing the file, tell the user the exact path.

## Command Routing

| Input | Mode |
|-------|------|
| `/job-search` (no args) | **Full Search** — spawn 3 parallel subagents |
| `/job-search [company name]` | **Company Search** — targeted search at a specific company |
| `/job-search analyze [job URL]` | **Deep Analysis** — score and analyze a specific posting |
| `/job-search prepare [job URL]` | **Application Package** — generate full application materials |

---

## Mode 1: Full Search

### Step 1 — Spawn 3 Parallel Subagents

**Spawn all 3 agents simultaneously using the Task tool.** Each agent operates independently within its budget. Do not wait for one to finish before spawning the next. Subagents don't inherit the loaded context: paste each agent the profile sections it needs (named below), the absolute `scripts_dir`, and the "How to write every Bash command" rule from Step 0 in its prompt.

---

**Agent 1 — Board APIs + Career Pages + LinkedIn Browser**

Budget: max 4 **browser** career page fetches + LinkedIn browser search. Board API calls are free and don't count. Input: the target-companies list (its **Board** column), profile **Search Plan → Career Pages** and **LinkedIn Searches**, and **Target Role Parameters** (for the geography pre-filter).

0. **Sweep the board APIs first.** Run one call per company with a **Board** entry (`<ats>:<slug>`). If the target-companies file has no Board column (files made before v1.1.0), skip this step and use career pages as before. Each call returns every open role with a real posted date:
   ```bash
   bash <scripts_dir>/fetch-board.sh ashby <slug>
   bash <scripts_dir>/fetch-board.sh greenhouse <slug> | jq -r '.jobs[] | "\(.posted_date) \(.location) \(.title) \(.url)"'
   ```
   (one Bash call per company; the `jq` form trims a large board to one line per role)
   Large boards can carry hundreds of roles: filter titles and locations with `jq` before returning anything. Apply the geography pre-filter and the 5-month rule to `posted_date` here, not later. **Do not browser-scrape the career page of a company whose board was swept.**

   For Google (or any company listed with board `google`), run up to 3 keyword queries, never a bare location dump: `bash <scripts_dir>/fetch-board.sh google "<keyword>" "<city country>"`. Results carry `posted_date: unknown` by design and come newest first; the Google freshness override applies.

1. Use `mcp__chrome-devtools__navigate_page` to open each **remaining** URL under **Career Pages** (companies with no board API; first 4 only), then `take_snapshot` to extract roles:
   - On each career page, check for a "posted date" or "last updated" field; skip any role posted more than 5 months ago or marked closed.
2. Search LinkedIn Jobs via browser (filtered to past 5 months, ≈150 days = 12 960 000 s):
   - For the first keyword set under **LinkedIn Searches**, navigate to `https://www.linkedin.com/jobs/search/?keywords=<url-encoded keywords>&location=<location from the profile>&f_TPR=r12960000`
   - Use `take_snapshot` to extract job titles, companies, URLs, **and posted dates**
   - Run 1–2 more searches with the remaining keyword sets, using the same `f_TPR=r12960000` filter
   - Discard any result where LinkedIn shows "Closed" or a posted date older than 5 months
3. Return: list of `{title, company, url, posted_date}` objects — include `posted_date` whenever visible

---

**Agent 2 — Track A (WebSearch)**

Budget: max 5 WebSearch queries. Stop after 5. Input: profile **Search Plan → Track A Queries**.

Run the Track A queries (the 5 most relevant if more are listed), substituting the current year where a year appears.

For each result, note the date shown in the search snippet. Discard any result whose snippet date is older than 5 months or whose title/snippet signals the role is closed.

Return: list of `{title, company, url, posted_date}` objects found in search results (`posted_date` = date from snippet, or `unknown`).

---

**Agent 3 — Track B (WebSearch)**

Budget: max 5 WebSearch queries. Stop after 5. Input: profile **Search Plan → Track B Queries**.

Run the Track B queries the same way as Agent 2.

For each result, note the date shown in the search snippet. Discard any result whose snippet date is older than 5 months or whose title/snippet signals the role is closed.

Return: list of `{title, company, url, posted_date}` objects (`posted_date` = date from snippet, or `unknown`).

---

### Step 2 — Deduplicate, Filter Freshness, and Parse

Collect all results from the 3 agents. Deduplicate by URL.

**Ledger dedup:** read `<leads_dir>/pipeline.json` and drop every URL already present in it — those jobs were handled in a previous run (any status). Report the count dropped ("N already in pipeline"). If the ledger file does not exist, report "ledger not found at <path>, no dedup applied" explicitly; never report "0 already in pipeline" in that case.

If total > 20, keep the 20 most relevant by title/company.

**Freshness filter — run before parsing:**
1. For each posting, check any date metadata already returned (LinkedIn `f_TPR` filter, search snippet dates, `posted_date` from agents).
2. Discard postings with a known date older than **5 months** from today.
3. Discard postings explicitly marked closed/filled, and Ashby postings with `listed: false`.
4. If the date is unknown, proceed to parse — but flag `posted_date: unknown`. **Exception: Google roles keep full priority despite an unknown date** (see Source-specific overrides).
5. Apply the **geography pre-filter** before spending a fetch on a role.

Fetch the full content of all surviving postings in **one batched call**, not a loop. The batch runs concurrently and returns an array in argument order:
```bash
bash <scripts_dir>/fetch-job.sh "<url-1>" "<url-2>" "<url-3>"
```
A serial loop pays every network round-trip end to end; the batch finishes in about the time of its slowest posting.

After fetching, re-apply the freshness filter using the returned `posted_date` and `status` fields:
- Look for fields: `Posted`, `Date posted`, `Listed`, `Apply by`, `Closes`, `Deadline`.
- If the extracted date is older than 5 months, **discard the posting** and do not score it.
- If the posting content says "position filled", "no longer available", or "closed", **discard immediately**.

Always capture the direct URL and resolved `posted_date` — both must appear in the results table.

### Step 3 — Score (Multi-Dimensional)

The weights are fixed; the per-dimension scale comes from the profile's **Scoring Scales**.

| Dimension | Weight | Scoring Guide |
|-----------|--------|---------------|
| **Domain alignment** | 30% | Profile scale |
| **Seniority fit** | 20% | Profile scale |
| **Skill stack overlap** | 20% | (matched skills / required skills) × 100, against the profile's key skills |
| **Work arrangement** | 15% | Profile scale |
| **Mission/culture** | 15% | Profile scale |

Filter to 60%+. Flag 80%+ as strong matches.

### Step 4 — Hidden Fit Detection

Flag postings where the title doesn't match but the description shows one of the profile's **Hidden Fit Signals**.

### Step 5 — Present Results

```
## Job Search Results — [date]

### Strong Matches (80%+)
| # | Role | Company | Score | Track | Posted | URL | Key Fit Signals |
|---|------|---------|-------|-------|--------|-----|-----------------|

### Good Matches (60-79%)
| # | Role | Company | Score | Track | Posted | URL | Key Fit Signals |
|---|------|---------|-------|-------|--------|-----|-----------------|

### Hidden Fit Opportunities
| # | Role | Company | Score | Posted | URL | Why Hidden Fit |
|---|------|---------|-------|--------|-----|----------------|
```

For each strong match (80%+): positioning frame, top 3 proof points, gaps, suggested angle.

### Step 6 — Contact Discovery (Auto-trigger for Strong Matches)

For every strong match (80%+), automatically invoke the `find-linkedin-contacts` skill:

> "Now finding contacts at [Company] for the [Role Title] role..."

Pass to `find-linkedin-contacts`:
- Company name
- Job title
- Job URL

This runs the full contact workflow: scrape company site, search LinkedIn, classify P1/P2/P3 contacts, draft messages, and output an outreach strategy. Results are appended to the same results file.

---

## Mode 2: Company Search

1. **Check the target-companies list for a Board entry first.** If there is one, a single `fetch-board.sh` call returns the whole board with dates: skip to step 3. If there isn't, probe the obvious slug against all three ATSes before falling back to search and a browser:
   ```bash
   bash <scripts_dir>/fetch-board.sh ashby <slug> | jq -c '{ats,count,error}'
   bash <scripts_dir>/fetch-board.sh greenhouse <slug> | jq -c '{ats,count,error}'
   bash <scripts_dir>/fetch-board.sh lever <slug> | jq -c '{ats,count,error}'
   ```
   Tell the user about any working slug so they can add it to the **Board** column.
2. Otherwise: search `[company] careers [current year]`, then fetch the career page (use the URL from the target-companies list when the company is there) via browser (`mcp__chrome-devtools__navigate_page` + `take_snapshot`) or Jina Reader as fallback
3. **Apply freshness filter:** discard any role marked closed/filled or with a posted date older than 5 months. Flag roles with no visible date as `posted_date: unknown`.
4. List only open, recent roles in a table with `URL` and `Posted` columns (clickable markdown links)
5. Score each using the multi-dimensional matrix
6. For top 3: provide positioning frame, proof points, gaps
7. For any 80%+ match: invoke `find-linkedin-contacts` automatically

---

## Mode 3: Deep Analysis

1. Fetch the full posting: `bash <scripts_dir>/fetch-job.sh "<job-url>"` — returns `{url, posted_date, status, content}` JSON
2. **Freshness check:** extract the posted date from the parsed content. If the role is closed or older than 5 months, **stop and report** — do not score. If date is unknown, note it and proceed with a warning.
3. Fetch the application form: `bash <scripts_dir>/fetch-application-form.sh "<job-url>"`. Record the `apply_url` and how many custom questions the form carries (this feeds the effort estimate and the Application Package).
4. Score with dimension breakdown
5. Determine positioning frame
6. Map every requirement to a proof point
7. Identify gaps honestly (this analysis is internal; see the gap rule in Mode 4)
8. Check for hidden fit signals
9. Recommend GO / STRETCH / PASS

```
## Deep Analysis: [Role] at [Company]

**Job URL**: [link]
**Posted Date**: [date or "unknown"]
**Status**: Open / Closed / Unknown
**Application Form**: [N custom questions / standard fields only / unreadable (JS or login wall)]
**Overall Score**: XX%

### Dimension Breakdown
- Domain alignment (30%): XX — [reasoning]
- Seniority fit (20%): XX — [reasoning]
- Skill stack (20%): XX — [reasoning]
- Work arrangement (15%): XX — [reasoning]
- Mission/culture (15%): XX — [reasoning]

### Positioning Frame: [chosen frame]
### Requirement Mapping
| Requirement | Proof Point | Strength |
### Gaps & Stretch Areas
### Hidden Fit Signals
### Recommendation: [GO / STRETCH / PASS]
```

---

## Mode 4: Application Package

**A job ad is not the application.** The real form (screening questions, essay prompts, salary/visa/notice fields, required attachments) lives on the apply deep link. The package is not complete without it.

1. Run Deep Analysis (Mode 3)
2. If score >= 60%, fetch the application form:
   ```bash
   bash <scripts_dir>/fetch-application-form.sh "<job-url>"
   ```
   - `needs_browser: false` and `questions` non-empty → use them as the authoritative form
   - `needs_browser: true` → the form wasn't captured; open `apply_url` with `mcp__chrome-devtools__navigate_page` + `take_snapshot` and read the rendered form (if browser tools are unavailable, extract questions from `form_text`, then try `WebFetch` on `apply_url`)
   - Still unreadable → include the `apply_url` in the package with an explicit "check the form manually before submitting" note; never silently skip it
3. Generate cover letter + resume talking points + approach angle + **application form answers** (see below)
4. Automatically invoke `find-linkedin-contacts` for this company+role

### Application Form Answers

For every question found in step 2, include a section in the package:

- **Essay/motivation questions**: a full drafted answer per the cover letter rules (concrete metrics, tone matched to culture; respect any stated word or character limit)
- **Factual questions** (salary expectation, notice period, visa/work authorization, start date): answer from the profile if present; otherwise insert a `[FILL ME: …]` placeholder and list it in the summary. Never guess personal facts.
- **Yes/no screeners**: answer honestly from the profile; if an honest answer is a knockout risk, flag it prominently rather than fudging it
- **Standard fields** (name, email, CV upload, LinkedIn): list them so nothing is a surprise at submit time; no draft needed

Record the `apply_url` and the form source (api / apply-page / browser / unreadable) at the top of the section.

### Cover Letter Structure
1. Opening hook — the most relevant intersection, not generic interest
2. Proof point 1 — strongest matching case study with concrete metrics
3. Proof point 2 — complementary case study showing breadth
4. Bridge — connect to what the company specifically needs
5. Close — forward-looking, specific to the team/mission

Rules: concrete outcomes only, ~350 words, tone matched to culture.

**Never volunteer a gap in the cover letter.** Gap honesty belongs in the Deep Analysis (internal) and in factual screener answers when the form asks directly. The letter sells fit: no sentences like "my experience has been X rather than Y, so I'd be building on that". Recruiters reject on the exact gap a letter names unprompted. If a real gap exists, leave it out or reframe it as the nearest adjacent proof the candidate does have, never as a disclaimer.

### Resume Talking Points
5–7 most relevant achievements from the profile, each with a metric, reframed for this role.

### Approach Angle
- Intersection to lead with
- Positioning frame
- Connections, publications, or side projects to mention
- Suggested email subject line

---

## Important Notes

- Never generate output before Step 0 succeeds; the loaded profile is the only source of candidate facts. Don't invent proof points or metrics.
- Phrase claims with the profile's **Proof Points Quick Reference** and follow its **Notes for the Agent**.
- Be honest about gaps in analysis and screener answers rather than overselling, but never disclaim them in the cover letter (see Mode 4).
- **The job ad is not the application**: for Deep Analysis and Application Package, always resolve the apply deep link and its form questions via `fetch-application-form.sh`. A package without the form's questions (or an explicit unreadable-form note with the `apply_url`) is incomplete.
- Prioritize roles where the candidate's intersection is a genuine advantage, not just a checkbox match.
- When in doubt about positioning, use the default frame under **Dynamic Positioning Frames**.
- All searches should include current year to find active postings
- If a career page is behind authentication or can't be fetched, note this and suggest the user check manually
