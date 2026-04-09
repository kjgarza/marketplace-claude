# Data Contracts — YAML Frontmatter Schemas

Every stage output is a markdown file with YAML frontmatter. These schemas define the required fields.

## Stage 1: `problem_space.md`

```yaml
---
run_id: string           # e.g. "ideation-run-01"
created_at: ISO8601      # e.g. "2026-04-08T14:30:00Z"
version: "1.0"
problem_count: integer
capability_count: integer
aspirational_count: integer
timeline: enum           # exploring | next_quarter | urgent
---
```

**Body structure**:
- `# Problem areas` — one `## prob_XX: [name]` per problem, with fields: Who is affected, What happens today, What should happen instead, Severity (1-5)
- `# Existing capabilities` — one `## cap_XX: [name]` per capability, with fields: Type, Description, Maturity, Constraints
- `# Aspirational capabilities` — one `## asp_XX: [name]` per aspirational, with fields: Type, What it would provide, What's needed to get there, Estimated effort, Dependencies
- `# Solution constraints` — Must, Must not, Target users, Technical environment, Timeline pressure

## Stage 2: `solutions.md`

```yaml
---
run_id: string
created_at: ISO8601
input_file: "problem_space.md"
version: "1.0"
solution_count: integer          # total across all problems
problems_addressed: [string]     # e.g. [prob_01, prob_02, prob_03]
---
```

**Body structure**:
- `# Solutions`
- Per problem: `## Problem: prob_XX — [name]`
- Per solution: `### sol_XX_YY: [SolutionName]` with fields:
  - Tagline, Interaction model, Automation level, Scope
  - Description (2-3 paragraphs)
  - Uses existing capabilities (bullet list with cap_XX refs)
  - Needs aspirational capabilities (bullet list with asp_XX refs + effort)
  - Key features (bullet list)
  - Target user persona
  - Success metric

## Stage 3: `reviewed_solutions.md`

```yaml
---
run_id: string
created_at: ISO8601
input_file: "solutions.md"
version: "1.0"
total_evaluated: integer
passed: integer
culled_feasibility: integer
culled_novelty: integer
culled_duplicate: integer
---
```

**Body structure**:
- `# Review summary` — totals table by problem
- `# Passed solutions` — per problem section, each passed solution has:
  - Feasibility score + rationale
  - Novelty score + rationale
  - Deduplication status (unique | near_duplicate)
  - Reviewer notes
  - Full specification in blockquote (`> **Full specification** ...`)
- `# Culled solutions summary` — table with Solution, Reason, Scores

## Stage 4: `ui_concepts.md`

```yaml
---
run_id: string
created_at: ISO8601
input_file: "reviewed_solutions.md"
version: "1.0"
solutions_with_uis: integer
total_ui_concepts: integer
---
```

**Body structure**:
- `# UI concepts`
- Per solution: `## sol_XX_YY: [Name] (interaction_model, automation_level)`
- Per UI concept: `### ui_XX_YY_Z — [1-line description]`
  - Description paragraph
  - ASCII art in fenced code block (60x30 max)
  - `**Style**:` tag
  - `**Key interactions**:` comma-separated list

## Stage 5: `prototypes/solution_{sol_id}.html`

No YAML frontmatter — these are standalone HTML files. See `html-prototype-spec.md` for requirements.
