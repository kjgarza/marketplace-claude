#!/usr/bin/env node
// set-verdict.js — update a listing's verdict (and optional reject reason).
//
// Usage:
//   node --experimental-sqlite scripts/set-verdict.js --id 12 --verdict rejected --reason "Wedding, too far"
//   node --experimental-sqlite scripts/set-verdict.js --id 12 --verdict accepted
import { setVerdict } from './db.js';

function arg(name) {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : null;
}

const id = parseInt(arg('id'), 10);
const verdict = arg('verdict');
const reason = arg('reason');

if (!id || !verdict) {
  console.error('Usage: set-verdict.js --id <n> --verdict <accepted|rejected|snoozed|contacted|pending|block> [--reason "..."]');
  process.exit(1);
}

setVerdict(id, verdict, reason);
console.log(JSON.stringify({ id, verdict, reason: reason || null }));
