---
name: ideation-review
description: >
  Score and filter solutions on feasibility, novelty, and deduplication. Produces
  reviewed_solutions.md as the single source of truth for downstream stages. Use when
  the user says "review solutions", "evaluate ideas", "filter solutions", or invokes
  /ideation:review.
allowed-tools:
  - Read
  - Write
  - Glob
argument-hint: "[run-folder]"
---

# Ideation Review

Act as an independent evaluator. Score every solution, cull the weak ones, and produce `reviewed_solutions.md` — the single source of truth from this stage onward.

## Steps

1. **Read both files** from the run folder:
   - `solutions.md` — the solutions to evaluate
   - `problem_space.md` — for context on constraints, capabilities, and timeline pressure

2. **Validate inputs**:
   - Both files exist with valid YAML frontmatter
   - Solution IDs follow `sol_XX_YY` pattern
   - Every referenced `cap_XX` / `asp_XX` exists in `problem_space.md`
   - If invalid, report and stop

3. **Score each solution** on three dimensions. Follow the rubric in [scoring-rubric.md](../ideation/references/scoring-rubric.md):

   | Dimension | Scale | Pass Threshold |
   |-----------|-------|----------------|
   | Feasibility | 1-5 | >= 3 |
   | Novelty | 1-5 | >= 2 |
   | Deduplication | unique / near_duplicate / duplicate | not duplicate |

   For each score, write a 1-2 sentence rationale explaining the reasoning.

4. **Apply pass rule**: A solution passes if feasibility >= 3 AND novelty >= 2 AND not a duplicate.

5. **Check near-duplicates across problems** — not just within a single problem. Two solutions are near-duplicates if they share the same core mechanism and >70% of backend implementation would overlap. Near-duplicates are kept but annotated.

6. **Do NOT backfill**. If only 4 solutions pass for a problem, keep 4. Quality over quantity.

7. **Write `reviewed_solutions.md`** with this structure:

   **YAML frontmatter**:
   ```yaml
   ---
   run_id: {from solutions.md}
   created_at: {ISO8601 timestamp}
   input_file: "solutions.md"
   version: "1.0"
   total_evaluated: {count}
   passed: {count}
   culled_feasibility: {count}
   culled_novelty: {count}
   culled_duplicate: {count}
   ---
   ```

   **Body**:
   - `# Review summary` — Total counts + table by problem (Generated / Passed / Culled)
   - `# Passed solutions` — Grouped by problem. Each passed solution includes:
     - Feasibility score + rationale
     - Novelty score + rationale
     - Deduplication status
     - Reviewer notes (1-2 sentences of strategic commentary)
     - **Full specification in blockquote** — embed the complete solution spec from `solutions.md` inside a `>` blockquote. This makes `reviewed_solutions.md` self-contained.
   - `# Culled solutions summary` — Table with columns: Solution, Reason, Scores

   **Critical**: The full solution spec must be embedded in blockquotes under each passed solution. Downstream skills (`ideation-ui`, `ideation-prototype`) read only `reviewed_solutions.md` — they never go back to `solutions.md`.

8. **Report**: Show the user the summary table and highlight the top 3 most promising solutions with a brief note on why.

## Reference

- Scoring rubric: [scoring-rubric.md](../ideation/references/scoring-rubric.md)
- Output schema: [data-contracts.md](../ideation/references/data-contracts.md) (Stage 3 section)
