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

It finds the config (`$JOB_SEARCH_CONFIG`, then `./.claude/job-search.local.md`, then `~/.claude/job-search.local.md`), checks that `leads_dir`, `profile` and `target_companies` all resolve, and prints the resolved paths followed by the full profile and target-company list.

- **Exit 2** → **stop** and show the user the error. It names the missing piece. Do not guess a profile, fall back to the cwd, or create a `leads/` tree elsewhere. For a first-time setup, tell the user to run `load-context.sh --init`, which copies `templates/` into `~/.claude/job-search/` and never overwrites.
- **Exit 0** → treat the printed profile and companies as the source of truth for everything below. Everywhere below, `leads/` means the printed `leads_dir`.

Profile sections referenced by name below (see `templates/profile.md`): **Target Role Parameters**, **Case Study Proof Points**, **Dynamic Positioning Frames**, **Search Plan** (Career Pages, LinkedIn Searches, Track A/B Queries), **Scoring Scales**, **Hidden Fit Signals**, **Proof Points Quick Reference**, **Notes for the Agent**. If a section the current mode needs is missing, say so in the output and continue with what is there.

## Scripts

Bundled helper scripts live in the `scripts/` subfolder of this skill:

| Script | Purpose |
|--------|---------|
| `scripts/load-context.sh [--init]` | Resolve config and print the candidate context (Step 0); `--init` scaffolds a user config from `templates/`. |
| `scripts/fetch-job.sh <url>` | Fetch a job posting and return `{url, posted_date, status, content}` JSON. Auto-selects: Greenhouse API → Lever API → Jina Reader → plain curl. |
| `scripts/run-job-search.sh <repo-dir>` | Run a full unattended search (cron/launchd). Runs Claude with `acceptEdits` and an explicit tool allowlist (no permission bypass); optional `NOTIFY_CMD` env var is run when done. |

## Search Budget (Hard Limits)

**Stop and present results when any limit is hit — do not continue searching.**

| Limit | Cap |
|-------|-----|
| Total WebSearch queries (across all agents) | 15 |
| Total job postings fetched & parsed | 20 |
| Total subagents spawned (Mode 1) | 3 |
| Career pages fetched per agent | 4 |

If limits are reached before finding enough matches, report what was found and note the cap was hit.

## Freshness Rules (Hard Filters)

**Apply these before scoring — discard any posting that fails either check.**

| Rule | Action |
|------|--------|
| Posting is marked **Closed**, **Filled**, **No longer accepting**, or equivalent | Discard immediately |
| Posting date is **older than 5 months** from today | Discard immediately |
| No date is visible and content signals the role is no longer available | Discard with a note |

When parsing a posting with Jina Reader, always look for: `Posted`, `Date posted`, `Listed`, `Apply by`, `Closes`, or any timestamp field. If the posting date cannot be determined, flag it as **date unknown** and deprioritize — do not include it in scored results unless it is the only option for a strong domain match.

## Tool Stack

| Task | Tool |
|------|------|
| Search for jobs | `WebSearch` |
| Fetch career pages (JS-heavy) | `mcp__chrome-devtools__navigate_page` + `mcp__chrome-devtools__take_snapshot` (or `evaluate_script` with `document.body.innerText` for plain text) |
| Search LinkedIn Jobs (authenticated) | `mcp__chrome-devtools__*` browser tools |
| Parse job posting content | `Bash`: `bash ${CLAUDE_PLUGIN_ROOT}/skills/job-search/scripts/fetch-job.sh "[url]"` |
| Fallback fetch | `WebFetch` |

Browser tools are deferred — load schemas first with `ToolSearch` (`select:mcp__chrome-devtools__navigate_page,mcp__chrome-devtools__take_snapshot`). If the chrome-devtools MCP server is unavailable, skip browser steps and rely on WebSearch + fetch-job.sh — do not fail the run.

**Fetching a posting:** `fetch-job.sh` is the single path for every job posting URL (below). It does not consult qurl, so for the `WebFetch`/browser fallbacks (career pages, company about/team pages) check the cache first with `qurl get "<url>"` (exit 0 = cached content, use it; exit 1 = fetch, then `echo "<content>" | qurl add "<url>"`). Skip qurl for posting URLs: `fetch-job.sh` already returns fresh `posted_date`/`status`.

**Job fetch pattern** — the only way to fetch a job posting URL. Returns structured JSON with `posted_date` and `status` pre-extracted:

```bash
RESULT=$(bash ${CLAUDE_PLUGIN_ROOT}/skills/job-search/scripts/fetch-job.sh "$JOB_URL")
POSTED_DATE=$(echo "$RESULT" | jq -r '.posted_date')   # YYYY-MM-DD or "unknown"
STATUS=$(echo "$RESULT"     | jq -r '.status')          # "open", "closed", or "unknown"
CONTENT=$(echo "$RESULT"    | jq -r '.content')
```

The script auto-selects the best source: **Greenhouse API → Lever API → Jina Reader → plain curl**. Do not call raw `curl`, Jina or `WebFetch` for posting URLs; the script already falls back through them (Jina needs `JINA_API_KEY`).

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

**Spawn all 3 agents simultaneously using the Task tool.** Each agent operates independently within its budget. Do not wait for one to finish before spawning the next. Subagents don't inherit the loaded context: paste each agent the profile sections it needs (named below) in its prompt.

---

**Agent 1 — Direct Career Pages + LinkedIn Browser**

Budget: max 4 career page fetches + LinkedIn browser search. Input: profile **Search Plan → Career Pages** and **LinkedIn Searches**.

1. Use `mcp__chrome-devtools__navigate_page` to open each URL under **Career Pages** (first 4 only), then `take_snapshot` to extract roles:
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
3. Discard postings explicitly marked closed/filled.
4. If the date is unknown, proceed to parse — but flag `posted_date: unknown`.

For each surviving posting, fetch the full content:
```bash
RESULT=$(bash ${CLAUDE_PLUGIN_ROOT}/skills/job-search/scripts/fetch-job.sh "$JOB_URL")
POSTED_DATE=$(echo "$RESULT" | jq -r '.posted_date')
STATUS=$(echo "$RESULT"     | jq -r '.status')
CONTENT=$(echo "$RESULT"    | jq -r '.content')
```

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

1. Search `[company] careers engineering 2026` and `[company] jobs AI ML 2026`
2. Fetch career page (use the URL from the target-companies list when the company is there) via browser (`mcp__chrome-devtools__navigate_page` + `take_snapshot`) or Jina Reader as fallback
3. **Apply freshness filter:** discard any role marked closed/filled or with a posted date older than 5 months. Flag roles with no visible date as `posted_date: unknown`.
4. List only open, recent roles in a table with `URL` and `Posted` columns (clickable markdown links)
5. Score each using the multi-dimensional matrix
6. For top 3: provide positioning frame, proof points, gaps
7. For any 80%+ match: invoke `find-linkedin-contacts` automatically

---

## Mode 3: Deep Analysis

1. Fetch the full posting: `bash ${CLAUDE_PLUGIN_ROOT}/skills/job-search/scripts/fetch-job.sh "[url]"` — returns `{url, posted_date, status, content}` JSON
2. **Freshness check:** extract the posted date from the parsed content. If the role is closed or older than 5 months, **stop and report** — do not score. If date is unknown, note it and proceed with a warning.
3. Score with dimension breakdown
4. Determine positioning frame
5. Map every requirement to a proof point
6. Identify gaps honestly
7. Check for hidden fit signals
8. Recommend GO / STRETCH / PASS

```
## Deep Analysis: [Role] at [Company]

**Job URL**: [link]
**Posted Date**: [date or "unknown"]
**Status**: Open / Closed / Unknown
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

1. Run Deep Analysis (Mode 3)
2. If score >= 60%, generate cover letter + resume talking points + approach angle
3. Automatically invoke `find-linkedin-contacts` for this company+role

### Cover Letter Structure
1. Opening hook — the most relevant intersection, not generic interest
2. Proof point 1 — strongest matching case study with concrete metrics
3. Proof point 2 — complementary case study showing breadth
4. Bridge — connect to what the company specifically needs
5. Close — forward-looking, specific to the team/mission

Rules: concrete outcomes only, ~350 words, tone matched to culture.

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
- Be honest about gaps rather than overselling.
- Prioritize roles where the candidate's intersection is a genuine advantage, not just a checkbox match.
- When in doubt about positioning, use the default frame under **Dynamic Positioning Frames**.
- All searches should include current year to find active postings
- If a career page is behind authentication or can't be fetched, note this and suggest the user check manually
