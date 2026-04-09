# Scoring Rubric — Solution Review

## Scoring Dimensions

| Dimension | Scale | Pass Threshold | What it measures |
|-----------|-------|----------------|------------------|
| Feasibility | 1-5 | >= 3 | Can we actually build this with available resources and constraints? |
| Novelty | 1-5 | >= 2 | Does this bring a meaningfully different approach vs. obvious solutions? |
| Deduplication | unique / near_duplicate / duplicate | not duplicate | Is this substantively different from other solutions across all problems? |

## Pass Rule

A solution passes if **all three** conditions are met:
1. Feasibility >= 3
2. Novelty >= 2
3. Deduplication status is `unique` or `near_duplicate`

## Feasibility Scale

| Score | Meaning |
|-------|---------|
| 5 | Straightforward with existing capabilities and team bandwidth |
| 4 | Achievable with modest new work (days-weeks of aspirational capability effort) |
| 3 | Realistic but requires meaningful investment (weeks-months) |
| 2 | Possible but significant blockers (missing capabilities, unclear path) |
| 1 | Unrealistic given current constraints (missing infrastructure, no team bandwidth, timeline mismatch) |

## Novelty Scale

| Score | Meaning |
|-------|---------|
| 5 | Genuinely surprising approach — reframes the problem |
| 4 | Creative combination of existing ideas applied in a new way |
| 3 | Solid differentiation from the obvious solution |
| 2 | Incremental variation — useful but not inspiring |
| 1 | The first thing anyone would think of — table stakes |

## Near-Duplicate Rules

Two solutions are **near-duplicates** if they:
- Solve the same problem with the same core mechanism, differing only in interaction model or scope
- Would share >70% of the same backend implementation

Near-duplicates are **kept** but annotated: `near_duplicate of sol_XX_YY`.

Two solutions are **duplicates** if they:
- Are functionally identical despite different names
- Would be indistinguishable to the end user

Duplicates are **culled**. The higher-scoring version is kept.

## Cross-Problem Deduplication

Solutions are also checked **across problems**, not just within a single problem. A solution for prob_01 might duplicate one for prob_02 if they share the same mechanism and user experience.
