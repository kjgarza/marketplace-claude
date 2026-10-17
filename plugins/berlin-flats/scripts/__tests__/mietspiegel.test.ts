import { describe, expect, test } from "bun:test";
import { MIETSPIEGEL, findDistrict, mietspiegelDelta } from "../mietspiegel.ts";

describe("findDistrict", () => {
  test("matches substring case-insensitively", () => {
    expect(findDistrict("Berlin Schöneberg")).toBe("Schöneberg");
  });
  test("falls back to default", () => {
    expect(findDistrict("Spandau")).toBe("default");
    expect(findDistrict(null)).toBe("default");
  });
});

describe("mietspiegelDelta", () => {
  test("computes positive delta for over-median listing", () => {
    // 1394 € / 83 m² = 16.80 €/m² vs Schöneberg median 13.5 → +24%
    const d = mietspiegelDelta({ cold_rent: 1394, sqm: 83, district: "Schöneberg" });
    expect(d).not.toBeNull();
    expect(d!.medianPerSqm).toBe(MIETSPIEGEL["Schöneberg"]);
    expect(d!.deltaPct).toBe(24);
  });
  test("returns null without rent or plausible sqm", () => {
    expect(mietspiegelDelta({ cold_rent: null, sqm: 80, district: "Mitte" })).toBeNull();
    expect(mietspiegelDelta({ cold_rent: 1000, sqm: 5, district: "Mitte" })).toBeNull();
  });
});
