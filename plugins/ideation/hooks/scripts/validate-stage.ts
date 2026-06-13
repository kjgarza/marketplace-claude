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
const stageFiles = new Set(["problem_space.md", "solutions.md", "reviewed_solutions.md", "ui_concepts.md"]);
if (!stageFiles.has(base)) process.exit(0);

let content = toolInput.content ?? "";
if (!content && path && existsSync(path)) {
  // Read failures (permissions, transient FS) are unrelated to stage-file
  // validity — stay fail-open (exit 0) like the JSON-parse guard above rather
  // than crashing and blocking the pipeline.
  try {
    content = readFileSync(path, "utf8");
  } catch {
    process.exit(0);
  }
}
if (!content) process.exit(0);

const problems: string[] = [];
const frontmatter = content.match(/^---\n(.*?)\n---\n/s);
if (!frontmatter) {
  problems.push("missing YAML frontmatter (--- ... --- block at top)");
} else if (!/^run_id\s*:\s*\S+/m.test(frontmatter[1])) {
  problems.push("frontmatter is missing a non-empty `run_id:` field");
}

const body = content.replace(/^---\n.*?\n---\n/s, "").trim();
if (body.length < 20) {
  problems.push("body is empty or too short to be a valid stage output");
}

if (problems.length > 0) {
  process.stderr.write(
    `ideation: ${base} failed stage validation:\n- ${problems.join("\n- ")}` +
      `\nFix ${path} before continuing the pipeline (later stages validate this file as a prerequisite).\n`,
  );
  process.exit(2);
}
