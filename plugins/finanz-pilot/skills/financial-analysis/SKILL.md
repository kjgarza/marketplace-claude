---
name: financial-analysis
description: This skill should be used when the user asks to "analyze finances", "financial position", "German tax", "pension analysis", "real estate purchase Germany", "expat finances Berlin", "Steuerklasse", "Kapitalertragsteuer", "investment comparison", "net worth overview", "savings rate", "Steuererklarung", "Grunderwerbsteuer", "retirement projection", "financial snapshot", "how much am I worth", or "budget review". Core knowledge skill providing German financial system context for an English-speaking expat in Berlin.
---

# Financial Analysis — Core Context

Provide quantitative, German-regulation-grounded financial analysis for an English-speaking expat living in Berlin. All output in English. All currency in EUR. All tax law references based on current German Einkommensteuergesetz (EStG) and related statutes.

## User Profile (Baseline Assumptions)

Apply these assumptions to every analysis unless overridden by data in `finance/data/`:

| Parameter | Value |
|---|---|
| Residence | Berlin, Germany |
| Tax residency | Germany — unbeschrankte Steuerpflicht (unlimited tax liability) |
| Steuerklasse | I (single, no dependents) |
| Household | Single, no children |
| Citizenship status | In progress (Einburgerung) |
| Real estate status | Currently renting; exploring purchase in Berlin and Brandenburg |
| Financial literacy | Beginner for German-specific topics; skip universally obvious concepts |
| Language | Source documents in German; all output in English |

## Analysis Principles

### Be Quantitative

Never state "this is expensive" or "returns are low" without numbers. Calculate actual amounts. Compare against benchmarks. Show projections over 5, 10, 20, and 30-year horizons where relevant. Express percentages to two decimal places and absolute amounts to the nearest euro.

Present every financial comparison as a numbered scenario analysis. For example, when comparing rent vs. buy: label Scenario A (continue renting) and Scenario B (purchase), then calculate the net position at year 10, 20, and 30 under each. Include opportunity cost — capital not spent on Kaufnebenkosten could be invested elsewhere.

When analyzing pension products, always compute the internal rate of return (IRR) net of all fees and taxes. Compare against a benchmark: a low-cost MSCI World ETF accumulating at an assumed 7% gross nominal return, minus Abgeltungsteuer on realization. This benchmark makes the true cost of insurance wrappers and guarantee fees visible.

For savings rate analysis, express the savings rate as a percentage of Nettoeinkommen (not gross). Break down where savings flow: emergency fund, ETF-Sparplan, pension, Bausparvertrag, or other vehicles. Flag when the total savings allocation exceeds available Nettoeinkommen minus fixed costs.

### Show Math

Include formulas and state assumptions explicitly. State every assumption in a dedicated "Assumptions" block at the top of each calculation section. Flag which assumptions are user-provided data and which are estimates or defaults.

For tax calculations, write out each step:

```
Gross salary:                    €X
- Sozialversicherungsbeitrage:   €Y
= Bruttoeinkommen (taxable):    €Z
- Income tax (per EStG tariff):  €A
- Solidaritatszuschlag:          €B
= Nettoeinkommen:               €C
```

When projecting investment growth, state the assumed return rate, inflation rate, and fee drag separately. Use compound interest formula: `FV = PV * (1 + r)^n` and show intermediate values at key milestones (year 5, 10, 15, 20, 25, 30).

For real-value projections, always present both nominal and inflation-adjusted (real) figures. Use the ECB target inflation rate of 2% as default unless a different rate is specified or retrieved via web search. Label columns clearly: "Nominal EUR" vs. "Real EUR (2026 purchasing power)."

### Cross-Check Results

After every major calculation, perform a sanity check. Compare the result against known benchmarks or rules of thumb:

- Net salary should be approximately 55–65% of gross for Steuerklasse I at typical Berlin salaries
- Total Kaufnebenkosten in Berlin should be 8–12% of purchase price (depending on broker involvement)
- A Riester contract with fees above 1.5% Effektivkosten per year is expensive relative to market average
- Savings rate above 20% of Nettoeinkommen is above the German median; below 10% warrants a budget review

If results deviate significantly from these ranges, re-examine the inputs and flag the discrepancy.

### Use Current Data

Use web search to retrieve current figures before every analysis. Do not rely on cached or training data for:

- Mortgage interest rates (Bauzinsen) — check Interhyp, Dr. Klein, or Europace
- Berlin and Brandenburg property prices per square meter — check Immoscout24 Preisatlas or Guthmann
- ETF total expense ratios and performance — check justETF or extraETF
- German tax thresholds and social insurance contribution ceilings (Beitragsbemessungsgrenze) — check Bundesfinanzministerium or Haufe
- Inflation rates — check Destatis (Statistisches Bundesamt)

### Apply German Tax Law

Reference the following tax parameters in calculations:

**Income Tax (Einkommensteuer)**
- Apply the current EStG tariff (progressive rates from 14% to 45%)
- Grundfreibetrag (basic tax-free allowance): look up current year value via web search
- Solidaritatszuschlag (Soli): 5.5% of income tax, but only when income tax exceeds the Freigrenze
- Kirchensteuer: not applicable unless the user states church membership (assume none)

**Capital Gains Tax (Kapitalertragsteuer / Abgeltungsteuer)**
- Flat rate: 25%
- Plus Solidaritatszuschlag: 5.5% of the 25% = 1.375%
- Effective rate without Kirchensteuer: 26.375%
- Sparerpauschbetrag (saver's lump sum): EUR 1,000 for singles
- Apply Freistellungsauftrag before calculating tax on investment income
- For Gunstigerprufung: if the marginal income tax rate is below 25%, apply the lower rate instead

**Real Estate Transfer Tax (Grunderwerbsteuer)**
- Berlin: 6.0%
- Brandenburg: 6.5%
- Include in total purchase cost calculations alongside notary fees (~1.5%), land registry fees (~0.5%), and optional broker commission (Maklerprovision, typically 3.57% including VAT, split buyer/seller in Berlin)

**Savings Incentives**
- Wohnungsbaupr&auml;mie: available for income below threshold; contribute to Bausparvertrag
- Arbeitnehmersparzulage: employer vermogenswirksame Leistungen (VL) contribution; check eligibility based on income limits
- Riester-Zulage: EUR 175 basic allowance; check if the user qualifies based on pension insurance membership

## Data Sources

### Input Data

Read financial data from the following locations within the Obsidian vault:

- **`finance/data/`** — structured markdown files: `pension.md`, `bank-accounts.md`, `employment.md`, `monthly-budget.md`, `property-goals.md`
- **`finance/docs/`** — raw German document transcriptions: Standmitteilungen, Kontoauszuge, Arbeitsvertrag, Nebenkostenabrechnungen

Parse markdown tables and key-value pairs from these files. When a data file is missing or incomplete, flag the gap and state what assumptions were made.

### Reference Material

Load the German financial system reference from `references/german-financial-system.md` (relative to this skill's directory) for term definitions, tax bracket details, and regulatory background.

For specific analyses, use the dedicated skills: `retirement-readiness` for three-pillar pension projections and Versorgungslücke analysis, `capital-allocation` for integrated pension vs. real estate allocation recommendations, and `evaluate-pension` for single-product pension evaluation.

### Output Destination

Write all generated reports to `finance/reports/` using the naming pattern:

```
[analysis-type]-YYYY-MM.md
```

Examples: `pension-evaluation-2026-04.md`, `real-estate-readiness-2026-04.md`, `tax-check-2026-04.md`, `net-worth-2026-04.md`.

## Output Format

### Obsidian-Compatible Markdown

Generate all reports as Obsidian-compatible markdown with the following structure:

**YAML Frontmatter (required):**

```yaml
---
title: "[Analysis Type] — [Month Year]"
date: YYYY-MM-DD
type: financial-report
status: draft
tags:
  - finance
  - [analysis-type]
---
```

**Wiki-Links:** Use `[[double-bracket]]` links when referencing other vault files, e.g., `[[pension]]`, `[[bank-accounts]]`, `[[glossary]]`.

**Callouts:** Use Obsidian callout syntax for inline explanations and warnings:

```markdown
> [!info] Kapitalertragsteuer (Capital Gains Tax)
> Germany levies a flat 25% tax on investment income (plus Soli), for an effective rate of 26.375%. The first EUR 1,000 (Sparerpauschbetrag) is tax-free if a Freistellungsauftrag is filed with the bank.

> [!warning] Consult a Steuerberater
> This scenario involves cross-border income. A qualified tax advisor (Steuerberater) should review the tax implications before proceeding.
```

**Tables:** Use markdown tables for comparisons, projections, and summaries. Align numeric columns to the right.

**Charts:** When comparing scenarios (e.g., rent vs. buy, ETF vs. pension), present a side-by-side table with key metrics: total cost, net return, effective annual yield, tax impact, and liquidity.

**Section Structure:** Organize each report with a consistent hierarchy:

1. **Executive Summary** — three to five bullet points with the key findings and recommended actions
2. **Current Position** — snapshot of relevant financial data from `finance/data/`
3. **Analysis** — detailed calculations, comparisons, and projections
4. **Scenarios** — labeled alternatives (Scenario A, B, C) with trade-offs
5. **Recommendations** — prioritized action items with estimated impact
6. **Next Steps** — specific tasks the user can take immediately
7. **Disclaimer and Professional Referral** — mandatory footer sections

## Concept Explanations

When introducing a German financial concept for the first time in a report, provide a brief explanation in an `> [!info]` callout. Explain in plain English. Include the German term in parentheses. Link to the `[[glossary]]` entry if one exists. Do not re-explain concepts already covered earlier in the same report.

Target audience: someone who understands general finance (compound interest, diversification, opportunity cost) but is unfamiliar with German-specific regulations, institutions, and terminology.

## Expat-Specific Considerations

Address these factors when relevant to the analysis:

- **Einburgerung timeline:** Citizenship application may affect eligibility for certain subsidies (e.g., Riester-Zulage requires Pflichtversicherung in GRV, not citizenship per se, but status changes during the process can affect benefits).
- **Aufenthaltstitel (residence permit):** Property purchase does not require German citizenship. Mortgage lenders may require a permanent residence permit (Niederlassungserlaubnis) or at minimum a long-term Aufenthaltstitel.
- **Progressionsvorbehalt:** Foreign-sourced income exempt under a DBA (Doppelbesteuerungsabkommen / double taxation agreement) may still increase the tax rate on German income. Flag when the user mentions income from abroad.
- **Social insurance continuity:** Gaps in Sozialversicherung due to relocation affect GRV pension entitlement. Calculate Entgeltpunkte based on actual German contribution years, not total career length.
- **Schufa history:** Expats who arrived recently may have a thin Schufa file. Note this as a potential obstacle in mortgage applications and suggest steps to build credit history (register address correctly at Burgeramt, have utility contracts in own name, use a German credit card).
- **EUR-only analysis:** Do not convert to other currencies. If the user holds assets in other currencies, note the FX exposure but perform all calculations in EUR.

## Mandatory Report Footer

End every generated report with the following two sections:

### Disclaimer

```markdown
---

> [!caution] AI-Generated Analysis
> This report was generated by an AI assistant (Claude) based on user-provided financial data and publicly available information about German tax law and financial regulations. It does not constitute financial, tax, or legal advice. Figures may contain errors. Tax law changes frequently — verify all thresholds and rates against current Bundesfinanzministerium publications.
```

### When to Consult a Professional

Include a bulleted list of specific scenarios from the analysis that warrant professional review. Tailor the list to the actual content of the report. Examples:

- "The pension contract contains a Garantiezins clause — a Versicherungsberater can assess whether early termination or Beitragsfreistellung is financially optimal."
- "Grunderwerbsteuer plus closing costs exceed EUR 30,000 — a Steuerberater can advise on deductibility if part of the property is rented out."
- "Income from foreign sources may trigger Progressionsvorbehalt — consult a Steuerberater experienced with expat taxation."
- "The Riester contract may lose Zulage eligibility upon Einburgerung completion — verify with the Zentrale Zulagenstelle fur Altersvermogen (ZfA)."

Never produce a generic disclaimer list. Each item must reference a specific finding or scenario from the analysis.
