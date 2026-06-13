#!/usr/bin/env bun
/**
 * Update database after a digest has been generated.
 */
import { Database } from "bun:sqlite";
import { parseArgs } from "util";

interface UpdateResult {
  digest_id: number;
  processed: number;
  not_found_or_already_processed: string[];
}

export function updateAfterDigest(
  dbPath: string,
  digestFile: string,
  bookmarkFiles: string[],
  weekStart: string,
  weekEnd: string,
  themes?: { name: string; count: number }[],
  force = false,
): UpdateResult {
  const db = new Database(dbPath);
  const now = new Date().toISOString().replace("T", " ").slice(0, 19);

  // Idempotency guard: refuse to create a duplicate digest for the same week unless --force.
  const existing = db
    .query<{ id: number }, [string, string]>(
      "SELECT id FROM digests WHERE week_start = ? AND week_end = ?",
    )
    .get(weekStart, weekEnd);

  if (existing && !force) {
    db.close();
    throw new Error(
      `A digest already exists for ${weekStart} to ${weekEnd} (digest_id=${existing.id}). ` +
        `Re-run with --force to regenerate.`,
    );
  }

  // Insert digest record
  const insertDigest = db.prepare(
    `INSERT INTO digests (date_generated, week_start, week_end, file_path, bookmark_count)
     VALUES (?, ?, ?, ?, ?)`,
  );
  insertDigest.run(now, weekStart, weekEnd, digestFile, bookmarkFiles.length);

  const digestId = Number(db.query("SELECT last_insert_rowid() as id").get()!.id);

  // Record themes
  if (themes) {
    const insertTheme = db.prepare(
      "INSERT INTO themes (digest_id, theme_name, bookmark_count) VALUES (?, ?, ?)",
    );
    for (const theme of themes) {
      insertTheme.run(digestId, theme.name, theme.count ?? 0);
    }
  }

  // Mark bookmarks as processed
  const updateBookmark = db.prepare(
    `UPDATE bookmarks
     SET status = 'processed', date_processed = ?, digest_id = ?
     WHERE file_path = ? AND status = 'unprocessed'`,
  );

  let processedCount = 0;
  const notFound: string[] = [];

  for (const fp of bookmarkFiles) {
    const changes = updateBookmark.run(now, digestId, fp);
    if (changes.changes > 0) {
      processedCount++;
    } else {
      notFound.push(fp);
    }
  }

  db.close();

  return {
    digest_id: digestId,
    processed: processedCount,
    not_found_or_already_processed: notFound,
  };
}

if (import.meta.main) {
  const { values, positionals } = parseArgs({
    args: Bun.argv.slice(2),
    options: {
      "db-path": { type: "string" },
      "digest-file": { type: "string" },
      "bookmark-files": { type: "string", multiple: true },
      "week-start": { type: "string" },
      "week-end": { type: "string" },
      "themes-json": { type: "string" },
      "force": { type: "boolean" },
    },
    strict: true,
    allowPositionals: false,
  });

  if (
    !values["db-path"] ||
    !values["digest-file"] ||
    !values["bookmark-files"]?.length ||
    !values["week-start"] ||
    !values["week-end"]
  ) {
    console.error(
      "Usage: bun run update-db.ts --db-path <path> --digest-file <path> " +
        "--bookmark-files <file1> --bookmark-files <file2> ... --week-start <YYYY-MM-DD> --week-end <YYYY-MM-DD>",
    );
    process.exit(1);
  }

  const bookmarkFiles = values["bookmark-files"]!.filter(Boolean);

  const themes = values["themes-json"]
    ? JSON.parse(values["themes-json"])
    : undefined;

  try {
    const result = updateAfterDigest(
      values["db-path"]!,
      values["digest-file"]!,
      bookmarkFiles,
      values["week-start"]!,
      values["week-end"]!,
      themes,
      values["force"] ?? false,
    );
    console.log(JSON.stringify(result, null, 2));
  } catch (e) {
    console.error(String(e instanceof Error ? e.message : e));
    process.exit(2);
  }
}
