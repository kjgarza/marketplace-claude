---
name: immobilien-check
description: German alias for the real-estate-check command
argument-hint: <Preis, Lage oder Immobilientyp, z.B. '€400.000', 'Pankow', 'Einfamilienhaus', 'Kapitalanlage'>
---

# Immobilien-Check

Pruefe die Kaufbereitschaft fuer: **$ARGUMENTS**

Nutze denselben Ablauf wie der primaere Command `real-estate-check`:

1. Verwende die `real-estate-readiness` Skill fuer die vollstaendige Kaufbereitschaftspruefung.
2. Datenbasis: `finance/data/bank-accounts.md`, `finance/data/employment.md`, `finance/data/monthly-budget.md`, `finance/data/property-goals.md`. Falls Dateien fehlen, Vorlagen unter `${CLAUDE_PLUGIN_ROOT}/templates/` nutzen.
3. Unterstuetzt Eigentumswohnungen, Einfamilienhaeuser, Doppelhaushaeelften, Reihenhaeuser sowie Neubau und Bestand.
4. Argument mit Preis, Lage oder Typ wird an die Skill weitergegeben.
