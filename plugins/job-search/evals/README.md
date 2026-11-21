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

## Baseline (2026-11-21)

Command: `claude plugin eval . --scaffold --allow-tools Bash Write --trust-plugin --no-publish --max-cost-usd 12 -j 4`
(3 runs per case, with-plugin and no-plugin arms; claude 2.1.330, judge haiku; 349 s, about $9.31).
Run against this branch, so before job-search 1.1.0 (#44).

Overall: 3 of 8 cases pass every run, mean score 0.87, mean delta vs no plugin +0.44.

| Case | Score | Pass rate | No-plugin score | Failing graders (of 3 runs) |
|---|---|---|---|---|
| analyze-closed-stops | 1.00 | 3/3 | 0.33 | none |
| analyze-strong-fit | 1.00 | 3/3 | 0.57 | none |
| broken-config-stops | 1.00 | 3/3 | 0.67 | none |
| contacts-excludes-executives | 0.95 | 2/3 | 0.33 | flags-unknown-url (1) |
| prepare-low-score-no-letter | 0.92 | 2/3 | 0.50 | recommends-pass (1) |
| prepare-strong-package | 0.76 | 0/3 | 0.29 | letter-no-self-disclaimed-gaps (3), no-invented-facts (1), saved-package (1) |
| analyze-stale-stops | 0.67 | 0/3 | 0.11 | reports-stale (3) |
| routes-to-job-search | 0.67 | 0/3 | 0.67 | no-hardcoded-candidate (3) |

Known: the cover-letter gap disclaimers are a real skill bug (Mode 4). `routes-to-job-search`
shows no delta over the no-plugin arm, and `analyze-stale-stops` and `no-hardcoded-candidate` fail
every run, so check whether those graders or the skill are at fault before treating this as a gate.
