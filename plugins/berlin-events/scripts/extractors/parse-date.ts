export interface ParsedDate {
  date: string;
  time?: string;
}

const MONTHS: Record<string, number> = {
  jan: 1, januar: 1, january: 1,
  feb: 2, februar: 2, february: 2,
  mar: 3, mär: 3, märz: 3, march: 3,
  apr: 4, april: 4,
  mai: 5, may: 5,
  jun: 6, juni: 6, june: 6,
  jul: 7, juli: 7, july: 7,
  aug: 8, august: 8,
  sep: 9, sept: 9, september: 9,
  oct: 10, okt: 10, oktober: 10, october: 10,
  nov: 11, november: 11,
  dec: 12, dez: 12, dezember: 12, december: 12,
};

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function clampYear(y: number): number {
  if (y < 100) return 2000 + y;
  return y;
}

function extractTime(input: string): string | undefined {
  const m = input.match(/\b(\d{1,2}):(\d{2})(?:\s*Uhr)?\b/i);
  if (!m) return undefined;
  const hour = Number(m[1]);
  const min = Number(m[2]);
  if (hour > 23 || min > 59) return undefined;
  return `${pad(hour)}:${pad(min)}`;
}

export function parseGermanDate(input: string | null | undefined): ParsedDate | null {
  if (!input) return null;
  const time = extractTime(input);

  const iso = input.match(/\b(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}))?/);
  if (iso) {
    const date = `${iso[1]}-${iso[2]}-${iso[3]}`;
    const t = iso[4] && iso[5] ? `${iso[4]}:${iso[5]}` : time;
    return t ? { date, time: t } : { date };
  }

  const numeric = input.match(/\b(\d{1,2})\.(\d{1,2})\.(\d{2,4})\b/);
  if (numeric) {
    const day = Number(numeric[1]);
    const month = Number(numeric[2]);
    const year = clampYear(Number(numeric[3]));
    if (day >= 1 && day <= 31 && month >= 1 && month <= 12) {
      const date = `${year}-${pad(month)}-${pad(day)}`;
      return time ? { date, time } : { date };
    }
  }

  const namedDM = input.match(/\b(\d{1,2})\.?\s+([A-Za-zäöü]+)\.?\s+(\d{4})\b/);
  if (namedDM) {
    const day = Number(namedDM[1]);
    const month = MONTHS[namedDM[2].toLowerCase()];
    const year = Number(namedDM[3]);
    if (month && day >= 1 && day <= 31) {
      const date = `${year}-${pad(month)}-${pad(day)}`;
      return time ? { date, time } : { date };
    }
  }

  const namedMD = input.match(/\b([A-Za-zäöü]+)\s+(\d{1,2}),?\s+(\d{4})\b/);
  if (namedMD) {
    const month = MONTHS[namedMD[1].toLowerCase()];
    const day = Number(namedMD[2]);
    const year = Number(namedMD[3]);
    if (month && day >= 1 && day <= 31) {
      const date = `${year}-${pad(month)}-${pad(day)}`;
      return time ? { date, time } : { date };
    }
  }

  return null;
}
