---
name: bilanz-guv-format
description: Use for preparing or reviewing HGB balance sheet and profit-and-loss statement layouts, including §266 HGB Bilanzgliederung and §275 HGB GuV formats under GKV or UKV. Trigger on Bilanz, GuV, Jahresabschluss, GKV, UKV, Aktiva, Passiva, Jahresueberschuss, or line-item structure requests.
portable: false
---

> `<plugin_dir>` = this plugin's root directory (two levels above this SKILL.md).

# HGB Statement Formats

Use the plugin templates for statement structure:
- `<plugin_dir>/templates/bilanz-266-hgb.md`
- `<plugin_dir>/templates/guv-gkv-275.md`
- `<plugin_dir>/templates/guv-ukv-275.md`

## Working method

1. Confirm whether the user needs Bilanz, GuV, or both.
2. For GuV, determine whether GKV or UKV is required.
3. Preserve HGB ordering and headings even when values are zero or omitted in source data.
4. Flag missing subtotals, classification gaps, or line items that break §266 or §275 structure.
5. Cross-check that Jahresueberschuss or Jahresfehlbetrag flows consistently into equity.

## Guardrails

- Keep HGB line-item names recognizable even when translating surrounding explanation.
- Distinguish clearly between presentation template and final legal filing.
- If source data is incomplete, produce a draft with explicit gaps rather than filling numbers by guesswork.
