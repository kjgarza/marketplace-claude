#!/usr/bin/env bun
/**
 * Watch: subcommands save|check|list|remove for VHS Berlin watch management.
 * save --label --query-json --db-path
 * check --db-path
 * list --db-path
 * remove --watch-id --db-path
 */
import { Database } from "bun:sqlite";
import { existsSync, readFileSync } from "fs";
import { join } from "path";
import { homedir } from "os";
import { parseArgs } from "util";
import { createHash } from "crypto";
import * as cheerio from "cheerio";
import yaml from "js-yaml";

const DEFAULT_DB_PATH = "~/.local/share/vhs-berlin/vhs.db";
const BROWSER_UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36";

function expandTilde(p) { if (p.startsWith("~/")) return join(homedir(), p.slice(2)); return p; }
function loadConfig(name) { return yaml.load(readFileSync(join(import.meta.dir, "..", "config", name), "utf-8")); }
function snapshotHash(courseIds) { return createHash("sha256").update(JSON.stringify(courseIds.slice().sort())).digest("hex"); }
function resolveDistrictCode(district, registry) {
  const dl = district.toLowerCase();
  for (const [key, val] of Object.entries(registry.districts)) {
    const variants = val.variants ?? [];
    if (key.includes(dl) || dl.includes(key) || variants.some(v => v.toLowerCase().includes(dl))) return val.code;
  }
  return null;
}
function buildSearchUrl(params, registry) {
  const base = registry.base_url;
  const keyword = params.keyword ?? params.category ?? "";
  if (params.district) {
    const code = resolveDistrictCode(params.district, registry);
    if (code) return keyword
      ? base + "/VHSKURSE/BusinessPages/CourseList.aspx?direkt=1&bezirk=" + code + "&stichw=" + encodeURIComponent(keyword)
      : base + "/VHSKURSE/BusinessPages/CourseList.aspx?direkt=1&bezirk=" + code;
  }
  if (keyword) return base + "/VHSKURSE/BusinessPages/CourseList.aspx?stichw=" + encodeURIComponent(keyword);
  return base + "/VHSKURSE/BusinessPages/CourseList.aspx";
}
async function fetchHtml(url) {
  try {
    const res = await fetch(url, { headers: { "User-Agent": BROWSER_UA, "Accept-Language": "de-DE,de;q=0.9", Accept: "text/html,*/*" }, redirect: "follow", signal: AbortSignal.timeout(15000) });
    if (res.ok) { const html = await res.text(); if (html.length > 500) return { html, tier: 1 }; }
  } catch (_) {}
  try {
    const res = await fetch("https://r.jina.ai/" + url, { headers: { "User-Agent": BROWSER_UA, Accept: "text/html", "X-Return-Format": "html" }, signal: AbortSignal.timeout(25000) });
    if (res.ok) { const html = await res.text(); return { html, tier: 2, via: "jina" }; }
  } catch (_) {}
  return { html: "", tier: 0, error: "all tiers failed" };
}

function parseCourseIds(html) {
  const $ = cheerio.load(html);
  const ids = new Set();
  $("a[href*=\"id=\"]").each((_i, el) => {
    const href = $(el).attr("href") ?? "";
    const m = href.match(/[?&]id=([^&]+)/);
    if (m) ids.add(m[1]);
  });
  return Array.from(ids);
}
async function cmdSave(db, label, queryJson) {
  const payload = JSON.parse(queryJson);
  const now = new Date().toISOString();
  db.prepare("INSERT INTO watched_searches (label,query_type,query_payload,created_at,enabled) VALUES (?,?,?,?,1)")
    .run(label, "natural_language", queryJson, now);
  const watchId = Number(db.query("SELECT last_insert_rowid() as id").get().id);
  const registry = loadConfig("query-registry.yaml");
  const url = buildSearchUrl(payload.parsed ?? payload, registry);
  const { html } = await fetchHtml(url);
  const courseIds = html ? parseCourseIds(html) : [];
  const hash = snapshotHash(courseIds);
  db.prepare("INSERT INTO snapshots (watch_id,extracted_at,result_hash,result_count,result_course_ids) VALUES (?,?,?,?,?)")
    .run(watchId, now, hash, courseIds.length, JSON.stringify(courseIds));
  return { watch_id: watchId, label, course_count: courseIds.length, url };
}
async function cmdCheck(db) {
  const watches = db.query("SELECT * FROM watched_searches WHERE enabled=1 ORDER BY last_checked_at ASC NULLS FIRST").all();
  const registry = loadConfig("query-registry.yaml");
  const allChanges = [];
  for (const watch of watches) {
    const payload = JSON.parse(watch.query_payload);
    const url = buildSearchUrl(payload.parsed ?? payload, registry);
    const { html, tier, error } = await fetchHtml(url);
    const now = new Date().toISOString();
    // Fetch failure: empty html would make `removed` swallow every previously
    // seen id, producing false "disappeared" events and a corrupt empty snapshot.
    // Skip all writes for this watch and surface the failure instead.
    if (tier === 0 || !html) {
      db.prepare("UPDATE watched_searches SET last_checked_at=? WHERE watch_id=?").run(now, watch.watch_id);
      allChanges.push({ watch_id: watch.watch_id, label: watch.label, verification_failed: true, error: error ?? "fetch failed", new_courses: [], removed: [], current_count: 0 });
      continue;
    }
    const currentIds = parseCourseIds(html);
    const prevSnap = db.query("SELECT * FROM snapshots WHERE watch_id=? ORDER BY extracted_at DESC LIMIT 1").get(watch.watch_id);
    const prevIds = prevSnap ? JSON.parse(prevSnap.result_course_ids) : [];
    const prevSet = new Set(prevIds);
    const currSet = new Set(currentIds);
    const newCourses = currentIds.filter(id => !prevSet.has(id));
    const removed = prevIds.filter(id => !currSet.has(id));
    const hash = snapshotHash(currentIds);
    db.prepare("INSERT INTO snapshots (watch_id,extracted_at,result_hash,result_count,result_course_ids) VALUES (?,?,?,?,?)")
      .run(watch.watch_id, now, hash, currentIds.length, JSON.stringify(currentIds));
    for (const id of newCourses) {
      db.prepare("INSERT INTO course_events (course_id,event_type,new_value,detected_at,watch_id) VALUES (?,?,?,?,?)")
        .run(id, "new_course", JSON.stringify({ source_course_id: id }), now, watch.watch_id);
    }
    for (const id of removed) {
      db.prepare("INSERT INTO course_events (course_id,event_type,old_value,detected_at,watch_id) VALUES (?,?,?,?,?)")
        .run(id, "disappeared", JSON.stringify({ source_course_id: id }), now, watch.watch_id);
    }
    db.prepare("UPDATE watched_searches SET last_checked_at=? WHERE watch_id=?").run(now, watch.watch_id);
    allChanges.push({ watch_id: watch.watch_id, label: watch.label, new_courses: newCourses, removed, current_count: currentIds.length });
  }
  return allChanges;
}
if (import.meta.main) {
  const subcommand = Bun.argv[2];
  if (!subcommand || !["save","check","list","remove"].includes(subcommand)) {
    console.error("Usage: bun run scripts/watch.ts <save|check|list|remove> [options]");
    process.exit(1);
  }
  const { values } = parseArgs({
    args: Bun.argv.slice(3),
    options: { "db-path": { type: "string" }, "label": { type: "string" }, "query-json": { type: "string" }, "watch-id": { type: "string" } },
    strict: true,
  });
  const dbPath = expandTilde(values["db-path"] ?? DEFAULT_DB_PATH);
  if (!existsSync(dbPath)) { console.error("DB not found: " + dbPath + ". Run init-db.ts first."); process.exit(1); }
  const db = new Database(dbPath);
  if (subcommand === "save") {
    if (!values["label"] || !values["query-json"]) { console.error("save requires --label and --query-json"); process.exit(1); }
    const result = await cmdSave(db, values["label"], values["query-json"]);
    console.log(JSON.stringify(result, null, 2));
  } else if (subcommand === "check") {
    const changes = await cmdCheck(db);
    console.log(JSON.stringify(changes, null, 2));
  } else if (subcommand === "list") {
    const rows = db.query("SELECT watch_id,label,query_type,created_at,last_checked_at,enabled FROM watched_searches ORDER BY created_at DESC").all();
    console.log(JSON.stringify(rows, null, 2));
  } else if (subcommand === "remove") {
    if (!values["watch-id"]) { console.error("remove requires --watch-id"); process.exit(1); }
    db.prepare("DELETE FROM watched_searches WHERE watch_id=?").run(parseInt(values["watch-id"]));
    console.log(JSON.stringify({ removed: true, watch_id: values["watch-id"] }, null, 2));
  }
  db.close();
}