# Skill Submission Standards

Quality bar for skills published to this marketplace. Based on Anthropic's
[Skill authoring best practices](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices).

Use this rule when **writing** a new skill or **reviewing** a submission.
Structural/manifest rules (directory layout, plugin.json, the validator) live
in [`plugin-development.md`](plugin-development.md); this file governs the
*content* of a `SKILL.md`.

---

## 1. YAML frontmatter (machine-checkable, hard reject if violated)

`name`:
- Max 64 characters
- Lowercase letters, numbers, hyphens only
- No XML tags
- Cannot contain reserved words "anthropic" or "claude"
- Reject vague (`helper`, `utils`, `tools`) or overly generic (`documents`, `data`, `files`) names
- **Prefer gerund form** (`processing-pdfs`, `analyzing-spreadsheets`) for marketplace consistency; noun-phrase (`pdf-processing`) or action-oriented (`process-pdfs`) accepted as alternatives
- Must follow a consistent pattern within a single author's skill collection

`description`:
- Non-empty, max 1024 characters, no XML tags
- Must state both **what** the Skill does and **when** to use it, with specific trigger terms (not just a category)
- **Third person only** — injected into the system prompt; inconsistent point-of-view breaks discovery
  - ✅ "Processes Excel files and generates reports"
  - ❌ "I can help you process Excel files" / "You can use this to..."
- Reject vague descriptions: "Helps with documents," "Processes data," "Does stuff with files"
- Reference standard: `Extract text and tables from PDF files, fill forms, merge documents. Use when working with PDF files or when the user mentions PDFs, forms, or document extraction.`

> **Local convention — trigger-phrase opening.** This marketplace additionally
> requires every `description` to **start** with the literal phrase
> `"This skill should be used when..."` — `scripts/validate-plugin.sh` (check
> #3) enforces this and will fail the build otherwise. That house rule governs
> the *opening*; everything after it (third-person voice, specific trigger
> terms, the what + when, the 1024-char limit) follows the standards above.

## 2. Conciseness

Metadata (name+description) preloads for every Skill regardless of relevance — shared cost across the whole marketplace install. SKILL.md body loads only when triggered, but then competes with everything else in context.

**Default assumption: Claude is already smart.** For each passage: *does this paragraph justify its token cost?* Reject explanations of things a competent model doesn't need explained (what a PDF is, how a library works, etc.) — show the working code/pattern, skip the lecture.

- Target: SKILL.md body **under 500 lines**. Split into reference files beyond that.

## 3. Degrees of freedom must match task fragility

| Freedom | When | Form |
|---|---|---|
| High | Multiple valid approaches, context-dependent | Text-based heuristics |
| Medium | Preferred pattern exists, some variation OK | Pseudocode / parameterized scripts |
| Low | Fragile, error-prone, order-critical | Exact scripts/commands + explicit "do not modify" |

Reviewers should flag under-specified fragile operations (e.g. a migration script left to judgment) and over-specified flexible ones (e.g. a code review locked to one rigid script).

## 4. Cross-model testing

Must be tested on every model tier the author targets — Haiku (enough guidance?), Sonnet (clear and efficient?), Opus (avoids over-explaining?). Require evidence of testing beyond just the flagship model if multi-model support is claimed.

## 5. Progressive disclosure structure

- Simple Skills: single SKILL.md is fine.
- Growing Skills: bundle linked files (`FORMS.md`, `reference.md`, `examples.md`) loaded on demand.
- Multi-domain Skills: organize reference files **by domain** (`reference/finance.md`, `reference/sales.md`, etc.) so unrelated queries don't pull in irrelevant context.
- **References must stay one level deep from SKILL.md.** Claude may only partially read nested references (e.g. via `head -100`), so SKILL.md → advanced.md → details.md risks incomplete reads. Every reference file links directly from SKILL.md.
- Reference files **over 100 lines require a table of contents** at the top.

## 6. Workflows and feedback loops

- Multi-step tasks → explicit sequential workflow. Complex ones should include a copyable markdown checklist Claude can check off as it progresses.
- **Conditional workflows**: when a task branches (e.g. "creating new content?" vs "editing existing content?"), structure as an explicit decision point with named sub-workflows. If a workflow grows too large, push it into a separate file and have SKILL.md route to it based on task type.
- Quality-critical or validation-sensitive output requires a **feedback loop**: run validator → fix errors → re-validate → only then proceed. The "validator" can be a script or a reference doc (e.g. a style guide) Claude checks against. Reject workflows that skip validation before a final/rebuild step.
- For batch, destructive, or high-stakes operations: require the **plan-validate-execute** pattern — Claude produces a structured intermediate plan (e.g. `changes.json`), a script validates the plan, only then is it executed and verified. This catches reference errors, conflicts, and missed required fields before anything is applied.

## 7. Content hygiene

- **No time-sensitive "before/after a date" claims.** Document the current method as current; move deprecated approaches into a clearly separated "old patterns" section (collapsible `<details>` block recommended).
- **Terminology must be consistent** throughout a Skill — one term per concept, everywhere (e.g. always "API endpoint," never alternating with "URL"/"route"/"path").

## 8. Templates and examples

- Output templates must state explicitly whether they are **strict** ("ALWAYS use this exact structure") or **flexible** ("sensible default, adapt as needed") — ambiguity causes inconsistent output.
- Where output quality is example-sensitive, require concrete input/output example pairs (not abstract rules alone) — these communicate style and detail level better than description.

## 9. Anti-patterns (explicit rejects)

- **Windows-style backslash paths** anywhere in Skill content — forward slashes only, even on Windows, since Unix-style paths work cross-platform and backslashes don't.
- **Offering too many options** without a default — e.g. listing five PDF libraries with no guidance. Require a stated default with an explicit escape hatch for the exception case, not an open menu.

## 10. Executable code requirements (skip this section for markdown-only Skills)

- **Solve, don't punt**: scripts must handle errors explicitly (e.g. missing file → create default, not crash) rather than leaving Claude to improvise around a failure.
- **No "voodoo constants"**: every magic number (timeouts, retry counts, thresholds) must be justified with a comment explaining the reasoning. Reject unexplained constants.
- **Prefer pre-built utility scripts** over asking Claude to generate code live — more reliable, saves tokens, ensures consistency. Instructions must clearly state whether a script should be **executed** ("Run `analyze_form.py`") or **read as reference** ("See `analyze_form.py` for the algorithm") — execution is preferred for most utility scripts.
- **Visual analysis**: when inputs can be rendered as images (e.g. PDF pages), Skills should convert and have Claude inspect visually rather than only parsing structured data.
- **Package dependencies**: must be explicitly listed in SKILL.md and verified available in the target runtime. Note the platform split — claude.ai can install from npm/PyPI/GitHub at runtime; the Claude API has no network access and no runtime package installation, so API-targeted Skills must only depend on what's already available.
- **MCP tool references must be fully qualified** as `ServerName:tool_name` (e.g. `BigQuery:bigquery_schema`) — unqualified names risk "tool not found" errors when multiple MCP servers are present.
- **Never assume a tool/package is pre-installed** — state the install command explicitly (e.g. `pip install pypdf`) before showing usage.
- File names should be descriptive (`form_validation_rules.md`, not `doc2.md`); directories organized by domain/feature, not generically (`docs/file1.md`, `docs/file2.md` is a reject).

## 11. Evaluation requirement

- Authors should build evaluations **before** writing extensive documentation — minimum **three test scenarios** derived from observed gaps (run Claude without the Skill, document failures, build evals against those specific gaps, then write the minimal content needed to pass them).
- Marketplace submissions should show evidence of: baseline testing without the Skill, at least 3 evaluation scenarios, and testing across model tiers (Haiku/Sonnet/Opus) where multi-model support is claimed.

---

## Marketplace submission checklist

**Core quality**
- [ ] `name`/`description` pass frontmatter validation; description is third-person, specific, states what + when
- [ ] Description opens with `"This skill should be used when..."` (validator-enforced)
- [ ] SKILL.md body under 500 lines; extra detail moved to reference files
- [ ] No time-sensitive claims (or isolated in an "old patterns" section)
- [ ] Terminology consistent throughout
- [ ] Examples are concrete, not abstract
- [ ] All file references one level deep from SKILL.md
- [ ] Progressive disclosure used where content is non-trivial
- [ ] Workflows have clear, explicit steps (with checklists for complex ones)

**Code and scripts** (if applicable)
- [ ] Scripts solve problems rather than punting errors to Claude
- [ ] Error handling explicit and helpful
- [ ] No unexplained "voodoo constants"
- [ ] Required packages listed and verified available in target runtime (claude.ai vs. API)
- [ ] No Windows-style paths
- [ ] Validation/feedback loops present for quality-critical or destructive operations
- [ ] MCP tool references fully qualified (`ServerName:tool_name`)

**Testing**
- [ ] At least three evaluations created against real observed gaps
- [ ] Tested on Haiku, Sonnet, and Opus (or stated model-tier limitation)
- [ ] Tested on real usage scenarios, not just synthetic test cases
