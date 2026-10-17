// mietspiegel.ts — Berlin 2024 Mietspiegel approximate medians (cold €/sqm) by district.
// Single source of truth shared by scam-score.ts (under-price fraud signal) and
// fit-score.ts (over-price value signal).
import type { Listing } from "./types.ts";

export const MIETSPIEGEL: Record<string, number> = {
  'Mitte': 15.5,
  'Prenzlauer Berg': 14.8,
  'Friedrichshain': 14.2,
  'Kreuzberg': 13.9,
  'Neukölln': 11.8,
  'Charlottenburg': 14.0,
  'Schöneberg': 13.5,
  'Tempelhof': 11.2,
  'default': 13.0,
};

export function findDistrict(districtStr?: string | null): string {
  if (!districtStr) return 'default';
  for (const key of Object.keys(MIETSPIEGEL)) {
    if (key === 'default') continue;
    if (districtStr.toLowerCase().includes(key.toLowerCase())) return key;
  }
  return 'default';
}

export interface MietspiegelDelta {
  district: string;
  medianPerSqm: number;
  actualPerSqm: number;
  /** Percent above (+) or below (−) the district median, rounded. */
  deltaPct: number;
}

export function mietspiegelDelta(
  listing: Pick<Listing, 'cold_rent' | 'sqm' | 'district'>
): MietspiegelDelta | null {
  // sqm > 10 guard mirrors scam-score.ts: tiny/erroneous sqm produces absurd €/m².
  if (!listing.cold_rent || !listing.sqm || listing.sqm <= 10) return null;
  const district = findDistrict(listing.district);
  const medianPerSqm = MIETSPIEGEL[district];
  const actualPerSqm = listing.cold_rent / listing.sqm;
  return {
    district,
    medianPerSqm,
    actualPerSqm: Math.round(actualPerSqm * 100) / 100,
    deltaPct: Math.round((actualPerSqm / medianPerSqm - 1) * 100),
  };
}
