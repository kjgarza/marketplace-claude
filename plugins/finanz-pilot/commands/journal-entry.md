---
name: journal-entry
description: Create an HGB journal entry with SKR04 account mapping and VAT treatment
argument-hint: <business event description>
---

# Journal Entry

Create an HGB-compliant journal entry for: **$ARGUMENTS**

## Workflow

1. Analyze the business event and determine the accounting substance.
2. Use the `skr04-kontenrahmen` skill to identify the most plausible SKR04 accounts.
3. Determine debit and credit under double-entry bookkeeping.
4. Assess VAT treatment: 19%, 7%, 0%, exempt, intra-community, or reverse charge.
5. For non-trivial recognition or measurement questions, use the `hgb-accounting` skill and cite the relevant HGB basis.
6. Ask only for facts that would materially change the booking treatment.

## Output Format

Use this structure:

```text
Journal entry:
Debit account (No.) / Credit account (No.) - Amount EUR

Reasoning:
- accounting classification
- VAT treatment
- HGB reference when judgment is non-trivial
- note if the mapping remains provisional
```

## Guardrails

- Always include account number and account name.
- If multiple mappings are plausible, give the preferred entry first and note the deciding factor.
- For provisions, check and document the recognition criteria under §249 HGB.
- For prepaid/deferred items, cite §250 HGB.
- For depreciation or valuation questions, cite §253 HGB.
- If the account mapping cannot be confirmed confidently from the plugin data, mark it as provisional.
