import { afterEach, describe, expect, test } from "bun:test";
import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { getDb, resetDbForTests, upsertListing } from "../db.ts";
import { calibrate } from "../calibrate.ts";

let tempDir: string | undefined;

afterEach(() => {
  resetDbForTests();
  if (tempDir) rmSync(tempDir, { recursive: true, force: true });
  tempDir = undefined;
});

describe("calibrate", () => {
  test("returns stable calibration shape", () => {
    tempDir = mkdtempSync(join(tmpdir(), "berlin-flats-calibrate-"));
    getDb(join(tempDir, "state.db"));
    upsertListing({
      portal: "kleinanzeigen",
      external_id: "1",
      url: "https://example.test/1",
      district: "Wedding",
      scam_score: 0.9,
      verdict: "block",
    });

    const result = calibrate();
    expect(result.total).toBe(1);
    expect(result.decided).toBe(1);
    expect(result.bands).toHaveLength(4);
    expect(Array.isArray(result.top_reasons)).toBe(true);
    expect(Array.isArray(result.suggestions)).toBe(true);
  });
});
