#!/usr/bin/env bun
// Fetch Berlin daily weather forecast from OpenMeteo and output gate flags.
// Usage:
//   bun run scripts/weather-gate.ts --date YYYY-MM-DD
//   bun run scripts/weather-gate.ts --from YYYY-MM-DD --to YYYY-MM-DD

const BERLIN = { lat: 52.52, lon: 13.41 };

// WMO weather interpretation codes — full ranges per spec (51–65, 80–82, 95–99 / 71–77, 85–86)
const RAIN_CODES = new Set([51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 80, 81, 82, 95, 96, 97, 98, 99]);
const SNOW_CODES = new Set([71, 72, 73, 74, 75, 76, 77, 85, 86]);

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

  let res: Response;
  try {
    res = await fetch(url);
  } catch (err) {
    process.stderr.write(`OpenMeteo fetch error: ${err instanceof Error ? err.message : err}\n`);
    process.exit(1);
  }
  if (!res.ok) {
    process.stderr.write(`OpenMeteo error: ${res.status} ${res.statusText}\n`);
    process.exit(1);
  }

  let data: {
    daily: {
      time: string[];
      temperature_2m_max: number[];
      temperature_2m_min: number[];
      precipitation_sum: number[];
      weathercode: number[];
    };
  };
  try {
    data = (await res.json()) as typeof data;
  } catch (err) {
    process.stderr.write(`OpenMeteo parse error: ${err instanceof Error ? err.message : err}\n`);
    process.exit(1);
  }

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
  return new Date().toLocaleDateString("en-CA", { timeZone: "Europe/Berlin" });
}

const ISO_RE = /^\d{4}-\d{2}-\d{2}$/;

const args = process.argv.slice(2);
const get = (flag: string): string | undefined => {
  const i = args.indexOf(flag);
  if (i < 0) return undefined;
  const val = args[i + 1];
  return val && !val.startsWith("--") ? val : undefined;
};

const dateArg = get("--date");
const fromArg = get("--from");
const toArg = get("--to");

function requireDate(name: string, val: string | undefined): string {
  if (!val || !ISO_RE.test(val)) {
    process.stderr.write(`Usage: bun run scripts/weather-gate.ts [--date YYYY-MM-DD | --from YYYY-MM-DD --to YYYY-MM-DD]\n`);
    if (val) process.stderr.write(`  Invalid date for ${name}: ${val}\n`);
    else process.stderr.write(`  Missing value for ${name}\n`);
    process.exit(1);
  }
  return val;
}

let from: string;
let to: string;

if (args.includes("--date")) {
  from = to = requireDate("--date", dateArg);
} else if (args.includes("--from") || args.includes("--to")) {
  from = requireDate("--from", fromArg);
  to = requireDate("--to", toArg);
} else {
  from = to = todayISO();
}

const gates = await fetchGates(from, to);
console.log(JSON.stringify(gates, null, 2));
