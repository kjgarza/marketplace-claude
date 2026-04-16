# Three-Pillar Retirement Projection Methodology

Detailed calculation methodology for projecting retirement readiness across all three German pension pillars.

---

## Pillar 1: GRV (Gesetzliche Rentenversicherung)

### Entgeltpunkte Calculation

For each year of German employment:

```
EP_year = min(Gross annual salary, Beitragsbemessungsgrenze) / Durchschnittsentgelt
```

- **Beitragsbemessungsgrenze (BBG)**: Contribution ceiling. Look up the current value — approximately EUR 90,600 (West) for 2025. Earnings above the BBG do not generate additional Entgeltpunkte.
- **Durchschnittsentgelt**: Average national earnings. Look up the current value — approximately EUR 45,358 for 2025. A salary exactly at Durchschnittsentgelt earns 1.0 Entgeltpunkte.
- One full-time employment year at median salary = 1.0 EP.
- Maximum EP per year ≈ 2.0 (at BBG / Durchschnittsentgelt).

### Projection to Retirement

```
Total EP = Sum of past EP + (remaining years × projected annual EP)
```

For projected annual EP, use the current salary unless the user specifies expected salary changes. Adjust Durchschnittsentgelt by assumed 2% annual growth.

### Monthly Pension Calculation

```
Monthly GRV pension = Total EP × aktueller Rentenwert × Zugangsfaktor × Rentenartfaktor
```

- **Aktueller Rentenwert**: Current pension point value. Look up — approximately EUR 39.32 (West) for 2025. Adjusted annually by the Rentenanpassung.
- **Zugangsfaktor**: 1.0 for retirement at Regelaltersgrenze (67). Reduced by 0.003 per month of early retirement (3.6% per year). Increased by 0.005 per month of delayed retirement.
- **Rentenartfaktor**: 1.0 for Altersrente (standard old-age pension).

### EU Aggregation (Regulation 883/2004)

For expats with employment periods in other EU/EEA countries:
- Contribution periods are aggregated for eligibility purposes (minimum 5 years for GRV)
- Each country pays its own pension based on its own rules
- Calculate the German portion based only on German Entgeltpunkte
- Note: foreign pension amounts must be estimated separately and are outside this skill's scope

### Taxation of GRV Pension

GRV pensions are subject to nachgelagerte Besteuerung:
- The taxable percentage depends on the year of first pension receipt (not the year of retirement)
- By 2058: 100% of GRV pension is taxable
- For a retirement start in ~2055–2060: assume 100% taxable
- Apply the personal income tax rate in retirement (typically lower due to lower total income)

---

## Pillar 2: bAV (Betriebliche Altersvorsorge)

### Projection by Vehicle Type

**Direktversicherung / Pensionskasse**:
- Defined contribution: project using assumed return rate (conservative: 2–3% for guaranteed, 4–6% for fund-linked)
- Use provider Standmitteilung projections if available
- Formula: `FV = PV × (1+r)^n + PMT × ((1+r)^n - 1) / r` where PMT = monthly contribution, r = monthly return, n = months to retirement

**Pensionsfonds**:
- Similar to Direktversicherung but with potentially higher equity allocation
- Use provider projections; if unavailable, assume 4–6% return

**Unterstützungskasse / Direktzusage**:
- Defined benefit: use the employer's formula (typically a percentage of final salary per year of service)
- If formula unknown: estimate based on total contributions plus conservative growth

### Tax and Social Insurance on bAV Payouts

bAV payouts in retirement are subject to:
- Full income tax at personal rate (nachgelagerte Besteuerung)
- Health insurance: KVdR-Beitrag at the full rate (~14.6% + Zusatzbeitrag, approximately 16%)
- Pflege insurance: ~3.4%
- Total social insurance deduction: approximately 19–20% of bAV pension
- Net bAV payout ≈ bAV gross × (1 - marginal tax rate) × (1 - ~0.19)

---

## Pillar 3: Private Pension and Self-Directed Savings

### Riester-Rente Projection

- Project capital at retirement: current value + future contributions + Zulagen + assumed investment return - fees
- Convert to monthly payout using provider's conversion factor (typically worse than market annuity rates due to longevity guarantees)
- Tax treatment: 100% of payout taxed at personal income tax rate in retirement

### Rürup-Rente (Basisrente) Projection

- Project capital at retirement: current value + future contributions (up to deduction ceiling) + assumed return - fees
- Payout as lifelong annuity only (no lump sum option)
- Tax treatment: taxable percentage depends on retirement year (rising to 100% by 2058)

### ETF / Depot Projection

- `FV = Current value × (1 + r_net)^n + Monthly Sparplan × ((1 + r_net)^n - 1) / r_net`
- r_net = gross return - TER - annual Vorabpauschale drag
- At withdrawal: apply 26.375% Abgeltungsteuer (with 30% Teilfreistellung for equity ETFs → effective ~18.46% on gains)
- Monthly withdrawal: 4% rule → annual withdrawal = 4% of portfolio, divided by 12
- The 4% rule provides a conservative estimate; adjust for German inflation and life expectancy if needed

---

## Versorgungslücke (Pension Gap) Framework

### Target Retirement Income

The standard replacement ratio target is 70–80% of current net income. Rationale:
- No more Sozialversicherungsbeiträge (~20% of gross)
- No more commuting costs
- No more retirement savings
- But: higher healthcare costs, more leisure spending, potential long-term care needs

Formula:
```
Target monthly income = Current net monthly income × 0.75 (mid-range)
```

Adjust downward if the user will own property outright by retirement (no rent/mortgage), or upward if the user has expensive hobbies or expects high care costs.

### Inflation Adjustment

All projections should be presented in both nominal and real terms:
```
Real value = Nominal value / (1 + inflation)^years_to_retirement
```

Use 2% annual inflation (ECB target) as default. This means a pension gap of EUR 500/month today requires approximately EUR 500 × (1.02)^30 ≈ EUR 905/month in nominal terms at retirement in 30 years.

### Capital Required to Close the Gap

Using the 4% safe withdrawal rate:
```
Required capital = Annual gap / 0.04
```

Example: EUR 500/month gap = EUR 6,000/year → EUR 150,000 required capital.

For insurance-based solutions (annuity purchase), the required capital is typically 20–40% higher due to insurer margins and longevity guarantees.

---

## Wohn-Riester Methodology

### Eligibility and Rules (§92a, §92b EStG)

**Qualifying withdrawal (Altersvorsorge-Eigenheimbetrag)**:
- Up to 100% of Riester capital can be withdrawn
- Minimum withdrawal: EUR 3,000
- Must be used for: acquisition or construction of self-occupied residential property, or barrier-free renovation
- Property must be in the EU/EEA
- Property must be the user's primary residence (Hauptwohnung)

**Wohnförderkonto**:
- Withdrawn amount + all future Zulagen (that would have been paid) are booked to a notional account
- The account balance grows at 2% per year until retirement (not actual returns — fixed notional rate)
- At retirement, the Wohnförderkonto balance is subject to nachgelagerte Besteuerung

**Taxation options at retirement**:
- **Option A**: Spread the Wohnförderkonto balance over the period from retirement to age 85 → annual taxable income addition = balance / remaining years
- **Option B**: One-time taxation with 30% discount → pay tax on 70% of the balance in one year
- Choose based on expected marginal tax rate in retirement vs. the discount benefit

### Trade-Off Calculation

**Benefit of Wohn-Riester**:
```
Mortgage reduction = Riester withdrawal amount
Interest saved = Riester amount × mortgage interest rate × remaining loan term (amortized)
```

Calculate the total interest savings over the full mortgage term. This is the primary financial benefit.

**Cost of Wohn-Riester**:
```
Forgone pension = What the Riester capital would have grown to at retirement × annuity conversion factor
Tax on Wohnförderkonto = Wohnförderkonto balance at retirement × marginal tax rate (or 70% × rate)
```

**Net benefit**:
```
Net = Total interest saved - NPV of forgone pension - NPV of Wohnförderkonto tax
```

If positive: Wohn-Riester is financially beneficial.
If negative: keeping the Riester as a pension is better.

### Capital Redirection Modeling

When comparing "keep paying pension" vs. "redirect to property down payment":

```
Scenario: Pension continuation
  Monthly pension contribution → projected pension capital at retirement
  Monthly pension payout in retirement

Scenario: Redirect to property
  Monthly contribution → down payment savings account
  Timeline to reach target Eigenkapital (20% of property price + Kaufnebenkosten)
  Impact on retirement income: reduced Pillar 3, but:
    + No rent expense in retirement (if property owned outright)
    + Potential rental income (if buy-to-let)
    + Property equity as legacy asset
```

Present both scenarios with 10/20/30-year projections and net worth comparison at age 67.
