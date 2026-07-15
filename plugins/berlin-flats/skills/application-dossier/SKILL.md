---
name: application-dossier
description: This skill should be used when the user asks to "prepare an application", "prepare my Bewerbungsmappe", "what documents do I need for a flat application", or wants to apply for a Berlin rental after a viewing. Covers the standard Berlin application dossier, document freshness rules, and the applicant's legal rights (Selbstauskunft limits, Kaution cap, Abstandszahlung rules).
---

# Berlin Rental Application Dossier

## Standard Bewerbungsmappe contents (in the order landlords expect)

| # | Document | Freshness | Notes |
|---|----------|-----------|-------|
| 1 | Cover letter (Anschreiben) | per listing | Draft with the `scribe` agent, mode `application` |
| 2 | Mieterselbstauskunft | current | Landlord's own form if provided, else a standard one |
| 3 | SCHUFA-BonitätsAuskunft | ≤ 3 months | Consumer version is fine; landlords reject stale ones |
| 4 | Last 3 payslips | newest ≤ ~3 months | Rule of thumb: warm rent ≤ 1/3 net income |
| 5 | Employer confirmation | optional | Confirms unbefristet contract; strengthens the file |
| 6 | Mietschuldenfreiheitsbescheinigung | ≤ 6 months | From the current landlord; optional but Hausverwaltungen like it |
| 7 | ID / passport copy | current | — |

Run `bun scripts/dossier.ts` to check readiness against `config/config.toml` `[documents]`.

## Legal guardrails (protect the applicant)

- **Kaution**: max 3 months cold rent (§ 551 BGB), payable in 3 monthly installments. Demands above this are illegal.
- **Abstandszahlung / fixture takeover**: payment for furniture or fixtures (Trockenbauwand, Küche, Hochebene) may not noticeably exceed their actual value (§ 4a WoVermittG). A demand clearly above value is unenforceable — negotiate or walk.
- **Deposit before viewing**: never. Automatic scam signal (see skills/scam-patterns).
- **Selbstauskunft — questions the landlord may NOT ask** (answering falsely carries no consequence): pregnancy/family planning, religion, party or union membership, criminal record, illnesses, previous rent amount. Questions the landlord MAY ask: identity, income and employer, household size, pets, guarantors, ongoing insolvency proceedings.

## Workflow

1. Check readiness: `bun scripts/dossier.ts` → fix `missing`/`stale`/`file_not_found` items first.
2. Fill the landlord's Selbstauskunft (or the standard form) from `[profile]` facts — flag any illegal questions to the user instead of answering them.
3. Draft the cover letter with the `scribe` agent in `application` mode.
4. Assemble as ONE PDF in the table order above — Hausverwaltungen forward a single attachment more reliably than six.

The document order table is a sensible default, adapt if a landlord requests a specific format.
