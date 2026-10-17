#!/usr/bin/env bun
// queue.ts — print listings from the state DB as JSON for the triage/application commands.
//
// Usage:
//   bun scripts/queue.ts review     # only review-band listings
//   bun scripts/queue.ts pending    # only pending listings
//   bun scripts/queue.ts triage     # pending + review (default)
//   bun scripts/queue.ts rank       # triage set sorted by fit score (desc)
//   bun scripts/queue.ts compare    # accepted→offer listings with fit scores
//   bun scripts/queue.ts pipeline   # contacted/viewing/applied/offer with days_in_state
//   bun scripts/queue.ts qualifying # print the DOD qualifying_count (number)
import { getQueue, countQualifying, getByVerdicts } from './db.ts';
import { fitScore } from './fit-score.ts';
import { loadConfig } from './config.ts';
import type { Listing, PluginConfig } from './types.ts';

function shapeListing(r: Listing) {
  // DB rows carry the description inside raw_json; in-memory listings carry it directly.
  let description: string | null = null;
  try { description = JSON.parse(r.raw_json || '{}').description || null; } catch { /* keep null */ }
  return {
    id: r.id, portal: r.portal, external_id: r.external_id ?? null,
    title: r.title, url: r.url, district: r.district,
    cold_rent: r.cold_rent, warm_rent: r.warm_rent, rooms: r.rooms, sqm: r.sqm,
    scam_score: r.scam_score, verdict: r.verdict, verdict_at: r.verdict_at ?? null,
    posted_at: r.posted_at ?? null,
    description: description ?? r.description ?? null,
  };
}

export function rankListings(rows: Listing[], config: PluginConfig, now: Date = new Date()) {
  return rows
    .map((r) => {
      const shaped = shapeListing(r);
      const fit = fitScore({ ...r, description: shaped.description }, config, now);
      return {
        ...shaped,
        // Top 3 factors by |points| tell the triage reader WHY at a glance.
        fit: {
          score: fit.score,
          top_factors: [...fit.factors].sort((a, b) => Math.abs(b.points) - Math.abs(a.points)).slice(0, 3),
        },
      };
    })
    .sort((a, b) => b.fit.score - a.fit.score);
}

export function daysInState(verdictAt: string | null | undefined, now: Date = new Date()): number | null {
  if (!verdictAt) return null;
  // SQLite datetime('now') emits "YYYY-MM-DD HH:MM:SS" in UTC; normalize to ISO.
  const t = new Date(verdictAt.includes('T') ? verdictAt : verdictAt.replace(' ', 'T') + 'Z');
  if (isNaN(t.getTime())) return null;
  return Math.floor((now.getTime() - t.getTime()) / 86_400_000);
}

const PIPELINE_VERDICTS = ['contacted', 'viewing', 'applied', 'offer'];

if (import.meta.main) {
  const arg = process.argv[2] || 'triage';

  // DOD measurement: emit just the qualifying_count so the Definition of Done is
  // machine-checkable (PASS if >= 1). See DOD.md.
  if (arg === 'qualifying') {
    process.stdout.write(countQualifying() + '\n');
    process.exit(0);
  }

  let out: unknown;
  if (arg === 'rank') {
    out = rankListings([...getQueue('review'), ...getQueue('pending')], loadConfig());
  } else if (arg === 'compare') {
    out = rankListings(getByVerdicts(['accepted', ...PIPELINE_VERDICTS]), loadConfig());
  } else if (arg === 'pipeline') {
    out = getByVerdicts(PIPELINE_VERDICTS).map((r) => ({
      ...shapeListing(r),
      days_in_state: daysInState(r.verdict_at),
    }));
  } else if (arg === 'triage') {
    out = [...getQueue('review'), ...getQueue('pending')].map(shapeListing);
  } else {
    out = getQueue(arg).map(shapeListing);
  }
  process.stdout.write(JSON.stringify(out, null, 2) + '\n');
}
