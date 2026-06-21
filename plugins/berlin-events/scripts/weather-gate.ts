#!/usr/bin/env bun
// Fetch Berlin daily weather forecast from OpenMeteo and output weather scoring per day.
// Usage (invoked via $PLUGIN_ROOT from the find-events skill):
//   bun run "$PLUGIN_ROOT/scripts/weather-gate.ts" --date YYYY-MM-DD
//   bun run "$PLUGIN_ROOT/scripts/weather-gate.ts" --from YYYY-MM-DD --to YYYY-MM-DD
//   bun run "$PLUGIN_ROOT/scripts/weather-gate.ts" --from YYYY-MM-DD --to YYYY-MM-DD --config '{"mode":"filter",...}'

const BERLIN = { lat: 52.52, lon: 13.41 };

// WMO weather interpretation codes — full ranges per spec
const RAIN_CODES = new Set([51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 80, 81, 82, 95, 96, 97, 98, 99]);
const SNOW_CODES = new Set([71, 72, 73, 74, 75, 76, 77, 85, 86]);

interface WeatherConfig {
  mode: "score" | "filter";
  warm_from_c: number;
  hot_from_c: number;
  cold_outdoor_below_c: number;
  precipitation_penalises_outdoor: boolean;  // covers both rain and snow
  suggest_water_from_c: number;
  weights: {
    outdoor_warm_bonus: number;
    outdoor_daytime_heat_penalty: number;
    indoor_heat_bonus: number;
    outdoor_precipitation_penalty: number;  // rain or snow — both treated as incompatible with outdoor
    outdoor_cold_penalty: number;           // cold but dry weather only
  };
}

const DEFAULT_CONFIG: WeatherConfig = {
  mode: "score",
  warm_from_c: 20,
  hot_from_c: 30,
  cold_outdoor_below_c: 8,
  precipitation_penalises_outdoor: true,
  suggest_water_from_c: 30,
  weights: {
    outdoor_warm_bonus: 2.0,
    outdoor_daytime_heat_penalty: -2.0,
    indoor_heat_bonus: 1.0,
    outdoor_precipitation_penalty: -3.0,
    outdoor_cold_penalty: -2.0,
  },
};

interface DailyWeather {
  date: string;
  temp_max_c: number;
  temp_min_c: number;
  precipitation_mm: number;
  weathercode: number;
  is_rainy: boolean;
  is_snowy: boolean;
  mode: "score" | "filter";
  scores: {
    outdoor_delta: number;
    indoor_delta: number;
  };
  drop_outdoor: boolean;
  drop_indoor: boolean;
  suggest_lake: boolean;
  note: string;
}

function scoreDay(
  temp_max_c: number,
  temp_min_c: number,
  is_rainy: boolean,
  is_snowy: boolean,
  cfg: WeatherConfig,
): { outdoor_delta: number; indoor_delta: number; drop_outdoor: boolean; drop_indoor: boolean; suggest_lake: boolean; note: string } {
  const w = cfg.weights;
  let outdoor_delta = 0;
  let indoor_delta = 0;
  const notes: string[] = [];

  const is_hot = temp_max_c >= cfg.hot_from_c;
  const is_warm = temp_max_c >= cfg.warm_from_c && !is_hot;
  const is_cold = temp_min_c < cfg.cold_outdoor_below_c;
  const is_precipitation = is_rainy || is_snowy;

  if (is_warm) {
    outdoor_delta += w.outdoor_warm_bonus;
    notes.push(`warm day (${temp_max_c}°C) — great for outdoor events, especially evenings`);
  }

  if (is_hot) {
    // Penalise daytime outdoor; indoor is the comfortable option; lake is an alternative
    outdoor_delta += w.outdoor_daytime_heat_penalty;
    indoor_delta += w.indoor_heat_bonus;
    notes.push(`hot day (${temp_max_c}°C) — favour indoor/AC venues; evening outdoor still good`);
  }

  if (is_cold) {
    outdoor_delta += w.outdoor_cold_penalty;
    notes.push(`cold (min ${temp_min_c}°C) — outdoor events penalised`);
  }

  if (is_precipitation && cfg.precipitation_penalises_outdoor) {
    outdoor_delta += w.outdoor_precipitation_penalty;  // same weight for rain and snow
    // Note says "hard-dropped" because drop_outdoor=true removes outdoor events entirely
    notes.push(is_rainy ? "rain expected — outdoor events hard-dropped" : "snow expected — outdoor events hard-dropped");
  }

  // Hard drop: only when precipitation makes outdoor genuinely incompatible
  const drop_outdoor = is_precipitation && cfg.precipitation_penalises_outdoor;
  const drop_indoor = false; // indoor events are never hard-dropped by weather

  const suggest_lake = temp_max_c >= cfg.suggest_water_from_c && !is_precipitation;
  if (suggest_lake) {
    notes.push("very hot — consider a lake / Strandbad as an alternative");
  }

  if (notes.length === 0) {
    notes.push(`mild and dry (${temp_max_c}°C) — all events shown`);
  }

  return { outdoor_delta, indoor_delta, drop_outdoor, drop_indoor, suggest_lake, note: notes.join("; ") };
}

function legacyFilterDay(
  temp_max_c: number,
  temp_min_c: number,
  is_rainy: boolean,
  is_snowy: boolean,
  cfg: WeatherConfig,
): { drop_outdoor: boolean; drop_indoor: boolean; note: string } {
  // Fixed legacy filter mode: hot day penalises OUTDOOR (sun-exposed daytime), not indoor.
  // The original bug was gate_indoor=true on hot days, which dropped indoor AC venues — inverted.
  // Uses cfg.hot_from_c and cfg.cold_outdoor_below_c so filter mode respects user config.
  const too_hot = temp_max_c > cfg.hot_from_c;
  const too_cold = temp_min_c < cfg.cold_outdoor_below_c;
  const precipitation = is_rainy || is_snowy;

  const drop_outdoor = too_cold || precipitation || too_hot;
  const drop_indoor = false;

  const notes: string[] = [];
  if (too_hot) notes.push(`hot (${temp_max_c}°C > ${cfg.hot_from_c}°C): outdoor sun-exposed events filtered`);
  if (too_cold) notes.push(`cold (${temp_min_c}°C < ${cfg.cold_outdoor_below_c}°C): outdoor events filtered`);
  if (is_rainy) notes.push("rain expected: outdoor events filtered");
  if (is_snowy) notes.push("snow expected: outdoor events filtered");
  if (!drop_outdoor && !drop_indoor) notes.push("mild and dry: all events shown");

  return { drop_outdoor, drop_indoor, note: notes.join("; ") };
}

async function fetchWeather(from: string, to: string, cfg: WeatherConfig): Promise<DailyWeather[]> {
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
    process.stderr.write(`OpenMeteo fetch error: ${err instanceof Error ? err.message : err} — skipping weather gate\n`);
    return [];
  }
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    process.stderr.write(`OpenMeteo error: ${res.status} ${res.statusText}${body ? ` — ${body}` : ""} — skipping weather gate\n`);
    return [];
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
    process.stderr.write(`OpenMeteo parse error: ${err instanceof Error ? err.message : err} — skipping weather gate\n`);
    return [];
  }

  const { time, temperature_2m_max, temperature_2m_min, precipitation_sum, weathercode } = data.daily;

  return time.map((date, i) => {
    const temp_max_c = temperature_2m_max[i];
    const temp_min_c = temperature_2m_min[i];
    const precipitation_mm = precipitation_sum[i] ?? 0;
    const code = weathercode[i];
    const is_rainy = RAIN_CODES.has(code);
    const is_snowy = SNOW_CODES.has(code);

    if (cfg.mode === "filter") {
      const { drop_outdoor, drop_indoor, note } = legacyFilterDay(temp_max_c, temp_min_c, is_rainy, is_snowy, cfg);
      return {
        date, temp_max_c, temp_min_c, precipitation_mm, weathercode: code,
        is_rainy, is_snowy, mode: "filter" as const,
        scores: { outdoor_delta: 0, indoor_delta: 0 },
        drop_outdoor, drop_indoor, suggest_lake: false, note,
      };
    }

    const { outdoor_delta, indoor_delta, drop_outdoor, drop_indoor, suggest_lake, note } =
      scoreDay(temp_max_c, temp_min_c, is_rainy, is_snowy, cfg);

    return {
      date, temp_max_c, temp_min_c, precipitation_mm, weathercode: code,
      is_rainy, is_snowy, mode: "score" as const,
      scores: { outdoor_delta, indoor_delta },
      drop_outdoor, drop_indoor, suggest_lake, note,
    };
  });
}

function todayISO(): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Berlin",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const get = (type: string) => parts.find(p => p.type === type)!.value;
  return `${get("year")}-${get("month")}-${get("day")}`;
}

const ISO_RE = /^\d{4}-\d{2}-\d{2}$/;

const args = process.argv.slice(2);
const getArg = (flag: string): string | undefined => {
  const i = args.indexOf(flag);
  if (i < 0) return undefined;
  const val = args[i + 1];
  return val && !val.startsWith("--") ? val : undefined;
};

const dateArg = getArg("--date");
const fromArg = getArg("--from");
const toArg = getArg("--to");
const configArg = getArg("--config");
const configFileArg = getArg("--config-file");

function requireDate(name: string, val: string | undefined): string {
  if (!val || !ISO_RE.test(val)) {
    process.stderr.write(
      `Usage: bun run ${process.argv[1] ?? "weather-gate.ts"} ` +
      `[--date YYYY-MM-DD | --from YYYY-MM-DD --to YYYY-MM-DD] ` +
      `[--config '{...}' | --config-file path/to/settings.json]\n`,
    );
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

function mergeConfig(partial: Partial<WeatherConfig>): WeatherConfig {
  return {
    ...DEFAULT_CONFIG,
    ...partial,
    weights: { ...DEFAULT_CONFIG.weights, ...(partial.weights ?? {}) },
  };
}

let cfg: WeatherConfig = DEFAULT_CONFIG;
if (configFileArg) {
  // --config-file reads pre-extracted JSON (e.g. from read-weather-config.ts)
  try {
    const text = await Bun.file(configFileArg).text();
    const partial = JSON.parse(text) as Partial<WeatherConfig>;
    cfg = mergeConfig(partial);
  } catch (err) {
    process.stderr.write(`Cannot read --config-file ${configFileArg}: ${err instanceof Error ? err.message : err}\n`);
    process.exit(1);
  }
} else if (configArg) {
  try {
    const partial = JSON.parse(configArg) as Partial<WeatherConfig>;
    cfg = mergeConfig(partial);
  } catch {
    process.stderr.write(`Invalid --config JSON — must be a JSON object. Got: ${configArg}\n`);
    process.exit(1);
  }
}

const weather = await fetchWeather(from, to, cfg);
console.log(JSON.stringify(weather, null, 2));
