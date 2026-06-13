import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import TOML from '@iarna/toml';
import type { PluginConfig } from "./types.ts";

const __dir = dirname(fileURLToPath(import.meta.url));
const DEFAULT_CONFIG_PATH = join(__dir, "../config/config.toml");

export function loadConfig(configPath = DEFAULT_CONFIG_PATH): PluginConfig {
  const raw = readFileSync(configPath, "utf8");
  return TOML.parse(raw) as unknown as PluginConfig;
}
