---
name: bilanz
description: German alias for the HGB balance-sheet command
argument-hint: <Summen- und Saldenliste, Kontenliste oder Abschlusskontext>
---

# Bilanz

Erstelle oder pruefe eine HGB-Bilanz fuer: **$ARGUMENTS**

Nutze denselben Ablauf wie der primaere Command `balance-sheet`:

1. Verwende `hgb-closing-flow` fuer Input-Pruefung, Mapping-Reihenfolge und Abschlusschecks.
2. Nutze `bilanz-guv-format` mit `${CLAUDE_PLUGIN_ROOT}/templates/bilanz-266-hgb.md`.
3. Ordne Salden den Positionen nach §266 HGB zu.
4. Pruefe, dass Aktiva und Passiva uebereinstimmen und der Jahreserfolg sauber ins Eigenkapital ueberleitet.
5. Kennzeichne Luecken oder unklare Kontenzuordnungen explizit statt Werte zu raten.
