---
name: find-kristian-jobs
description: Search for jobs and prepare application materials for Kristian Garza. Use when asked to find jobs, search job boards, match jobs to skills, prepare cover letters, or help with job applications for Kristian.
---

# Find Jobs for Kristian Garza

You are a job search agent for **Kristian Garza**, a Senior AI Engineer at Digital Science based in Berlin. Your job is to find, analyze, and prepare application materials for above-senior roles (Lead, Principal, Staff, Manager, Director) that match his rare cross-disciplinary profile.

## Reference Files

Before proceeding, read these reference files for full context:
- `references/kristian-profile.md` — Complete candidate profile with proof points, tech stack, publications, and positioning frames
- `references/target-companies.md` — Curated target company list across three tiers

## Scripts

Bundled helper scripts live in the `scripts/` subfolder of this skill:

| Script | Purpose |
|--------|---------|
| `scripts/fetch-job.sh <url>` | Fetch a job posting and return `{url, posted_date, status, content}` JSON. Auto-selects: Greenhouse API → Lever API → Jina Reader → plain curl. |
| `scripts/run-job-search.sh` | Run a full unattended search (cron/remote trigger). Invokes Claude in `bypassPermissions` mode and sends a push notification when done. |

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
| Parse job posting content | `Bash`: `bash ${CLAUDE_PLUGIN_ROOT}/skills/find-kristian-jobs/scripts/fetch-job.sh "[url]"` |
| Fallback fetch | `WebFetch` |

Browser tools are deferred — load schemas first with `ToolSearch` (`select:mcp__chrome-devtools__navigate_page,mcp__chrome-devtools__take_snapshot`). If the chrome-devtools MCP server is unavailable, skip browser steps and rely on WebSearch + fetch-job.sh — do not fail the run.

**URL Caching with qurl — check before every fetch:**
```bash
qurl get "<url>"   # exits 0 with content if cached; exits 1 if not found
```
- Exit 0: use returned content directly. Skip Jina/WebFetch.
- Exit 1: proceed with Jina or WebFetch, then index the result:
```bash
echo "<fetched_content>" | qurl add "<url>"
```
Applies to: job posting URLs, career page URLs, company about/team pages.

**Jina Reader pattern:** `curl -H "Authorization: Bearer $JINA_API_KEY" "https://r.jina.ai/[url]"` — use for every job posting URL to get clean markdown fast. Always preferred over raw WebFetch.
**Job fetch pattern** — use for every job posting URL. Returns structured JSON with `posted_date` and `status` pre-extracted:

```bash
RESULT=$(bash ${CLAUDE_PLUGIN_ROOT}/skills/find-kristian-jobs/scripts/fetch-job.sh "$JOB_URL")
POSTED_DATE=$(echo "$RESULT" | jq -r '.posted_date')   # YYYY-MM-DD or "unknown"
STATUS=$(echo "$RESULT"     | jq -r '.status')          # "open", "closed", or "unknown"
CONTENT=$(echo "$RESULT"    | jq -r '.content')
```

The script auto-selects the best source: **Greenhouse API → Lever API → Jina Reader → plain curl**. Always preferred over raw `curl` or `WebFetch`.

## Output

Always save results to a markdown file under `leads/` at the repository root, in addition to displaying them in the conversation.

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
| `/find-kristian-jobs` (no args) | **Full Search** — spawn 3 parallel subagents |
| `/find-kristian-jobs [company name]` | **Company Search** — targeted search at a specific company |
| `/find-kristian-jobs analyze [job URL]` | **Deep Analysis** — score and analyze a specific posting |
| `/find-kristian-jobs prepare [job URL]` | **Application Package** — generate full application materials |

---

## Mode 1: Full Search

### Step 1 — Spawn 3 Parallel Subagents

**Spawn all 3 agents simultaneously using the Task tool.** Each agent operates independently within its budget. Do not wait for one to finish before spawning the next.

---

**Agent 1 — Direct Career Pages + LinkedIn Browser**

Budget: max 4 career page fetches + LinkedIn browser search.

1. Use `mcp__chrome-devtools__navigate_page` to open each career page, then `take_snapshot` to extract roles:
   - `https://openai.com/careers/search/`
   - `https://www.anthropic.com/careers/jobs`
   - `https://holtzbrinck.com/en/jobs`
   - On each career page, check for a "posted date" or "last updated" field; skip any role posted more than 5 months ago or marked closed.
2. Search LinkedIn Jobs via browser (filtered to past 5 months, ≈150 days = 12 960 000 s):
   - Navigate to `https://www.linkedin.com/jobs/search/?keywords=AI+Engineer+research+infrastructure&location=Europe&f_TPR=r12960000`
   - Use `take_snapshot` to extract job titles, companies, URLs, **and posted dates**
   - Run 1–2 additional LinkedIn searches varying keywords (Staff Engineer LLM, Head of AI open science) using the same `f_TPR=r12960000` filter
   - Discard any result where LinkedIn shows "Closed" or a posted date older than 5 months
3. Return: list of `{title, company, url, posted_date}` objects — include `posted_date` whenever visible

---

**Agent 2 — Track A: AI Labs (WebSearch)**

Budget: max 5 WebSearch queries. Stop after 5.

Queries (pick the most relevant 5):
- `"AI Engineer" OR "ML Engineer" research infrastructure remote Europe 2026`
- `"Staff Engineer" OR "Principal Engineer" LLM knowledge graph remote 2026`
- `"Head of AI" OR "Director of AI" open science remote Europe 2026`
- `"Engineering Lead" developer tools research remote Europe 2026`
- `Anthropic OR OpenAI OR "Google DeepMind" OR "Mistral AI" careers AI engineer Europe 2026`

For each result, note the date shown in the search snippet. Discard any result whose snippet date is older than 5 months or whose title/snippet signals the role is closed.

Return: list of `{title, company, url, posted_date}` objects found in search results (`posted_date` = date from snippet, or `unknown`).

---

**Agent 3 — Track B: Research Infrastructure (WebSearch)**

Budget: max 5 WebSearch queries. Stop after 5.

Queries:
- `"Senior Engineer" OR "Lead Engineer" scholarly infrastructure remote 2026`
- `"Staff Engineer" OR "Principal Engineer" open science remote Europe 2026`
- `"Head of Engineering" research data infrastructure remote 2026`
- `"Engineering Manager" scientific publishing technology remote 2026`
- `"Chan Zuckerberg" OR "Crossref" OR "ORCID" OR "Allen Institute" OR "Hugging Face" careers engineering 2026`

For each result, note the date shown in the search snippet. Discard any result whose snippet date is older than 5 months or whose title/snippet signals the role is closed.

Return: list of `{title, company, url, posted_date}` objects (`posted_date` = date from snippet, or `unknown`).

---

### Step 2 — Deduplicate, Filter Freshness, and Parse

Collect all results from the 3 agents. Deduplicate by URL.

**Ledger dedup:** if `leads/pipeline.json` exists at the repo root, drop every URL already present in it — those jobs were handled in a previous run (any status). Report the count dropped ("N already in pipeline").

If total > 20, keep the 20 most relevant by title/company.

**Freshness filter — run before parsing:**
1. For each posting, check any date metadata already returned (LinkedIn `f_TPR` filter, search snippet dates, `posted_date` from agents).
2. Discard postings with a known date older than **5 months** from today.
3. Discard postings explicitly marked closed/filled.
4. If the date is unknown, proceed to parse — but flag `posted_date: unknown`.

For each surviving posting, fetch the full content:
```bash
RESULT=$(bash ${CLAUDE_PLUGIN_ROOT}/skills/find-kristian-jobs/scripts/fetch-job.sh "$JOB_URL")
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

| Dimension | Weight | Scoring Guide |
|-----------|--------|---------------|
| **Domain alignment** | 30% | Scholarly infra/open science = 100, AI/ML = 90, devtools = 80, knowledge management = 70, general SaaS = 30 |
| **Seniority fit** | 20% | Director/Head = 100, Principal/Staff = 90, Lead/Manager = 85, Senior = 50, Mid = 10 |
| **Skill stack overlap** | 20% | (matched skills / required skills) × 100. Key skills: LLMs, Python, FastAPI, distributed systems, UX research, design systems, Kubernetes, PID systems |
| **Work arrangement** | 15% | Remote Europe = 100, Berlin-based = 100, Remote global = 80, Hybrid Berlin = 70, Other EU city = 50, US-only = 0 |
| **Mission/culture** | 15% | Open source + research-driven = 100, mission-oriented = 80, commercial but ethical = 50, pure enterprise = 20 |

Filter to 60%+. Flag 80%+ as strong matches.

### Step 4 — Hidden Fit Detection

Flag postings where the title doesn't match but the description signals latent need:
- "AI Engineer" mentioning documentation, metadata, or knowledge management
- "Research Software Engineer" mentioning LLMs or NLP
- "Product Engineer" mentioning user research or design systems
- "Backend Engineer" mentioning scholarly, academic, or publishing

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
2. Fetch career page via browser (`mcp__chrome-devtools__navigate_page` + `take_snapshot`) or Jina Reader as fallback
3. **Apply freshness filter:** discard any role marked closed/filled or with a posted date older than 5 months. Flag roles with no visible date as `posted_date: unknown`.
4. List only open, recent roles in a table with `URL` and `Posted` columns (clickable markdown links)
5. Score each using the multi-dimensional matrix
6. For top 3: provide positioning frame, proof points, gaps
7. For any 80%+ match: invoke `find-linkedin-contacts` automatically

---

## Mode 3: Deep Analysis

1. Fetch the full posting: `bash ${CLAUDE_PLUGIN_ROOT}/skills/find-kristian-jobs/scripts/fetch-job.sh "[url]"` — returns `{url, posted_date, status, content}` JSON
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

## Proof Points Quick Reference

| Instead of... | Say... |
|---------------|--------|
| "Experience with LLMs" | "Built an NLP-to-structured-query API serving production traffic (FastAPI + LangChain + pgvector)" |
| "UX research skills" | "Ran a 56-person focus group across 10 organizations, delivered 42% reduction in lead time" |
| "Backend engineering" | "Designed a SUSHI-compliant API handling 50K datasets with 70% storage cost reduction (S3/MySQL hybrid)" |
| "Design systems experience" | "Led creation of a WCAG-compliant design system unifying 4 web services, managing a 4-person team" |
| "Publications" | "18+ publications on LLMs, scholarly metadata, and PIDs including research on language UIs for repository discovery" |
| "AI side projects" | "Built Dataset Discovery Agent (AI SDK), ParrotGPT (metadata schema translation), SnowyOwl (async AI dev tool)" |
| "Thought leadership" | "Host Digital Science's AI Technology Radar sessions; maintain a personal tech radar for tool evaluation" |

## Important Notes

- Always read the full reference files before generating any output
- Be honest about gaps — Kristian values authenticity over overselling
- Prioritize roles where the cross-disciplinary intersection is a genuine advantage, not just a checkbox match
- When in doubt about positioning, default to "production AI engineer with deep domain expertise in research infrastructure"
- All searches should include current year to find active postings
- If a career page is behind authentication or can't be fetched, note this and suggest the user check manually
