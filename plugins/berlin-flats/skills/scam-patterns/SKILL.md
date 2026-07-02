---
name: Scam Pattern Catalog
description: This skill should be used when performing scam detection to recognize Berlin rental fraud patterns. Reference before classifying any listing as ok, review, or block.
---

## Hard Block Signals (weight 0.8+)

These are near-certain fraud. Auto-block without LLM confirmation.

- **Western Union / MoneyGram** payment requests in any form
- **"Send deposit before viewing"** — Kaution vor Besichtigung überweisen
- **Bitcoin / crypto / Kryptowährung** payment requests
- **Landlord-abroad framing** — "Ich bin im Ausland / im Urlaub und schicke die Schlüssel per Post"
- **Keys by mail** — offering to mail keys without an in-person meeting

## Strong Signals (weight 0.4–0.6)

Require at least one of these + another signal to block. Single occurrence = review.

- **WhatsApp-only contact** — "Bitte nur per WhatsApp / nur Whatsapp" (note: phone number in description is normal on Kleinanzeigen — this signal is about *exclusivity*)
- **Price >50% below Mietspiegel** for size + district (see berlin-context skill)
- **Airbnb framing** — "flexible stays", nightly rates mentioned
- **Google Translate artifacts** — grammatically broken formal German (e.g., "Ich brauche ehrliche und sorgfältige Mieter")
- **Multiple portals, same description, different photos** — coordinated scam operation

## Moderate Signals (weight 0.2–0.4)

These alone don't classify a listing. They raise the threshold for ok classification.

- Price 35–50% below Mietspiegel
- Ablöse >€2,000 for used furniture
- Kaution >3× cold rent (illegal, §551 BGB)
- Landlord name is a generic English name ("John Smith", "David Williams", "Mary Johnson")
- No address given, only "Berlin" with no district — common for legit listings but lowers confidence
- Listing is very old (>90 days) at an unusually low price

## Swap Signals (filtered, not scam)

Not scam, but filtered by deal_breakers config.

- Keywords: `Tausch`, `Wohnungstausch`, `biete gegen`, `suche im Tausch`
- Listing requires a counter-offer property

## Portal-Specific Notes

**Kleinanzeigen:**
- Phone numbers in description: normal for private landlords — weight only 0.15 (not 0.30)
- "Nur Selbstnutzer": legitimate signal, ignore
- Very low-priced listings (€300–500) for large flats in central districts: almost always scam

**ImmoScout24:**
- Premium-contact wall on private listings: unusual, flag for review
- Agency listings with "Provision frei" but then mentioning fees elsewhere: flag

## Scoring Logic

```
total_score = sum of triggered weights, capped at 1.0
block  if score >= 0.85
review if score >= 0.55
ok     if score <  0.55
```

LLM judgment is the *last* layer — invoke only when rule-based score is in the 0.40–0.84 range.
