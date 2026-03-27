#!/usr/bin/env bun
/**
 * Cleanup operations for ReadItLater bookmarks.
 */
import { Database } from "bun:sqlite";
import { existsSync, mkdirSync, renameSync, unlinkSync } from "fs";
import { join, dirname } from "path";
import { parseArgs } from "util";

interface ArchiveResult {
  moved: { file: string; title: string }[];
  already_missing: string[];
  errors: { file: string; error: string }[];
}

export function archiveProcessed(
  dbPath: string,
  inboxPath: string,
  archivePath: string,
): ArchiveResult {
  mkdirSync(archivePath, { recursive: true });

  const db = new Database(dbPath);
  const rows = db
    .query<
      { id: number; file_path: string; title: string },
      []
    >("SELECT id, file_path, title FROM bookmarks WHERE status = 'processed'")
    .all();

  const updateStmt = db.prepare(
    "UPDATE bookmarks SET status = 'archived' WHERE id = ?",
  );

  const result: ArchiveResult = { moved: [], already_missing: [], errors: [] };

  for (const row of rows) {
    const src = join(inboxPath, row.file_path);
    const dst = join(archivePath, row.file_path);

    if (!existsSync(src)) {
      updateStmt.run(row.id);
      result.already_missing.push(row.file_path);
      continue;
    }

    try {
      mkdirSync(dirname(dst), { recursive: true });
      renameSync(src, dst);
      updateStmt.run(row.id);
      result.moved.push({ file: row.file_path, title: row.title });
    } catch (e: any) {
      result.errors.push({ file: row.file_path, error: e.message });
    }
  }

  db.close();
  return result;
}

interface DuplicateInfo {
  file: string;
  title: string;
  url: string;
  exists_on_disk: boolean;
}

export function listDuplicates(
  dbPath: string,
  inboxPath: string,
): { duplicates: DuplicateInfo[]; count: number } {
  const db = new Database(dbPath);
  const rows = db
    .query<
      { file_path: string; title: string; url: string },
      []
    >(
      `SELECT file_path, title, url FROM bookmarks
       WHERE status = 'duplicate' ORDER BY url, date_saved`,
    )
    .all();
  db.close();

  const duplicates = rows.map((row) => ({
    file: row.file_path,
    title: row.title,
    url: row.url,
    exists_on_disk: existsSync(join(inboxPath, row.file_path)),
  }));

  return { duplicates, count: duplicates.length };
}

export function deleteDuplicates(
  dbPath: string,
  inboxPath: string,
  confirmedFiles: string[],
): { deleted: string[]; errors: { file: string; error: string }[] } {
  const db = new Database(dbPath);
  const updateStmt = db.prepare(
    "UPDATE bookmarks SET status = 'archived' WHERE file_path = ?",
  );

  const deleted: string[] = [];
  const errors: { file: string; error: string }[] = [];

  for (const relPath of confirmedFiles) {
    const filePath = join(inboxPath, relPath);
    try {
      if (existsSync(filePath)) unlinkSync(filePath);
      updateStmt.run(relPath);
      deleted.push(relPath);
    } catch (e: any) {
      errors.push({ file: relPath, error: e.message });
    }
  }

  db.close();
  return { deleted, errors };
}

interface StatusReport {
  total_bookmarks: number;
  by_status: Record<string, number>;
  total_digests: number;
  top_domains: { domain: string; count: number }[];
  last_digest?: {
    generated: string;
    week: string;
    bookmarks: number;
  };
}

export function statusReport(dbPath: string): StatusReport {
  const db = new Database(dbPath);

  const statusCounts: Record<string, number> = {};
  for (const row of db
    .query<{ status: string; count: number }, []>(
      "SELECT status, COUNT(*) as count FROM bookmarks GROUP BY status",
    )
    .all()) {
    statusCounts[row.status] = row.count;
  }

  const total =
    db.query<{ total: number }, []>("SELECT COUNT(*) as total FROM bookmarks").get()
      ?.total ?? 0;

  const digestCount =
    db.query<{ count: number }, []>("SELECT COUNT(*) as count FROM digests").get()
      ?.count ?? 0;

  const lastDigest = db
    .query<
      {
        date_generated: string;
        week_start: string;
        week_end: string;
        bookmark_count: number;
      },
      []
    >(
      `SELECT date_generated, week_start, week_end, bookmark_count
       FROM digests ORDER BY date_generated DESC LIMIT 1`,
    )
    .get();

  const topDomains = db
    .query<{ source_domain: string; count: number }, []>(
      `SELECT source_domain, COUNT(*) as count FROM bookmarks
       WHERE source_domain IS NOT NULL
       GROUP BY source_domain ORDER BY count DESC LIMIT 10`,
    )
    .all()
    .map((r) => ({ domain: r.source_domain, count: r.count }));

  db.close();

  const report: StatusReport = {
    total_bookmarks: total,
    by_status: statusCounts,
    total_digests: digestCount,
    top_domains: topDomains,
  };

  if (lastDigest) {
    report.last_digest = {
      generated: lastDigest.date_generated,
      week: `${lastDigest.week_start} to ${lastDigest.week_end}`,
      bookmarks: lastDigest.bookmark_count,
    };
  }

  return report;
}

if (import.meta.main) {
  const args = Bun.argv.slice(2);
  const command = args[0];

  if (!command || !["archive", "dedup", "delete", "status"].includes(command)) {
    console.error("Usage: bun run cleanup.ts <archive|dedup|delete|status> [options]");
    process.exit(1);
  }

  const { values } = parseArgs({
    args: args.slice(1),
    options: {
      "db-path": { type: "string" },
      "inbox-path": { type: "string" },
      "archive-path": { type: "string" },
      "files": { type: "string" },
    },
    strict: true,
  });

  if (!values["db-path"]) {
    console.error("--db-path is required");
    process.exit(1);
  }

  let result: unknown;

  switch (command) {
    case "archive":
      if (!values["inbox-path"] || !values["archive-path"]) {
        console.error("archive requires --inbox-path and --archive-path");
        process.exit(1);
      }
      result = archiveProcessed(
        values["db-path"],
        values["inbox-path"],
        values["archive-path"],
      );
      break;

    case "dedup":
      if (!values["inbox-path"]) {
        console.error("dedup requires --inbox-path");
        process.exit(1);
      }
      result = listDuplicates(values["db-path"], values["inbox-path"]);
      break;

    case "delete":
      if (!values["inbox-path"] || !values["files"]) {
        console.error("delete requires --inbox-path and --files (comma-separated)");
        process.exit(1);
      }
      result = deleteDuplicates(
        values["db-path"],
        values["inbox-path"],
        values["files"].split(",").map((f) => f.trim()),
      );
      break;

    case "status":
      result = statusReport(values["db-path"]);
      break;
  }

  console.log(JSON.stringify(result, null, 2));
}
