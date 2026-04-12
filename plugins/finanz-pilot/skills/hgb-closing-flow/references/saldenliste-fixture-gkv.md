# Worked Fixture: Saldenliste To Bilanz And GuV (GKV)

Use this as a small validation-oriented example for the `trial-balance-to-statements` flow. It is intentionally compact and uses mostly the starter mappings already shipped by the plugin.

## Scenario

- Reporting date: 2025-12-31
- Source type: simplified Summen- und Saldenliste
- GuV format: GKV
- Assumption: equity opening balances are already grouped, because the plugin does not yet ship a full detailed SKR04 equity map

## Example source input

| Source line | Balance EUR | Direction | Expected destination |
|---|---:|---|---|
| 1200 Bank | 35,000 | debit | Bilanz Aktiva B.IV |
| 1360 Forderungen aus Lieferungen und Leistungen | 11,900 | debit | Bilanz Aktiva B.II.1 |
| 1576 Abziehbare Vorsteuer 19% | 1,330 | debit | Bilanz Aktiva B.II.4 |
| 1600 Verbindlichkeiten aus Lieferungen und Leistungen | 4,760 | credit | Bilanz Passiva C.4 |
| 1776 Umsatzsteuer 19% | 1,900 | credit | Bilanz Passiva C.8 |
| Opening equity balances (grouped) | 30,000 | credit | Bilanz Passiva A. Eigenkapital before current-year result |
| 4400 Erloese 19% USt | 50,000 | credit | GuV Umsatzerloese |
| 4960 Fremdleistungen | 30,000 | debit | GuV Materialaufwand in this fixture |
| 6300 Sonstige betriebliche Aufwendungen | 5,000 | debit | GuV Sonstige betriebliche Aufwendungen |
| 6815 Bueroaufwand | 2,100 | debit | GuV Sonstige betriebliche Aufwendungen |
| 7600 Zinsaufwendungen | 1,330 | debit | GuV Zinsen und aehnliche Aufwendungen |

## Expected mapping summary

```text
Mapping summary:
- 1200 -> Bilanz Aktiva B.IV Liquide Mittel
- 1360 -> Bilanz Aktiva B.II.1 Forderungen aus Lieferungen und Leistungen
- 1576 -> Bilanz Aktiva B.II.4 sonstige Vermoegensgegenstaende
- 1600 -> Bilanz Passiva C.4 Verbindlichkeiten aus Lieferungen und Leistungen
- 1776 -> Bilanz Passiva C.8 sonstige Verbindlichkeiten
- Opening equity balances -> Bilanz Passiva A. Eigenkapital
- 4400 -> GuV Umsatzerloese
- 4960 -> GuV Materialaufwand for this example
- 6300 and 6815 -> GuV Sonstige betriebliche Aufwendungen
- 7600 -> GuV Zinsen und aehnliche Aufwendungen
```

## Expected GuV output

```text
Gewinn- und Verlustrechnung nach §275 Abs. 2 HGB (GKV)

1. Umsatzerloese: 50,000 EUR
5. Materialaufwand: 30,000 EUR
8. Sonstige betriebliche Aufwendungen: 7,100 EUR
13. Zinsen und aehnliche Aufwendungen: 1,330 EUR
17. Jahresueberschuss: 11,570 EUR
```

## Expected Bilanz output

```text
Bilanz nach §266 HGB

Aktiva
- B. Umlaufvermoegen
  - II. Forderungen und sonstige Vermoegensgegenstaende
    - 1. Forderungen aus Lieferungen und Leistungen: 11,900 EUR
    - 4. sonstige Vermoegensgegenstaende: 1,330 EUR
  - IV. Kassenbestand, Bundesbankguthaben, Guthaben bei Kreditinstituten und Schecks: 35,000 EUR

Passiva
- A. Eigenkapital: 41,570 EUR
- C. Verbindlichkeiten
  - 4. Verbindlichkeiten aus Lieferungen und Leistungen: 4,760 EUR
  - 8. sonstige Verbindlichkeiten: 1,900 EUR
```

## Expected checks

- Aktiva total: 48,230 EUR
- Passiva total: 48,230 EUR
- GuV result: 11,570 EUR
- Equity tie-out: 30,000 opening equity + 11,570 current-year result = 41,570 EUR

## What this fixture is for

- Validating that the command produces both statements, not only one
- Validating that the GuV result flows into equity
- Validating that common accounts use the shipped starter mapping before ad hoc reasoning

## What this fixture does not prove

- Detailed equity subaccount mapping
- Taxes on income and earnings
- Depreciation, provisions, RAP, or fixed-asset schedules
- UKV-specific classification
