---
name: retirement-readiness
description: This skill should be used when the user asks to "check retirement readiness", "retirement projection", "am I saving enough for retirement", "pension gap analysis", "Rentenlücke", "all my pensions", "three pillar pension", "Wohn-Riester", "redirect pension to mortgage", "pension vs property", "how much pension will I get", or "Versorgungslücke". Assesses overall retirement readiness across all three German pension pillars and models trade-off scenarios including pension-to-property capital redirection.
argument-hint: "[optional: focus area, e.g., 'Wohn-Riester', 'pension gap', 'redirect to mortgage']"
allowed-tools: ["Read", "Write", "Edit", "WebSearch", "Bash", "Glob", "Grep"]
---

# Retirement Readiness — Three-Pillar Projection

Assess overall retirement readiness across all three German pension pillars (statutory, occupational, private). Quantify the pension gap (Versorgungslücke) and model scenarios including capital redirection toward property purchase. Produce a comprehensive projection report.

Load `${CLAUDE_PLUGIN_ROOT}/skills/financial-analysis/references/german-financial-system.md` for pension system overview, tax parameters, and regulatory context.

For detailed calculation methodology — Entgeltpunkte formulas, bAV projection by vehicle type, Wohn-Riester rules, and capital redirection modeling — load `references/three-pillar-methodology.md`.

## Step 1: Gather Data

Read the following input files. If any file is missing or incomplete, note the gaps explicitly and proceed with available data. Never fabricate financial figures.

- `finance/data/pension.md` — all private and occupational pension products (provider, type, contributions, fees, current value, projected payouts)
- `finance/data/employment.md` — gross salary, net salary, Steuerklasse, employer bAV contributions, employment history (for GRV contribution years), VL details

If `finance/reports/pension-evaluation-*.md` exists and is recent (within 3 months), read it to incorporate the single-product analysis rather than recalculating.

Parse all monetary values into EUR. Note the date of each data point to flag stale information.

## Step 2: Pillar 1 — Statutory Pension (Gesetzliche Rentenversicherung)

Project the statutory pension at standard retirement age (Regelaltersgrenze, currently 67).

1. **Determine German contribution years**: From employment data, count the years the user has been employed in Germany (pflichtversichert in the GRV). Note any periods abroad that might count under EU Regulation 883/2004.

2. **Estimate Entgeltpunkte (earnings points)**: For each contribution year, calculate:
   ```
   Entgeltpunkte = Gross annual salary / Durchschnittsentgelt (average national earnings)
   ```
   Cap at the Beitragsbemessungsgrenze (contribution ceiling). Web search for the current Durchschnittsentgelt and Beitragsbemessungsgrenze.

3. **Project future Entgeltpunkte**: Assume current salary continues (adjusted for inflation if specified) until age 67. Sum all past and projected Entgeltpunkte.

4. **Calculate monthly pension**: Web search for the current Rentenwert (pension point value). Calculate:
   ```
   Monthly GRV pension = Total Entgeltpunkte × Rentenwert × Zugangsfaktor (1.0 at age 67)
   ```

5. **Note limitations**: GRV projections assume no career breaks, no salary changes, and stable Rentenwert growth. Flag these assumptions explicitly.

If the user has a Renteninformation (annual GRV statement), use the projected values directly rather than estimating.

## Step 3: Pillar 2 — Occupational Pension (Betriebliche Altersvorsorge)

Read bAV details from employment data.

1. **Identify the bAV vehicle**: Direktversicherung, Pensionskasse, Pensionsfonds, Unterstützungskasse, or Direktzusage. Each has different projection methods.

2. **Current contributions**: Sum employee Entgeltumwandlung and employer Arbeitgeberzuschuss. Calculate the total annual contribution.

3. **Project the bAV payout at retirement**:
   - For Direktversicherung / Pensionskasse: use the provider's projected payout if available from the Standmitteilung. Otherwise, model with a conservative return assumption (2–4% for traditional, 4–6% for fund-linked).
   - For Direktzusage / Unterstützungskasse: use the employer's commitment formula if known.

4. **Tax treatment**: bAV payouts are subject to full income tax (nachgelagerte Besteuerung) plus health insurance contributions in retirement (~11% KVdR + PVdR). Apply an estimated retirement tax rate (typically lower than working-life rate).

If there is no bAV, note this as a gap and flag that the user has a legal right to Entgeltumwandlung (§1a BetrAVG).

## Step 4: Pillar 3 — Private Pension and Savings

Compile all private retirement provisions:

1. **Subsidized products**: Riester-Rente, Rürup-Rente (Basisrente) — extract projected payouts, current values, and contribution amounts from pension data.

2. **Unsubsidized products**: Private Rentenversicherung, fondsgebundene Rentenversicherung — extract projected payouts.

3. **Self-directed investments**: ETF Sparplan, Depot holdings from `finance/data/bank-accounts.md` — if earmarked for retirement, project the value at 67 using assumed returns (7% gross, minus TER, minus Abgeltungsteuer on realization).

4. If a pension-evaluation report exists (`finance/reports/pension-evaluation-*.md`), reference its findings for the detailed single-product analysis rather than re-doing the work.

For each product, note the projected monthly payout or the capital value and convert to a monthly withdrawal using the 4% rule (for liquid assets) or the provider's annuity factor (for insurance products).

## Step 5: Gap Analysis (Versorgungslücke)

1. **Target retirement income**: Calculate 70–80% of current net monthly income as the baseline target. Adjust for:
   - No more Sozialversicherungsbeiträge in retirement (saves ~20% of gross)
   - No more savings contributions (frees up that portion of income)
   - Lower tax rate in retirement (fewer deductions needed, but pension income is taxed)

2. **Total projected retirement income**: Sum the monthly projections from Pillars 1 + 2 + 3.

3. **Pension gap (Versorgungslücke)**: Calculate:
   ```
   Monthly gap = Target retirement income - Total projected retirement income
   ```
   Express in both nominal EUR and real EUR (inflation-adjusted at 2% to retirement age).

4. **Capital required to close the gap**: Using a 4% withdrawal rate, calculate the additional capital needed:
   ```
   Required capital = Monthly gap × 12 / 0.04
   ```

5. **Model three scenarios**:

   **Scenario A — Status quo**: Continue current contribution levels to all pension products. No changes. Project the gap at retirement.

   **Scenario B — Optimize within the pension system**:
   - Increase Rürup contributions to the deduction ceiling (tax savings reinvested)
   - Switch high-cost private pension to a low-cost alternative (or make paid-up and redirect to ETF)
   - Increase bAV contributions if employer matching is available
   - Calculate the reduced gap and the net cost (additional monthly outflow after tax savings)

   **Scenario C — Redirect to property equity**:
   - Make private pension paid-up (Beitragsfreistellung) or cancel
   - Redirect those contributions to a savings account earmarked for property down payment
   - Model the timeline to accumulate sufficient Eigenkapital for a property purchase
   - Calculate the retirement income impact: smaller Pillar 3 but potential rental income or eliminated rent expense

For each scenario, present a table showing projected monthly retirement income, pension gap, and required additional capital.

## Step 6: Wohn-Riester Modeling

If the user has a Riester-Rente, model the option to use it for property purchase under Wohn-Riester rules.

1. **Altersvorsorge-Eigenheimbetrag (§92a EStG)**: The user can withdraw up to 100% of the Riester capital for purchasing owner-occupied property. Calculate the available amount (current Riester contract value).

2. **Wohnförderkonto**: The withdrawn amount is booked to a notional Wohnförderkonto, which accrues at 2% annually until retirement. At retirement, the accumulated Wohnförderkonto balance is taxed as income (nachgelagerte Besteuerung), either spread over 17–25 years or as a lump sum with a 30% discount.

3. **Trade-off calculation**:
   - **Benefit**: Riester capital applied to property reduces mortgage amount → lower interest payments over the loan term. Calculate total interest savings.
   - **Cost**: Forgone Riester pension payout in retirement + tax liability on Wohnförderkonto balance at retirement.
   - Present the net benefit or net cost in EUR.

4. **Eligibility check**: Wohn-Riester requires:
   - Self-occupied property (Eigennutzung), not buy-to-let
   - Property must be in the EU/EEA
   - Provider must agree to the withdrawal
   Note any conditions that may disqualify the user.

## Step 7: Generate the Retirement Readiness Report

Create the output file at `finance/reports/retirement-readiness-YYYY-MM.md`, replacing YYYY-MM with the current year and month.

```markdown
---
title: "Retirement Readiness Projection"
date: YYYY-MM-DD
type: retirement-readiness
status: draft
---
```

### Report Sections

1. **Executive Summary**: Readiness assessment in 2–3 sentences. State the projected pension gap and the recommended scenario.

2. **Pillar 1 — Statutory Pension (GRV)**: Entgeltpunkte calculation, projected monthly payout, key assumptions (contribution years, salary trajectory, Rentenwert).

3. **Pillar 2 — Occupational Pension (bAV)**: Current contributions, projected payout, tax treatment in retirement. Flag if no bAV exists.

4. **Pillar 3 — Private Pensions and Savings**: Summary table of all private products with projected payouts. Reference the pension-evaluation report for detailed analysis.

5. **Retirement Income Projection**: Table showing monthly income from each pillar, total, target, and gap — at current trajectory and under each scenario.

6. **Scenario Comparison**: Side-by-side table of Scenarios A, B, and C with key metrics: monthly retirement income, pension gap, additional monthly outflow required, net worth at 67, and timeline to property purchase (for Scenario C).

7. **Wohn-Riester Analysis**: If applicable, present the trade-off calculation with clear benefit/cost breakdown.

8. **Recommendations**: Prioritized action items. Specify which scenario is recommended and why.

9. **Assumptions and Limitations**: List all assumptions (return rates, inflation, Rentenwert growth, salary trajectory) and note the sensitivity of results to these assumptions.

### Formatting Rules

- Link German financial terms to the glossary using wiki-links: `[[glossary#Term|Term]]`
- Use `> [!info]` callouts to explain concepts on first use (Entgeltpunkte, Versorgungslücke, Wohnförderkonto, nachgelagerte Besteuerung)
- Use `> [!warning]` callouts for professional referral flags
- Show all math with formulas and intermediate calculations
- Present both nominal and real (inflation-adjusted) EUR values

### Mandatory Footer

```markdown
## Disclaimer

This analysis is generated for informational purposes only and does not constitute Anlageberatung (investment advice) or Versicherungsberatung (insurance advice) within the meaning of German financial regulation (GewO §34d, §34f). All projections are based on assumptions that may not reflect future performance. Consult a qualified Honorar-Finanzanlagenberater or Steuerberater before making financial decisions.

## When to Consult a Professional

- [Specific referral flags based on findings — tailor to the actual analysis]
```

## Step 8: Glossary Maintenance

After completing the report, scan for German financial terms in wiki-links. Check whether each term exists in the project glossary at `finance/reference/glossary.md`. Add any new terms with concise definitions.

Key terms to verify: Entgeltpunkte, Rentenwert, Versorgungslücke, Regelaltersgrenze, Durchschnittsentgelt, Beitragsbemessungsgrenze, Zugangsfaktor, Wohnförderkonto, Altersvorsorge-Eigenheimbetrag, nachgelagerte Besteuerung, Beitragsfreistellung, Entgeltumwandlung.

## Important Rules

- Never fabricate financial data. If a data file is missing, state the gap and suggest the user populate the file.
- Always show assumptions and sources. Every number from a web search must include its source URL.
- All monetary values in EUR. All output in English.
- If the user provides a specific focus area argument (e.g., "Wohn-Riester", "pension gap"), expand that section with additional detail. Still generate the full report structure.
- Flag any scenario where the pension gap exceeds 40% of the target retirement income as critical.
- The report status is always "draft" — the user must review before acting on any recommendation.
