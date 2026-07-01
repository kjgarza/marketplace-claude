import { Database } from "bun:sqlite";
import { existsSync, copyFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { homedir } from "node:os";
import type { Listing, RunRecord } from "./types.ts";

const __dir = dirname(fileURLToPath(import.meta.url));
const LEGACY_DB_PATH = join(__dir, '../state.db');
type SqliteDb = Database;

export function resolveStateDir(): string {
  return process.env.BERLIN_FLATS_STATE_DIR || join(homedir(), '.claude', 'berlin-flats');
}

/**
 * One-time migration off the versioned-plugin-cache path: if the new state
 * dir has no DB yet but a legacy in-plugin-directory DB exists, copy it over.
 * Never overwrites an existing new-path DB.
 */
export function migrateLegacyStateIfNeeded(legacyPath: string, stateDir: string): string {
  mkdirSync(stateDir, { recursive: true });
  const newPath = join(stateDir, 'state.db');
  if (!existsSync(newPath) && existsSync(legacyPath)) {
    copyFileSync(legacyPath, newPath);
  }
  return newPath;
}

function resolveDbPath(): string {
  return migrateLegacyStateIfNeeded(LEGACY_DB_PATH, resolveStateDir());
}

function assertIdentifier(value: string): void {
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(value)) {
    throw new Error(`Invalid SQLite identifier: ${value}`);
  }
}

// Column types are interpolated into ALTER TABLE, so constrain them to a known
// allowlist rather than trusting the caller-supplied string (no SQL injection).
const ALLOWED_COLUMN_TYPES = new Set(['TEXT', 'INTEGER', 'REAL', 'BLOB', 'NUMERIC']);
function assertColumnType(type: string): void {
  if (!ALLOWED_COLUMN_TYPES.has(type.toUpperCase())) {
    throw new Error(`Invalid SQLite column type: ${type}`);
  }
}

/**
 * Ensure a column exists in a table. Uses PRAGMA table_info to check first,
 * then ALTER TABLE if missing. Safe to call on existing databases (migration helper).
 */
export function ensureColumn(db: SqliteDb, table: string, col: string, type: string): void {
  assertIdentifier(table);
  assertIdentifier(col);
  assertColumnType(type);
  const cols = db.query(`PRAGMA table_info(${table})`).all() as Array<{ name: string }>;
  const exists = cols.some((c) => c.name === col);
  if (!exists) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${col} ${type}`);
  }
}

let _db: SqliteDb | undefined;
let _dbPath: string | undefined;

export function getDb(dbPath = resolveDbPath()): SqliteDb {
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
    CREATE TABLE IF NOT EXISTS runs (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      ts            TEXT DEFAULT (datetime('now')),
      portal        TEXT NOT NULL,
      tier          INTEGER,
      http_ok       INTEGER NOT NULL,
      html_length   INTEGER,
      cards_found   INTEGER NOT NULL,
      new_count     INTEGER NOT NULL,
      detail_ok     INTEGER NOT NULL,
      detail_total  INTEGER NOT NULL,
      field_presence TEXT,
      error         TEXT
    );
  `);
  // Migration: ensure reject_reason exists for databases created before this column was added
  ensureColumn(_db, 'listings', 'reject_reason', 'TEXT');
  return _db;
}

export function resetDbForTests(): void {
  _db?.close();
  _db = undefined;
  _dbPath = undefined;
}

export function upsertListing(listing: Listing): void {
  // external_id is optional on Listing (it's populated incrementally while
  // scraping) but NOT NULL in the schema and half the UNIQUE key. Fail fast
  // with a clear message instead of a cryptic SQLite constraint error.
  if (!listing.external_id) {
    throw new Error(`upsertListing requires external_id (portal=${listing.portal}, url=${listing.url})`);
  }
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

export function recordRun(run: RunRecord): void {
  const db = getDb();
  db.query(`
    INSERT INTO runs (portal, tier, http_ok, html_length, cards_found, new_count,
      detail_ok, detail_total, field_presence, error)
    VALUES ($portal, $tier, $http_ok, $html_length, $cards_found, $new_count,
      $detail_ok, $detail_total, $field_presence, $error)
  `).run({
    $portal: run.portal,
    $tier: run.tier,
    $http_ok: run.http_ok,
    $html_length: run.html_length,
    $cards_found: run.cards_found,
    $new_count: run.new_count,
    $detail_ok: run.detail_ok,
    $detail_total: run.detail_total,
    $field_presence: run.field_presence,
    $error: run.error,
  } as never);
}

export function getRecentRuns(portal: string, limit = 5): RunRecord[] {
  return getDb().query(
    'SELECT * FROM runs WHERE portal=$portal ORDER BY id DESC LIMIT $limit'
  ).all({ $portal: portal, $limit: limit }) as RunRecord[];
}
