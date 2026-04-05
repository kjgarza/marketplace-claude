---
name: evaluate-pension
description: This skill should be used when the user asks to "evaluate pension", "analyze pension", "review pension plan", "compare pension alternatives", "check pension fees", "pension cost analysis", "should I cancel my pension", "is my Riester worth it", or "pension surrender value". Analyzes private pension plans for cost-efficiency, projected returns, and compares against alternatives in the German financial system.
argument-hint: "[optional: specific aspect to focus on, e.g., 'fees', 'alternatives', 'tax treatment']"
allowed-tools: ["Read", "Write", "Edit", "WebSearch", "Bash", "Glob", "Grep"]
---

# Evaluate Pension

Analyze the current private pension plan for cost-efficiency, projected returns, and compare against alternatives available in Germany. Produce a comprehensive evaluation report that enables informed decision-making about pension optimization.

Load `${CLAUDE_PLUGIN_ROOT}/skills/financial-analysis/references/german-financial-system.md` for detailed German tax parameters, pension system overview, and regulatory context.

## Step 1: Gather Pension and Employment Data

Read the pension data file at `finance/data/pension.md`. Extract all available details:

- **Provider** (e.g., Allianz, ERGO, Deutsche Rentenversicherung Bund)
- **Plan type**: Riester-Rente, Rürup-Rente (Basisrente), private Rentenversicherung, fondsgebundene Rentenversicherung, betriebliche Altersvorsorge (bAV)
- **Monthly/annual contribution amount**
- **Fee structure**: Abschlusskosten (acquisition costs), Verwaltungskosten (administration fees), Fondskosten / TER (total expense ratio for fund-linked products), Wechselkosten (switching costs)
- **Contract start date and remaining term**
- **Current contract value** (Rückkaufswert / surrender value)
- **Guaranteed capital** (Garantiekapital) and guaranteed interest rate (Garantiezins)
- **Projected payout**: provider's optimistic and conservative scenarios
- **Fund allocation** (for fondsgebundene products): which funds, what allocation

Read the employment data file at `finance/data/employment.md`. Extract:

- **Gross annual salary** (Bruttojahresgehalt) for contribution ceiling calculations
- **Tax bracket** (Steuerklasse) and marginal tax rate
- **Employer pension contributions** (Arbeitgeberzuschuss) if applicable
- **Employment status** (angestellt, selbstständig, verbeamtet) as this affects eligibility for Riester/Rürup

If either file is missing or incomplete, note the gaps explicitly in the report and proceed with available data. Flag missing data points as assumptions.

## Step 2: Research Current Market Benchmarks

Perform web searches to gather up-to-date comparison data:

1. Search for "beste Riester-Rente Vergleich aktuell" or the equivalent for the identified plan type to find current top-rated comparable products and their fee structures.
2. Search for "MSCI World ETF 10-Jahres-Rendite" to obtain the current 10-year annualized return of broad market index ETFs.
3. Search for "günstigste ETF Rentenversicherung Deutschland" (e.g., myPension, fairr, ETF Rürup) to find low-cost pension wrapper alternatives.
4. Search for "Scalable Capital Trade Republic Sparplan Kosten" to get current broker fee structures for self-directed ETF investing.
5. Search for "Sparerpauschbetrag aktuell" and "Kapitalertragsteuer Deutschland" to confirm current tax-free allowances and capital gains tax rates.

Record all sources with URLs for citation in the report.

## Step 3: Calculate Total Cost Drag

Compute the cumulative impact of fees on the pension plan's performance over the remaining investment horizon:

1. Determine remaining years to retirement: assume retirement age 67 unless the pension data specifies otherwise. Calculate `years_remaining = 67 - current_age`.
2. Calculate **annual cost ratio**: sum all recurring fees (Verwaltungskosten + TER + any percentage-based charges) as a single annual percentage of assets.
3. Calculate **upfront cost impact**: determine what portion of Abschlusskosten has already been paid (typically spread over first 5 years via Zillmerung) and what remains.
4. Model the **cost drag over the full period**:
   - Project the portfolio value WITH current fees applied annually.
   - Project the portfolio value WITHOUT fees (gross return only).
   - The difference is the total cost drag in euros.
5. Express the cost drag as: total euros lost to fees, percentage of final portfolio value sacrificed, and equivalent monthly pension reduction.

Use a moderate 7% gross return assumption for the base case. Show sensitivity at 5% and 9%.

## Step 4: Compare Against Alternatives

Build a projection comparison across three scenarios. For each scenario, model monthly contributions equal to the current pension contribution amount.

### Scenario A: Current Pension Plan
Use the provider's projected returns. Also calculate an independent projection using realistic return assumptions minus the plan's actual fee load.

### Scenario B: Low-Cost Pension Wrapper
Model a low-cost ETF-based pension product (e.g., ETF Rürup via myPension or fairr, or Nettopolice Rentenversicherung). Typical fee structure: 0.3%-0.6% total annual cost including ETF TER. Apply the same gross return assumptions.

### Scenario C: Self-Directed ETF Portfolio
Model a DIY approach via a German neo-broker:
- Assume a globally diversified ETF portfolio (e.g., MSCI World or FTSE All-World).
- TER: 0.07%-0.22% annually.
- No additional wrapper fees.
- Include transaction costs if applicable (most Sparpläne are free at Trade Republic/Scalable Capital).

For all three scenarios, calculate and display:
- Portfolio value at 10, 20, and 30 years (or remaining years to retirement, whichever is less).
- Total contributions paid over each period.
- Total fees paid over each period.
- Projected monthly pension payout (for insurance products, use a standard annuity factor; for ETF portfolios, use the 4% safe withdrawal rate as a reference).

## Step 5: Evaluate Tax Treatment

Analyze the tax implications for each scenario. For detailed calculation methodology — Riester-Rente Grundzulage/Kinderzulage math, Rürup-Rente deductibility percentages, Private Rentenversicherung Ertragsanteilbesteuerung rates, and ETF Teilfreistellung calculations — load `references/pension-tax-treatment.md`.

Key tax characteristics per scenario:
- **Riester-Rente**: State subsidies (Grundzulage + Kinderzulage) plus Sonderausgabenabzug up to 2,100 EUR/year; fully taxed at personal rate in retirement.
- **Rürup-Rente**: ~100% deductible contributions (up to ~27,566 EUR single in 2025); taxable payout portion rises to 100% by 2058.
- **Private Rentenversicherung**: No contribution deductibility; favourable Ertragsanteilbesteuerung in payout phase (e.g., 18% taxable share at age 67).
- **Self-Directed ETF**: Vorabpauschale during accumulation; 26.375% Kapitalertragsteuer on withdrawal with 30% Teilfreistellung for equity ETFs (effective ~18.46%).

Summarize the tax comparison in a table showing effective tax rates for each option during accumulation and payout phases.

## Step 6: Assess Switching Feasibility

Evaluate whether changing the current pension arrangement is practical:

1. **Surrender value** (Rückkaufswert): Compare against total contributions paid. If the surrender value is significantly below contributions, calculate the realized loss from cancellation.
2. **Anbieterwechsel** (provider switch): Determine if the plan type allows transferring to a different provider without cancellation (Riester plans allow this; most private Rentenversicherungen do not).
3. **Beitragsfreistellung** (paid-up status): Evaluate making the plan paid-up (stopping contributions) while keeping the existing contract value invested. Compare the outcome of redirecting future contributions to a lower-cost alternative versus continuing the current plan.
4. **Penalty clauses**: Identify any early termination penalties, Stornoabzug, or other contractual costs.
5. **Timing considerations**: Note if the contract is past the Zillmerung period (typically 5 years), as cancellation becomes less costly after upfront fees have been fully charged.

Provide a clear recommendation: cancel, switch provider, make paid-up and redirect, or continue.

## Step 7: Generate the Evaluation Report

Create the output file at `finance/reports/pension-evaluation-YYYY-MM.md`, replacing YYYY-MM with the current year and month. Structure the report as follows:

```markdown
---
title: "Pension Plan Evaluation"
date: YYYY-MM-DD
type: pension-evaluation
status: draft
pension-provider: "[provider name]"
pension-type: "[plan type]"
---
```

### Report Sections

1. **Executive Summary**: Two to three sentences stating the key finding and primary recommendation.

2. **Current Plan Summary**: A table listing provider, plan type, contribution amount, all fee components, current value, guaranteed capital, and projected payouts. Include a fee breakdown table showing each fee type, its annual cost in euros, and its percentage impact.

3. **Cost Drag Analysis**: Present the total cost drag calculation with a clear visualization of euros lost to fees over the investment horizon.

4. **Projection Comparison Table**: A markdown table comparing all three scenarios (current plan, low-cost pension, self-directed ETF) at 10-year, 20-year, and 30-year horizons. Include columns for portfolio value, total contributions, total fees, and estimated monthly payout.

5. **Tax Implications Comparison**: A table comparing the effective tax treatment of each option during accumulation and payout phases. Include net-of-tax projected values.

6. **Switching Analysis**: Present the feasibility assessment with costs, penalties, and a clear recommendation on whether to switch, make paid-up, or continue.

7. **Recommendation**: State the recommended course of action with supporting rationale. Include specific next steps.

8. **Glossary References**: Link all German financial terms to the glossary using wiki-link syntax (e.g., `[[Abschlusskosten]]`, `[[Garantiezins]]`, `[[Ertragsanteilbesteuerung]]`).

### Callout Formatting

Use `> [!info]` callouts to explain technical concepts inline:

```markdown
> [!info] Garantiezins
> The Garantiezins is the guaranteed minimum interest rate set by the German Federal Ministry of Finance for life insurance contracts. As of 2025, it stands at 1.0% for new contracts — significantly below historical levels and long-term equity market returns.
```

Use `> [!warning]` callouts to flag situations requiring professional advice:

```markdown
> [!warning] Professional Advice Recommended
> This analysis involves [specific complex situation]. Consult a Honorar-Finanzanlagenberater (fee-only financial advisor) or Steuerberater for personalized guidance.
```

### Mandatory Disclaimers

Include the following at the end of every report:

```markdown
## Disclaimer

This analysis is generated for informational purposes only and does not constitute Anlageberatung (investment advice) or Versicherungsberatung (insurance advice) within the meaning of German financial regulation (GewO §34d, §34f). All projections are based on historical data and assumptions that may not reflect future performance. Tax treatment depends on individual circumstances and may change. Consult a qualified Honorar-Finanzanlagenberater or Steuerberater before making financial decisions.

## When to Consult a Professional

- The pension plan involves employer matching (betriebliche Altersvorsorge) with complex vesting rules
- Total retirement assets exceed 500,000 EUR and require comprehensive drawdown planning
- Tax situation involves cross-border elements (e.g., potential retirement abroad)
- The plan includes Berufsunfähigkeitsversicherung (disability insurance) riders that need separate evaluation
- Family situation changes (marriage, children, divorce) affect Riester Zulagen or beneficiary designations
```

## Step 8: Maintain Glossary

After completing the report, scan the generated file for all German financial terms enclosed in wiki-links. Check whether each term exists in the project glossary. For any new terms not yet in the glossary, add them with a concise definition. This ensures the knowledge base stays current as new pension-related terminology enters the analysis workflow.

## Focus Area Handling

If the user provides a specific focus area argument (e.g., "fees", "alternatives", "tax treatment"), prioritize that section of the analysis. Still generate the full report structure, but expand the focused section with additional detail, more granular calculations, and deeper research. Mark the focused section with a `> [!tip] Deep Dive` callout at the top of that section.
