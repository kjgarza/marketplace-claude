import { afterEach, describe, expect, test } from "bun:test";
import { Database } from "bun:sqlite";
import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { countQualifying, ensureColumn, getDb, getQueue, isSeen, resetDbForTests, setVerdict, upsertListing } from "../db.ts";

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
});

describe("countQualifying (DOD pass condition)", () => {
  // One fully-qualifying listing plus one of each disqualifying variant, so the
  // count must be exactly 1. This pins the DOD qualifying_count contract:
  // pending verdict + target district + rent ceiling + real listing URL.
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
