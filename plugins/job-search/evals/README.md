# job-search evals

Run from `plugins/job-search`. The cases need their scaffolds and the gated tools:

```bash
claude plugin eval . --scaffold --allow-tools Bash Write
```

`--runs 1 --ablation none --threshold 0` gives a cheap smoke pass.

All fixtures live in `_fixtures/common.sh` and are fictional. This repo is public, so
never add real candidate data. Each case writes a project-level config, which outranks
`~/.claude/job-search.local.md`.

Postings skip `fetch-job.sh` (the prompt points at a local file), so these cases cover
the skill's decisions, not the fetcher. Dates are generated relative to today.
