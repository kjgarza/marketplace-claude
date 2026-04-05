---
name: glossary-maintenance
description: >
  This skill should be used when generating financial reports, encountering German financial terms,
  or when the user asks to "update glossary", "add term to glossary", "maintain glossary",
  "explain German financial term", "what does [term] mean", "define [German financial term]", or
  "financial vocabulary". Manages automatic glossary maintenance for German financial
  terminology in Obsidian.
---

# German Financial Terms Glossary Maintenance

Automatically maintain a living glossary of German financial terms at `finance/reference/glossary.md` within the user's Obsidian vault. The glossary serves as a beginner-friendly reference for an English-speaking expat navigating the German financial system. Every German financial term that appears in any generated report or analysis must have a corresponding glossary entry.

## Glossary File Location

Store the glossary at the following path relative to the Obsidian vault root:

```
finance/reference/glossary.md
```

If the file does not exist, create it with the initial template specified below. If the parent directories do not exist, create them.

## Glossary File Format

Structure the glossary file exactly as follows:

```markdown
---
title: German Financial Terms Glossary
updated: YYYY-MM-DD
---

# German Financial Terms Glossary

## A

### Abgeltungsteuer (AbgSt)
Flat-rate withholding tax on capital gains and investment income. Currently 25% plus Solidaritätszuschlag and optional Kirchensteuer. Applied automatically by German banks and brokers.

### Arbeitnehmersparzulage
Government bonus for employee savings plans (vermögenswirksame Leistungen). Available for employees below certain income thresholds.

## B

### Betriebliche Altersvorsorge (bAV)
Company pension scheme funded through salary conversion (Entgeltumwandlung). Contributions are tax-advantaged up to certain limits defined in the EStG.

...
```

### Format Rules

- Use level-2 headings (`##`) for alphabetical section letters (A, B, C, ...).
- Use level-3 headings (`###`) for individual terms.
- Place the German term as the heading text. Include common abbreviations in parentheses after the term — e.g., `### Abgeltungsteuer (AbgSt)`.
- Follow each heading with 1-3 sentences of plain-English explanation.
- Include practical context explaining how the term affects the user's personal financial situation (taxes, pensions, property purchases, etc.).
- Target a beginner audience — assume the reader understands general financial concepts but not German-specific regulations or bureaucratic processes.
- Sort all terms alphabetically by German term within their letter section.
- Only include letter sections that contain at least one term. Do not create empty sections.

## Core Workflow

### Step 1: Track German Financial Terms During Report Generation

When generating any financial report, analysis, or response that involves German financial concepts, maintain an internal running list of every German financial term used. This includes:

- Tax terms (Einkommensteuer, Abgeltungsteuer, Solidaritätszuschlag, Kirchensteuer, etc.)
- Pension terms (Riester-Rente, Rürup-Rente, gesetzliche Rentenversicherung, Betriebsrente, etc.)
- Real estate terms (Grunderwerbsteuer, Grundbuch, Nebenkostenabrechnung, Wohnungseigentümergemeinschaft, etc.)
- Banking and investment terms (Freistellungsauftrag, Sparerpauschbetrag, Tagesgeldkonto, etc.)
- Employment terms (Bruttoeinkommen, Nettoeinkommen, Steuerklasse, Lohnsteuerbescheinigung, etc.)
- Legal and regulatory terms (EStG, BGB, Finanzamt, Steuerbescheid, etc.)
- Insurance terms (Haftpflichtversicherung, Berufsunfähigkeitsversicherung, Krankenversicherung, etc.)

### Step 2: Read the Existing Glossary

After completing a report or analysis, read the glossary file at `finance/reference/glossary.md`. Parse the existing entries to determine which terms are already defined.

If the file does not exist, create it using the template from the "Glossary File Format" section above, populated with whatever terms were tracked in Step 1.

### Step 3: Identify Missing Terms

Compare the list of German financial terms used in the current report against the terms already present in the glossary. Mark any term that appears in the report but lacks a glossary entry as "missing."

Also flag any existing entries that could benefit from improved or expanded definitions based on new context encountered during the current analysis. Do not flag entries for trivial rewording — only flag when the existing definition is materially incomplete or misleading.

### Step 4: Add New Terms

For each missing term, write a glossary entry following these guidelines:

- **Heading**: Use the full German term. Include the standard abbreviation in parentheses if one is commonly used (e.g., `Abgeltungsteuer (AbgSt)`).
- **Definition**: Write 1-3 sentences in plain English. Start with what the term means, then explain its practical relevance.
- **Context**: Where applicable, note how the concept interacts with the user's financial situation — for example, whether it reduces taxable income, affects property purchase costs, or triggers reporting obligations.
- **Tone**: Keep language accessible. Avoid jargon-heavy explanations. If referencing another German term within a definition, use its Obsidian wiki-link form (see Step 5).

Insert each new entry in the correct alphabetical position. Create new letter sections as needed.

### Step 5: Update Existing Definitions (When Warranted)

If an existing definition is materially incomplete — for example, a pension term that omits the tax treatment, or a property term that fails to mention Berlin-specific rates — expand the definition. Preserve the original wording where possible and append additional context.

Never remove or shorten existing definitions. Only add information.

### Step 6: Update the Frontmatter Date

Set the `updated` field in the glossary's YAML frontmatter to today's date in `YYYY-MM-DD` format.

### Step 7: Link Terms in Reports Using Obsidian Wiki-Links

When writing or finalizing any report or analysis that references German financial terms, link each term to its glossary entry using the Obsidian wiki-link format:

```markdown
[[glossary#Abgeltungsteuer (AbgSt)|Abgeltungsteuer]]
```

The format is: `[[glossary#<Exact Heading>|<Display Text>]]`

- `<Exact Heading>` must match the level-3 heading in the glossary exactly, including any parenthetical abbreviation.
- `<Display Text>` is the term as it naturally appears in the sentence — typically just the German word without the abbreviation.

Apply wiki-links on the first occurrence of each term in a report section. Do not link every single occurrence — link only the first mention per section to avoid visual clutter.

## Handling Edge Cases

### Compound Terms

Some German financial terms are compound words (e.g., Grunderwerbsteuer = Grunderwerb + Steuer). Define the compound term as a single glossary entry. Do not break compounds into separate entries unless each component is independently used in financial contexts.

### Regional Variations

When a term has Berlin-specific or Brandenburg-specific implications (e.g., Grunderwerbsteuer rates vary by Bundesland), note the regional variation in the definition. Specify the Berlin rate as the primary reference.

### Legal References

When a term is defined or governed by a specific law (e.g., EStG, BGB, AO), mention the law by abbreviation and include a brief note about what it governs. Add a glossary entry for the law abbreviation itself.

### Terms with Multiple Meanings

If a German term has different meanings in different financial contexts (e.g., Freibetrag can refer to various types of tax allowances), define the primary financial meaning and note the variants.

## Constraints

- Never remove existing terms from the glossary.
- Never shorten or reduce existing definitions.
- Always preserve alphabetical ordering.
- Always use plain English for definitions — the user is a beginner for German financial concepts.
- Always update the `updated` date in frontmatter when making any change to the glossary.
- Always use the Obsidian wiki-link format `[[glossary#Term|Term]]` when referencing glossary terms in reports.
- Do not add terms that are universally understood financial concepts without German-specific nuance (e.g., do not add "Portfolio" or "Dividende" unless the German tax or regulatory treatment differs meaningfully from general understanding).
- Limit each definition to 3 sentences maximum. If a term requires extensive explanation, write a concise glossary entry and suggest the user request a deep-dive analysis.
