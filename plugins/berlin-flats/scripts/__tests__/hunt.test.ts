import { describe, expect, test } from "bun:test";
import { buildSearchUrl, computeFieldPresence, scoreAgainstPrefs } from "../hunt.ts";

const prefs = {
  max_warm_rent_eur: 2200,
  max_cold_rent_eur: 2000,
  min_rooms: 2,
  max_rooms: 4,
  min_sqm: 100,
  districts: ["Schöneberg"],
  keywords_required: ["Altbau"],
  deal_breakers: ["WG", "Tausch"],
};

describe("buildSearchUrl", () => {
  test("builds Kleinanzeigen search URLs", () => {
    const url = buildSearchUrl("kleinanzeigen", prefs);
    expect(url).toContain("kleinanzeigen.de");
    expect(url).toContain("categoryId=203");
    expect(url).toContain("maxPrice=2200");
  });

  test("builds ImmoScout24 search URLs", () => {
    const url = buildSearchUrl("immoscout24", prefs);
    expect(url).toContain("immobilienscout24.de");
    expect(url).toContain("berlin/schoeneberg");
    expect(url).toContain("price=-2000");
  });

  test("rejects unknown portals", () => {
    expect(() => buildSearchUrl("unknown", prefs)).toThrow("Unknown portal");
  });

  test("builds the inberlinwohnen search URL (fixed — no server-side filter params)", () => {
    const url = buildSearchUrl("inberlinwohnen", prefs);
    expect(url).toBe("https://www.inberlinwohnen.de/wohnungsfinder/");
  });
});

describe("scoreAgainstPrefs", () => {
  test("accepts matching listings", () => {
    expect(scoreAgainstPrefs(
      { portal: "x", url: "https://example.test", title: "Schöne Altbauwohnung", description: "Altbau mit Balkon", cold_rent: 1800, warm_rent: 2100, rooms: 3, sqm: 110, district: "Schöneberg" },
      prefs,
    )).toBe(100);
  });

  test("rejects budget, deal breaker, keyword, district, and size mismatches", () => {
    expect(scoreAgainstPrefs({ portal: "x", url: "https://example.test", warm_rent: 2500, rooms: 3, sqm: 110, district: "Schöneberg", title: "Altbau" }, prefs)).toBe(-1);
    expect(scoreAgainstPrefs({ portal: "x", url: "https://example.test", title: "WG Zimmer Altbau", cold_rent: 1000, rooms: 3, sqm: 110, district: "Schöneberg" }, prefs)).toBe(-1);
    expect(scoreAgainstPrefs({ portal: "x", url: "https://example.test", title: "Neubau Wohnung", cold_rent: 1000, rooms: 3, sqm: 110, district: "Schöneberg" }, prefs)).toBe(-1);
    expect(scoreAgainstPrefs({ portal: "x", url: "https://example.test", title: "Altbau", cold_rent: 1000, rooms: 3, sqm: 110, district: "Wedding" }, prefs)).toBe(-1);
    expect(scoreAgainstPrefs({ portal: "x", url: "https://example.test", title: "Altbau", cold_rent: 1000, rooms: 3, sqm: 60, district: "Schöneberg" }, prefs)).toBe(-1);
  });
});

describe("computeFieldPresence", () => {
  test("returns the fraction of listings with each tracked field present", () => {
    const presence = computeFieldPresence([
      { portal: "x", url: "https://example.test/1", title: "A", cold_rent: 1000, sqm: 50, district: "Mitte" },
      { portal: "x", url: "https://example.test/2", title: "B", cold_rent: null, sqm: 60, district: "Mitte" },
    ]);
    expect(presence.title).toBe(1);
    expect(presence.cold_rent).toBe(0.5);
    expect(presence.sqm).toBe(1);
    expect(presence.rooms).toBe(0);
  });

  test("returns an empty object for zero listings", () => {
    expect(computeFieldPresence([])).toEqual({});
  });
});
