---
name: finanzplan
description: German alias for the financial-plan command
argument-hint: <Praeferenz oder Einschraenkung, z.B. 'Kauf innerhalb 2 Jahre', 'Rente maximieren', 'Liquiditaet priorisieren'>
---

# Finanzplan

Erstelle einen integrierten Kapitalallokationsplan fuer: **$ARGUMENTS**

Nutze denselben Ablauf wie der primaere Command `financial-plan`:

1. Verwende die `capital-allocation` Skill fuer den integrierten Finanzplan.
2. Voraussetzung: aktuelle Berichte unter `finance/reports/` (Rentenanalyse, Immobilienpruefung, Altersvorsorge-Projektion). Falls Berichte fehlen oder aelter als 3 Monate, zuerst `/rente-pruefen` und `/immobilien-check` ausfuehren.
3. Datenbasis: alle Dateien unter `finance/data/`. Falls Dateien fehlen, Vorlagen unter `${CLAUDE_PLUGIN_ROOT}/templates/` nutzen.
4. Ergebnis: vier Szenarien (Rentenpriorisierung, Immobilienpriorisierung, Ausgewogen, Wohn-Riester-Hybrid) mit Bewertungsmatrix, Sensitivitaetsanalyse und Massnahmenplan.
