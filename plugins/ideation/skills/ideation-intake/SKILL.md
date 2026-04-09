---
name: ideation-intake
description: >
  Start a new ideation run by creating a run folder and intake template, then validate
  the filled template and produce a structured problem_space.md. Use when the user says
  "start ideation", "new ideation run", "define problem space", or invokes /ideation:intake.
allowed-tools:
  - Read
  - Write
  - Glob
  - Bash
argument-hint: "[run-name]"
---

# Ideation Intake

This skill operates in two phases:

## Phase 1: Create Template

When the user invokes this skill for the first time (no filled intake.md exists):

1. **Read configuration** from `.claude/ideation.local.md` if it exists. Parse YAML frontmatter for `default_run_prefix` and `output_root`. Use defaults (`ideation-run`, `.`) if missing.

2. **Determine run folder name**:
   - If the user provides a run name argument, use it directly (e.g. `my-project-ideas`)
   - Otherwise, auto-number: scan `output_root` for existing folders matching `{default_run_prefix}-NN` and use the next number (zero-padded to 2 digits)

3. **Create the run folder** at `{output_root}/{run-name}/`

4. **Write `intake.md`** into the run folder using the template from [references/intake-template.md](../ideation/references/intake-template.md). Copy it verbatim.

5. **Tell the user**: "I've created `{run-folder}/intake.md`. Fill in the template with your problem areas, capabilities, and constraints, then run `/ideation:intake {run-folder}` again to validate and generate the problem space."

**Stop here.** Do not proceed to Phase 2 until the user has filled in the template.

## Phase 2: Validate and Generate

When the user invokes this skill on a run folder that already has a filled `intake.md`:

1. **Read `intake.md`** from the run folder.

2. **Validate completeness**:
   - At least 1 problem area with all fields filled (Who, What happens, What should happen, Severity)
   - At least 1 existing capability with all fields filled
   - Solution constraints section has at least one "Must" and one "Must not"
   - Target users is not empty
   - If validation fails, report what's missing and stop

3. **Assign IDs** sequentially:
   - Problems: `prob_01`, `prob_02`, ...
   - Existing capabilities: `cap_01`, `cap_02`, ...
   - Aspirational capabilities: `asp_01`, `asp_02`, ...

4. **Write `problem_space.md`** with YAML frontmatter following the data contract:

```yaml
---
run_id: {run-folder-name}
created_at: {ISO8601 timestamp}
version: "1.0"
problem_count: {count}
capability_count: {count}
aspirational_count: {count}
timeline: {from constraints}
---
```

The body transforms the user's input into the structured format with assigned IDs. Preserve the user's language — do not rewrite their descriptions. Only clean up formatting and add IDs.

**Severity mapping**: The user's "How bad is it (1-5)" becomes `**Severity**: X/5`.

5. **Report**: Show the user a summary of what was parsed — problem count, capability count, aspirational count, and the assigned IDs.

## Reference

- Template: [intake-template.md](../ideation/references/intake-template.md)
- Output schema: [data-contracts.md](../ideation/references/data-contracts.md) (Stage 1 section)
