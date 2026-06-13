---
name: feedback
description: >
  Record your reaction to a ReadItLater digest so future digests bias toward themes you
  actually read. Use when the user says "rate the last digest", "that digest was great/meh",
  mentions which themes resonated, or runs /readitlater-digest:feedback.
allowed-tools: ["Bash", "Read"]
---

# ReadItLater Digest Feedback

Capture lightweight feedback on the most recent digest. This feeds the theme-selection step
of future digests (see the `digest` skill, Step 4).

## Configuration

Read `db_path` the same way the `digest` skill does (from `.claude/readitlater-digest.local.md`,
default `<vault_path>/.readitlater-digest.db`). Resolve `$BUN`:

```bash
BUN=$(command -v bun 2>/dev/null || echo "$HOME/.bun/bin/bun")
```

## Recording feedback

Translate what the user says into a rating (1–5, optional), free-text notes, and the list of
themes that resonated. Then:

```bash
$BUN run ${CLAUDE_PLUGIN_ROOT}/scripts/record-feedback.ts \
  --db-path "<db_path>" \
  --rating 4 \
  --notes "Loved the agents thread; skipped the crypto section" \
  --themes-liked "Agentic Engineering, Local-first software"
```

- `--digest-id` is optional; without it the feedback attaches to the most recent digest.
- Any field is optional — record whatever the user gave you.

Confirm what was saved and which digest it attached to.

## Reading feedback (used by the digest pipeline)

```bash
$BUN run ${CLAUDE_PLUGIN_ROOT}/scripts/record-feedback.ts --db-path "<db_path>" --recent --limit 5
```

Returns the last N feedback rows (rating, notes, themes_liked, week range). The `digest` skill
reads this before clustering to weight recurring liked themes up and disliked ones down.
