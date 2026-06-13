#!/usr/bin/env bun
/**
 * Initialize the VHS Berlin SQLite database.
 * Reads schema from data/schema.sql relative to this script file.
 * Idempotent — safe to run multiple times.
 */
import { Database } from 'bun:sqlite';
import { existsSync, mkdirSync, readFileSync } from 'fs';
import { dirname, join } from 'path';
import { homedir } from 'os';
import { parseArgs } from 'util';

const DEFAULT_DB_PATH = '~/.local/share/vhs-berlin/vhs.db';

function expandTilde(p: string): string {
  if (p.startsWith('~/')) return join(homedir(), p.slice(2));
  return p;
}

export function initDb(dbPath: string): void {
  const resolved = expandTilde(dbPath);
  const dir = dirname(resolved);
  if (dir && !existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }

  const schemaPath = join(import.meta.dir, '..', 'data', 'schema.sql');
  const schema = readFileSync(schemaPath, 'utf-8');

  const isNew = !existsSync(resolved);
  const db = new Database(resolved, { create: true });
  db.exec(schema);
  db.close();

  if (isNew) {
    console.log(`Created new database at: ${resolved}`);
  } else {
    console.log(`Database already exists at: ${resolved} (schema verified)`);
  }
}

if (import.meta.main) {
  const { values } = parseArgs({
    args: Bun.argv.slice(2),
    options: {
      'db-path': { type: 'string' },
    },
    strict: true,
  });

  const dbPath = values['db-path'] ?? DEFAULT_DB_PATH;
  initDb(dbPath);
}
