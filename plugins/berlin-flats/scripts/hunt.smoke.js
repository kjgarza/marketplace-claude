import { buildSearchUrl, scoreAgainstPrefs } from './hunt.js';

const url = buildSearchUrl('kleinanzeigen', {
  districts: ['Mitte'], max_warm_rent_eur: 2000,
  min_rooms: 2, max_rooms: 3.5, min_sqm: 55,
});
console.assert(url.includes('kleinanzeigen.de'), `URL has domain: ${url}`);
console.assert(url.includes('categoryId=203'), `URL has categoryId=203: ${url}`);
console.assert(url.includes('2000'), `URL has max rent 2000: ${url}`);

const goodScore = scoreAgainstPrefs(
  { warm_rent: 1800, rooms: 2.5, sqm: 65, district: 'Berlin Mitte', title: 'Schöne Wohnung' },
  { max_warm_rent_eur: 2000, min_rooms: 2, max_rooms: 3.5, min_sqm: 55, deal_breakers: ['WG'] }
);
console.assert(goodScore > 0, `good listing scores positive: ${goodScore}`);

const overBudget = scoreAgainstPrefs(
  { warm_rent: 2500, rooms: 2.5, sqm: 65, district: 'Mitte' },
  { max_warm_rent_eur: 2000, min_rooms: 2, max_rooms: 3.5, min_sqm: 55, deal_breakers: [] }
);
console.assert(overBudget < 0, `over-budget filtered: ${overBudget}`);

const dealBreaker = scoreAgainstPrefs(
  { warm_rent: 900, rooms: 3, sqm: 70, title: 'WG Zimmer frei', district: 'Mitte' },
  { max_warm_rent_eur: 2000, min_rooms: 2, max_rooms: 3.5, min_sqm: 55, deal_breakers: ['WG'] }
);
console.assert(dealBreaker < 0, `deal-breaker filtered: ${dealBreaker}`);

console.log('hunt smoke tests passed');
