import { loadConfig } from './config.js';

const cfg = loadConfig();
console.assert(cfg.search.max_warm_rent_eur === 2000, 'warm rent limit');
console.assert(Array.isArray(cfg.portals.enabled), 'portals enabled array');
console.assert(cfg.profile.name === 'Kristian', 'profile name');
console.log('config tests passed');
