import { afterEach, describe, expect, test } from "bun:test";
import { Database } from "bun:sqlite";
import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { ensureColumn, getDb, getQueue, isSeen, resetDbForTests, setVerdict, upsertListing } from "../db.ts";

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
