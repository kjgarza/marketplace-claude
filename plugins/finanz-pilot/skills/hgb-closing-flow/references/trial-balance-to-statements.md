# Trial Balance To Statements

Use this reference when the user provides a trial balance, Summen- und Saldenliste, or a raw year-end account export and wants a coherent HGB statement package.

## Minimum input to ask for

Ask only for the items that block classification or tie-out:
- reporting date or reporting period
- account number, account name, and ending balance
- debit/credit sign convention if not obvious from the export
- whether the GuV should be GKV or UKV when the user has a preference
- any known year-end adjustments still pending

## Recommended sequence

1. Normalize the source
   - confirm whether signs are shown as debit/credit, positive/negative, or split columns
   - keep the original labels visible when re-grouping accounts
2. Build a mapping table
   - source account or account group
   - tentative HGB destination line
   - confidence or open issue note
3. Draft the GuV first when the result account flow is clearer from revenue and expense balances.
4. Draft the Bilanz next, ensuring the annual result is reflected in equity consistently.
5. Run the tie-outs explicitly before presenting the final statements.

## Suggested mapping summary format

```text
Mapping summary:
- 1200 Bank -> B. Umlaufvermoegen / Kassenbestand, Bundesbankguthaben, Guthaben bei Kreditinstituten und Schecks
- 1400 Forderungen aus Lieferungen und Leistungen -> B. Umlaufvermoegen / Forderungen und sonstige Vermoegensgegenstaende
- 1600 Verbindlichkeiten aus Lieferungen und Leistungen -> C. Verbindlichkeiten
- Revenue and expense accounts -> GuV nach §275 HGB
- Open items: [list]
```

## Checks before final output

- Assets equal liabilities and equity.
- The GuV result is not stranded outside equity in the Bilanz.
- Provisions are not mixed with trade payables.
- RAP balances are not hidden inside operating expense or other receivables/payables.
- Open close items are listed separately from finalized statement lines.

## If the input is incomplete

Return:
- a draft Bilanz
- a draft GuV
- a short list titled `Still needed for final statements`

Do not invent:
- missing balances
- tax expense allocations
- year-end accruals
- depreciation or provision movements that are not evidenced in the source
