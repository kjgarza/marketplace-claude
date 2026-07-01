import { getRecentRuns } from "./db.ts";
import { loadPortalProfile } from "./portal-profile.ts";
import type { RunRecord } from "./types.ts";

export type DriftType = "none" | "selector" | "field" | "access" | "blocked";

export interface DriftVerdict {
  portal: string;
  drift: DriftType;
  detail: string;
}

// One bad run is usually a transient rate limit, not real drift — require this
// many consecutive degraded runs before flagging structural drift or repairing.
const CONSECUTIVE_RUNS_FOR_DRIFT = 2;

// Proposal threshold: a field presence drop of more than 30 points below the
// portal profile's declared baseline indicates the extractor path broke.
const FIELD_DRIFT_THRESHOLD = 0.30;

export function classifyDrift(runs: RunRecord[]): DriftType {
  if (runs.length < CONSECUTIVE_RUNS_FOR_DRIFT) return "none";
  const recent = runs.slice(0, CONSECUTIVE_RUNS_FOR_DRIFT);

  if (recent.every((r) => r.tier === 0)) return "blocked";
  if (recent.every((r) => (r.tier ?? 0) >= 2)) return "access";
  if (recent.every((r) => r.http_ok === 1 && r.cards_found === 0)) return "selector";
  return "none";
}

export function checkFieldDrift(portal: string, run: RunRecord): DriftType {
  if (!run.field_presence) return "none";
  let profile;
  try {
    profile = loadPortalProfile(portal);
  } catch {
    return "none"; // no profile to compare against (e.g. a portal not yet recon'd)
  }
  const fields = profile.extraction?.detail?.fields;
  if (!fields) return "none";
  const observed = JSON.parse(run.field_presence) as Record<string, number>;
  for (const [field, spec] of Object.entries(fields)) {
    const baseline = spec.presence_rate;
    const actual = observed[field];
    if (baseline != null && actual != null && baseline - actual > FIELD_DRIFT_THRESHOLD) {
      return "field";
    }
  }
  return "none";
}

export function evaluatePortalHealth(portal: string): DriftVerdict {
  const runs = getRecentRuns(portal, 5);
  const structural = classifyDrift(runs);
  if (structural !== "none") {
    return { portal, drift: structural, detail: `last ${Math.min(runs.length, CONSECUTIVE_RUNS_FOR_DRIFT)} runs` };
  }
  const latest = runs[0];
  if (latest) {
    const field = checkFieldDrift(portal, latest);
    if (field !== "none") return { portal, drift: field, detail: "field presence below baseline" };
  }
  return { portal, drift: "none", detail: runs.length === 0 ? "no run history yet" : "ok" };
}
