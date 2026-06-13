// calibrate.smoke.js — calibrate() runs against the real state DB and returns the expected shape.
import { calibrate } from './calibrate.js';

const r = calibrate();
console.assert(typeof r.total === 'number', 'total is a number');
console.assert(typeof r.decided === 'number', 'decided is a number');
console.assert(Array.isArray(r.bands) && r.bands.length === 4, 'four scam-score bands');
console.assert(Array.isArray(r.top_reasons), 'top_reasons is an array');
console.assert(Array.isArray(r.suggestions), 'suggestions is an array');
for (const b of r.bands) {
  console.assert(typeof b.count === 'number' && 'rejection_rate' in b, `band ${b.band} well-formed`);
}
console.log('calibrate smoke passed');
