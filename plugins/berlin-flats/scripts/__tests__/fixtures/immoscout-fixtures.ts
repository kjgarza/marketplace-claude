// Real ImmoScout24 Schöneberg listings captured 2026-07-07 — eval fixtures for fit-score.
import type { Listing, PluginConfig } from "../../types.ts";

export const AD_MANSTEIN: Listing = {
  portal: "immoscout24",
  external_id: "167850948",
  url: "https://www.immobilienscout24.de/expose/167850948",
  title: "MODERNISIERTE 3-ZIMMER DACHGESCHOSSWOHNUNG IN SCHÖNEBERG",
  description:
    "Modernisiertes Apartment in der sechsten Etage, 83 qm, hochwertige Ausstattung. " +
    "Moderne Einbauküche vorhanden, Aufzug, Kellerraum, Balkon. Erstbezug nach Sanierung. " +
    "Haustiere nicht gestattet. Nebenkosten 385 €, Heizkosten enthalten.",
  cold_rent: 1394, warm_rent: 1779, sqm: 83, rooms: 3,
  district: "Schöneberg", posted_at: "2026-05-19",
};

export const AD_RUBENS: Listing = {
  portal: "immoscout24",
  external_id: "168988987",
  url: "https://www.immobilienscout24.de/expose/168988987",
  title: "2.01: Parkett, Fußbodenheizung, Aufzug, EBK",
  description:
    "Zweitbezug: Aufzug mittels Chip direkt in die Wohnung. Parkettboden und Fußbodenheizung. " +
    "Einbauküche, Bad mit ebenerdiger Dusche, französischer Balkon, bodentiefe Fenster, " +
    "Fahrradkeller. Baujahr 2023. Kaution 4470 €.",
  cold_rent: 1490, warm_rent: 1790, sqm: 75, rooms: 2,
  district: "Schöneberg", posted_at: "2026-07-01",
};

export const AD_NOLLENDORF: Listing = {
  portal: "immoscout24",
  external_id: "169077787",
  url: "https://www.immobilienscout24.de/expose/169077787",
  title: "Schöne Altbauwohnung zur Übernahme | Suche Nachmieter",
  description:
    "Altbau im 3. Obergeschoss, Balkon und Kellerraum. Nachmieter gesucht, Einzug zum 01.08.2026. " +
    "Übernahme der Trockenbauwand für 1.000 € und der Hochebene für 1.500 € vorausgesetzt. " +
    "Nebenkosten 200 €, Kaution 4.000 €.",
  cold_rent: 1400, warm_rent: 1600, sqm: 104, rooms: 2.5,
  district: "Schöneberg", posted_at: "2026-07-05",
};

export const TEST_CONFIG: PluginConfig = {
  profile: { name: "Test" },
  portals: { enabled: ["immoscout24"] },
  search: {
    districts: ["Schöneberg"],
    min_rooms: 2, max_rooms: 4, min_sqm: 100,
    max_warm_rent_eur: 2200, max_cold_rent_eur: 2000,
    keywords_required: ["Altbau"],
    deal_breakers: ["Tausch", "Souterrain"],
  },
};
