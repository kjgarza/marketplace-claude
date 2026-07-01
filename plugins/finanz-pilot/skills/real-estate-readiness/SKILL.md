---
name: real-estate-readiness
description: This skill should be used when the user asks to "check real estate readiness", "assess property purchase", "can I afford to buy", "Eigenkapital check", "mortgage readiness", "buy apartment Berlin", "Kaufnebenkosten calculation", "rent or buy", "rent vs buy", "buy a house", "Haus kaufen", "Einfamilienhaus", "Neubau vs Bestand", "house vs apartment", "Doppelhaushälfte", or "Reihenhaus". Assesses financial readiness to purchase property in Berlin/Brandenburg — apartments and houses — with German-specific buying costs.
argument-hint: "[optional: property price or area to focus on, e.g., '€350,000', 'Neukölln', 'buy-to-let']"
allowed-tools: ["Read", "Write", "Edit", "WebSearch", "Bash", "Glob", "Grep"]
portable: false
---

> `<plugin_dir>` = this plugin's root directory (two levels above this SKILL.md).

# Real Estate Readiness Assessment

Assess financial readiness to purchase property in Berlin/Brandenburg, model purchase scenarios, and highlight German-specific buying costs. Produce a comprehensive report grounded in the user's actual financial data and current market conditions.

Load `<plugin_dir>/skills/financial-analysis/references/german-financial-system.md` for detailed German tax parameters, real estate purchase process, and regulatory context.

## Step 1: Gather Financial Data

Read the following input files from the Obsidian vault. If any file is missing or empty, warn about the gap and proceed with available data. Never fabricate financial figures.

- `finance/data/bank-accounts.md` — savings balances, account types, interest rates, and any notes about earmarked funds (e.g., "saving for down payment" vs. "emergency fund")
- `finance/data/employment.md` — gross and net income, Steuerklasse, employer benefits, bonus structure
- `finance/data/monthly-budget.md` — current income vs. expenses breakdown, discretionary spending, existing debt obligations
- `finance/data/property-goals.md` — target neighborhoods or cities, budget range, size preferences, buy-to-live vs. buy-to-let intent, timeline

Parse all monetary values into EUR. Note the "as of" date on each balance to flag stale data (older than 3 months).

## Step 2: Calculate Available Equity (Eigenkapital)

Determine total available Eigenkapital from bank account data. Classify each account into one of three categories:

1. **Available for down payment** — accounts explicitly earmarked for property purchase, plus any unallocated Tagesgeld or Festgeld with no lock-in or an upcoming maturity date
2. **Emergency reserve** — maintain a minimum of 3-6 months of net expenses as an untouchable buffer; identify which accounts serve this purpose
3. **Locked or restricted** — Festgeld with remaining lock-in periods, employer pension contributions, or other illiquid holdings

Calculate the net Eigenkapital figure: total liquid savings minus emergency reserve minus any locked funds. Present this as the "deployable equity" for a property purchase.

If the user provided a specific property price as an argument, use that as the reference price. Otherwise, derive a reference price from `property-goals.md` or, if no target is stated, use the Berlin median price per m² multiplied by a typical 60-70 m² apartment.

## Step 3: Research Current Market Data

Perform web searches to gather up-to-date figures. Execute the following searches (combine or split as needed for best results):

1. **Berlin and Brandenburg property prices** — current average price per m² for apartments (Eigentumswohnungen), broken down by district if available. Search for terms like "Berlin Immobilienpreise pro Quadratmeter aktuell" and "Brandenburg Wohnungspreise aktuell".
2. **Current mortgage rates (Bauzins)** — rates for 10-year, 15-year, and 20-year Zinsbindung periods. Search for "Bauzins aktuell" or "Hypothekenzinsen Deutschland". Note the effective rate (effektiver Jahreszins), not just the nominal rate (Sollzins).
3. **Grunderwerbsteuer rates** — verify the current land transfer tax rates for Berlin (expected: 6.0%) and Brandenburg (expected: 6.5%). Search for "Grunderwerbsteuer Berlin Brandenburg aktuell" to confirm, as these rates can change with state legislation.

Record the source and date for each data point. If a web search fails or returns outdated results, fall back to the expected values noted above and flag them as unverified.

## Step 3.5: Research House-Specific Cost Factors

If the user's `property-goals.md` mentions a house (Einfamilienhaus, Doppelhaushälfte, Reihenhaus) or the command argument specifies a house type, perform additional research. Skip this step for apartment (Eigentumswohnung) purchases.

For the full cost structure comparison, Sanierung categories, Neubau vs. Bestand framework, and Speckgürtel market context, load `references/house-vs-apartment.md`.

1. **House prices**: Search for current house prices in Berlin/Brandenburg separately from apartment Quadratmeterpreise. Search for "Einfamilienhaus Preise Berlin Brandenburg aktuell" and "Haus kaufen Speckgürtel Preise". House prices follow different dynamics than apartment prices, especially in Brandenburg commuter areas.

2. **Land value (Grundstückswert)**: For houses, land typically represents 40–60% of total value (vs. 20–40% for apartments). This matters for AfA calculations in buy-to-let scenarios, since only the building portion is depreciable. Estimate the land-to-building ratio for the target area.

3. **Neubau vs. Bestand**:
   - **Neubau**: No Makler commission (developer sells directly), but higher base price. May qualify for KfW energy-efficiency subsidies. Include Erschließungskosten (utility connection costs) if the plot is previously undeveloped — typically EUR 10,000–30,000.
   - **Bestand**: Potentially lower base price but may require Sanierung (renovation). Estimate renovation costs based on condition: cosmetic (EUR 200–500/m²), moderate (EUR 500–1,000/m²), structural (EUR 1,000–1,500/m²). Search for "Sanierungskosten Haus pro Quadratmeter" for current benchmarks.

4. **No Hausgeld**: Detached and semi-detached houses do not have Hausgeld (that applies to Wohnungseigentümergemeinschaften). Instead, the owner bears all costs directly: Wohngebäudeversicherung, Grundsteuer, maintenance, and repairs. Estimate a self-managed maintenance reserve of 1–2% of property value per year.

## Step 4: Model Total Purchase Costs (Kaufnebenkosten)

Calculate the full Kaufnebenkosten for the reference property price. Break down each component:

| Cost Component | Berlin Rate | Brandenburg Rate | Notes |
|---|---|---|---|
| Grunderwerbsteuer (land transfer tax) | 6.0% | 6.5% | Verify via Step 3 search results |
| Notar + Grundbuch (notary and land registry) | ~1.5-2.0% | ~1.5-2.0% | Legally required, non-negotiable |
| Makler (broker commission) | ~3.57% | ~3.57% | Including VAT; sometimes split buyer/seller or avoidable for direct purchases |
| Sanierungskosten (renovation reserve) | Variable | Variable | For Bestand properties only; EUR 200–1,500/m² depending on condition. Estimate from property inspection or listing details. |

Calculate the total Kaufnebenkosten as both a percentage and an absolute EUR amount. Emphasize that these costs are non-recoverable sunk costs — they do not contribute to equity in the property. Present both a "with Makler" and "without Makler" scenario, since the user may find direct-sale listings.

Compute the total capital required at closing: Eigenkapital for down payment (ideally 20-30% of purchase price) plus 100% of Kaufnebenkosten from savings. Banks generally do not finance Kaufnebenkosten.

## Step 5: Calculate Maximum Affordable Property Price

Determine affordability from two directions and take the more conservative result:

### Direction A: Equity-Based Maximum

Work backward from available Eigenkapital. Apply the formula:

```
Max price = (Eigenkapital - Kaufnebenkosten) / target_equity_ratio
```

Model three equity ratios: 10% (aggressive, higher rates), 20% (standard), and 30% (conservative, best rates). For each, calculate the implied loan amount and flag whether the Eigenkapital covers the full Kaufnebenkosten plus the down payment.

### Direction B: Income-Based Maximum

Apply the 35% rule: maximum monthly mortgage payment must not exceed 35% of net monthly income. From `monthly-budget.md`, also check the actual disposable income after fixed expenses — the real capacity may be lower than the 35% rule suggests.

Using the current Bauzins rates from Step 3, calculate the maximum loan amount for each Zinsbindung period (10, 15, 20 years). Assume an initial Tilgung (repayment) rate of 2-3% per year. Apply the annuity formula:

```
Monthly payment = Loan * (Zinssatz + Tilgung) / 12
```

Derive the maximum property price by adding the down payment to the maximum loan.

### Combined Result

Present a table showing the maximum affordable price under each combination of equity ratio and Zinsbindung period. Highlight the "sweet spot" where both equity and income constraints are satisfied.

## Step 6: Model Buy-to-Live Scenario (Eigentumswohnung)

Compare owning vs. continuing to rent over 10, 20, and 30-year horizons. For the full monthly cost breakdown, opportunity cost calculation, and break-even methodology, load `references/rent-vs-buy-model.md`.

Key inputs: mortgage Annuität, Hausgeld (EUR 2.50–4.50/m²), current rent from `monthly-budget.md`, Berlin rent increase trend (~2–3%/year), ETF opportunity cost at 6–7% net of 26.375% Kapitalertragsteuer, and Berlin appreciation assumption (1–3%/year).

**House-specific adjustments**: For houses (Einfamilienhaus, Doppelhaushälfte, Reihenhaus), replace the Hausgeld line item with direct costs: Wohngebäudeversicherung (typically EUR 150–500/year), Grundsteuer (varies by municipality; search for current rates), and a self-managed maintenance reserve (1–2% of property value per year). Include Sanierung costs as an upfront addition to the purchase price if the property is Bestand requiring renovation.

## Step 7: Model Buy-to-Let Scenario (Kapitalanlage)

Assess viability as an investment property. For the full rental yield formula, AfA application rules, and cash flow methodology, load `references/rent-vs-buy-model.md`.

Key inputs: gross yield = (annual rent / total purchase cost) × 100; net yield after Hausgeld, management (~5–8%), and vacancy (~3–5%); AfA at 2% (pre-2023 buildings) or 3% (from 2023) on building value only; rental income taxed at personal marginal rate.

## Step 8: Rent vs. Buy Comparison Summary

**Run the deterministic model first**, then build the table from its output (don't hand-compute
amortization or compounding):

```bash
BUN=$(command -v bun 2>/dev/null || echo "$HOME/.bun/bin/bun")
echo '{"purchase_price":500000,"kaufnebenkosten_pct":12,"equity":150000,"mortgage_rate_pct":3.6,
"tilgung_pct":2.0,"hausgeld_monthly":350,"current_rent_monthly":1600,"rent_increase_pct":2.5,
"etf_return_pct":6.5,"etf_tax_pct":18.46,"appreciation_pct":2.0,"horizons":[10,20,30]}' \
  | $BUN run <plugin_dir>/scripts/rent-vs-buy.ts
```

Fill the assumptions from the user's data and the market research above. The script returns
per-horizon owning vs renting net cost and the break-even year. Use these figures in the table.

Create a comparison table covering both scenarios:

| Metric | Rent + Invest | Buy to Live | Buy to Let |
|---|---|---|---|
| Monthly outflow | | | |
| Equity built at 10/20/30 years | | | |
| Total cost over 10/20/30 years | | | |
| Net worth impact at 10/20/30 years | | | |
| Liquidity / flexibility | High | Low | Medium |
| Risk profile | Market risk | Concentration risk | Tenant + market risk |

## Step 9: Assess Readiness and Generate Report

Determine a readiness score based on the following criteria:

- **Ready** — Eigenkapital covers at least 20% of target price plus full Kaufnebenkosten; monthly mortgage payment is under 30% of net income; emergency fund remains intact after down payment
- **Almost Ready** — Eigenkapital covers 10-20% plus partial Kaufnebenkosten, or monthly payment is 30-40% of net income; achievable within 6-12 months of additional saving
- **Not Yet Ready** — Eigenkapital insufficient for minimum down payment plus Kaufnebenkosten; monthly payment would exceed 40% of net income; recommend specific savings targets and timeline

Save the report to `finance/reports/real-estate-readiness-YYYY-MM.md` (use the current year and month). Structure the report as follows:

```markdown
---
title: "Real Estate Readiness Assessment"
date: YYYY-MM-DD
type: real-estate-readiness
status: draft
---
```

Include the following sections in order:

1. **Executive Summary** — readiness score (Ready / Almost Ready / Not Yet Ready) with a one-paragraph rationale
2. **Eigenkapital Assessment** — breakdown of available equity, emergency reserve, and deployable amount
3. **Kaufnebenkosten Breakdown** — table for the reference property price, with and without Makler
4. **Affordability Model** — maximum price table across equity ratios and Zinsbindung periods
5. **Buy-to-Live Analysis** — monthly cost comparison, break-even year, 10/20/30-year projections
6. **Buy-to-Let Analysis** — yield calculations, cash flow projection, tax treatment summary
7. **Rent vs. Buy Comparison** — the summary table from Step 8
8. **Berlin/Brandenburg Market Context** — current prices per m², recent trends, notable district-level differences
9. **Key Risks and Considerations** — interest rate risk, concentration risk, maintenance surprises, Mietpreisbremse implications, opportunity cost
10. **When to Consult a Professional** — specific referral flags from the analysis

Throughout the report, apply these formatting rules:

- Link German financial terms to the glossary using Obsidian wiki-links: `[[glossary#Term|Term]]`
- Use `> [!info]` callouts to explain key concepts when they first appear (Eigenkapital, Kaufnebenkosten, Zinsbindung, Hausgeld, AfA, Grunderwerbsteuer, Mietpreisbremse, Annuitat, Tilgung, Sondertilgung)
- Use `> [!warning]` callouts for professional referral flags (e.g., mortgage broker consultation, Steuerberater for rental income tax optimization, Notar selection)
- Show all math: include formulas, assumptions, and intermediate calculations so the user can verify and adjust
- End the report with the standard disclaimer: "This analysis is AI-generated and does not constitute professional financial, tax, or legal advice."

## Step 10: Glossary Maintenance

After saving the report, collect all German financial terms used in the report. Trigger the glossary-maintenance skill to add any new terms to `finance/reference/glossary.md`. If the glossary-maintenance skill is not available, manually read the glossary file, identify terms from this report that are missing, and append them with plain-English definitions.

Key terms to verify are present in the glossary: Eigenkapital, Kaufnebenkosten, Grunderwerbsteuer, Zinsbindung, Bauzins, Notar, Grundbuch, Makler, Hausgeld, Instandhaltungsrucklage, Tilgung, Sondertilgung, Annuitat, AfA, Mietpreisbremse, Kapitalanlage, Eigentumswohnung, Einkunfte aus Vermietung und Verpachtung, Wohngebaude, Mietspiegel, Sollzins, Effektivzins.

## Important Rules

- Never fabricate financial data. If a data file is missing, state the gap and suggest the user populate the file.
- Always show assumptions and sources. Every number from a web search must include its source.
- All monetary values in EUR. All output in English.
- If the user provides a specific property price or neighborhood as an argument, focus the analysis on that target. Otherwise, use the goals from `property-goals.md` or Berlin-wide median values.
- Flag any scenario where monthly mortgage payments exceed 40% of net income as high-risk.
- Flag any scenario where the emergency fund would be depleted by the down payment.
- The report status is always "draft" — the user must review before acting on any recommendation.
