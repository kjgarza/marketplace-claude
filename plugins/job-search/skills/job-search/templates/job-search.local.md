---
# Where search results and the pipeline ledger (pipeline.json) live. Must exist.
leads_dir: ~/job-search/leads
# Candidate profile (copy of templates/profile.md, filled in).
profile: job-search/profile.md
# Target company tiers (copy of templates/target-companies.md, filled in).
target_companies: job-search/target-companies.md
---

Config for the `job-search` skill. Keep this file and the files it points to
out of version control: they hold personal data.

Lookup order: `$JOB_SEARCH_CONFIG`, then `./.claude/job-search.local.md`
(project override), then `~/.claude/job-search.local.md` (user default).
Relative paths resolve against this file's directory; `~` is expanded.
