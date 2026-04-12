---
name: hgb-accounting
description: Use for German statutory accounting, bookkeeping, month-end or year-end close, journal entries, provisions, accruals, depreciation, balance sheets, or profit and loss statements under HGB. Trigger on terms like Buchung, Buchungssatz, Rueckstellung, Abschluss, Jahresabschluss, Bilanz, GuV, AfA, Rechnungsabgrenzung, and on German legal forms like GmbH, UG, AG, KG, OHG, e.K.
---

# HGB Accounting

Apply HGB as the default framework for German single-entity statutory accounts unless the user explicitly asks for IFRS or the case is a capital-market-oriented consolidated reporting scenario.

## Core principles

Use these principles in analysis and output:
- Vollstaendigkeit, Richtigkeit, Klarheit, Einzelbewertung, Stetigkeit
- Vorsichtsprinzip under §252 Abs. 1 Nr. 4 HGB
- Realisationsprinzip and Imparitaetsprinzip
- Niederstwertprinzip for asset valuation where applicable

## Framework selection

1. Identify the legal form and whether the request concerns Einzelabschluss or Konzernabschluss.
2. For GmbH, UG, AG, KG, OHG, and e.K. single-entity statutory reporting, default to HGB.
3. For capital-market-oriented consolidated reporting, flag IFRS relevance under §315e HGB.
4. If the user mixes frameworks, say so explicitly and separate HGB from IFRS treatment.

## Working method

1. Determine the business event and relevant HGB topic.
2. Identify the likely accounts using the `skr04-kontenrahmen` skill.
3. Determine recognition, measurement, and VAT treatment.
4. Produce the booking, schedule, or statement in a clearly structured format.
5. Cite the relevant HGB sections for non-trivial judgments.

## Common HGB anchors

Use paragraph citations when they materially affect the answer:
- §238 HGB for bookkeeping duty
- §242 HGB for annual financial statements
- §246 HGB for completeness and balance sheet recognition
- §249 HGB for provisions
- §250 HGB for prepaid and deferred items (RAP)
- §252 HGB for general valuation principles
- §253 HGB for measurement
- §255 HGB for acquisition and production cost
- §266 HGB for balance sheet structure
- §275 HGB for GuV structure
- §267 HGB for size classes

## Guardrails

- Do not invent account numbers when a suitable SKR04 account is not known. Say that the mapping needs confirmation.
- Distinguish clearly between trade law (HGB), tax law (EStG/KStG/GewStG), and VAT law (UStG).
- If the user gives too little information for a booking, ask only for the missing facts that change the accounting treatment.
- When a case is ambiguous, present the likely treatment and the reason it could differ.
