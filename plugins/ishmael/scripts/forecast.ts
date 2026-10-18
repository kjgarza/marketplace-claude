#!/usr/bin/env bun
// Open-meteo weather wrapper for Ishmael.
// Usage: bun run forecast.ts "<City>" <start-YYYY-MM-DD> <end-YYYY-MM-DD>

export interface DayRaw { t_max: number; t_min: number; precip_prob_max: number }
export interface Gear { umbrella: boolean; fan: boolean; cap_sunglasses: boolean; layers: boolean }

export function deriveGear(d: DayRaw): Gear {
  const umbrella = d.precip_prob_max >= 40;
  const fan = d.t_max >= 30;
  const cap_sunglasses = d.precip_prob_max < 40 && d.t_max >= 22;
  const layers = d.t_max - d.t_min >= 12 && d.t_min < 15;
  return { umbrella, fan, cap_sunglasses, layers };
}

async function geocode(city: string): Promise<{ latitude: number; longitude: number; name: string }> {
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`;
  const r = await fetch(url);
  if (!r.ok) throw new Error(`geocode HTTP ${r.status}`);
  const j = await r.json() as any;
  if (!j.results?.length) throw new Error(`no geocode match for "${city}"`);
  const g = j.results[0];
  return { latitude: g.latitude, longitude: g.longitude, name: g.name };
}

async function main() {
  const [city, start, end] = process.argv.slice(2);
  if (!city || !start || !end) {
    console.error('Usage: bun run forecast.ts "<City>" <start-YYYY-MM-DD> <end-YYYY-MM-DD>');
    process.exit(2);
  }
  const g = await geocode(city);
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${g.latitude}&longitude=${g.longitude}`
    + `&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max`
    + `&timezone=auto&start_date=${start}&end_date=${end}`;
  const r = await fetch(url);
  if (!r.ok) throw new Error(`forecast HTTP ${r.status}`);
  const j = await r.json() as any;
  const d = j.daily;
  const days = (d?.time ?? []).map((date: string, i: number) => {
    const raw: DayRaw = {
      t_max: d.temperature_2m_max[i],
      t_min: d.temperature_2m_min[i],
      precip_prob_max: d.precipitation_probability_max?.[i] ?? 0,
    };
    return { date, ...raw, gear: deriveGear(raw) };
  });
  console.log(JSON.stringify({ city: g.name, latitude: g.latitude, longitude: g.longitude, days }, null, 2));
}

if (import.meta.main) main().catch((e) => { console.error(String(e)); process.exit(1); });
