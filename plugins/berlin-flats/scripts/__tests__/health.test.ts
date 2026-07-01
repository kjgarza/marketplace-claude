import { describe, expect, test } from "bun:test";
import { classifyDrift, checkFieldDrift } from "../health.ts";
import type { RunRecord } from "../types.ts";

function run(overrides: Partial<RunRecord>): RunRecord {
  return {
    portal: "kleinanzeigen", tier: 1, http_ok: 1, html_length: 5000,
    cards_found: 10, new_count: 2, detail_ok: 2, detail_total: 2,
    field_presence: null, error: null,
    ...overrides,
  };
}

describe("classifyDrift", () => {
  test("returns none with fewer than 2 runs of history", () => {
    expect(classifyDrift([run({})])).toBe("none");
    expect(classifyDrift([])).toBe("none");
  });

  test("returns blocked when the last 2 runs both failed all tiers", () => {
    const runs = [run({ tier: 0, http_ok: 0, cards_found: 0 }), run({ tier: 0, http_ok: 0, cards_found: 0 })];
    expect(classifyDrift(runs)).toBe("blocked");
  });

  test("returns access when the last 2 runs both fell back to Jina or worse", () => {
    const runs = [run({ tier: 2 }), run({ tier: 2 })];
    expect(classifyDrift(runs)).toBe("access");
  });

  test("returns selector when fetch succeeds but 0 cards parsed twice in a row", () => {
    const runs = [run({ tier: 1, http_ok: 1, cards_found: 0 }), run({ tier: 1, http_ok: 1, cards_found: 0 })];
    expect(classifyDrift(runs)).toBe("selector");
  });

  test("returns none for a single blip followed by a healthy run", () => {
    const runs = [run({ tier: 1, http_ok: 1, cards_found: 10 }), run({ tier: 0, http_ok: 0, cards_found: 0 })];
    expect(classifyDrift(runs)).toBe("none");
  });
});

describe("checkFieldDrift", () => {
  test("flags field drift when observed presence drops more than 30 points below baseline", () => {
    const observed = { title: 1.0, sqm: 0.20, rooms: 0.75, cold_rent: 0.90, district: 0.95, description: 1.0 };
    const drifted = checkFieldDrift("kleinanzeigen", run({ field_presence: JSON.stringify(observed) }));
    expect(drifted).toBe("field");
  });

  test("returns none when observed presence matches baselines within tolerance", () => {
    const observed = { title: 1.0, sqm: 0.65, rooms: 0.75, cold_rent: 0.90, district: 0.95, description: 1.0 };
    expect(checkFieldDrift("kleinanzeigen", run({ field_presence: JSON.stringify(observed) }))).toBe("none");
  });

  test("returns none when there is no field_presence data yet", () => {
    expect(checkFieldDrift("kleinanzeigen", run({ field_presence: null }))).toBe("none");
  });

  test("returns none for a portal with no profile file instead of throwing", () => {
    const observed = { title: 0.1 };
    expect(checkFieldDrift("not-a-real-portal", run({ field_presence: JSON.stringify(observed) }))).toBe("none");
  });
});
