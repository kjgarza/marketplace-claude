#!/usr/bin/env bun
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
async function fetchDirect(url) {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": BROWSER_UA, "Accept-Language": "de-DE,de;q=0.9,en;q=0.8", Accept: "text/html,application/xhtml+xml,*/*;q=0.8" },
      redirect: "follow", signal: AbortSignal.timeout(15000),
    });
    if (res.ok) { const html = await res.text(); if (html.length > 500) return html; }
  } catch (_) {}
  return null;
}
// Best-effort fallback through the Jina reader proxy. A raw fetch of the VHS course
// list often yields 0 course links; Jina sometimes returns a more complete render.
// It is not a guaranteed JS-rendering engine — see PLUGIN.md for known limitations.
async function fetchJina(url) {
  try {
    const res = await fetch("https://r.jina.ai/" + url, {
      headers: { "User-Agent": BROWSER_UA, Accept: "text/html,text/plain", "X-Return-Format": "html" },
      signal: AbortSignal.timeout(25000),
    });
    if (res.ok) return await res.text();
  } catch (_) {}
  return null;
}
async function fetchHtml(url) {
  const direct = await fetchDirect(url);
  if (direct) return { html: direct, tier: 1 };
  const jina = await fetchJina(url);
  if (jina) return { html: jina, tier: 2, via: "jina" };
  return { html: "", tier: 0, error: "all tiers failed" };
}

function detectLevel(title) { const m = title.match(/\b(A1|A2|B1|B2|C1|C2)\b/); return m ? m[1] : null; }
function rawHash(data) { return createHash("sha256").update(JSON.stringify(data)).digest("hex"); }
function parseCourseList(html, sourceUrl) {
  const $ = cheerio.load(html);
  const now = new Date().toISOString();
  const courses = [];
  const containerSelectors = [".course-list .course-item",".ergebnisliste .kurs-eintrag","tr.course-row",".result-item"];
  let items = null;
  for (const sel of containerSelectors) { const found = $(sel); if (found.length > 0) { items = found; break; } }
  if (!items || items.length === 0) {
    $("a[href*=\"id=\"]").each((_i, el) => {
      const href = $(el).attr("href") ?? "";
      const idMatch = href.match(/[?&]id=([^&]+)/);
      if (!idMatch) return;
      const courseId = idMatch[1]; const title = $(el).text().trim() || courseId;
      const fullHref = href.startsWith("http") ? href : "https://vhsit.berlin.de" + href;
      courses.push({ source_url: fullHref, source_course_id: courseId, title, district: null, location: null, category: null,
        level: detectLevel(title), start_date: null, end_date: null, schedule_text: null, price_text: null,
        booking_status: null, special_rules: null, extracted_at: now, raw_hash: rawHash({ courseId, title }) });
    });
    return courses;
  }
  items.each((_i, el) => {
    const $el = $(el); let title = "";
    for (const s of ["h3","h2",".kurs-titel",".course-title","td.titel","a"]) {
      const t = $el.find(s).first().text().trim(); if (t) { title = t; break; }
    }
    if (!title) return;
    const linkEl = $el.find("a[href*=\"id=\"]").first();
    const href = linkEl.attr("href") ?? "";
    const idMatch = href.match(/[?&]id=([^&]+)/);
    if (!idMatch) return; // no real course id — skip rather than fabricate `course-<index>`
    const courseId = idMatch[1];
    const fullHref = href.startsWith("http") ? href : href ? "https://vhsit.berlin.de" + href : sourceUrl;
    const district = $el.find(".bezirk,.district,td.bezirk").first().text().trim() || null;
    const location = $el.find(".lehrstaette,.location,td.lehrstaette").first().text().trim() || null;
    const datesText = $el.find(".termin,.dates,td.termin,.kurs-termin").first().text().trim() || null;
    const priceRaw = $el.find(".preis,.price,td.preis,.kurs-preis").first().text().trim() || null;
    const statusRaw = $el.find(".status,.anmeldestatus,td.status,.buchungsstatus").first().text().trim() || null;
    const data = { courseId, title, district, location, datesText, priceRaw, statusRaw };
    courses.push({ source_url: fullHref, source_course_id: courseId, title, district, location, category: null,
      level: detectLevel(title), start_date: null, end_date: null, schedule_text: datesText,
      price_text: priceRaw, booking_status: statusRaw, special_rules: null, extracted_at: now, raw_hash: rawHash(data) });
  });
  return courses;
}
function upsertCourses(db, courses) {
  const stmt = db.prepare(
    "INSERT OR IGNORE INTO courses (source_url,source_course_id,title,district,location," +
    "category,level,start_date,end_date,schedule_text,price_text,booking_status," +
    "special_rules,extracted_at,raw_hash) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)"
  );
  for (const c of courses) {
    stmt.run(c.source_url,c.source_course_id,c.title,c.district,c.location,
      c.category,c.level,c.start_date,c.end_date,c.schedule_text,
      c.price_text,c.booking_status,c.special_rules,c.extracted_at,c.raw_hash);
  }
}
if (import.meta.main) {
  const { values } = parseArgs({
    args: Bun.argv.slice(2),
    options: { "query-json": { type: "string" }, "db-path": { type: "string" }, "limit": { type: "string" } },
    strict: true,
  });
  if (!values["query-json"]) {
    console.error("Usage: bun run scripts/search.ts --query-json '{}' [--db-path <path>] [--limit N]");
    process.exit(1);
  }
  const params = JSON.parse(values["query-json"]);
  const dbPath = expandTilde(values["db-path"] ?? DEFAULT_DB_PATH);
  const limit = values["limit"] ? parseInt(values["limit"]) : 50;
  const registry = loadConfig("query-registry.yaml");
  const url = buildSearchUrl(params, registry);
  let { html, tier, via, error } = await fetchHtml(url);
  if (!html) {
    console.log(JSON.stringify({ courses: [], url, tier, verification: { ok: false, reason: error ?? "empty response" } }, null, 2));
    process.exit(0);
  }
  let courses = parseCourseList(html, url).slice(0, limit);
  // A direct fetch of the VHS course list often returns HTML with 0 course links.
  // If tier-1 parsed nothing, retry through the Jina reader proxy (best-effort, not a
  // guaranteed JS renderer) and re-parse.
  if (courses.length === 0 && tier === 1) {
    const jina = await fetchJina(url);
    if (jina) {
      const jinaCourses = parseCourseList(jina, url).slice(0, limit);
      if (jinaCourses.length > 0) { courses = jinaCourses; html = jina; tier = 2; via = "jina-rerender"; }
    }
  }
  const verification = courses.length === 0
    ? { ok: false, reason: "HTML received (" + html.length + " bytes) but 0 courses parsed — selectors may need updating or page requires JS rendering" }
    : { ok: true };
  if (existsSync(dbPath)) {
    try { const db = new Database(dbPath); upsertCourses(db, courses); db.close(); } catch (_) {}
  }
  console.log(JSON.stringify({ courses, url, tier, via, verification }, null, 2));
}