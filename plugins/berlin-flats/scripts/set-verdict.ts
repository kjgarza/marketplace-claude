#!/usr/bin/env bun
// set-verdict.ts — update a listing's verdict (and optional reject reason).
//
// Usage:
//   bun scripts/set-verdict.ts --id 12 --verdict rejected --reason "Wedding, too far"
//   bun scripts/set-verdict.ts --id 12 --verdict accepted
import { setVerdict } from './db.ts';

// Verdicts a human may set via this CLI (system-assigned states like `review`
// and `filtered` are excluded). Keep in sync with the usage string below.
const ALLOWED_VERDICTS = ['accepted', 'rejected', 'snoozed', 'contacted', 'pending', 'block'] as const;
const USAGE = `Usage: set-verdict.ts --id <n> --verdict <${ALLOWED_VERDICTS.join('|')}> [--reason "..."]`;

function arg(name: string): string | null {
  const i = process.argv.indexOf(`--${name}`);
  if (i < 0) return null;
  const value = process.argv[i + 1];
  // Treat a missing value or a following flag as "not provided".
  if (value === undefined || value.startsWith('--')) return null;
  return value;
}

const id = parseInt(arg('id') ?? "", 10);
const verdict = arg('verdict');
const reason = arg('reason');

if (!id || !verdict) {
  console.error(USAGE);
  process.exit(1);
}

if (!ALLOWED_VERDICTS.includes(verdict as (typeof ALLOWED_VERDICTS)[number])) {
  console.error(`Invalid verdict: ${verdict}\n${USAGE}`);
  process.exit(1);
}

setVerdict(id, verdict, reason);
console.log(JSON.stringify({ id, verdict, reason: reason || null }));
