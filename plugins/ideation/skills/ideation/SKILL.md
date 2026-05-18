---
name: ideation
description: "Ideation pipeline management: configure runs, understand the 5-stage workflow (intake, generate, review, UI, prototype), and validate cross-stage consistency"
---

# Ideation Pipeline

A 5-stage skill chain that transforms a problem space into interactive HTML prototypes. Each stage reads the previous stage's markdown output and writes structured markdown for the next.

```
intake → generate → review → ui → prototype
  │          │          │       │       │
  ▼          ▼          ▼       ▼       ▼
problem    solutions  reviewed  ui    prototypes/
_space.md   .md       _solutions concepts solution_
                      .md       .md    {id}.html
```

## Configuration

Read **`.claude/ideation.local.md`** in the project root if it exists. Parse the YAML frontmatter for settings. If missing, use defaults.

**Template**: [settings-template.md](../../settings-template.md) — copy to `.claude/ideation.local.md`.
You can also generate it with `/ideation:init`.

| Field | Default | Description |
|-------|---------|-------------|
| `default_run_prefix` | `ideation-run` | Prefix for auto-numbered run folders |
| `output_root` | `.` | Directory where run folders are created |

## Stage Skills

| Stage | Skill | Input | Output |
|-------|-------|-------|--------|
| 1 | `/ideation:intake [run-name]` | User fills template | `problem_space.md` |
| 2 | `/ideation:generate [run-folder] [--research]` | `problem_space.md` | `solutions.md` |
| 3 | `/ideation:review [run-folder]` | `solutions.md` + `problem_space.md` | `reviewed_solutions.md` |
| 4 | `/ideation:ui [run-folder]` | `reviewed_solutions.md` | `ui_concepts.md` |
| 5 | `/ideation:prototype [run-folder] [selection]` | `reviewed_solutions.md` + `ui_concepts.md` | `prototypes/solution_{id}.html` |

## Run Folder Structure

A completed run folder looks like:

```
ideation-run-01/
├── intake.md                  # Blank template (created by stage 1, filled by user)
├── problem_space.md           # Stage 1 output
├── solutions.md               # Stage 2 output
├── reviewed_solutions.md      # Stage 3 output (single source of truth from here on)
├── ui_concepts.md             # Stage 4 output
└── prototypes/                # Stage 5 output (via web-artifacts-builder)
    ├── solution_01_01/        # React project source
    │   └── bundle.html
    ├── solution_01_01.html    # Bundled standalone prototype
    ├── solution_01_02/
    │   └── bundle.html
    ├── solution_01_02.html
    └── ...
```

## ID Conventions

| Entity | Pattern | Example |
|--------|---------|---------|
| Problem | `prob_XX` | `prob_01`, `prob_02` |
| Existing capability | `cap_XX` | `cap_01`, `cap_04` |
| Aspirational capability | `asp_XX` | `asp_01`, `asp_02` |
| Solution | `sol_XX_YY` | `sol_01_01` (problem 1, solution 1) |
| UI concept | `ui_XX_YY_Z` | `ui_01_01_A` (solution 01_01, variant A) |

## Cross-Stage Validation Rules

1. Every solution ID in `reviewed_solutions.md` must trace back to `solutions.md`
2. Every solution in `ui_concepts.md` must appear in the "passed" section of `reviewed_solutions.md`
3. Every `cap_XX` or `asp_XX` referenced in solutions must exist in `problem_space.md`
4. Every `prob_XX` referenced in solutions must exist in `problem_space.md`
5. Solution IDs follow the pattern `sol_{NN}_{NN}`
6. UI concept IDs follow the pattern `ui_{NN}_{NN}_{letter}`
7. Prototype filenames follow the pattern `solution_{sol_id}.html`

## Reference Docs

- [Data Contracts](references/data-contracts.md) — YAML frontmatter schemas for all stages
- [Intake Template](references/intake-template.md) — Blank template for stage 1
- [Solution Diversity](references/solution-diversity.md) — 5 diversity dimensions for stage 2
- [Scoring Rubric](references/scoring-rubric.md) — Feasibility/novelty/dedup for stage 3
- [ASCII Rules](references/ascii-rules.md) — Box-drawing, sizing, labeling for stage 4
- [HTML Prototype Spec](references/html-prototype-spec.md) — Self-contained HTML requirements for stage 5
