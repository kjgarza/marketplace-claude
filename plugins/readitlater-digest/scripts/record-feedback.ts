#!/usr/bin/env bun
/**
 * Record reader feedback on a digest, and read recent feedback for theme biasing.
 */
import { Database } from "bun:sqlite";
import { parseArgs } from "util";

export function recordFeedback(
  dbPath: string,
  digestId: number | null,
  rating: number | null,
  notes: string | null,
  themesLiked: string[] | null,
) {
  const db = new Database(dbPath);
  // Default to the most recent digest when no id given.
  let id = digestId;
  if (id == null) {
    const last = db.query<{ id: number }, []>("SELECT id FROM digests ORDER BY id DESC LIMIT 1").get();
    if (!last) { db.close(); throw new Error("No digests exist yet to attach feedback to."); }
    id = last.id;
  }
  db.prepare(
    "INSERT INTO feedback (digest_id, rating, notes, themes_liked) VALUES (?, ?, ?, ?)",
  ).run(id, rating, notes, themesLiked ? JSON.stringify(themesLiked) : null);
  db.close();
  return { digest_id: id, rating, notes, themes_liked: themesLiked };
}

export function recentFeedback(dbPath: string, limit = 5) {
  const db = new Database(dbPath);
  const rows = db
    .query(
      `SELECT f.digest_id, f.rating, f.notes, f.themes_liked, d.week_start, d.week_end
       FROM feedback f JOIN digests d ON d.id = f.digest_id
       ORDER BY f.id DESC LIMIT ?`,
    )
    .all(limit);
  db.close();
  return rows;
}

if (import.meta.main) {
  const { values } = parseArgs({
    args: Bun.argv.slice(2),
    options: {
      "db-path": { type: "string" },
      "digest-id": { type: "string" },
      "rating": { type: "string" },
      "notes": { type: "string" },
      "themes-liked": { type: "string" }, // comma-separated
      "recent": { type: "boolean" },
      "limit": { type: "string" },
    },
    strict: true,
  });

  if (!values["db-path"]) {
    console.error("Usage: record-feedback.ts --db-path <p> [--recent] | [--rating N --notes '...' --themes-liked 'a,b']");
    process.exit(1);
  }

  if (values["recent"]) {
    console.log(JSON.stringify(recentFeedback(values["db-path"], values["limit"] ? parseInt(values["limit"]) : 5), null, 2));
  } else {
    const themes = values["themes-liked"] ? values["themes-liked"].split(",").map((s) => s.trim()).filter(Boolean) : null;
    const result = recordFeedback(
      values["db-path"],
      values["digest-id"] ? parseInt(values["digest-id"]) : null,
      values["rating"] ? parseInt(values["rating"]) : null,
      values["notes"] ?? null,
      themes,
    );
    console.log(JSON.stringify(result, null, 2));
  }
}
