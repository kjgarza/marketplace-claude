#!/usr/bin/env bun
// calibrate.ts — feedback loop for berlin-flats.
//
// Correlates human triage outcomes (accepted/rejected/snoozed/contacted) against
// scam-score bands and the config criteria each listing matched, then suggests
// concrete config tweaks. Pure heuristic stats, no LLM.
//
// Usage:
//   bun scripts/calibrate.ts            # human-readable
//   bun scripts/calibrate.ts --json     # machine output
import { fileURLToPath } from "node:url";
import { getDb } from './db.ts';
import { loadConfig } from './config.ts';
import type { Listing } from "./types.ts";

const JSON_MODE = process.argv.includes('--json');

const BANDS = [
  { name: 'low (0.00–0.39)',   min: 0.0,  max: 0.4 },
  { name: 'mid (0.40–0.54)',   min: 0.4,  max: 0.55 },
  { name: 'review (0.55–0.84)', min: 0.55, max: 0.85 },
  { name: 'block (0.85–1.00)', min: 0.85, max: 1.01 },
];

const REJECTED = new Set(['rejected', 'filtered', 'block']);
const ACCEPTED = new Set(['accepted', 'contacted']);

function verdictOf(row: Listing): string {
  return row.verdict ?? "pending";
}

export function calibrate() {
  const db = getDb();
  const cfg = loadConfig();
  const rows = db.query('SELECT * FROM listings').all() as Listing[];

  const total = rows.length;
  const decided = rows.filter(r => REJECTED.has(verdictOf(r)) || ACCEPTED.has(verdictOf(r)));

  // Rejection rate by scam-score band
  const bands = BANDS.map(b => {
    const inBand = rows.filter(r => (r.scam_score ?? 0) >= b.min && (r.scam_score ?? 0) < b.max);
    const rej = inBand.filter(r => REJECTED.has(verdictOf(r))).length;
    const acc = inBand.filter(r => ACCEPTED.has(verdictOf(r))).length;
    return {
      band: b.name,
      count: inBand.length,
      rejected: rej,
      accepted: acc,
      rejection_rate: inBand.length ? +(rej / inBand.length).toFixed(2) : null,
    };
  });

  // Most common reject reasons
  const reasonCounts: Record<string, number> = {};
  for (const r of rows) {
    if (REJECTED.has(verdictOf(r)) && r.reject_reason) {
      const key = r.reject_reason.split(':')[0].trim();
      reasonCounts[key] = (reasonCounts[key] || 0) + 1;
    }
  }
  const topReasons = Object.entries(reasonCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([reason, count]) => ({ reason, count }));

  // District outcomes — which configured districts yield rejects
  const districtStats: Record<string, { count: number; rejected: number; accepted: number }> = {};
  for (const r of rows) {
    if (!r.district) continue;
    const d = r.district;
    districtStats[d] = districtStats[d] || { count: 0, rejected: 0, accepted: 0 };
    districtStats[d].count++;
    if (REJECTED.has(verdictOf(r))) districtStats[d].rejected++;
    if (ACCEPTED.has(verdictOf(r))) districtStats[d].accepted++;
  }

  // Suggestions
  const suggestions = [];
  for (const [d, s] of Object.entries(districtStats)) {
    if (s.count >= 3 && s.accepted === 0 && s.rejected === s.count) {
      suggestions.push(`All ${s.count} listings in "${d}" were rejected — consider removing it from [search].districts.`);
    }
  }
  const reviewBand = bands.find(b => b.band.startsWith('review'));
  if (reviewBand && reviewBand.count >= 4 && reviewBand.rejection_rate !== null && reviewBand.rejection_rate < 0.3) {
    suggestions.push(`Review band rarely rejected (${reviewBand.rejection_rate}) — scam threshold_review (${cfg.scam_detection?.threshold_review}) may be too aggressive; consider raising it.`);
  }
  for (const { reason, count } of topReasons) {
    if (count >= 3) suggestions.push(`"${reason}" caused ${count} rejections — encode it as a deal_breaker or scam rule if not already.`);
  }
  if (decided.length < 5) {
    suggestions.push(`Only ${decided.length} listings triaged so far — calibration improves after more accept/reject decisions.`);
  }

  return { total, decided: decided.length, bands, top_reasons: topReasons, district_stats: districtStats, suggestions };
}

function printHuman(r: ReturnType<typeof calibrate>) {
  console.log('=== berlin-flats calibration ===');
  console.log(`Listings: ${r.total} total, ${r.decided} triaged (accepted/rejected).\n`);
  console.log('Rejection rate by scam-score band:');
  for (const b of r.bands) {
    const rate = b.rejection_rate === null ? 'n/a' : `${Math.round(b.rejection_rate * 100)}%`;
    console.log(`  ${b.band.padEnd(20)} n=${b.count}  rejected=${b.rejected}  accepted=${b.accepted}  rate=${rate}`);
  }
  if (r.top_reasons.length) {
    console.log('\nTop reject reasons:');
    for (const t of r.top_reasons) console.log(`  ${t.count}×  ${t.reason}`);
  }
  console.log('\nSuggestions:');
  if (!r.suggestions.length) console.log('  (none yet — keep triaging)');
  for (const s of r.suggestions) console.log(`  • ${s}`);
}

// CLI
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const result = calibrate();
  if (JSON_MODE) process.stdout.write(JSON.stringify(result, null, 2) + '\n');
  else printHuman(result);
}
