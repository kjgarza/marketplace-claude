---
description: Buchungssatz erstellen fuer deutsche HGB-Buchhaltung mit SKR04-Konten und USt-Pruefung
argument-hint: <Geschaeftsvorfall Beschreibung>
---

# Buchungssatz

Erstelle einen HGB-konformen Buchungssatz fuer: **$ARGUMENTS**

## Vorgehen

1. Analysiere den Geschaeftsvorfall.
2. Nutze den Skill `skr04-kontenrahmen`, um passende SKR04-Konten zu finden.
3. Bestimme Soll und Haben nach den Regeln der doppelten Buchfuehrung.
4. Pruefe die USt-Behandlung: 19%, 7%, 0%, steuerfrei oder Reverse Charge.
5. Pruefe bei nicht-trivialen Faellen die HGB-Basis, insbesondere bei Rueckstellungen, RAP, Abschreibungen oder Bewertungsfragen.
6. Wenn Informationen fehlen, frage nur nach den Fakten, die die Buchungslogik aendern.

## Ausgabeformat

Nutze dieses Format:

```text
Buchungssatz:
Soll-Konto (Nr.) an Haben-Konto (Nr.) - Betrag EUR

Begruendung:
- kurze Einordnung des Sachverhalts
- USt-Behandlung
- HGB-Verweis bei nicht-trivialen Faellen
```

## Zusatzregeln

- Gib immer Kontonummer und Kontonamen an.
- Wenn mehrere Konten plausibel sind, nenne die bevorzugte Buchung und fuehre Alternativen kurz auf.
- Bei Rueckstellungen: Ansatzkriterien nach §249 HGB pruefen und dokumentieren.
- Bei Rechnungsabgrenzung: §250 HGB nennen.
- Bei Abschreibungen oder Bewertungsfragen: §253 HGB nennen.
- Wenn keine sichere Kontenzuordnung moeglich ist, markiere die Buchung als vorlaeufig.
