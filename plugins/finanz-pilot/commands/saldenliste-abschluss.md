---
name: saldenliste-abschluss
description: German alias for converting a Summen- und Saldenliste into Bilanz and GuV
argument-hint: <Summen- und Saldenliste oder Abschlussdaten>
---

# Saldenliste Abschluss

Fuehre diese Summen- und Saldenliste in einen HGB-Abschluss ueber: **$ARGUMENTS**

Nutze denselben Ablauf wie der primaere Command `trial-balance-to-statements`:

1. Verwende `hgb-closing-flow` und die Referenz `trial-balance-to-statements.md`.
2. Ordne Salden zuerst den Positionen nach §266 HGB und §275 HGB zu.
3. Weise unklare Zuordnungen und fehlende Abschlussbuchungen vor dem Endergebnis explizit aus.
4. Gib Bilanz, GuV und einen Abstimmungsblock gemeinsam aus.
