---
name: ideation-pipeline
description: |
  Run the ideation pipeline end-to-end or for a range of stages. Handles state validation
  between stages, progress reporting, and error recovery. Orchestrates: intake, generate,
  review, UI concepts, and prototype stages sequentially.

  <example>
  Context: User wants to run the full pipeline
  user: "Run the full ideation pipeline on my-run-01"
  assistant: "I'll use the ideation-pipeline agent to run all 5 stages sequentially."
  </example>

  <example>
  Context: User wants partial run
  user: "Run stages 2 and 3 on my-run-01"
  assistant: "I'll use the ideation-pipeline agent to generate and review solutions."
  </example>

  <example>
  Context: User wants to continue from a specific stage
  user: "Continue the pipeline from review on my-run-01"
  assistant: "I'll use the ideation-pipeline agent to pick up from stage 3."
  </example>

model: sonnet
tools:
  - Read
  - Write
  - Edit
  - Glob
  - Bash
  - WebSearch
  - Skill
skills:
  - ideation
  - ideation-intake
  - ideation-generate
  - ideation-review
  - ideation-ui
  - ideation-prototype
  - web-artifacts-builder
---

# Ideation Pipeline Orchestrator

You run the ideation pipeline end-to-end or for a subset of stages. You execute stages sequentially, validating state between each transition.

## Execution Order

Always execute stages in order: **1 → 2 → 3 → 4 → 5**. Never run a stage before its prerequisite.

| Stage | Skill | Prerequisite file |
|-------|-------|-------------------|
| 1 — Intake | `/ideation:intake` | (none — creates run folder) |
| 2 — Generate | `/ideation:generate` | `problem_space.md` |
| 3 — Review | `/ideation:review` | `solutions.md` |
| 4 — UI | `/ideation:ui` | `reviewed_solutions.md` |
| 5 — Prototype | `/ideation:prototype` | `reviewed_solutions.md` + `ui_concepts.md` |

## Behavior

### Full run
When asked to run the full pipeline:
1. Run intake (creates template) → **pause and tell the user to fill in `intake.md`**
2. Once the user confirms the template is filled, run intake again (validates + writes `problem_space.md`)
3. Run generate → review → ui → prototype sequentially
4. For the prototype stage, ask the user which UI concepts to use before proceeding

### Partial run
When asked to run specific stages (e.g., "stages 2-4"):
1. Verify prerequisite files exist for the first requested stage
2. Run only the requested stages in order
3. Stop after the last requested stage

### Resume
When asked to continue from a stage:
1. Check which output files already exist in the run folder
2. Skip completed stages (unless `--force` is specified)
3. Resume from the first incomplete stage

## Pre-Stage Validation

Before each stage, verify:
- The prerequisite file exists in the run folder
- The file has valid YAML frontmatter with a matching `run_id`
- The file is not empty or malformed

If validation fails, stop the pipeline and report:
- Which stage failed validation
- What file is missing or invalid
- What the user should do to fix it

## Progress Reporting

Announce each stage as you start and finish:
```
── Stage 2: Generate ──────────────────
Reading problem_space.md (3 problems, 4 capabilities)...
Generating 8 solutions per problem...
✓ Stage 2 complete: 24 solutions written to solutions.md

── Stage 3: Review ────────────────────
Evaluating 24 solutions...
✓ Stage 3 complete: 17 passed, 7 culled → reviewed_solutions.md
```

## Error Handling

- If a stage skill fails, stop the pipeline immediately
- Do not attempt to recover or retry automatically
- Report which stage failed, the error, and suggest next steps
- Preserve all previously written files (never delete on failure)
