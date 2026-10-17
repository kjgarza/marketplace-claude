#!/usr/bin/env bun
// assess.ts — full quantitative assessment of one listing: fit-score + scam-score
// + Mietspiegel delta. Accepts a DB row or an ad-hoc listing JSON (e.g. a pasted
// ImmoScout URL scraped by the /assess command).
//
// Usage:
//   bun scripts/assess.ts --id 12                      # assess a listing already in the DB
//   bun scripts/assess.ts --json '{"url":...}'         # assess an ad-hoc listing
//   bun scripts/assess.ts --json '{"url":...}' --save  # also upsert it into the DB (verdict pending)
import type { Listing, PluginConfig } from "./types.ts";
import { fitScore } from "./fit-score.ts";
import { scamScore } from "./scam-score.ts";
import { mietspiegelDelta, type MietspiegelDelta } from "./mietspiegel.ts";
import { loadConfig } from "./config.ts";

/**
 * Stable listing key from a portal URL so ad-hoc listings dedupe against
 * hunt-scraped ones (UNIQUE(portal, external_id) in the DB).
 */
export function deriveExternalId(url: string): string {
  const expose = url.match(/\/expose\/(\d+)/); // ImmoScout24
  if (expose) return expose[1];
  const anzeige = url.match(/\/s-anzeige\/[^/]+\/([\w-]+)/); // Kleinanzeigen
  if (anzeige) return anzeige[1];
  return url;
}

export interface Assessment {
  listing: Listing;
  fit: ReturnType<typeof fitScore>;
  scam: ReturnType<typeof scamScore>;
  mietspiegel: MietspiegelDelta | null;
}

export function assessListing(listing: Listing, config: PluginConfig, now: Date = new Date()): Assessment {
  const withId: Listing = {
    ...listing,
    external_id: listing.external_id || deriveExternalId(listing.url),
    portal: listing.portal || (listing.url.includes("immobilienscout24") ? "immoscout24"
      : listing.url.includes("kleinanzeigen") ? "kleinanzeigen" : "manual"),
  };
  return {
    listing: withId,
    fit: fitScore(withId, config, now),
    scam: scamScore(withId),
    mietspiegel: mietspiegelDelta(withId),
  };
}

function cliArg(name: string): string | null {
  const i = process.argv.indexOf(`--${name}`);
  if (i < 0) return null;
  const value = process.argv[i + 1];
  if (value === undefined || value.startsWith("--")) return null;
  return value;
}

if (import.meta.main) {
  const USAGE = "Usage: assess.ts --id <n> | --json '<listing json>' [--save]";
  const config = loadConfig();
  let listing: Listing | undefined;

  const id = cliArg("id");
  const json = cliArg("json");
  if (id) {
    const { getDb } = await import("./db.ts");
    const row = getDb().query("SELECT * FROM listings WHERE id=$id").get({ $id: parseInt(id, 10) }) as Listing | null;
    if (!row) {
      console.error(`No listing with id ${id}`);
      process.exit(1);
    }
    // DB rows keep the description inside raw_json.
    try { row.description = JSON.parse(row.raw_json || "{}").description || null; } catch { /* keep null */ }
    listing = row;
  } else if (json) {
    listing = JSON.parse(json) as Listing;
  } else {
    console.error(USAGE);
    process.exit(1);
  }

  const assessment = assessListing(listing!, config);

  if (process.argv.includes("--save") && !id) {
    const { upsertListing } = await import("./db.ts");
    upsertListing({
      ...assessment.listing,
      scam_score: assessment.scam.score,
      verdict: assessment.scam.verdict === "block" ? "block" : "pending",
      raw_json: JSON.stringify({ description: assessment.listing.description ?? null, source: "assess" }),
    });
  }

  process.stdout.write(JSON.stringify(assessment, null, 2) + "\n");
}
