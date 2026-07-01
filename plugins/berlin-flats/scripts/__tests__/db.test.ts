import { afterEach, describe, expect, test } from "bun:test";
import { Database } from "bun:sqlite";
import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { countQualifying, ensureColumn, getDb, getQueue, getRecentRuns, isSeen, recordRun, resetDbForTests, setVerdict, upsertListing } from "../db.ts";

let tempDir: string | undefined;

function useTempDb(): string {
  resetDbForTests();
  tempDir = mkdtempSync(join(tmpdir(), "berlin-flats-db-"));
  const dbPath = join(tempDir, "state.db");
  getDb(dbPath);
  return dbPath;
}

afterEach(() => {
  resetDbForTests();
  if (tempDir) rmSync(tempDir, { recursive: true, force: true });
  tempDir = undefined;
});

describe("ensureColumn", () => {
  test("adds missing columns idempotently", () => {
    const db = new Database(":memory:");
    db.exec("CREATE TABLE t (id INTEGER PRIMARY KEY, a TEXT)");
    ensureColumn(db, "t", "b", "TEXT");
    ensureColumn(db, "t", "b", "TEXT");
    const cols = db.query("PRAGMA table_info(t)").all() as Array<{ name: string }>;
    expect(cols.filter((c) => c.name === "b")).toHaveLength(1);
    db.close();
  });

  test("rejects unsanitized column types and identifiers", () => {
    const db = new Database(":memory:");
    db.exec("CREATE TABLE t (id INTEGER PRIMARY KEY)");
    expect(() => ensureColumn(db, "t", "c", "TEXT); DROP TABLE t;--")).toThrow(/column type/);
    expect(() => ensureColumn(db, "t", "c)--", "TEXT")).toThrow(/identifier/);
    db.close();
  });
});

describe("listing persistence", () => {
  test("upserts by portal and external_id", () => {
    useTempDb();
    upsertListing({
      portal: "kleinanzeigen",
      external_id: "123",
      url: "https://example.test/1",
      title: "First",
      warm_rent: 1200,
      scam_score: 0.1,
      verdict: "pending",
    });
    upsertListing({
      portal: "kleinanzeigen",
      external_id: "123",
      url: "https://example.test/1",
      title: "Updated title is intentionally not updated",
      warm_rent: 1300,
      scam_score: 0.6,
      verdict: "review",
    });
    const rows = getQueue("review");
    expect(rows).toHaveLength(1);
    expect(rows[0].warm_rent).toBe(1300);
    expect(rows[0].scam_score).toBe(0.6);
    expect(rows[0].title).toBe("First");
  });

  test("tracks seen listings and updates verdict reasons", () => {
    useTempDb();
    expect(isSeen("kleinanzeigen", "abc")).toBe(false);
    upsertListing({
      portal: "kleinanzeigen",
      external_id: "abc",
      url: "https://example.test/abc",
      verdict: "pending",
    });
    expect(isSeen("kleinanzeigen", "abc")).toBe(true);
    const [row] = getQueue("pending");
    setVerdict(row.id!, "rejected", "too far");
    const [rejected] = getQueue("rejected");
    expect(rejected.reject_reason).toBe("too far");
  });

  test("upsertListing rejects a listing with no external_id", () => {
    useTempDb();
    expect(() =>
      upsertListing({ portal: "kleinanzeigen", url: "https://example.test/x" }),
    ).toThrow(/external_id/);
  });
});

describe("countQualifying (DOD pass condition)", () => {
  // Two qualifying listings (one per pass path: warm-rent ceiling + s-anzeige
  // URL, and cold-rent proxy + expose URL) plus one of each disqualifying
  // variant, so the count must be exactly 2. This pins the DOD qualifying_count
  // contract: pending verdict + target district + rent ceiling + real listing URL.
  test("counts only listings meeting every DOD criterion", () => {
    useTempDb();
    // Qualifying: pending, Mitte, warm_rent within ceiling, real s-anzeige URL.
    upsertListing({
      portal: "kleinanzeigen",
      external_id: "q1",
      url: "https://www.kleinanzeigen.de/s-anzeige/2-zimmer/123",
      district: "Mitte",
      warm_rent: 1800,
      verdict: "pending",
    });
    // Qualifying via cold_rent proxy + expose URL.
    upsertListing({
      portal: "immoscout24",
      external_id: "q2",
      url: "https://www.immobilienscout24.de/expose/456",
      district: "Prenzlauer Berg",
      cold_rent: 1500,
      verdict: "pending",
    });
    // Disqualified: wrong verdict.
    upsertListing({
      portal: "kleinanzeigen",
      external_id: "x_verdict",
      url: "https://www.kleinanzeigen.de/s-anzeige/x/1",
      district: "Mitte",
      warm_rent: 1800,
      verdict: "rejected",
    });
    // Disqualified: district not in the target set.
    upsertListing({
      portal: "kleinanzeigen",
      external_id: "x_district",
      url: "https://www.kleinanzeigen.de/s-anzeige/x/2",
      district: "Spandau",
      warm_rent: 1800,
      verdict: "pending",
    });
    // Disqualified: over the rent ceiling (warm > 2000, cold > 1600).
    upsertListing({
      portal: "kleinanzeigen",
      external_id: "x_rent",
      url: "https://www.kleinanzeigen.de/s-anzeige/x/3",
      district: "Mitte",
      warm_rent: 2500,
      cold_rent: 2100,
      verdict: "pending",
    });
    // Disqualified: not a real listing URL.
    upsertListing({
      portal: "kleinanzeigen",
      external_id: "x_url",
      url: "https://www.kleinanzeigen.de/s-suche/preview",
      district: "Mitte",
      warm_rent: 1800,
      verdict: "pending",
    });

    expect(countQualifying()).toBe(2);
  });
});

describe("run telemetry", () => {
  test("records and retrieves runs newest-first, scoped by portal", () => {
    useTempDb();
    recordRun({ portal: "kleinanzeigen", tier: 1, http_ok: 1, html_length: 5000, cards_found: 12, new_count: 3, detail_ok: 3, detail_total: 3, field_presence: JSON.stringify({ title: 1 }), error: null });
    recordRun({ portal: "kleinanzeigen", tier: 0, http_ok: 0, html_length: null, cards_found: 0, new_count: 0, detail_ok: 0, detail_total: 0, field_presence: null, error: "all tiers failed" });
    recordRun({ portal: "immoscout24", tier: 2, http_ok: 1, html_length: 8000, cards_found: 5, new_count: 1, detail_ok: 1, detail_total: 1, field_presence: JSON.stringify({ title: 1 }), error: null });

    const kaRuns = getRecentRuns("kleinanzeigen", 5);
    expect(kaRuns).toHaveLength(2);
    expect(kaRuns[0].error).toBe("all tiers failed");
    expect(kaRuns[1].cards_found).toBe(12);

    const is24Runs = getRecentRuns("immoscout24");
    expect(is24Runs).toHaveLength(1);
  });

  test("limits results to the requested count", () => {
    useTempDb();
    for (let i = 0; i < 4; i++) {
      recordRun({ portal: "kleinanzeigen", tier: 1, http_ok: 1, html_length: 100, cards_found: i, new_count: 0, detail_ok: 0, detail_total: 0, field_presence: null, error: null });
    }
    expect(getRecentRuns("kleinanzeigen", 2)).toHaveLength(2);
  });
});
