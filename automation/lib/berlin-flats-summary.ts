#!/usr/bin/env bun

type HuntListing = {
  title?: string | null;
  cold_rent?: number | null;
  district?: string | null;
  verdict?: string | null;
  url?: string | null;
};

type HuntOutput = {
  new?: HuntListing[];
};

const input = await Bun.stdin.text();
let data: HuntOutput;
try {
  data = JSON.parse(input) as HuntOutput;
} catch {
  process.exit(0);
}

const listings = (data.new ?? []).filter((listing) => listing.verdict === "pending" || listing.verdict === "review");
if (listings.length === 0) process.exit(0);

const lines = [`🏠 ${listings.length} new Berlin flat(s):`];
for (const listing of listings.slice(0, 10)) {
  const rent = listing.cold_rent ?? "?";
  const verdict = listing.verdict === "review" ? "⚠️ review" : "✓";
  lines.push(`• ${listing.title || "(no title)"} - €${rent}, ${listing.district || "?"} [${verdict}]\n${listing.url || ""}`);
}

process.stdout.write(`${lines.join("\n")}\n`);
