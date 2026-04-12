---
name: guv
description: German alias for the HGB income-statement command
argument-hint: <Summen- und Saldenliste, Kontenliste oder Abschlusskontext>
---

# GuV

Erstelle oder pruefe eine HGB-Gewinn- und Verlustrechnung fuer: **$ARGUMENTS**

Nutze denselben Ablauf wie der primaere Command `income-statement`:

1. Verwende `hgb-closing-flow` fuer Input-Pruefung, GuV-Logik und Abschlusschecks.
2. Nutze `bilanz-guv-format` mit `${CLAUDE_PLUGIN_ROOT}/templates/guv-gkv-275.md` oder `${CLAUDE_PLUGIN_ROOT}/templates/guv-ukv-275.md`.
3. Wenn nichts anderes angegeben ist, nutze GKV als Standard und benenne die Annahme.
4. Ordne Salden den Positionen nach §275 HGB zu.
5. Pruefe Zwischensummen und die Ueberleitung des Jahresergebnisses.
