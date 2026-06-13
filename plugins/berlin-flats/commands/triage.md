---
name: triage
description: Review pending and review-band flat listings. Auto-adjudicates review-band listings with the scam-judge agent, then lets you accept, reject, snooze, or contact each. Use after /hunt to act on results.
allowed-tools: Bash, Read, Agent
---

Resolve Bun once:

```bash
BUN_BIN="$(command -v bun || echo /opt/homebrew/bin/bun)"
```

## Step 1 — Adjudicate the review band with scam-judge

Load listings the rule-based scorer left in the inconclusive `review` band (scam score 0.55–0.84):

```bash
cd $CLAUDE_PLUGIN_ROOT && "$BUN_BIN" scripts/queue.ts review
```

For **each** review listing, launch the `scam-judge` agent (haiku) with the listing JSON as context. Apply its verdict:

- `block` → `set-verdict.ts --id <id> --verdict rejected --reason "scam-judge: <top reason codes>"`
- `ok` → `set-verdict.ts --id <id> --verdict pending`
- `review` → leave as `review`; it will be surfaced to you below.

```bash
cd $CLAUDE_PLUGIN_ROOT && "$BUN_BIN" scripts/set-verdict.ts --id <id> --verdict <verdict> --reason "<reason>"
```

## Step 2 — Interactive triage

Load the remaining queue (pending + any still-review listings):

```bash
cd $CLAUDE_PLUGIN_ROOT && "$BUN_BIN" scripts/queue.ts triage
```

For each listing, present:
- **Title** and URL
- District | Cold rent | Warm rent | Rooms | sqm
- Scam score and verdict (note any scam-judge override)
- Description excerpt (first 200 chars)

Ask the user for each: **(a)ccept, (r)eject, (s)nooze, (c)ontact, or (q)uit?**

Apply the choice via `set-verdict.ts`. On **(r)eject**, ask for a one-line reason and pass it with `--reason` so the calibration loop can learn from it:

```bash
cd $CLAUDE_PLUGIN_ROOT && "$BUN_BIN" scripts/set-verdict.ts --id <id> --verdict rejected --reason "<why>"
```

On **(c)ontact**: invoke the `scribe` agent to draft a message for this listing (provide the listing JSON), then `set-verdict.ts --verdict contacted`.

## Step 3 — Summary + calibration

After all listings are reviewed, show the session summary (Accepted / Rejected / Snoozed / Contacted counts), then run the feedback loop and surface its suggestions:

```bash
cd $CLAUDE_PLUGIN_ROOT && "$BUN_BIN" scripts/calibrate.ts
```

Relay any calibration suggestions (e.g. districts to drop, threshold tweaks) to the user — these are concrete edits they can make to `config/config.toml`.
