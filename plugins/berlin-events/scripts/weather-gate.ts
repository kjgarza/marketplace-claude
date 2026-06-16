#!/usr/bin/env bun
// Fetch Berlin daily weather forecast from OpenMeteo and output gate flags.
// Usage:
//   bun run weather-gate.ts --date YYYY-MM-DD
//   bun run weather-gate.ts --from YYYY-MM-DD --to YYYY-MM-DD

const BERLIN = { lat: 52.52, lon: 13.41 };

// WMO weather interpretation codes
const RAIN_CODES = new Set([51, 53, 55, 61, 63, 65, 80, 81, 82, 95, 96, 99]);
const SNOW_CODES = new Set([71, 73, 75, 77, 85, 86]);

interface DailyGate {
  date: string;
  temp_max_c: number;
  temp_min_c: number;
  precipitation_mm: number;
  weathercode: number;
  is_rainy: boolean;
  is_snowy: boolean;
  gate_outdoor: boolean;
  gate_indoor: boolean;
  reason: string;
}

async function fetchGates(from: string, to: string): Promise<DailyGate[]> {
  const url =
    `https://api.open-meteo.com/v1/forecast` +
    `?latitude=${BERLIN.lat}&longitude=${BERLIN.lon}` +
    `&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,weathercode` +
    `&start_date=${from}&end_date=${to}` +
    `&timezone=Europe%2FBerlin`;

  const res = await fetch(url);
  if (!res.ok) {
    process.stderr.write(`OpenMeteo error: ${res.status} ${res.statusText}\n`);
    process.exit(1);
  }

  const data = (await res.json()) as {
    daily: {
      time: string[];
      temperature_2m_max: number[];
      temperature_2m_min: number[];
      precipitation_sum: number[];
      weathercode: number[];
    };
  };

  const { time, temperature_2m_max, temperature_2m_min, precipitation_sum, weathercode } =
    data.daily;

  return time.map((date, i) => {
    const temp_max_c = temperature_2m_max[i];
    const temp_min_c = temperature_2m_min[i];
    const precipitation_mm = precipitation_sum[i] ?? 0;
    const code = weathercode[i];

    const is_rainy = RAIN_CODES.has(code);
    const is_snowy = SNOW_CODES.has(code);

    // Temperature band settings
    const gate_indoor = temp_max_c > 27;
    const gate_outdoor = temp_min_c < 5 || is_rainy || is_snowy;

    const reasons: string[] = [];
    if (gate_indoor) reasons.push(`hot (${temp_max_c}°C > 27°C): indoor events filtered`);
    if (temp_min_c < 5) reasons.push(`cold (${temp_min_c}°C < 5°C): outdoor events filtered`);
    if (is_rainy) reasons.push(`rain expected: outdoor events filtered`);
    if (is_snowy) reasons.push(`snow expected: outdoor events filtered`);
    if (!gate_indoor && !gate_outdoor) reasons.push(`mild and dry: all events shown`);

    return {
      date,
      temp_max_c,
      temp_min_c,
      precipitation_mm,
      weathercode: code,
      is_rainy,
      is_snowy,
      gate_outdoor,
      gate_indoor,
      reason: reasons.join("; "),
    };
  });
}

function todayISO(): string {
  return new Date().toISOString().split("T")[0];
}

const args = process.argv.slice(2);
const get = (flag: string) => {
  const i = args.indexOf(flag);
  return i >= 0 ? args[i + 1] : undefined;
};

const dateArg = get("--date");
const fromArg = get("--from");
const toArg = get("--to");

let from: string;
let to: string;

if (dateArg) {
  from = to = dateArg;
} else if (fromArg && toArg) {
  from = fromArg;
  to = toArg;
} else {
  from = to = todayISO();
}

const gates = await fetchGates(from, to);
console.log(JSON.stringify(gates, null, 2));
