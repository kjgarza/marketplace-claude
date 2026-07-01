---
name: tax-check
description: This skill should be used when the user asks to "check taxes", "tax optimization", "reduce taxes Germany", "Steuererklärung tips", "tax deductions", "Werbungskosten check", "Sparerpauschbetrag optimization", "what can I deduct", "prepare for Steuerberater", or "file tax return". Identifies tax optimization opportunities for a single expat in Berlin using German tax law.
argument-hint: "[optional: specific area to focus on, e.g., 'investment income', 'pension deductions', 'property tax implications']"
allowed-tools: ["Read", "Write", "Edit", "WebSearch", "Bash", "Glob", "Grep"]
portable: false
---

> `<plugin_dir>` = this plugin's root directory (two levels above this SKILL.md).

# Tax Check — German Tax Optimization for Berlin Expat

Identify tax optimization opportunities for the user's situation as a single expat in Berlin, Germany. Produce a structured, quantitative report with actionable recommendations ranked by estimated annual savings. All output in English. All currency in EUR. All tax references grounded in current German Einkommensteuergesetz (EStG) and related statutes.

Load `<plugin_dir>/skills/financial-analysis/references/german-financial-system.md` for detailed German tax parameters, deduction categories, and regulatory context.

## Step 1: Read Financial Data

Read all files in `finance/data/` to establish the user's current financial position:

- `finance/data/employment.md` — gross salary, Steuerklasse, employer benefits, bonus structure, any Geldwerter Vorteil (benefits in kind)
- `finance/data/pension.md` — pension provider, plan type (Riester, Ruerup, private Rentenversicherung), contribution amounts
- `finance/data/bank-accounts.md` — savings accounts, brokerage accounts, interest earned, current Freistellungsauftrag allocations
- `finance/data/monthly-budget.md` — income vs. expenses, identifying deductible categories
- `finance/data/property-goals.md` — real estate purchase timeline and target parameters

If a file is missing or incomplete, flag the gap explicitly in the report and state what assumptions were made in its place. Do not silently substitute default values.

Also read any raw documents in `finance/docs/` that may contain relevant details (Arbeitsvertrag, Kontoauszuege, Standmitteilungen).

## Step 2: Web Search for Current Tax Parameters

Before performing any calculations, execute web searches to retrieve current-year figures. Do not rely on training data for any of the following:

1. **German income tax brackets (Einkommensteuertarif)** — search for the current year's tariff schedule, including the Grundfreibetrag (basic tax-free allowance), entry rate (14%), top rate (42%), and Reichensteuer threshold (45%).
2. **Sparerpauschbetrag** — confirm the current saver's lump-sum allowance (expected EUR 1,000 for singles). Verify whether any legislative changes have taken effect.
3. **Werbungskostenpauschale** — confirm the current employee lump-sum deduction (expected EUR 1,230). Check for any increases.
4. **Homeoffice-Pauschale** — confirm the per-day amount and maximum annual cap.
5. **Vorsorgeaufwendungen limits** — maximum deductible pension contributions for Basisversorgung (Ruerup/gesetzliche Rente).
6. **Sonderausgaben limits** — deduction ceilings for insurance premiums and other special expenses.
7. **Recent tax law changes** — search for any new deductions, changed thresholds, or expiring provisions relevant to the current tax year.

Record the source URL and retrieval date for each figure. Include these in the report for traceability.

## Step 3: Analyze Income and Identify Deductions

Calculate the current estimated tax burden step by step. Show all math explicitly:

```
Gross annual salary:                         EUR X
- Sozialversicherungsbeitraege:              EUR Y
  (Rentenversicherung, Krankenversicherung,
   Pflegeversicherung, Arbeitslosenversicherung)
= Zu versteuerndes Einkommen (before deductions): EUR Z
- Applicable deductions (see below):         EUR D
= Zu versteuerndes Einkommen (final):       EUR F
- Einkommensteuer (per EStG tariff):         EUR T
- Solidaritaetszuschlag:                     EUR S
= Estimated annual tax burden:               EUR B
```

### 3a: Werbungskosten (Income-Related Expenses)

Determine whether actual work-related expenses exceed the Werbungskostenpauschale (EUR 1,230). For km rates, day caps, EUR 800 equipment threshold, and all other calculation parameters, load `<plugin_dir>/skills/financial-analysis/references/german-financial-system.md`.

Key categories to evaluate: Entfernungspauschale (commuting), Homeoffice-Pauschale (max EUR 1,260/year, cannot combine with Entfernungspauschale on the same day), professional development, work equipment, association dues, double household (Doppelte Haushaltsführung), and relocation costs.

If actual costs exceed EUR 1,230, flag as an optimization opportunity and quantify the additional deduction. Use `> [!info] Werbungskosten` callouts to explain the concept inline in the generated report.

### 3b: Sonderausgaben (Special Expenses)

Evaluate deductible special expenses. For deduction ceilings, percentage rules, and Günstigerprüfung criteria, load `<plugin_dir>/skills/financial-analysis/references/german-financial-system.md`.

Key categories: Basisversorgung contributions (GRV + Rürup, 100% deductible since 2023), Kranken-/Pflegeversicherung Basisbeiträge (fully deductible), Riester Sonderausgabenabzug (up to EUR 2,100 including Zulage), and charitable donations (Spenden up to 20% of income).

Use `> [!info] Sonderausgaben` callouts to explain the concept inline in the generated report.

### 3c: Aussergewoehnliche Belastungen (Extraordinary Expenses)

Note this category for completeness. Flag if any of the following apply based on the user's data: significant medical expenses not covered by insurance, disability-related costs, or care costs for dependents. If none apply, state that no extraordinary expenses were identified.

## Step 4: Review Investment Income Optimization

Analyze investment and savings income for tax efficiency:

1. **Sparerpauschbetrag utilization:** Sum all investment income (interest, dividends, realized capital gains) across all accounts. Determine whether the EUR 1,000 Sparerpauschbetrag is fully utilized, underutilized, or exceeded.
2. **Freistellungsauftrag allocation:** Check whether Freistellungsauftraege are filed with each bank and broker. Verify that the total across all institutions does not exceed EUR 1,000. Flag any account earning investment income without a Freistellungsauftrag — tax is being withheld unnecessarily on income that could be tax-free.
3. **Loss harvesting (Verlustverrechnung):** Identify positions with unrealized losses. Explain that selling and immediately rebuying (or buying a similar ETF) crystallizes the loss for tax offset. Note the restriction: Aktienverluste can only offset Aktiengewinne, not other investment income.
4. **Guenstigerpruefung:** If the user's marginal income tax rate is below 25%, flag that a tax return could reclaim overpaid Kapitalertragsteuer via the Guenstigerpruefung.

> [!info] Freistellungsauftrag (Tax Exemption Order)
> A standing instruction to a bank or broker to not withhold tax on investment income up to a specified amount. The total across all institutions must not exceed the Sparerpauschbetrag (EUR 1,000 for singles). Without it, tax is withheld at source and must be reclaimed via a tax return.

> [!info] Verlustverrechnung (Loss Offsetting)
> Realized investment losses can offset gains, reducing the tax bill. Losses from share sales (Aktien) can only offset gains from share sales, not dividends or interest. Losses from other investments (ETFs classified as Investmentfonds, bonds, interest) can offset all types of investment income.

## Step 5: Pension-Specific Tax Optimization

Evaluate pension arrangements for tax efficiency:

1. **Ruerup (Basisrente):**
   - Calculate the maximum tax-deductible contribution for the current year.
   - Determine how much the user is currently contributing.
   - Quantify the tax saving from increasing contributions to the maximum deductible amount.
   - Note the trade-off: contributions are locked until retirement (earliest age 62), and payouts are taxed as income.

2. **Riester-Rente:**
   - Verify eligibility (requires membership in gesetzliche Rentenversicherung or being a Beamter).
   - Check whether the minimum contribution (4% of Vorjahresbrutto, minus Zulagen) is being met to receive the full Grundzulage of EUR 175.
   - Calculate the Sonderausgabenabzug benefit: determine whether the tax deduction (up to EUR 2,100) exceeds the Zulage — if so, the difference is refunded via the tax return.
   - Flag that Einbuergerung status change does not affect Riester eligibility if the user remains in the German pension system.

3. **Private Rentenversicherung (non-subsidized):**
   - Note that contributions are not tax-deductible.
   - Assess whether reallocating contributions to a Ruerup or increasing Riester would be more tax-efficient.

4. **Betriebliche Altersvorsorge (bAV):**
   - Check whether the employer offers Entgeltumwandlung (salary sacrifice).
   - Calculate the tax and social insurance savings from contributing up to the bAV tax-free limit (currently 8% of the Beitragsbemessungsgrenze West for Rentenversicherung).

## Step 6: Real-Estate-Related Tax Preview

If `finance/data/property-goals.md` indicates the user is planning to purchase property, outline the tax implications:

### Buy-to-Live Scenario

- Grunderwerbsteuer: 6.0% (Berlin) or 6.5% (Brandenburg) of the purchase price.
- Closing costs summary: notary (~1.5%), land registry (~0.5%), optional Makler (typically 3.57% incl. VAT, split buyer/seller in Berlin).
- No ongoing income tax benefit for owner-occupied property (mortgage interest is not deductible).
- Spekulationssteuer exemption: gains from selling owner-occupied property are tax-free after living in it for the year of sale plus the two preceding calendar years.

### Buy-to-Let Scenario

- **Rental income taxation (Einkuenfte aus Vermietung und Verpachtung):** rental income is added to total taxable income and taxed at the marginal rate.
- **Deductible Werbungskosten for landlords:**
  - Mortgage interest (Schuldzinsen) — fully deductible against rental income.
  - Depreciation (AfA — Absetzung fuer Abnutzung): 2% per year for buildings constructed after 1924, 2.5% for buildings constructed before 1925. For buildings completed after 2023: check whether the new 3% degressive AfA applies.
  - Maintenance and repair costs (Instandhaltungskosten).
  - Property management fees (Hausverwaltung).
  - Hausgeld (non-allocable share, i.e., the portion not passed to tenants via Nebenkostenabrechnung).
  - Insurance, property tax (Grundsteuer), travel to the property.
- **Verlustverrechnung for rental losses:** if deductible expenses exceed rental income, the loss offsets other income (e.g., employment income), reducing the overall tax burden. This is a significant tax optimization for leveraged property purchases.

> [!warning] Real Estate Tax Complexity
> Property purchase and rental income taxation involve numerous interacting rules. The estimates here are indicative. Engage a Steuerberater before committing to a purchase — particularly to model the tax impact of financing structure, AfA, and rental income projections.

## Step 7: Generate the Report

Save the report to `finance/reports/tax-check-YYYY-MM.md` using the current year and month. Structure the report as follows:

### YAML Frontmatter

```yaml
---
title: "Tax Optimization Check — [Month Year]"
date: YYYY-MM-DD
type: tax-check
status: draft
tags:
  - finance
  - tax-check
---
```

### Report Sections

1. **Executive Summary** — three to five bullet points covering the most impactful findings.
2. **Current Estimated Tax Burden** — full calculation breakdown as shown in Step 3. Present as a structured table or code block with aligned figures.
3. **Optimization Opportunities** — each opportunity as a subsection with:
   - Description of the optimization.
   - Estimated annual tax saving in EUR.
   - Difficulty/effort level (e.g., "file one form" vs. "requires restructuring pension").
   - Rank opportunities by estimated annual savings, highest first.
4. **Investment Income Tax Review** — Sparerpauschbetrag status, Freistellungsauftrag check, loss harvesting candidates.
5. **Pension Tax Efficiency** — current vs. optimized contribution strategy, with projected tax savings.
6. **Property Purchase Tax Preview** — buy-to-live and buy-to-let scenarios with cost projections.
7. **Action Items** — numbered list of concrete next steps, ordered by priority and expected impact.
8. **Glossary References** — link all German terms used to `[[glossary]]` entries using wiki-link syntax.

### Callouts and Formatting

Use `> [!info]` callouts to explain German tax concepts inline — Werbungskosten, Sonderausgaben, Freistellungsauftrag, Verlustverrechnung, Vorsorgeaufwendungen, Sparerpauschbetrag, Guenstigerpruefung, Entfernungspauschale, Homeoffice-Pauschale, and others as they arise.

Use `> [!warning]` callouts to flag situations requiring professional advice. Be specific — reference the exact finding that triggers the referral.

### Mandatory Disclaimer

End the report with:

```markdown
---

> [!caution] AI-Generated Analysis
> This report was generated by an AI assistant (Claude) based on user-provided financial data and publicly available information about German tax law and financial regulations. It does not constitute financial, tax, or legal advice. Figures may contain errors. Tax law changes frequently — verify all thresholds and rates against current Bundesfinanzministerium publications.
```

### When to Consult a Professional

Include a tailored list of specific scenarios from the analysis that warrant professional review. Each item must reference a concrete finding — never produce a generic list. Always include the following baseline recommendation:

> A Steuerberater can file an Einkommensteuererklaerung to claim deductions beyond the Pauschale amounts — this is likely worthwhile in your case given that [cite specific reason from analysis, e.g., actual Werbungskosten exceed the Pauschale, or Ruerup contributions provide a significant deduction].

Additional items should reference specific findings, for example:

- Cross-border income implications if applicable (Progressionsvorbehalt).
- Property purchase structuring for optimal AfA and interest deduction.
- Riester Zulage eligibility after Einbuergerung.
- bAV optimization with employer.

## Step 8: Trigger Glossary Maintenance

After saving the report, identify all German financial and tax terms used in the report. Invoke the `glossary-maintenance` skill to ensure each term has an entry in `finance/reference/glossary.md`. Pass the list of terms from the report as input. New terms introduced in this analysis — such as Guenstigerpruefung, Entfernungspauschale, Homeoffice-Pauschale, Verlustverrechnung, Freistellungsauftrag, or any others not previously in the glossary — must be added with plain-English definitions and cross-references.
