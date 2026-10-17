#!/usr/bin/env bun
// dossier.ts — Bewerbungsmappe (application dossier) readiness report.
// Reads [documents] from config/config.toml and checks each expected document
// for presence and freshness. Prints a JSON report.
//
// Usage: bun scripts/dossier.ts
import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { loadConfig } from "./config.ts";

export interface DocumentEntry { path?: string; issued?: string }
export type DocumentsConfig = Record<string, DocumentEntry>;

export interface DossierItem {
  key: string;
  label: string;
  required: boolean;
  status: "ok" | "missing" | "file_not_found" | "stale";
  detail: string;
}

export interface DossierReport { ready: boolean; items: DossierItem[] }

// Freshness rules reflect what Berlin landlords/Hausverwaltungen expect:
// SCHUFA no older than 3 months (90d); payslips are "the last three" so the newest
// should be ≤ ~3 months old (100d gives one pay-cycle slack); a
// Mietschuldenfreiheitsbescheinigung is customarily accepted up to 6 months (180d).
const DOC_RULES: Record<string, { label: string; required: boolean; max_age_days?: number }> = {
  schufa: { label: "SCHUFA-BonitätsAuskunft", required: true, max_age_days: 90 },
  payslips: { label: "Last 3 payslips", required: true, max_age_days: 100 },
  id: { label: "ID / passport copy", required: true },
  selbstauskunft: { label: "Filled Mieterselbstauskunft", required: true },
  employer_letter: { label: "Employer confirmation (unbefristet)", required: false },
  mietschuldenfreiheit: { label: "Mietschuldenfreiheitsbescheinigung", required: false, max_age_days: 180 },
};

function expandHome(p: string): string {
  return p.startsWith("~/") ? p.replace("~", homedir()) : p;
}

export function checkDossier(
  documents: DocumentsConfig | undefined,
  opts: { exists: (path: string) => boolean; now: Date }
): DossierReport {
  const items: DossierItem[] = [];
  for (const [key, rule] of Object.entries(DOC_RULES)) {
    const entry = documents?.[key];
    if (!entry?.path) {
      items.push({ key, ...rule, status: "missing", detail: `no [documents.${key}] entry in config.toml` });
      continue;
    }
    if (!opts.exists(expandHome(entry.path))) {
      items.push({ key, ...rule, status: "file_not_found", detail: `${entry.path} does not exist` });
      continue;
    }
    if (rule.max_age_days && entry.issued) {
      const ageDays = (opts.now.getTime() - new Date(entry.issued).getTime()) / 86_400_000;
      if (isNaN(ageDays) || ageDays > rule.max_age_days) {
        items.push({
          key, ...rule, status: "stale",
          detail: `issued ${entry.issued}, older than the ${rule.max_age_days}-day freshness window — renew`,
        });
        continue;
      }
    }
    items.push({ key, ...rule, status: "ok", detail: entry.path });
  }
  const ready = items.filter((i) => i.required).every((i) => i.status === "ok");
  return { ready, items };
}

if (import.meta.main) {
  const config = loadConfig() as { documents?: DocumentsConfig };
  const report = checkDossier(config.documents, { exists: existsSync, now: new Date() });
  process.stdout.write(JSON.stringify(report, null, 2) + "\n");
}
