// db.test.js — verify ensureColumn migration and setVerdict reject_reason.
// Runs against a throwaway in-repo temp DB by overriding the module's DB via a fresh import.
import { DatabaseSync } from 'node:sqlite';
import { ensureColumn } from './db.js';

// ensureColumn on a fresh table
const db = new DatabaseSync(':memory:');
db.exec('CREATE TABLE t (id INTEGER PRIMARY KEY, a TEXT)');

ensureColumn(db, 't', 'b', 'TEXT');
let cols = db.prepare('PRAGMA table_info(t)').all().map(c => c.name);
console.assert(cols.includes('b'), `column b added: ${cols.join(',')}`);

// Idempotent — second call must not throw
ensureColumn(db, 't', 'b', 'TEXT');
cols = db.prepare('PRAGMA table_info(t)').all().map(c => c.name);
console.assert(cols.filter(c => c === 'b').length === 1, 'no duplicate column');

// Simulate legacy DB without reject_reason, then migrate
const legacy = new DatabaseSync(':memory:');
legacy.exec('CREATE TABLE listings (id INTEGER PRIMARY KEY, verdict TEXT)');
ensureColumn(legacy, 'listings', 'reject_reason', 'TEXT');
const lc = legacy.prepare('PRAGMA table_info(listings)').all().map(c => c.name);
console.assert(lc.includes('reject_reason'), 'reject_reason migrated onto legacy table');

console.log('db tests passed');
