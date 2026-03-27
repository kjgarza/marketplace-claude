#!/usr/bin/env bun
/**
 * Scan ReadItLater inbox folder and parse bookmark files into the database.
 */
import { Database } from "bun:sqlite";
import { readdirSync, readFileSync, statSync, existsSync } from "fs";
import { join, relative, extname, basename } from "path";
import { parseArgs } from "util";
import { createHash } from "crypto";

interface BookmarkInfo {
  file: string;
  title: string;
  url: string | null;
  domain: string | null;
  date_saved: string;
}

interface ScanResults {
  new: BookmarkInfo[];
  duplicates: BookmarkInfo[];
  already_tracked: number;
  errors: { file: string; error: string }[];
}

function parseFrontmatter(content: string): [Record<string, string>, string] {
  const fm: Record<string, string> = {};
  let body = content;

  if (content.startsWith("---")) {
    const parts = content.split("---", 3);
    if (parts.length >= 3) {
      const fmText = parts[1].trim();
      body = parts[2].trim();
      for (const line of fmText.split("\n")) {
        const trimmed = line.trim();
        const colonIdx = trimmed.indexOf(":");
        if (colonIdx > 0) {
          const key = trimmed.slice(0, colonIdx).trim();
          const value = trimmed
            .slice(colonIdx + 1)
            .trim()
            .replace(/^["']|["']$/g, "");
          if (value) fm[key] = value;
        }
      }
    }
  }
  return [fm, body];
}

function extractTitle(
  fm: Record<string, string>,
  body: string,
  filename: string,
): string {
  for (const key of [
    "title",
    "articleTitle",
    "videoTitle",
    "tweetAuthorName",
    "channelTitle",
    "authorName",
    "questionTitle",
  ]) {
    if (fm[key]) return fm[key];
  }

  const headingMatch = body.match(/^#\s+(.+)$/m);
  if (headingMatch) return headingMatch[1].trim();

  return basename(filename, extname(filename));
}

function extractUrl(
  fm: Record<string, string>,
  body: string,
): string | null {
  for (const key of [
    "source",
    "url",
    "articleURL",
    "videoURL",
    "tweetURL",
    "tootURL",
    "postURL",
    "questionURL",
    "pinURL",
    "link",
  ]) {
    if (fm[key]) return fm[key];
  }

  const urlMatch = body.match(/https?:\/\/[^\s)>\]]+/);
  if (urlMatch) return urlMatch[0].replace(/[.,;:]+$/, "");

  return null;
}

function extractDateSaved(
  fm: Record<string, string>,
  filePath: string,
): string {
  for (const key of [
    "date",
    "created",
    "date_saved",
    "savedAt",
    "publishedTime",
    "videoPublishDate",
    "tweetPublishDate",
    "publishedAt",
  ]) {
    if (fm[key]) return fm[key];
  }

  const mtime = statSync(filePath).mtime;
  return mtime.toISOString().split("T")[0];
}

function getDomain(url: string | null): string | null {
  if (!url) return null;
  try {
    let domain = new URL(url).hostname;
    if (domain.startsWith("www.")) domain = domain.slice(4);
    return domain;
  } catch {
    return null;
  }
}

function contentHash(content: string): string {
  return createHash("sha256").update(content, "utf-8").digest("hex").slice(0, 16);
}

function walkMdFiles(dir: string, skipArchive = true): string[] {
  const results: string[] = [];
  if (!existsSync(dir)) return results;

  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (skipArchive && entry.name.toLowerCase() === "archive") continue;
      results.push(...walkMdFiles(join(dir, entry.name), skipArchive));
    } else if (entry.name.endsWith(".md")) {
      results.push(join(dir, entry.name));
    }
  }
  return results;
}

export function scanAndInsert(inboxPath: string, dbPath: string): ScanResults {
  const db = new Database(dbPath);

  const knownPaths = new Set(
    db
      .query<{ file_path: string }, []>("SELECT file_path FROM bookmarks")
      .all()
      .map((r) => r.file_path),
  );

  const knownUrls = new Set(
    db
      .query<{ url: string }, []>(
        "SELECT url FROM bookmarks WHERE url IS NOT NULL",
      )
      .all()
      .map((r) => r.url),
  );

  const insertStmt = db.prepare(
    `INSERT INTO bookmarks (file_path, title, url, source_domain, date_saved, status, content_hash)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
  );

  const results: ScanResults = {
    new: [],
    duplicates: [],
    already_tracked: 0,
    errors: [],
  };

  if (!existsSync(inboxPath)) {
    console.error(`Error: Inbox path does not exist: ${inboxPath}`);
    process.exit(1);
  }

  const mdFiles = walkMdFiles(inboxPath);

  for (const filePath of mdFiles.sort()) {
    const relPath = relative(inboxPath, filePath);

    if (knownPaths.has(relPath)) {
      results.already_tracked++;
      continue;
    }

    let content: string;
    try {
      content = readFileSync(filePath, "utf-8");
    } catch (e: any) {
      results.errors.push({ file: relPath, error: e.message });
      continue;
    }

    const [fm, body] = parseFrontmatter(content);
    const title = extractTitle(fm, body, basename(filePath));
    const url = extractUrl(fm, body);
    const dateSaved = extractDateSaved(fm, filePath);
    const domain = getDomain(url);
    const hash = contentHash(content);

    const isDuplicate = url !== null && knownUrls.has(url);
    const status = isDuplicate ? "duplicate" : "unprocessed";

    insertStmt.run(relPath, title, url, domain, dateSaved, status, hash);

    const info: BookmarkInfo = {
      file: relPath,
      title,
      url,
      domain,
      date_saved: dateSaved,
    };

    if (isDuplicate) {
      results.duplicates.push(info);
    } else {
      results.new.push(info);
    }

    if (url) knownUrls.add(url);
  }

  db.close();
  return results;
}

if (import.meta.main) {
  const { values } = parseArgs({
    args: Bun.argv.slice(2),
    options: {
      "inbox-path": { type: "string" },
      "db-path": { type: "string" },
    },
    strict: true,
  });

  if (!values["inbox-path"] || !values["db-path"]) {
    console.error(
      "Usage: bun run scan-bookmarks.ts --inbox-path <path> --db-path <path>",
    );
    process.exit(1);
  }

  const results = scanAndInsert(values["inbox-path"]!, values["db-path"]!);
  console.log(JSON.stringify(results, null, 2));
  console.error(
    `\nSummary: ${results.new.length} new, ${results.duplicates.length} duplicates, ` +
      `${results.already_tracked} already tracked, ${results.errors.length} errors`,
  );
}
