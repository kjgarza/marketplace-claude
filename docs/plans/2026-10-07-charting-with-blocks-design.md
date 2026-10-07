# charting-with-blocks — design

Status: agreed in discussion 2026-10-07, not yet built.

## Goal

A `kjgarza-base` skill that draws quick data-visualisation boards out of Unicode
[Block Elements](https://en.wikipedia.org/wiki/Block_Elements), in the spirit of
[alexwlchan's ASCII bar charts](https://alexwlchan.net/2018/ascii-bar-charts/)
(eighth-width partial blocks for sub-cell precision), following the OpenIvy
Visualisation Principles v0.6 (`nova-agentic/packages/agents/openivy-agent/src/guidance/v0.6/`).

Primary reader: the Claude Code terminal / chat (markdown code block, monospace, no colour).

## Decisions

| Topic | Decision |
|---|---|
| Principles | OpenIvy v0.6, general 7 clusters: FORM, TRUTH, FIND, COLOUR, COMP, A11Y, TABLE. GEO and METRIC dropped. |
| Engine | Bundled Bun/TS script `blockviz.ts`, zero dependencies. |
| Home | `plugins/kjgarza-base/skills/charting-with-blocks/` (+ optional `/block-board` command). |
| Chart forms (v1) | Horizontal bars, sparklines, heatmap / calendar grid, vertical columns / histograms. |
| Board | Grid of panels (2-up), each panel with its own headline. |
| Width | 80 cols default, `--width` flag. |
| Input | JSON board spec (stdin or file) for boards; CSV + flags shortcut for single charts. |
| Subject (COLOUR-02, COMP-01) | Glyph contrast: subject bar solid `█`, others shaded `▓`, plus a `◀` marker. |
| Shaded bar tails | Solid eighth-width tail (`▓▓▓▌`): keeps full precision, accepts a small texture break. |
| Negatives | Diverging bars around a `│` zero axis. Positives in eighths; negatives left-anchored with `▐` (half-cell precision). |
| Missing values (TRUTH-09) | Visible gap glyph `·`; heatmap `·` distinct from a true zero (blank); bars print `n/a`. Never interpolate or zero-fill. |
| Reference (COMP-02) | Vertical `│` rule at the reference value through every bar row, labelled once in the panel header. |
| Enforcement | Script enforces the mechanical rules; SKILL.md covers judgment calls. |

## Rules the script enforces

- TRUTH-01: bars and columns start at zero.
- TRUTH-03 / FORM-07: panels of the same kind on a board can share a scale (`sharedScale`).
- TRUTH-04: values rounded to 1 dp by default.
- FORM-08: categorical bars sorted by value unless `order: "given"`.
- FIND-01: refuse a panel without a `headline`.
- FORM-09: sparklines and columns only on ordered x; categorical lines are rejected.
- COLOUR-04: the subject is marked by glyph and pointer, not texture alone.

## Rules left to SKILL.md (judgment)

FORM-01..06 (form choice, when not to chart), FIND-02..06 (headline wording,
calibrated claims, restrained annotation), A11Y-03 (insight-first summary next to
the board), TABLE-* (when a table beats a chart).

## Glyph sets

- Bar eighths: `▏▎▍▌▋▊▉█`
- Column / sparkline eighths: `▁▂▃▄▅▆▇█`
- Shade ramp (sequential heatmap): blank `░ ▒ ▓ █`; gap `·`
- Subject: `█` + `◀`; context: `▓`; reference: `│`

## Open for build phase

- Heatmap ramp has only 4 shade levels; a diverging heatmap is out of v1.
- Evals: at least 3 scenarios (per skill-standards), e.g. funder bars with subject +
  median, monthly sparkline with gaps, weekday x week calendar heatmap.
- `bash scripts/validate-plugin.sh kjgarza-base` must pass.
