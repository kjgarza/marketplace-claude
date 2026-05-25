---
name: find-linkedin-contacts
description: "Find LinkedIn contacts at a target company for a specific job role. Use when helping with job applications and needing to identify people to reach out to — hiring managers, direct managers, and team members who are decision makers. Excludes C-suite, founders, and owners. Works alongside find-kristian-jobs and find-jobs skills. Triggers when asked to find contacts at a company, who should I reach out to for a job, find the hiring manager at a company, find people to reach out to on LinkedIn, build my outreach list for a job or company, or find decision makers at a company."
---

# Find LinkedIn Contacts

Identify the right people to contact at a target company and build a prioritized outreach plan with ready-to-send LinkedIn messages.

## Input

Accept any of:
- Company name + job title (from find-kristian-jobs or find-jobs output)
- A job posting URL (fetch and extract company and role)
- Company name + department (e.g. "DataCite, engineering")
- Company website URL (use as a scraping source for team/people pages)

## Workflow

### 1. Extract Target Info

If given a job URL, fetch it using Jina Reader with the API key from the environment:
```bash
curl -H "Authorization: Bearer $JINA_API_KEY" "https://r.jina.ai/[job-url]"
```
Extract: company name, job title, department, team/product area, location.

Also note the company's main domain (e.g. `datacite.org`) — used in Step 2.

### 2. Scrape the Company Website for Team/People Pages

Before searching LinkedIn, check the company website directly. Many companies list team members on `/team`, `/about`, `/people`, or `/staff` pages.

Fetch using Jina Reader with the API key (authenticated requests get higher rate limits and better rendering):
```bash
curl -H "Authorization: Bearer $JINA_API_KEY" "https://r.jina.ai/https://[company-domain]/team"
curl -H "Authorization: Bearer $JINA_API_KEY" "https://r.jina.ai/https://[company-domain]/about"
curl -H "Authorization: Bearer $JINA_API_KEY" "https://r.jina.ai/https://[company-domain]/people"
```

If Jina returns a redirect or empty content, fall back to direct curl:
```bash
curl -sL "https://[company-domain]/team" | grep -i "name\|title\|role\|linkedin"
```

**What to extract from company pages:**
- Names and titles of team members
- Any linked LinkedIn profiles (look for `linkedin.com/in/` hrefs)
- Team structure clues (who reports to whom, what teams exist)

### 3. Search LinkedIn via Browser (Claude Chrome)

Use browser automation (`mcp__claude-in-chrome__*`) to search LinkedIn directly. This gives more accurate, up-to-date results than web search alone.

**Steps:**
1. Get the current tab context with `tabs_context_mcp`
2. Navigate to `https://www.linkedin.com/search/results/people/` with query params, or use the LinkedIn search bar
3. Search for: `[company name] [role/department]` and filter by "People"
4. For each result page, use `get_page_text` or `read_page` to extract names, titles, and profile URLs
5. Click into promising profiles to verify current employer and role

**Search queries to run in LinkedIn:**
- `[company name] engineering manager` (P1 target)
- `[company name] [job title]` (P2 peers)
- `[company name] recruiter` (P3)

**LinkedIn profile URL pattern:** `linkedin.com/in/[handle]` — capture these directly from search results.

**Note:** Only navigate profiles — do not send connection requests or messages via browser automation. Connection requests require explicit user action.

### 4. Supplement with WebSearch

Fill any gaps with WebSearch using these patterns:

```
site:linkedin.com/in "[company]" "engineering manager" OR "head of" "[department]"
site:linkedin.com/in "[company]" "[job title]" -CEO -founder -owner -president
site:linkedin.com/in "[company]" "recruiter" OR "talent acquisition"
"[company]" "[job title]" linkedin.com/in
```

Run 2–3 searches only if browser search didn't surface enough candidates.

### 5. Filter and Classify

**Exclude always:** CEO, CTO, COO, CFO, CPO, founder, co-founder, owner, president, board member.
VP-level: exclude at large companies (>500 employees); keep at startups/small orgs where a VP may be the direct manager.

**Keep and classify as:**

| Priority | Role type | Examples |
|----------|-----------|---------|
| 🥇 P1 — Decision maker | Hiring manager / direct manager | Engineering Manager, Head of Platform, Director of Data |
| 🥈 P2 — Team peer | Same or adjacent role | Senior Engineer, Data Engineer, Researcher |
| 🥉 P3 — Recruiter | Talent / people team | Technical Recruiter, Talent Partner |

### 6. Build the Contact List

```
## Contacts at [Company] for [Job Title]

| Priority | Name | Title | LinkedIn URL | Source | Why reach out |
|----------|------|-------|-------------|--------|---------------|
| 🥇 P1 | Jane Doe | Engineering Manager | linkedin.com/in/janedoe | LinkedIn search | Likely direct manager |
| 🥈 P2 | John Smith | Senior Data Engineer | linkedin.com/in/johnsmith | Company /team page | Peer on the team |
| 🥉 P3 | Ana Torres | Technical Recruiter | linkedin.com/in/anatorres | WebSearch | Manages hiring pipeline |
```

If a LinkedIn URL wasn't confirmed, note it as `[verify URL]`.

### 7. Draft LinkedIn Connection Messages

Write a short, personalized message (≤300 chars) for each contact.

Load `references/outreach-templates.md` for base templates and personalization guidance.

**Message rules:**
- Be genuine, not salesy
- Reference something specific: the role, company project, or shared background found on the company site
- Do NOT write "I saw you're hiring" — too generic
- P1: Lead with curiosity about the team/work, not the job application
- P2: Lead with shared craft or interest in the company's technical work
- P3: Can be more direct about the application

### 8. Outreach Strategy

```
## Outreach Strategy for [Company]

**Day 1–2**: Connect with P1 (hiring manager / team lead)
  Message: [draft A]

**Day 3–4**: Connect with P2 peers
  Message: [draft B]

**Day 5+**: Connect with P3 recruiter — mention you've already reached out to the team
  Message: [draft C]

**After acceptance**: Follow up within 48h. See follow-up templates in references/outreach-templates.md.
```

## Tool Reference

| Task | Tool |
|------|------|
| Fetch job posting or company page | `Bash`: `curl -H "Authorization: Bearer $JINA_API_KEY" "https://r.jina.ai/[url]"` |
| Scrape company /team or /about page | `Bash`: `curl -H "Authorization: Bearer $JINA_API_KEY" "https://r.jina.ai/[url]"` |
| Search LinkedIn people | `mcp__claude-in-chrome__*` browser tools |
| Supplement with web search | `WebSearch` with `site:linkedin.com/in` |
| Read LinkedIn search results | `mcp__claude-in-chrome__get_page_text` |

**Jina Reader:** Prepend `https://r.jina.ai/` to any URL. Always pass `Authorization: Bearer $JINA_API_KEY` for authenticated requests (higher rate limits, better JS rendering).
Example: `curl -H "Authorization: Bearer $JINA_API_KEY" "https://r.jina.ai/https://datacite.org/team"`

## Quick Commands

- "Find contacts at [company] for [role]" → Full workflow
- "Who should I reach out to for [job URL]?" → Fetch + full workflow
- "Write me a LinkedIn message for [person/title]" → Draft single message only
- "Build outreach plan for [company]" → Strategy + ranked list

## Resources

See `references/outreach-templates.md` for connection request templates, follow-up messages, referral ask messages, and personalization patterns by contact type.
