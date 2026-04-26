import { scamScore } from './scam-score.js';

const scam1 = scamScore({
  description: 'Schicken Sie die Kaution per Western Union vor der Besichtigung.',
  cold_rent: 600, sqm: 80, district: 'Mitte',
});
console.assert(scam1.score >= 0.85, `obvious scam detected: ${scam1.score}`);
console.assert(scam1.verdict === 'block', `verdict block: ${scam1.verdict}`);

const scam2 = scamScore({
  title: 'Wohnung Mitte',
  description: 'Ich bin im Urlaub und sende die Schlüssel per Post.',
  cold_rent: 400, sqm: 70, district: 'Berlin Mitte',
});
console.assert(scam2.score >= 0.55, `price+landlord-abroad flagged: ${scam2.score}`);

const legit = scamScore({
  title: 'Schöne Altbauwohnung',
  description: 'Schöne Altbauwohnung mit Balkon, ruhige Lage.',
  cold_rent: 1400, sqm: 75, district: 'Mitte',
});
console.assert(legit.score < 0.55, `legit listing not flagged: ${legit.score}`);
console.assert(legit.verdict === 'ok', `legit verdict ok: ${legit.verdict}`);

console.log('scam tests passed');
