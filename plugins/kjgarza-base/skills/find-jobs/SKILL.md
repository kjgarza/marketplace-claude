---
name: find-jobs
description: Search for jobs and prepare application materials for Claudia Garcia. Use when asked to find jobs, search job boards, match jobs to skills, prepare cover letters, or help with job applications. Searches LinkedIn, Indeed, and other job boards via web search, then analyzes matches against Claudia's Customer Success/CRM background.
---

# Find Jobs for Claudia

Job search and application preparation skill for Claudia Garcia, Senior Customer Success Manager.

## Workflow

### 1. Search for Jobs

Use WebSearch to find relevant positions:

```
WebSearch: "Senior Customer Success Manager" OR "Customer Success Lead" site:linkedin.com OR site:indeed.com
```

Target roles based on Claudia's background:
- Senior Customer Success Manager
- Customer Success Lead/Director
- Strategic Account Manager
- Client Success Manager
- CRM Manager/Director
- Audience/Engagement Manager

Include location preferences if specified. Default to Berlin or remote positions.

### 1.5. qurl Gate — Skip Already-Known Jobs

Before scoring, check each job URL against the qurl decision ledger. `qurl get`
exits 1 only when the URL is not cached; when cached (exit 0) it prints the
stored tag on the `Tags:` line of stdout. Pass `--no-body` so the gate check
doesn't dump the whole stored document, and branch on the parsed tag — not the
exit code, which can't distinguish `found` from `applied`/`skipped`/`rejected`:

```bash
state="$(qurl get "<job_url>" --no-body 2>/dev/null | sed -n 's/^.*Tags: //p')"
```

An empty `$state` means the URL isn't cached (exit 1) — treat it as a new job.

| `qurl get` result | Action |
|-------------------|--------|
| Exit 1 (not cached) | New job — continue to Step 2 |
| `Tags:` contains `found` | Pending review — count in digest, skip reprocessing |
| `Tags:` contains `applied` | Already applied — skip |
| `Tags:` contains `skipped` | Passed on this — skip |
| `Tags:` contains `rejected` | Rejected or expired — skip |

### 2. Analyze Job Match

For each job found, read the posting and score against Claudia's profile in `references/claudia-profile.md`.

**Match criteria:**
| Category | Look For |
|----------|----------|
| Core skills | Customer success, CRM, retention, engagement |
| Tools | Braze, marketing automation, CRM platforms |
| Domain | SaaS, B2B, tech, e-commerce, gaming |
| Languages | English, Spanish, German (trilingual) |
| Seniority | Senior/Lead (6+ years experience) |

**Scoring:**
- **Strong match (80%+)**: Core CS role, SaaS/tech, requires Braze or similar
- **Good match (60-79%)**: Adjacent role, transferable skills apply
- **Weak match (<60%)**: Missing key requirements or domain mismatch

### 2.5. Record New Findings

For each new job that scores strong or good match, record it in qurl and create
a Taskwarrior review task:

`qurl add` is a content indexer — it reads the body from stdin or `--file` and
aborts with `No content provided` if neither is given. Always pipe a content
line; re-adding the same URL replaces its tag set (this is how state
transitions `found`→`applied`).

```bash
# Tag the URL as found — gates future runs from reprocessing
echo "Job: [Company] [Role] | score [score]% | $(date +%F)" \
  | qurl add "<job_url>" --source jobs --tags "found"

# Create a review task in the job pipeline
task add "Review: [Company] — [Role] ([score]%)" project:JobSearch +review
task <new-id> annotate "<job_url>"
```

For weak matches (<60%): tag as `skipped` in qurl, no Taskwarrior task.

```bash
echo "Job: [Company] [Role] | score [score]% | $(date +%F)" \
  | qurl add "<job_url>" --source jobs --tags "skipped"
```

When Claudia submits an application, update both stores:
```bash
task <id> done
echo "Job: [Company] [Role] | applied | $(date +%F)" \
  | qurl add "<job_url>" --source jobs --tags "applied"
```

### 3. Prepare Application Materials

For strong matches, prepare:

**A. Match Analysis**
- List matching qualifications with evidence from resume
- Identify gaps and mitigation strategies
- Highlight unique value propositions

**B. Tailored Cover Letter**
Structure:
1. Opening hook connecting to company/role
2. Relevant achievement from Braze (6M+ ARR, EBRs, customer advocacy)
3. Supporting experience from HelloFresh/GameDuell
4. Cultural/mission alignment
5. Call to action

**C. Resume Talking Points**
Key achievements to emphasize based on job requirements:
- Strategic account management (6M+ ARR portfolio at Braze)
- Cross-functional collaboration (Product, Sales, Marketing)
- Customer engagement (EBRs, workshops, champion programs)
- Retention/growth metrics (80% YoY revenue, 50% opt-in increase)
- A/B testing and data-driven optimization

## Auto Mode (--auto)

Headless execution for cron. Invoked as `find-jobs --auto`. Runs Steps 1, 1.5,
2, and 2.5 only — no cover letter generation, no interactive output.

1. Search job boards (Step 1)
2. Gate against qurl ledger (Step 1.5)
3. Score new matches (Step 2)
4. Record findings in qurl + Taskwarrior (Step 2.5)
5. Print digest to stdout:
   ```
   Job scan complete (YYYY-MM-DD): N new tasks created, M pending review, P applications open.
   ```

Cover letter prep (Step 3) remains manual — start the Taskwarrior review task
interactively when ready to apply.

## Quick Commands

- "Find CS jobs in Berlin" → Search + list matches
- "Analyze [job URL]" → Fetch job, score match, identify gaps
- "Prepare application for [company]" → Full package: analysis + cover letter + talking points

## Resources

See `references/claudia-profile.md` for full resume and skills profile.
