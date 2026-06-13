import { loadConfig } from './config.js';

const cfg = loadConfig();
// Assert shape/type, not the user's personal values (those drift as config is edited).
console.assert(typeof cfg.search.max_warm_rent_eur === 'number' && cfg.search.max_warm_rent_eur > 0, 'warm rent limit is a positive number');
console.assert(Array.isArray(cfg.portals.enabled) && cfg.portals.enabled.length > 0, 'portals enabled array');
console.assert(typeof cfg.profile.name === 'string' && cfg.profile.name.length > 0, 'profile name present');
console.log('config tests passed');
