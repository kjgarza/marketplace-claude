---
description: Assess a flat listing (DB id or pasted URL) — fit score, scam score, Mietspiegel delta, plus a qualitative Berlin-rental report.
argument-hint: "[listing-id | listing-url]"
allowed-tools: Bash, Read, WebFetch
---

Read the `skills/flat-assessment` skill first — it defines the method and the report template.

Resolve Bun once:

```bash
BUN_BIN="$(command -v bun 2>/dev/null || true)"
for c in "${HOME:-}/.bun/bin/bun" /opt/homebrew/bin/bun /usr/local/bin/bun; do
  [ -n "$BUN_BIN" ] && break; [ -x "$c" ] && BUN_BIN="$c"
done
: "${BUN_BIN:=bun}"
```

## Step 1 — Obtain the listing

**If `$1` is a number** (DB id):

```bash
cd $CLAUDE_PLUGIN_ROOT && "$BUN_BIN" scripts/assess.ts --id $1
```

**If `$1` is a URL:** fetch the expose page (browser tools for ImmoScout24 — its bot wall blocks plain HTTP; WebFetch is fine for Kleinanzeigen). Extract into a listing JSON: `url`, `title`, `description` (Objektbeschreibung + Ausstattung + Lage text), `cold_rent`, `warm_rent`, `sqm`, `rooms`, `district`, `posted_at` (Veröffentlicht date), plus any Kaution/Nebenkosten figures into the description. Then:

```bash
cd $CLAUDE_PLUGIN_ROOT && "$BUN_BIN" scripts/assess.ts --json '<listing json>' --save
```

`--save` stores it (verdict `pending`) so `/triage` and the pipeline can track it afterwards.

**If no argument:** show `queue.ts rank` output and ask which listing to assess.

## Step 2 — Report

Apply the `flat-assessment` skill: present the fit factor table from the script output, then work the qualitative checklist (money, contract, object, location, market signal) against the listing text. Use `skills/berlin-context` for Mietspiegel, district, and legal facts.

Finish with the output template's Verdict section — recommendation, quantified risks, single next action.

## Step 3 — Optional follow-through

If the verdict is positive, offer the next pipeline steps: draft a contact message (`scribe`), or `/berlin-flats:prepare-application <id>` if a viewing already happened.
