#!/usr/bin/env bun
// set-verdict.ts — update a listing's verdict (and optional reject reason).
//
// Usage:
//   bun scripts/set-verdict.ts --id 12 --verdict rejected --reason "Wedding, too far"
//   bun scripts/set-verdict.ts --id 12 --verdict accepted
import { setVerdict } from './db.ts';

function arg(name: string): string | null {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : null;
}

const id = parseInt(arg('id') ?? "", 10);
const verdict = arg('verdict');
const reason = arg('reason');

if (!id || !verdict) {
  console.error('Usage: set-verdict.ts --id <n> --verdict <accepted|rejected|snoozed|contacted|pending|block> [--reason "..."]');
  process.exit(1);
}

setVerdict(id, verdict, reason);
console.log(JSON.stringify({ id, verdict, reason: reason || null }));
