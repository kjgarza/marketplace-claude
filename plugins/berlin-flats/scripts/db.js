import { DatabaseSync } from 'node:sqlite';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dir = dirname(fileURLToPath(import.meta.url));
const DB_PATH = join(__dir, '../state.db');

let _db;
export function getDb() {
  if (_db) return _db;
  _db = new DatabaseSync(DB_PATH);
  _db.exec(`
    CREATE TABLE IF NOT EXISTS listings (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      portal      TEXT NOT NULL,
      external_id TEXT NOT NULL,
      url         TEXT NOT NULL,
      title       TEXT,
      cold_rent   REAL,
      warm_rent   REAL,
      sqm         REAL,
      rooms       REAL,
      district    TEXT,
      posted_at   TEXT,
      fetched_at  TEXT DEFAULT (datetime('now')),
      scam_score  REAL,
      verdict     TEXT DEFAULT 'pending',
      raw_json    TEXT,
      UNIQUE(portal, external_id)
    );
    CREATE TABLE IF NOT EXISTS events (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      ts         TEXT DEFAULT (datetime('now')),
      event_type TEXT,
      payload    TEXT
    );
  `);
  return _db;
}

export function upsertListing(listing) {
  const db = getDb();
  const stmt = db.prepare(`
    INSERT INTO listings (portal, external_id, url, title, cold_rent, warm_rent,
      sqm, rooms, district, posted_at, scam_score, verdict, raw_json)
    VALUES (:portal, :external_id, :url, :title, :cold_rent, :warm_rent,
      :sqm, :rooms, :district, :posted_at, :scam_score, :verdict, :raw_json)
    ON CONFLICT(portal, external_id) DO UPDATE SET
      warm_rent  = excluded.warm_rent,
      scam_score = excluded.scam_score,
      verdict    = excluded.verdict,
      fetched_at = datetime('now')
  `);
  stmt.run(listing);
}

export function isSeen(portal, externalId) {
  const db = getDb();
  const row = db.prepare(
    'SELECT 1 AS found FROM listings WHERE portal=:portal AND external_id=:external_id'
  ).get({ portal, external_id: externalId });
  return !!row;
}

export function getQueue(verdict = 'pending') {
  return getDb().prepare(
    'SELECT * FROM listings WHERE verdict=:verdict ORDER BY fetched_at DESC'
  ).all({ verdict });
}

export function setVerdict(id, verdict) {
  getDb().prepare('UPDATE listings SET verdict=:verdict WHERE id=:id').run({ verdict, id });
}
