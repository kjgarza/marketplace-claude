import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import TOML from '@iarna/toml';

const __dir = dirname(fileURLToPath(import.meta.url));

export function loadConfig() {
  const raw = readFileSync(join(__dir, '../config/config.toml'), 'utf8');
  return TOML.parse(raw);
}
