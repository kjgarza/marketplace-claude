// prefs.test.js — verify scoreAgainstPrefs filtering logic.
import { scoreAgainstPrefs } from './hunt.js';

const prefs = {
  max_warm_rent_eur: 2200,
  max_cold_rent_eur: 2000,
  min_rooms: 2,
  max_rooms: 4,
  min_sqm: 100,
  districts: ['Schöneberg'],
  keywords_required: ['Altbau'],
  deal_breakers: ['WG', 'Tausch'],
};

// Passes all criteria
const ok = scoreAgainstPrefs(
  { title: 'Schöne Altbauwohnung', description: 'Altbau mit Balkon', cold_rent: 1800, warm_rent: 2100, rooms: 3, sqm: 110, district: 'Schöneberg' },
  prefs
);
console.assert(ok === 100, `matching listing passes: ${ok}`);

// Over warm rent
console.assert(scoreAgainstPrefs({ warm_rent: 2500, rooms: 3, sqm: 110, district: 'Schöneberg', title: 'Altbau' }, prefs) === -1, 'over warm rent filtered');

// Deal breaker present
console.assert(scoreAgainstPrefs({ title: 'WG Zimmer Altbau', cold_rent: 1000, rooms: 3, sqm: 110, district: 'Schöneberg' }, prefs) === -1, 'deal breaker filtered');

// Missing required keyword
console.assert(scoreAgainstPrefs({ title: 'Neubau Wohnung', cold_rent: 1000, rooms: 3, sqm: 110, district: 'Schöneberg' }, prefs) === -1, 'missing keyword filtered');

// Wrong district
console.assert(scoreAgainstPrefs({ title: 'Altbau', cold_rent: 1000, rooms: 3, sqm: 110, district: 'Wedding' }, prefs) === -1, 'wrong district filtered');

// Too small
console.assert(scoreAgainstPrefs({ title: 'Altbau', cold_rent: 1000, rooms: 3, sqm: 60, district: 'Schöneberg' }, prefs) === -1, 'too small filtered');

console.log('prefs tests passed');
