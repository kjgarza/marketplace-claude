#!/usr/bin/env bun
/**
 * Initialize the ReadItLater digest SQLite database.
 */
import { Database } from "bun:sqlite";
import { existsSync, mkdirSync } from "fs";
import { dirname } from "path";
import { parseArgs } from "util";

const SCHEMA = `
CREATE TABLE IF NOT EXISTS bookmarks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    file_path TEXT NOT NULL UNIQUE,
    title TEXT,
    url TEXT,
    source_domain TEXT,
    date_saved TEXT,
    date_processed TEXT,
    digest_id INTEGER,
    status TEXT NOT NULL DEFAULT 'unprocessed'
        CHECK(status IN ('unprocessed', 'processed', 'archived', 'duplicate')),
    content_hash TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (digest_id) REFERENCES digests(id)
);

CREATE TABLE IF NOT EXISTS digests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date_generated TEXT NOT NULL DEFAULT (datetime('now')),
    week_start TEXT NOT NULL,
    week_end TEXT NOT NULL,
    file_path TEXT,
    bookmark_count INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS themes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    digest_id INTEGER NOT NULL,
    theme_name TEXT NOT NULL,
    bookmark_count INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY (digest_id) REFERENCES digests(id)
);

CREATE INDEX IF NOT EXISTS idx_bookmarks_status ON bookmarks(status);
CREATE INDEX IF NOT EXISTS idx_bookmarks_url ON bookmarks(url);
CREATE INDEX IF NOT EXISTS idx_bookmarks_digest ON bookmarks(digest_id);
CREATE INDEX IF NOT EXISTS idx_themes_digest ON themes(digest_id);
`;

export function initDb(dbPath: string): void {
  const dir = dirname(dbPath);
  if (dir && !existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }

  const isNew = !existsSync(dbPath);
  const db = new Database(dbPath, { create: true });
  db.exec(SCHEMA);
  db.close();

  if (isNew) {
    console.log(`Created new database at: ${dbPath}`);
  } else {
    console.log(`Database already exists at: ${dbPath} (schema verified)`);
  }
}

// CLI entry point
if (import.meta.main) {
  const { values } = parseArgs({
    args: Bun.argv.slice(2),
    options: { "db-path": { type: "string" } },
    strict: true,
  });

  if (!values["db-path"]) {
    console.error("Usage: bun run init-db.ts --db-path <path>");
    process.exit(1);
  }

  initDb(values["db-path"]);
}
