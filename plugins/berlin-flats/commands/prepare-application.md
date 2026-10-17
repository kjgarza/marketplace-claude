---
description: Check application-document readiness and assemble an application package for a flat (dossier report + cover letter via scribe).
argument-hint: "[listing-id]"
allowed-tools: Bash, Read, Agent
---

Read the `skills/application-dossier` skill first — it defines the dossier contents, order, and legal guardrails.

Resolve Bun once:

```bash
BUN_BIN="$(command -v bun 2>/dev/null || true)"
for c in "${HOME:-}/.bun/bin/bun" /opt/homebrew/bin/bun /usr/local/bin/bun; do
  [ -n "$BUN_BIN" ] && break; [ -x "$c" ] && BUN_BIN="$c"
done
: "${BUN_BIN:=bun}"
```

## Step 1 — Dossier readiness

```bash
cd $CLAUDE_PLUGIN_ROOT && "$BUN_BIN" scripts/dossier.ts
```

Present the report as a checklist (✅ ok / ⚠️ stale / ❌ missing / ❌ file_not_found). For each non-ok item, tell the user concretely how to fix it (where to order a SCHUFA, what to ask the employer or current landlord for) and which `[documents.<key>]` entry to add to `config/config.toml`.

## Step 2 — Target listing

If `$1` is a listing id, load it:

```bash
cd $CLAUDE_PLUGIN_ROOT && "$BUN_BIN" scripts/queue.ts compare
```

and pick the listing with `id == $1`. If no id was given, show the `compare` output and ask which listing to prepare for.

## Step 3 — Cover letter

Invoke the `scribe` agent with the listing JSON and `mode: application`. Include in the prompt which dossier documents are ready (from Step 1) so the letter can reference them truthfully.

## Step 4 — Package checklist

Output the final assembly checklist in the dossier order (cover letter → Selbstauskunft → SCHUFA → payslips → employer letter → Mietschuldenfreiheit → ID), marking what is ready now versus what the user must renew first. Recommend merging into a single PDF.

If the listing is in `viewing` state and the user confirms they applied, set:

```bash
cd $CLAUDE_PLUGIN_ROOT && "$BUN_BIN" scripts/set-verdict.ts --id <id> --verdict applied
```
