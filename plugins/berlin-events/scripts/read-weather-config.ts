#!/usr/bin/env bun
// Extract the `weather:` block from .claude/berlin-events.local.md and print JSON.
// Usage: bun run read-weather-config.ts [path/to/.claude/berlin-events.local.md]
// Exits 0 with JSON on success; exits 1 with nothing on stdout if block is absent or file missing.

const filePath = process.argv[2] ?? ".claude/berlin-events.local.md";

let text: string;
try {
  text = await Bun.file(filePath).text();
} catch {
  process.exit(1);
}

// Extract YAML frontmatter between first pair of --- delimiters
const fmMatch = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
if (!fmMatch) process.exit(1);

const fm = fmMatch[1];

// Find the weather: block — collect all indented lines that follow it
const lines = fm.split(/\r?\n/);
const weatherIdx = lines.findIndex(l => /^weather:\s*$/.test(l));
if (weatherIdx < 0) process.exit(1);

// Collect the indented sub-lines of the weather block
const weatherLines: string[] = [];
for (let i = weatherIdx + 1; i < lines.length; i++) {
  const line = lines[i];
  // Stop when we hit a top-level key (no leading whitespace) or end of input
  if (line.length > 0 && !/^\s/.test(line)) break;
  weatherLines.push(line);
}

// Detect the actual indentation of the first non-empty, non-comment line in a list
function detectIndent(lineList: string[]): number {
  for (const line of lineList) {
    const stripped = line.trimStart();
    if (!stripped || stripped.startsWith("#")) continue;
    return line.length - stripped.length;
  }
  return 2; // fallback
}

// Parse simple key: value pairs (handles arbitrary indentation, inline comments)
function parseBlock(lineList: string[], baseIndent: number): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  let i = 0;
  while (i < lineList.length) {
    const raw = lineList[i];
    const stripped = raw.trimStart();
    if (!stripped || stripped.startsWith("#")) { i++; continue; }

    const indent = raw.length - stripped.length;
    if (indent < baseIndent) break;
    if (indent > baseIndent) { i++; continue; } // orphan indented line — skip

    const colonIdx = stripped.indexOf(":");
    if (colonIdx < 0) { i++; continue; }

    const key = stripped.slice(0, colonIdx).trim();
    const rest = stripped.slice(colonIdx + 1).replace(/#.*$/, "").trim(); // strip inline comments

    if (rest === "") {
      // Nested block — gather sub-lines and detect their indentation
      const subLines: string[] = [];
      i++;
      while (i < lineList.length) {
        const subRaw = lineList[i];
        const subStripped = subRaw.trimStart();
        const subActualIndent = subRaw.length - subStripped.length;
        if (subStripped && subActualIndent <= baseIndent) break;
        subLines.push(subRaw);
        i++;
      }
      const subIndent = detectIndent(subLines);
      result[key] = parseBlock(subLines, subIndent);
      continue;
    }

    // Scalar value
    let value: unknown = rest.replace(/^['"]|['"]$/g, ""); // strip optional quotes
    if (value === "true") value = true;
    else if (value === "false") value = false;
    else if (!isNaN(Number(value)) && String(value).trim() !== "") value = Number(value);

    result[key] = value;
    i++;
  }
  return result;
}

const baseIndent = detectIndent(weatherLines);
const weatherCfg = parseBlock(weatherLines, baseIndent);

if (Object.keys(weatherCfg).length === 0) process.exit(1);

console.log(JSON.stringify(weatherCfg));
