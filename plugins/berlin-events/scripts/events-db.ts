#!/usr/bin/env bun
/**
 * events-db — tiny state store so berlin-events stops re-suggesting the same events
 * and can learn taste over time. Runs under bun (bun:sqlite), like the rest of the plugin.
 *
 * Event identity = sha256(lowercased "title|date|venue").
 *
 * Subcommands:
 *   init                                   create DB + schema
 *   filter   < events.json                 read events array on stdin, print only those NOT already shown
 *   record   < events.json                 mark events as shown (now)
 *   feedback --hash <h> --verdict went|skip [--notes "..."]
 *   recent-feedback [--limit N]            print recent feedback for ranking context
 *
 * --db-path defaults to ~/.local/share/berlin-events/events.db
 */
import { Database } from "bun:sqlite";
import { existsSync, mkdirSync, readFileSync } from "fs";
import { dirname, join } from "path";
import { homedir } from "os";
import { createHash } from "crypto";

const DEFAULT_DB = join(homedir(), ".local/share/berlin-events/events.db");

function arg(name: string): string | null {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : null;
}
function dbPath(): string { return arg("db-path") ?? DEFAULT_DB; }

function eventHash(e: { title?: string; date?: string; venue?: string }): string {
  const key = `${(e.title ?? "").trim().toLowerCase()}|${(e.date ?? "").trim().toLowerCase()}|${(e.venue ?? "").trim().toLowerCase()}`;
  return createHash("sha256").update(key).digest("hex");
}

function open(): Database {
  const p = dbPath();
  const dir = dirname(p);
  if (dir && !existsSync(dir)) mkdirSync(dir, { recursive: true });
  const db = new Database(p, { create: true });
  db.exec(`
    CREATE TABLE IF NOT EXISTS shown (
      hash TEXT PRIMARY KEY,
      title TEXT, date TEXT, venue TEXT,
      first_shown TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS feedback (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      hash TEXT, verdict TEXT, notes TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);
  return db;
}

function readStdin(): any[] {
  const raw = readFileSync(0, "utf-8").trim();
  if (!raw) return [];
  const parsed = JSON.parse(raw);
  return Array.isArray(parsed) ? parsed : (parsed.events ?? []);
}

const cmd = process.argv[2];

if (cmd === "init") {
  open().close();
  console.log(`events-db ready at ${dbPath()}`);
} else if (cmd === "filter") {
  const db = open();
  const events = readStdin();
  const seen = db.query("SELECT 1 AS f FROM shown WHERE hash = ?");
  const fresh = events.filter((e) => !seen.get(eventHash(e)));
  db.close();
  process.stdout.write(JSON.stringify(fresh, null, 2) + "\n");
} else if (cmd === "record") {
  const db = open();
  const events = readStdin();
  const ins = db.prepare("INSERT OR IGNORE INTO shown (hash, title, date, venue) VALUES (?, ?, ?, ?)");
  let n = 0;
  for (const e of events) {
    // .changes is 0 when INSERT OR IGNORE skips a duplicate; only count new rows.
    n += ins.run(eventHash(e), e.title ?? null, e.date ?? null, e.venue ?? null).changes;
  }
  db.close();
  console.log(JSON.stringify({ recorded: n }));
} else if (cmd === "feedback") {
  const db = open();
  db.prepare("INSERT INTO feedback (hash, verdict, notes) VALUES (?, ?, ?)")
    .run(arg("hash"), arg("verdict"), arg("notes"));
  db.close();
  console.log(JSON.stringify({ ok: true, verdict: arg("verdict") }));
} else if (cmd === "recent-feedback") {
  const db = open();
  const limit = arg("limit") ? parseInt(arg("limit")!) : 20;
  const rows = db.query(
    "SELECT f.verdict, f.notes, s.title, s.venue FROM feedback f LEFT JOIN shown s ON s.hash = f.hash ORDER BY f.id DESC LIMIT ?"
  ).all(limit);
  db.close();
  process.stdout.write(JSON.stringify(rows, null, 2) + "\n");
} else {
  console.error("Usage: events-db.ts <init|filter|record|feedback|recent-feedback> [--db-path <p>]");
  process.exit(1);
}
