# Plan: Add Skill Submission Standards rule to the marketplace

## Context

This marketplace bundles many plugins whose primary unit is a **skill**
(`skills/<name>/SKILL.md`). Today the only skill guidance lives inside
`.claude/rules/plugin-development.md` under "Skill Format" — a short section
covering frontmatter shape and the `"This skill should be used when..."`
trigger phrase. There is **no comprehensive rule** for what makes a *good*
skill: naming conventions, conciseness, degrees of freedom, progressive
disclosure, feedback loops, executable-code hygiene, or an evaluation
requirement.

The user supplied a ready-made standards document (derived from Anthropic's
official Skill authoring best practices) and wants it adopted as a marketplace
rule. Outcome: a single canonical rule file authors and reviewers can point to
when writing or reviewing skill submissions, cross-linked from the existing
docs. **Scope confirmed with the user: documentation only — no changes to
`scripts/validate-plugin.sh`.**

## Approach

### 1. Create `.claude/rules/skill-standards.md` (new file)

Add the supplied "Marketplace Rule: Skill Submission Standards" content as a
new rule file, sitting alongside `plugin-development.md` and `dod-template.md`.
Keep the content essentially as provided, with light formatting alignment to
the house style of the existing rule files (same `##`/`---` section rhythm,
fenced examples, checkboxes). Sections to preserve:

1. YAML frontmatter standards (name + description, machine-checkable)
2. Conciseness (<500 line body target)
3. Degrees of freedom framework (High/Medium/Low table)
4. Cross-model testing (Haiku/Sonnet/Opus)
5. Progressive disclosure (one level deep, TOC over 100 lines)
6. Workflows and feedback loops (conditional + plan-validate-execute patterns)
7. Content hygiene (no time-sensitive claims, consistent terminology)
8. Templates and examples (strict vs flexible)
9. Anti-patterns (Windows paths, too many options)
10. Executable-code requirements (markdown-only skills skip)
11. Evaluation requirement (≥3 scenarios, build evals first)
   - plus the final **Marketplace submission checklist**

Drop the trailing meta-paragraph ("This rule now reflects the complete source
page…") since it documents the drafting process, not a rule. Add a one-line
header noting the source: Anthropic's Skill authoring best practices.

### 2. Reconcile with existing `plugin-development.md`

`/.claude/rules/plugin-development.md` already has a "Skill Format" section and
a "Definition of Done" list. To avoid two competing sources of truth:

- In its **Skill Format** section, add a short pointer:
  *"For the full quality bar on skill content (naming, conciseness, degrees of
  freedom, progressive disclosure, evaluations), see
  `.claude/rules/skill-standards.md`."*
- Keep the existing structural rules there (they cover the `"This skill should
  be used when..."` convention the validator enforces). Note the **one known
  divergence** so it is explicit rather than silently contradictory:
  - `plugin-development.md` mandates the description **start** with
    `"This skill should be used when..."` (enforced by
    `scripts/validate-plugin.sh`, check #3).
  - `skill-standards.md` (from the upstream best-practices) emphasizes
    third-person "what + when" and uses a different reference example.
  - Resolution in the doc: this marketplace **keeps** the
    `"This skill should be used when..."` opening as the local house rule (it
    is validator-enforced); `skill-standards.md` governs everything *after*
    that opening (specificity, third-person, trigger terms, 1024-char limit).
    Add a sentence to that effect in `skill-standards.md` §1 so authors are not
    confused.

### 3. Wire up references in the top-level guidance

- **`CLAUDE.md`** — under the existing "## Rules" section, add a line next to
  the `plugin-development.md` pointer:
  *"Skill content quality standards live in
  `.claude/rules/skill-standards.md`."*
- **`AGENTS.md`** — mirror the same pointer under its "## Rules" section for
  Codex parity (note: this file uses find/replace-style "Codex" branding; match
  its existing wording/paths style, i.e. `.Codex/rules/...` is how it refers to
  the rules dir — keep that file's convention rather than importing Claude
  paths).

## Critical files

| File | Change |
|------|--------|
| `.claude/rules/skill-standards.md` | **new** — the standards rule (full content) |
| `.claude/rules/plugin-development.md` | edit — add pointer in Skill Format; note the trigger-phrase divergence |
| `CLAUDE.md` | edit — add reference under "## Rules" |
| `AGENTS.md` | edit — add reference under "## Rules" (match its Codex path style) |

No changes to `scripts/validate-plugin.sh` (per user: doc only).

## Verification

Since this is documentation-only:

1. **Markdown sanity** — confirm the new file renders (tables, fenced blocks,
   checkboxes well-formed); no broken internal links.
2. **Cross-reference integrity** — every path mentioned
   (`.claude/rules/skill-standards.md`) resolves to a real file; grep for the
   filename across `CLAUDE.md`, `AGENTS.md`, `plugin-development.md` to confirm
   the pointers were added.
3. **Regression check** — run `bash scripts/validate-plugin.sh --all` to
   confirm the doc additions did not disturb existing validation (expected:
   unchanged pass/fail counts, since the script reads plugins, not rules).
4. **Consistency spot-check** — re-read §1 of `skill-standards.md` against
   validator check #3 to confirm the documented divergence resolution matches
   actual script behavior.
