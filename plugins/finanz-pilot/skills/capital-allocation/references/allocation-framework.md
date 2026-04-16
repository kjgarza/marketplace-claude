# Capital Allocation Decision Framework

Reference material for the integrated capital allocation skill. Provides the decision matrix structure, scoring methodology, and pension-property interaction effects.

---

## Decision Matrix Structure

### Criteria Definitions

**1. Net Worth at 67 (Weight: 25%)**
Total projected assets at retirement age in real EUR (inflation-adjusted). Includes:
- Pension capital across all three pillars (GRV capitalized value, bAV value, private pension value)
- Property equity (market value minus outstanding mortgage)
- Liquid investments (Depot, Tagesgeld)
- Minus: outstanding debts

Score 5: Highest net worth among scenarios. Score 1: Lowest.

**2. Monthly Retirement Income (Weight: 25%)**
Projected monthly income from all sources after tax:
- GRV pension (net of income tax)
- bAV pension (net of income tax and social insurance)
- Private pension payouts (net of applicable tax)
- ETF withdrawals (net of Abgeltungsteuer)
- Imputed rent savings (if property owned outright — value the avoided rent at market rate)
- Rental income (if buy-to-let property, net of costs and tax)

Score 5: Highest monthly income. Score 1: Lowest.

**3. Liquidity and Flexibility (Weight: 15%)**
Ability to access capital before retirement and adapt to life changes:
- Pension capital is locked until retirement (low liquidity)
- Property equity is illiquid (requires sale or refinancing)
- ETF portfolio is fully liquid (highest flexibility)
- Emergency fund preservation is critical

Score 5: High liquid reserves, diversified access points. Score 1: Most capital locked in illiquid assets.

**4. Tax Efficiency (Weight: 15%)**
Total tax savings during the accumulation phase:
- Rürup contributions: deductible at marginal rate (currently 100%)
- Riester Zulagen: EUR 175/year + Sonderausgabenabzug
- bAV Entgeltumwandlung: exempt from income tax and social insurance up to limits
- ETF Sparplan: no upfront tax benefit, but Teilfreistellung and Sparerpauschbetrag on gains
- Property: Grunderwerbsteuer is a cost (not a benefit); mortgage interest deductible only for buy-to-let

Calculate total annual tax savings for each scenario and project over the accumulation period.

Score 5: Highest cumulative tax savings. Score 1: Lowest.

**5. Risk Concentration (Weight: 10%)**
Diversification of assets and income sources:
- Heavy property allocation = concentration in a single illiquid asset in one geographic market
- Heavy pension allocation = diversified across markets (if ETF-based) but locked
- Balanced allocation = best diversification

Score 5: Well-diversified across asset classes, geographies, and liquidity profiles. Score 1: >70% of net worth in a single asset (e.g., one property).

**6. Timeline to Property Purchase (Weight: 10%)**
Years until the user can feasibly purchase a property:
- Based on equity accumulation rate vs. required Eigenkapital
- Infinity (or "not planned") for pension-only scenarios

Score 5: Purchase feasible within 1–2 years. Score 3: 3–5 years. Score 1: >5 years or not planned.

Adjust this weight upward if the user's argument indicates urgency ("buy within 2 years") or downward if property is lower priority.

### Weight Adjustment Rules

If the user provides a constraint argument, adjust weights:

| Constraint | Increase | Decrease |
|-----------|----------|----------|
| "buy within X years" | Timeline to property → 25% | Net worth, Retirement income → 20% each |
| "maximize pension" / "retirement focus" | Retirement income → 35% | Timeline to property → 5% |
| "prioritize liquidity" | Liquidity → 25% | Risk concentration → 5% |
| "maximize tax efficiency" | Tax efficiency → 25% | Liquidity → 10% |
| No constraint | Use default weights | — |

---

## Pension ↔ Property Interaction Effects

### Wohn-Riester Bridge

Using Riester capital for property purchase creates a direct link between Pillar 3 and real estate:

- **Positive interaction**: Riester capital reduces mortgage principal → lower interest payments → lower total cost of ownership
- **Negative interaction**: Wohnförderkonto creates a deferred tax liability in retirement → reduces effective retirement income
- **Break-even analysis**: If mortgage interest rate > Riester net return (after fees), Wohn-Riester is advantageous. If mortgage rate < Riester net return, keeping the Riester as a pension is better.
- **Typical outcome**: At current mortgage rates (3–4%) and typical Riester net returns (2–4% after fees), Wohn-Riester often breaks even or slightly favors property use, especially for high-fee Riester contracts.

### bAV and Mortgage Affordability

bAV Entgeltumwandlung reduces gross salary → reduces net salary → reduces the income available for mortgage qualification.

- Banks assess mortgage affordability based on net income
- High bAV contributions may reduce the maximum mortgage amount the bank will approve
- Consider temporarily reducing bAV (if voluntary) during the mortgage application phase
- After purchase: can increase bAV again since mortgage is already locked in

### Rürup Tax Savings → Equity Acceleration

Rürup contributions generate immediate tax savings at the marginal rate:
- At 42% marginal rate: EUR 500/month Rürup contribution → EUR 210/month tax refund
- Reinvest the tax refund into the property down payment savings
- Net cost of EUR 500 Rürup contribution = EUR 290/month after tax benefit
- This creates a "dual-benefit" strategy: pension grows AND property equity grows (from tax savings)

This interaction makes Scenario C (Balanced) and Scenario D (Hybrid) particularly powerful.

### Property Ownership and Retirement Income

Owning property outright by retirement creates an implicit income stream:
- If the user would otherwise pay EUR 1,200/month rent in retirement, owning eliminates that cost
- Imputed rental savings should be valued at the projected market rent at retirement (adjust current rent by 2–3% annual growth)
- This "income" is tax-free (no Mieteinnahmen to declare for self-occupied property)
- Effect: property ownership partially closes the Versorgungslücke even if pension income is lower

### Concentration Risk Offset

A property-heavy portfolio (Scenarios B, D) concentrates risk in Berlin/Brandenburg real estate. Mitigants:
- Maintain at least 3–6 months emergency fund in liquid assets
- Continue modest ETF Sparplan (even EUR 100–200/month) for market diversification
- GRV provides a floor of inflation-adjusted income regardless of property market
- Consider: if property prices decline 20%, does the user still have positive equity?

---

## Projection Methodology

### Compound Growth Formula

For all projections:
```
FV = PV × (1 + r)^n + PMT × ((1 + r)^n - 1) / r
```
Where:
- FV = future value
- PV = present value (current balance)
- r = monthly return rate (annual rate / 12)
- n = number of months
- PMT = monthly contribution

### Return Assumptions

| Asset | Gross Return | Fee Drag | Net Return |
|-------|-------------|----------|------------|
| ETF portfolio (MSCI World) | 7.0% | 0.2% TER | 6.8% nominal |
| Low-cost pension wrapper | 7.0% | 0.5% total | 6.5% nominal |
| High-cost pension | 7.0% | 1.5–2.5% total | 4.5–5.5% nominal |
| Berlin property appreciation | 1–3% | 0% | 1–3% nominal |
| Tagesgeld / savings | 2–3% | 0% | 2–3% nominal |

Always present results at three return levels: conservative (base - 2%), moderate (base), optimistic (base + 2%).

### Inflation Adjustment

Use 2% annual inflation (ECB target) as default:
```
Real return = (1 + nominal return) / (1 + inflation) - 1
```

Present all final comparisons in both nominal and real EUR to avoid misleading the user with large nominal numbers that ignore purchasing power erosion.

### Mortgage Modeling

```
Monthly Annuität = Loan × (Zinssatz + Tilgungsrate) / 12
```

Model at:
- Current Bauzins (look up for 10/15/20-year Zinsbindung)
- +1% stress test
- +2% stress test

After Zinsbindung expires, assume a refinancing rate. Use a conservative assumption: current rate + 1% for 10-year Zinsbindung renewal.

Calculate Restschuld (remaining balance) at the end of each Zinsbindung period.
