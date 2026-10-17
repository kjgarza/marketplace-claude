import { describe, expect, test } from "bun:test";
import { rankListings, daysInState } from "../queue.ts";
import { AD_MANSTEIN, AD_NOLLENDORF, TEST_CONFIG } from "./fixtures/immoscout-fixtures.ts";

const NOW = new Date("2026-07-07T12:00:00Z");

describe("rankListings", () => {
  test("sorts by fit score descending and attaches top factors", () => {
    const ranked = rankListings([AD_MANSTEIN, AD_NOLLENDORF], TEST_CONFIG, NOW);
    expect(ranked[0].external_id).toBe("169077787");
    expect(ranked[0].fit.score).toBeGreaterThan(ranked[1].fit.score);
    expect(ranked[0].fit.top_factors.length).toBeGreaterThan(0);
  });
});

describe("daysInState", () => {
  test("computes whole days since verdict_at", () => {
    expect(daysInState("2026-07-03 12:00:00", NOW)).toBe(4);
    expect(daysInState(null, NOW)).toBeNull();
  });
});
