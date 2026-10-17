import { describe, expect, test } from "bun:test";
import { assessListing, deriveExternalId } from "../assess.ts";
import { AD_NOLLENDORF, TEST_CONFIG } from "./fixtures/immoscout-fixtures.ts";

const NOW = new Date("2026-07-07T12:00:00Z");

describe("deriveExternalId", () => {
  test("extracts ImmoScout expose id", () => {
    expect(deriveExternalId("https://www.immobilienscout24.de/expose/169077787?referrer=x#/")).toBe("169077787");
  });
  test("extracts Kleinanzeigen s-anzeige id", () => {
    expect(deriveExternalId("https://www.kleinanzeigen.de/s-anzeige/schoene-wohnung/2743889912-203-3331")).toBe("2743889912-203-3331");
  });
  test("falls back to the full URL when no pattern matches", () => {
    expect(deriveExternalId("https://example.test/flat/1")).toBe("https://example.test/flat/1");
  });
});

describe("assessListing", () => {
  test("bundles fit, scam, and mietspiegel results", () => {
    const a = assessListing(AD_NOLLENDORF, TEST_CONFIG, NOW);
    expect(a.fit.score).toBe(89);
    expect(a.scam.verdict).toBe("ok");
    expect(a.mietspiegel!.district).toBe("Schöneberg");
    expect(a.listing.external_id).toBe("169077787");
  });

  test("derives a missing external_id from the URL", () => {
    const { external_id, ...rest } = AD_NOLLENDORF;
    const a = assessListing(rest, TEST_CONFIG, NOW);
    expect(a.listing.external_id).toBe("169077787");
  });
});
