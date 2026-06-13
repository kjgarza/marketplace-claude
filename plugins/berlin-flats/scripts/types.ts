export type Portal = "kleinanzeigen" | "immoscout24" | string;

export interface SearchCriteria {
  districts?: string[];
  max_warm_rent_eur: number;
  max_cold_rent_eur?: number;
  min_rooms: number;
  max_rooms?: number;
  min_sqm: number;
  keywords_required?: string[];
  deal_breakers?: string[];
}

export interface PluginConfig {
  profile: {
    name: string;
    [key: string]: unknown;
  };
  portals: {
    enabled: string[];
  };
  search: SearchCriteria;
  scam_detection?: {
    threshold_review?: number;
    [key: string]: unknown;
  };
}

export interface Listing {
  id?: number;
  portal: string;
  external_id?: string;
  url: string;
  title?: string | null;
  description?: string | null;
  cold_rent?: number | null;
  warm_rent?: number | null;
  sqm?: number | null;
  rooms?: number | null;
  district?: string | null;
  posted_at?: string | null;
  fetched_at?: string | null;
  scam_score?: number | null;
  verdict?: string;
  raw_json?: string | null;
  reject_reason?: string | null;
  image_urls?: string[];
}

export interface ScamReason {
  code: string;
  weight: number;
  detail?: string;
}

export interface ScamResult {
  score: number;
  verdict: "ok" | "review" | "block";
  reasons: ScamReason[];
}

export interface ScrapeResult {
  html: string;
  tier: number;
  url: string;
  via?: string;
  error?: string;
}
