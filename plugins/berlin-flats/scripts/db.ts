import { Database } from "bun:sqlite";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import type { Listing } from "./types.ts";

const __dir = dirname(fileURLToPath(import.meta.url));
const DB_PATH = join(__dir, '../state.db');
type SqliteDb = Database;

function assertIdentifier(value: string): void {
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(value)) {
    throw new Error(`Invalid SQLite identifier: ${value}`);
  }
}

/**
 * Ensure a column exists in a table. Uses PRAGMA table_info to check first,
 * then ALTER TABLE if missing. Safe to call on existing databases (migration helper).
 */
export function ensureColumn(db: SqliteDb, table: string, col: string, type: string): void {
  assertIdentifier(table);
  assertIdentifier(col);
  const cols = db.query(`PRAGMA table_info(${table})`).all() as Array<{ name: string }>;
  const exists = cols.some((c) => c.name === col);
  if (!exists) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${col} ${type}`);
  }
}

let _db: SqliteDb | undefined;
let _dbPath = DB_PATH;

export function getDb(dbPath = _dbPath): SqliteDb {
  if (_db) return _db;
  _dbPath = dbPath;
  _db = new Database(dbPath);
  _db.exec(`
    CREATE TABLE IF NOT EXISTS listings (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      portal       TEXT NOT NULL,
      external_id  TEXT NOT NULL,
      url          TEXT NOT NULL,
      title        TEXT,
      cold_rent    REAL,
      warm_rent    REAL,
      sqm          REAL,
      rooms        REAL,
      district     TEXT,
      posted_at    TEXT,
      fetched_at   TEXT DEFAULT (datetime('now')),
      scam_score   REAL,
      verdict      TEXT DEFAULT 'pending',
      raw_json     TEXT,
      reject_reason TEXT,
      UNIQUE(portal, external_id)
    );
    CREATE TABLE IF NOT EXISTS events (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      ts         TEXT DEFAULT (datetime('now')),
      event_type TEXT,
      payload    TEXT
    );
  `);
  // Migration: ensure reject_reason exists for databases created before this column was added
  ensureColumn(_db, 'listings', 'reject_reason', 'TEXT');
  return _db;
}

export function resetDbForTests(): void {
  _db?.close();
  _db = undefined;
  _dbPath = DB_PATH;
}

export function upsertListing(listing: Listing): void {
  const db = getDb();
  const stmt = db.query(`
    INSERT INTO listings (portal, external_id, url, title, cold_rent, warm_rent,
      sqm, rooms, district, posted_at, scam_score, verdict, raw_json)
    VALUES ($portal, $external_id, $url, $title, $cold_rent, $warm_rent,
      $sqm, $rooms, $district, $posted_at, $scam_score, $verdict, $raw_json)
    ON CONFLICT(portal, external_id) DO UPDATE SET
      warm_rent  = excluded.warm_rent,
      scam_score = excluded.scam_score,
      verdict    = excluded.verdict,
      fetched_at = datetime('now')
  `);
  stmt.run({
    $portal: listing.portal,
    $external_id: listing.external_id,
    $url: listing.url,
    $title: listing.title ?? null,
    $cold_rent: listing.cold_rent ?? null,
    $warm_rent: listing.warm_rent ?? null,
    $sqm: listing.sqm ?? null,
    $rooms: listing.rooms ?? null,
    $district: listing.district ?? null,
    $posted_at: listing.posted_at ?? null,
    $scam_score: listing.scam_score ?? null,
    $verdict: listing.verdict ?? "pending",
    $raw_json: listing.raw_json ?? null,
  } as never);
}

/** Returns true if the listing was newly inserted (did not exist before), false if it was an update. */
export function upsertListingNew(listing: Listing): boolean {
  const wasNew = !isSeen(listing.portal, listing.external_id);
  upsertListing(listing);
  return wasNew;
}

export function isSeen(portal: string, externalId?: string): boolean {
  if (!externalId) return false;
  const db = getDb();
  const row = db.query(
    'SELECT 1 AS found FROM listings WHERE portal=$portal AND external_id=$external_id'
  ).get({ $portal: portal, $external_id: externalId });
  return !!row;
}

export function getQueue(verdict = 'pending'): Listing[] {
  return getDb().query(
    'SELECT * FROM listings WHERE verdict=$verdict ORDER BY fetched_at DESC'
  ).all({ $verdict: verdict }) as Listing[];
}

// Count listings that satisfy the DOD pass condition (see DOD.md): pending,
// in a target Berlin district, within the rent ceiling, and a real listing URL.
export function countQualifying(): number {
  const districts = [
    'Mitte', 'Prenzlauer Berg', 'Friedrichshain', 'Kreuzberg', 'Neukölln',
    'Charlottenburg', 'Schöneberg', 'Wilmersdorf', 'Pankow', 'Berlin',
  ];
  const districtClause = districts.map((_, i) => `district LIKE $d${i}`).join(' OR ');
  const params: Record<string, string> = {};
  districts.forEach((d, i) => { params[`$d${i}`] = `%${d}%`; });
  const row = getDb().query(
    `SELECT COUNT(*) AS n FROM listings
     WHERE verdict = 'pending'
       AND (${districtClause})
       AND ((warm_rent IS NOT NULL AND warm_rent <= 2000)
            OR (cold_rent IS NOT NULL AND cold_rent <= 1600))
       AND (url LIKE '%/s-anzeige/%' OR url LIKE '%/expose/%')`
  ).get(params) as { n: number };
  return row.n;
}

export function setVerdict(id: number, verdict: string, reason: string | null = null): void {
  getDb().query(
    'UPDATE listings SET verdict=$verdict, reject_reason=$reason WHERE id=$id'
  ).run({ $verdict: verdict, $reason: reason, $id: id });
}
