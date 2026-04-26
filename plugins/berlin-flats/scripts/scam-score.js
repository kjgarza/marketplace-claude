// Berlin 2024 Mietspiegel approximate medians (cold €/sqm) by district
const MIETSPIEGEL = {
  'Mitte': 15.5,
  'Prenzlauer Berg': 14.8,
  'Friedrichshain': 14.2,
  'Kreuzberg': 13.9,
  'Neukölln': 11.8,
  'Charlottenburg': 14.0,
  'Schöneberg': 13.5,
  'Tempelhof': 11.2,
  'default': 13.0,
};

const HARD_RULES = [
  { pattern: /western\s*union|moneygram/i,            weight: 0.90, code: 'PAYMENT_FRAUD' },
  { pattern: /kaution.*vor.*besichtigung|deposit.*before.*viewing/i, weight: 0.85, code: 'DEPOSIT_BEFORE_VIEWING' },
  { pattern: /bitcoin|crypto|kryptowährung/i,          weight: 0.85, code: 'CRYPTO_PAYMENT' },
  { pattern: /im\s*(ausland|urlaub)|verreist|abroad|i am away/i, weight: 0.50, code: 'LANDLORD_ABROAD' },
  { pattern: /\bwg.?tausch\b|wohnungstausch|biete.*gegen.*wohnung/i, weight: 0.60, code: 'SWAP_LISTING' },
  { pattern: /airbnb/i,                               weight: 0.70, code: 'SHORTTERM_PLATFORM' },
  { pattern: /whatsapp.*nur|nur.*whatsapp/i,           weight: 0.30, code: 'WHATSAPP_ONLY' },
  { pattern: /google\s+translate|übersetzt\s+mit/i,   weight: 0.35, code: 'TRANSLATION_ARTIFACT' },
];

function findDistrict(districtStr) {
  if (!districtStr) return 'default';
  for (const key of Object.keys(MIETSPIEGEL)) {
    if (key === 'default') continue;
    if (districtStr.toLowerCase().includes(key.toLowerCase())) return key;
  }
  return 'default';
}

export function scamScore(listing) {
  const desc = `${listing.title || ''} ${listing.description || ''}`.toLowerCase();
  const reasons = [];
  let score = 0;

  for (const rule of HARD_RULES) {
    if (rule.pattern.test(desc)) {
      reasons.push({ code: rule.code, weight: rule.weight });
      score = Math.min(1, score + rule.weight);
    }
  }

  // Price outlier vs Mietspiegel
  if (listing.cold_rent && listing.sqm && listing.sqm > 10) {
    const districtKey = findDistrict(listing.district);
    const medianPerSqm = MIETSPIEGEL[districtKey];
    const expectedMin = medianPerSqm * listing.sqm;
    const ratio = listing.cold_rent / expectedMin;

    if (ratio < 0.50) {
      const w = 0.45;
      reasons.push({
        code: 'PRICE_OUTLIER_SEVERE', weight: w,
        detail: `€${listing.cold_rent} cold vs expected ≥€${Math.round(expectedMin * 0.5)} for ${listing.sqm}sqm in ${districtKey}`,
      });
      score = Math.min(1, score + w);
    } else if (ratio < 0.65) {
      const w = 0.25;
      reasons.push({ code: 'PRICE_OUTLIER_MODERATE', weight: w,
        detail: `€${listing.cold_rent} is ${Math.round((1 - ratio) * 100)}% below district median` });
      score = Math.min(1, score + w);
    }
  }

  score = Math.round(score * 100) / 100;
  const verdict = score >= 0.85 ? 'block' : score >= 0.55 ? 'review' : 'ok';

  return { score, verdict, reasons };
}
