import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { parse } from "yaml";

const __dir = dirname(fileURLToPath(import.meta.url));
const PORTALS_DIR = join(__dir, "../portals");

export interface PortalFieldSpec {
  path?: string;
  format?: string;
  required?: boolean;
  presence_rate?: number;
}

export interface PortalProfile {
  portal: string;
  extraction: {
    detail?: {
      fields?: Record<string, PortalFieldSpec>;
      expected_field_count?: number;
    };
  };
}

export function loadPortalProfile(portal: string): PortalProfile {
  const path = join(PORTALS_DIR, `${portal}.yaml`);
  const raw = readFileSync(path, "utf8");
  return parse(raw) as PortalProfile;
}
