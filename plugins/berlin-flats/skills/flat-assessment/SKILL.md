---
name: flat-assessment
description: This skill should be used when the user asks to "assess this flat", "assess this listing", "is this a good flat", "evaluate this apartment ad", or pastes a rental listing URL and wants a quality judgment beyond scam detection. Combines quantitative scores (fit, scam, Mietspiegel) with a qualitative Berlin-rental checklist and produces a structured assessment report.
---

# Flat Assessment Method

Two layers: scripts compute the numbers, this checklist covers what scripts cannot see.
Read `skills/berlin-context` first for Mietspiegel, law, and district facts.

## Layer 1 — Quantitative (run the script)

```bash
bun scripts/assess.ts --id <n>            # listing already in the DB
bun scripts/assess.ts --json '<listing>'  # ad-hoc listing (add --save to store it)
```

Returns `fit` (0–100 with factors), `scam` (score + reasons), `mietspiegel` (€/m² delta vs district median). Present the fit factor table verbatim — the factor details are written to be user-facing.

## Layer 2 — Qualitative checklist (judge each, report only notable ones)

**Money**
- Nebenkosten realism: script flags <2 €/m²; if flagged, estimate realistic warm rent (Altbau ≈ +3.5–4.5 €/m² on cold) and state the corrected monthly cost.
- Total move-in cash: Kaution + Abstand/takeover + kitchen if none. One number.
- Kaution legality: ≤ 3 × cold rent (§ 551 BGB). Above = illegal demand, say so.
- Abstand/fixture takeover: legal only up to actual value (§ 4a WoVermittG). Estimate the real value; if the demand is above, mark as negotiation item, not dealbreaker — compare against monthly savings vs alternatives (amortization months).

**Contract**
- Type: unbefristet? Nachmieter takeover (inherits old rent — usually favorable)? Staffel-/Indexmiete (state escalation)? Zwischenmiete (usually reject).
- Mietpreisbremse: if >10% over Mietspiegel median, note exceptions (new build post-2014, umfassende Sanierung) and whether the claimed exception is plausible.
- Landlord approval chain: Nachmieter listings need Vermieter sign-off — dossier quality decides; check `bun scripts/dossier.ts` readiness in the same breath.

**Object**
- What the ad does NOT mention: EBK, floor if ground/top without lift, heating type, Energieausweis, bath condition. Every omission on this list becomes a viewing question.
- Ausstattung rating vs price: "Einfache Qualität" at premium €/m² is a mismatch to probe.
- Layout oddities: room count vs sqm (2,5 rooms on 100+ m² = partitioned rooms — check who built the partition and why).

**Location**
- Kiez character, noise sources (nightlife streets, main roads), transit lines from `skills/berlin-context`.
- Bedroom orientation (Hofseite = quiet) if stated; else viewing question.

**Market signal**
- Days on market: fresh (≤3d) → act same day; stale (>21d) → market says overpriced, negotiate.

## Output template (sensible default, adapt as needed)

```
# Assessment — <address> (<portal> <external_id>)
## Scores
Fit: <n>/100 · Scam: <n> — <verdict> · Mietspiegel: <€/m²> vs median <€/m²> (<±n>%)
<fit factor table>
## Beyond the scores
<numbered notable findings from Layer 2, each with a concrete action>
## Verdict
<2–3 sentences: recommendation, quantified risks, next action with urgency>
```

Always end with the single next action (contact today / request document / skip).
