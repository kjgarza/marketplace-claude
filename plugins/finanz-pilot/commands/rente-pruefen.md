---
name: rente-pruefen
description: German alias for the evaluate-pension command
argument-hint: <Schwerpunkt oder Rentenart, z.B. 'Gebühren', 'Alternativen', 'Riester', 'Altersvorsorge', 'alle Renten'>
---

# Rente prüfen

Bewerte die Rentensituation fuer: **$ARGUMENTS**

Nutze denselben Ablauf wie der primaere Command `evaluate-pension`:

1. Wenn das Argument "Altersvorsorge", "alle Renten", "drei Saeulen", "Rentenluecke" oder "Versorgungsluecke" enthaelt, verwende die `retirement-readiness` Skill fuer eine saeulenuebergreifende Projektion.
2. Andernfalls verwende die `evaluate-pension` Skill zur Analyse des spezifischen Rentenprodukts.
3. Datenbasis: `finance/data/pension.md` und `finance/data/employment.md`. Falls Dateien fehlen, Vorlagen unter `${CLAUDE_PLUGIN_ROOT}/templates/` nutzen.
4. Schwerpunkt-Argument wird an die Skill zur vertieften Analyse weitergegeben.
