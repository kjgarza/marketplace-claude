# Rent vs. Buy Modeling Frameworks

Detailed modeling methodology for buy-to-live and buy-to-let scenarios used in the real estate readiness assessment.

## Buy-to-Live Model (Eigentumswohnung)

Compare owning vs. continuing to rent over 10, 20, and 30-year horizons.

**Monthly ownership costs:**
- Mortgage payment (Annuität: Zins + Tilgung)
- Hausgeld (monthly maintenance fee for the building, typically EUR 2.50–4.50/m²; includes Instandhaltungsrücklage)
- Property-related insurance (Wohngebäude, Hausrat — estimate if not known)

**Monthly renting costs:**
- Current rent from `monthly-budget.md`
- Assumed annual rent increase (use Berlin Mietspiegel trend, typically 2–3% per year; search if needed)

**Opportunity cost of equity:**
- Calculate the alternative return if the Eigenkapital were invested in a diversified ETF portfolio (assume 6–7% nominal annual return, minus Kapitalertragsteuer at 26.375%)

**Net comparison:**
- For each horizon (10/20/30 years), calculate total cost of owning vs. total cost of renting plus investment returns on the equity difference
- Include the estimated property value at the end of each horizon (assume 1–3% annual appreciation for Berlin; search for recent trends)
- Present a break-even analysis: at what year does buying become cheaper than renting?

## Buy-to-Let Model (Kapitalanlage)

Assess viability as an investment property.

**Gross rental yield:**
- Search for current average rental prices per m² in the target area(s)
- Calculate: (annual rent / purchase price including Kaufnebenkosten) × 100

**Net rental yield after costs:**
- Subtract: Hausgeld (non-recoverable portion), property management if applicable (~5–8% of rent), vacancy allowance (~3–5%), maintenance reserve
- Note Mietpreisbremse (rent cap) regulations in Berlin — verify current status via web search

**Tax treatment of rental income (Einkünfte aus Vermietung und Verpachtung):**
- Rental income is taxed at the personal marginal income tax rate, not the flat Kapitalertragsteuer
- Deductible expenses: mortgage interest (Schuldzinsen), depreciation (AfA), Hausgeld, maintenance, Grundsteuer, insurance
- AfA (Absetzung für Abnutzung): 2% linear for buildings constructed before 2023; 3% linear for buildings completed from 2023 onward. Apply to the building portion only (exclude land value, typically 20–40% of total price in Berlin)

**Cash flow analysis:**
- Monthly: rental income minus mortgage payment minus Hausgeld minus management fees
- Annual: include tax refund/liability from rental income deductions
- Flag whether the property is cash-flow positive or requires monthly subsidy from salary
