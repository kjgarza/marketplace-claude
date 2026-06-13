#!/usr/bin/env bun
import { basename } from "node:path";
import { existsSync, readFileSync } from "node:fs";

type HookInput = {
  tool_input?: {
    file_path?: string;
    path?: string;
    content?: string;
  };
};

const input = await Bun.stdin.text();
let data: HookInput;
try {
  data = JSON.parse(input) as HookInput;
} catch {
  process.exit(0);
}

const toolInput = data.tool_input ?? {};
const path = toolInput.file_path ?? toolInput.path ?? "";
const base = basename(path).toLowerCase();

let limits: [string, number, number] | undefined;
if (base.includes("bookclub-announce") || base.startsWith("announce")) {
  limits = ["announcement", 120, 220];
} else if (base.includes("bookclub-remind") || base.startsWith("remind")) {
  limits = ["reminder", 80, 115];
} else if (base.includes("bookclub-articles") || base.startsWith("articles")) {
  limits = ["articles roundup", 100, 145];
} else if (base.includes("bookclub-eve") || base.startsWith("eve")) {
  limits = ["eve", 120, 175];
}

if (!limits || base.endsWith(".json")) process.exit(0);

let content = toolInput.content ?? "";
if (!content && path && existsSync(path)) {
  // Read failures (permissions, transient FS) are unrelated to message
  // validity — stay fail-open (exit 0) rather than crashing and blocking the
  // pipeline.
  try {
    content = readFileSync(path, "utf8");
  } catch {
    process.exit(0);
  }
}
if (!content) process.exit(0);

const body = content
  .replace(/^---\n.*?\n---\n/s, "")
  .replace(/```.*?```/gs, "")
  .replace(/https?:\/\/\S+/g, "URL");

const words = body.match(/\S+/g) ?? [];
const count = words.length;
const [label, min, max] = limits;

if (count < min || count > max) {
  const direction = count < min ? "add" : "remove";
  process.stderr.write(
    `bookclub: ${label} message is ${count} words; hard limit is ${min}-${max}. ` +
      `Rewrite the message body in ${path} to fall within range (${direction} words). ` +
      "Count excludes frontmatter and code fences; URLs and :emoji: count as one word each.\n",
  );
  process.exit(2);
}
