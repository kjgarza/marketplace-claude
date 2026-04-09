---
name: ideation-generate
description: >
  Generate 8 diverse solutions per problem from the problem space. Each solution is a
  product specification with tagline, interaction model, capabilities, and success metrics.
  Supports optional --research flag for WebSearch. Use when the user says "generate solutions",
  "run crazy eight", "ideate on problems", or invokes /ideation:generate.
allowed-tools:
  - Read
  - Write
  - Glob
  - WebSearch
argument-hint: "[run-folder] [--research]"
---

# Ideation Generate

Generate 8 radically different solutions for each problem in the problem space. Each solution is a **product specification**, not a technical design.

## Steps

1. **Read `problem_space.md`** from the specified run folder.

2. **Validate input**:
   - File exists and has valid YAML frontmatter with `run_id`, `problem_count`
   - At least 1 problem with an assigned `prob_XX` ID
   - At least 1 capability with a `cap_XX` ID
   - If invalid, report what's wrong and stop

3. **Parse the `--research` flag** (optional):
   - If present, use WebSearch to find real-world analogues, prior art, and market examples for each problem area before generating solutions
   - Default: pure generation without web research

4. **For each problem**, generate exactly 8 solutions. Each solution must include:

   - **ID**: `sol_XX_YY` (XX = problem number, YY = solution number 01-08)
   - **Tagline**: One catchy sentence
   - **Interaction model**: one of: web, cli, api, bot, notification, extension, mobile, embedded
   - **Automation level**: one of: fully_manual, assisted, semi_automated, fully_automated
   - **Scope**: one of: minimal, focused, moderate, ambitious
   - **Description**: 2-3 paragraphs explaining what it does and how
   - **Uses existing capabilities**: Bullet list referencing `cap_XX` IDs — **at least one required**
   - **Needs aspirational capabilities**: Bullet list referencing `asp_XX` IDs with effort estimate, or "None"
   - **Key features**: 3-5 bullet points
   - **Target user persona**: One sentence describing the ideal user
   - **Success metric**: One measurable outcome

5. **Ensure diversity** across the 8 solutions for each problem. Read and follow [solution-diversity.md](../ideation/references/solution-diversity.md). The 5 diversity dimensions are:
   - Scope (minimal → ambitious)
   - Interaction model (web, cli, api, bot, notification, extension, mobile, embedded)
   - Automation level (manual → automated)
   - Capability reliance (mostly existing → mostly aspirational)
   - Approach (preventive/reactive, centralized/distributed, real-time/batch)

   No two solutions for the same problem should share the same position on more than two dimensions.

6. **Write `solutions.md`** with YAML frontmatter:

```yaml
---
run_id: {from problem_space.md}
created_at: {ISO8601 timestamp}
input_file: "problem_space.md"
version: "1.0"
solution_count: {total across all problems}
problems_addressed: [{list of prob_XX IDs}]
---
```

7. **Report**: Show the user a summary table — problems addressed, solutions per problem, diversity spread (interaction models used, automation levels used).

## Quality Checks

- Every solution must reference at least 1 existing capability (`cap_XX`)
- Aspirational capabilities (`asp_XX`) must include effort estimate when referenced
- Solution descriptions must be concrete enough to evaluate — no vague hand-waving
- If `--research` was used, cite specific real-world analogues in descriptions

## Reference

- Diversity dimensions: [solution-diversity.md](../ideation/references/solution-diversity.md)
- Output schema: [data-contracts.md](../ideation/references/data-contracts.md) (Stage 2 section)
