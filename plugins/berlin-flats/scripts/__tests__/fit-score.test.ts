import { describe, expect, test } from "bun:test";
import { fitScore } from "../fit-score.ts";
import { AD_MANSTEIN, AD_RUBENS, AD_NOLLENDORF, TEST_CONFIG } from "./fixtures/immoscout-fixtures.ts";

// Fixed clock: two days after the freshest fixture ad was posted.
const NOW = new Date("2026-07-07T12:00:00Z");

function factor(result: ReturnType<typeof fitScore>, code: string) {
  const f = result.factors.find((f) => f.code === code);
  if (!f) throw new Error(`missing factor ${code}`);
  return f;
}

describe("fitScore on real ImmoScout ads", () => {
  const nollendorf = fitScore(AD_NOLLENDORF, TEST_CONFIG, NOW);
  const manstein = fitScore(AD_MANSTEIN, TEST_CONFIG, NOW);
  const rubens = fitScore(AD_RUBENS, TEST_CONFIG, NOW);

  test("ranks Nollendorf (Altbau, 104sqm, at-median) first", () => {
    expect(nollendorf.score).toBeGreaterThan(manstein.score);
    expect(manstein.score).toBeGreaterThan(rubens.score);
  });

  test("Nollendorf: full VALUE points at/below median", () => {
    expect(factor(nollendorf, "VALUE").points).toBe(25);
    expect(factor(nollendorf, "SIZE").points).toBe(20);
    expect(factor(nollendorf, "KEYWORDS").points).toBe(10);
  });

  test("Nollendorf: lowball Nebenkosten flagged (1.92 €/m² < 2.0 floor)", () => {
    const nk = factor(nollendorf, "NEBENKOSTEN");
    expect(nk.points).toBe(0);
    expect(nk.detail).toContain("low");
  });

  test("Manstein: +24% over median lands in the 11–25% VALUE band", () => {
    expect(factor(manstein, "VALUE").points).toBe(10);
  });

  test("Manstein: 49 days on market scores zero freshness", () => {
    expect(factor(manstein, "FRESHNESS").points).toBe(0);
  });

  test("Manstein: 83sqm near-miss gets partial SIZE credit", () => {
    const size = factor(manstein, "SIZE").points;
    expect(size).toBeGreaterThan(0);
    expect(size).toBeLessThan(20);
  });

  test("Rubens: +47% over median scores zero VALUE", () => {
    expect(factor(rubens, "VALUE").points).toBe(0);
  });
});

describe("fitScore edge cases", () => {
  test("deal-breaker zeroes the score", () => {
    const listing = { ...AD_NOLLENDORF, description: "Schöner Altbau, nur im Tausch gegen 2-Zimmer." };
    const r = fitScore(listing, TEST_CONFIG, NOW);
    expect(r.score).toBe(0);
    expect(factor(r, "DEAL_BREAKER").detail).toContain("Tausch");
  });

  test("missing data yields neutral mid scores, not crashes", () => {
    const bare = { portal: "immoscout24", url: "x" };
    const r = fitScore(bare, TEST_CONFIG, NOW);
    expect(r.score).toBeGreaterThan(0);
    expect(r.score).toBeLessThan(60);
  });

  test("score is clamped to [0, 100]", () => {
    const r = fitScore(AD_NOLLENDORF, TEST_CONFIG, NOW);
    expect(r.score).toBeLessThanOrEqual(100);
  });
});
