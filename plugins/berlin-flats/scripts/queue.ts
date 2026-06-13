#!/usr/bin/env bun
// queue.ts — print listings from the state DB as JSON for the triage command.
//
// Usage:
//   bun scripts/queue.ts review     # only review-band listings
//   bun scripts/queue.ts pending    # only pending listings
//   bun scripts/queue.ts triage     # pending + review (default)
import { getQueue } from './db.ts';

const arg = process.argv[2] || 'triage';

let rows;
if (arg === 'triage') {
  rows = [...getQueue('review'), ...getQueue('pending')];
} else {
  rows = getQueue(arg);
}

// Trim raw_json blob from output to keep it readable; keep the parsed essentials.
const out = rows.map(r => ({
  id: r.id,
  portal: r.portal,
  title: r.title,
  url: r.url,
  district: r.district,
  cold_rent: r.cold_rent,
  warm_rent: r.warm_rent,
  rooms: r.rooms,
  sqm: r.sqm,
  scam_score: r.scam_score,
  verdict: r.verdict,
  description: (() => { try { return JSON.parse(r.raw_json || '{}').description || null; } catch { return null; } })(),
}));

process.stdout.write(JSON.stringify(out, null, 2) + '\n');
