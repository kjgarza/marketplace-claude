# SKR04 To HGB Starter Mapping

Use this reference as a compact default mapping aid when turning a trial balance or account list into Bilanz and GuV outputs under HGB.

This is intentionally a starter set, not a full DATEV import. It covers common accounts and recurring classes that the plugin already references. If a source account falls outside this set, say so and keep the mapping provisional.

## Common account mappings

| SKR04 | Account name | Typical HGB destination |
|---|---|---|
| 1200 | Bank | Bilanz §266 Aktiva B. Umlaufvermoegen / IV. Kassenbestand, Bundesbankguthaben, Guthaben bei Kreditinstituten und Schecks |
| 1360 | Forderungen aus Lieferungen und Leistungen | Bilanz §266 Aktiva B. Umlaufvermoegen / II. Forderungen und sonstige Vermoegensgegenstaende / 1. Forderungen aus Lieferungen und Leistungen |
| 1576 | Abziehbare Vorsteuer 19% | Bilanz §266 Aktiva B. Umlaufvermoegen / II. Forderungen und sonstige Vermoegensgegenstaende / 4. sonstige Vermoegensgegenstaende |
| 1600 | Verbindlichkeiten aus Lieferungen und Leistungen | Bilanz §266 Passiva C. Verbindlichkeiten / 4. Verbindlichkeiten aus Lieferungen und Leistungen |
| 1776 | Umsatzsteuer 19% | Bilanz §266 Passiva C. Verbindlichkeiten / 8. sonstige Verbindlichkeiten |
| 4400 | Erloese 19% USt | GuV §275 Abs. 2 oder 3 / Umsatzerloese |
| 4960 | Fremdleistungen | GuV §275 Abs. 2 / Materialaufwand or Sonstige betriebliche Aufwendungen depending on substance; mark if unclear |
| 6300 | Sonstige betriebliche Aufwendungen | GuV §275 Abs. 2 oder 3 / Sonstige betriebliche Aufwendungen |
| 6815 | Bueroaufwand | GuV §275 Abs. 2 oder 3 / Sonstige betriebliche Aufwendungen |
| 7600 | Zinsaufwendungen | GuV §275 Abs. 2 oder 3 / Zinsen und aehnliche Aufwendungen |
| 8600 | Ertraege aus Abgang von Anlagevermoegen | GuV §275 Abs. 2 oder 3 / Sonstige betriebliche Ertraege |
| 9000 | Saldenvortraege Sachkonten | Usually not a direct statement line; resolve into underlying opening balances or flag as a close artifact |

## Account-class shortcuts

Use these only when the specific account is not listed but the source clearly belongs to the same class:

| Account class | Typical default |
|---|---|
| Liquidity / Bank / Cash | Bilanz Aktiva B. Umlaufvermoegen / IV. Kassenbestand, Bundesbankguthaben, Guthaben bei Kreditinstituten und Schecks |
| Trade receivables | Bilanz Aktiva B. Umlaufvermoegen / II.1 Forderungen aus Lieferungen und Leistungen |
| Input VAT receivable | Bilanz Aktiva B. Umlaufvermoegen / II.4 sonstige Vermoegensgegenstaende |
| Trade payables | Bilanz Passiva C.4 Verbindlichkeiten aus Lieferungen und Leistungen |
| Output VAT payable | Bilanz Passiva C.8 sonstige Verbindlichkeiten |
| Equity opening balances | Bilanz Passiva A. Eigenkapital |
| Current-year result | Bilanz Passiva A. Eigenkapital / Jahresueberschuss or Jahresfehlbetrag until appropriation is clarified |
| Revenue accounts | GuV / Umsatzerloese unless the source clearly points to financial income or disposal gains |
| Operating expense accounts | GuV / Sonstige betriebliche Aufwendungen unless the source clearly belongs to Materialaufwand, Personalaufwand, taxes, or interest |
| Interest expense accounts | GuV / Zinsen und aehnliche Aufwendungen |
| Disposal gains on fixed assets | GuV / Sonstige betriebliche Ertraege |

## Use notes

- Prefer a listed specific account mapping over an account-class shortcut.
- If a balance could reasonably belong to multiple lines, show the preferred destination and the reason.
- Do not use this starter mapping to infer depreciation, provisions, deferred items, or equity sub-lines that are not evidenced in the source.
- Keep the final statement headings aligned with the existing HGB templates.
