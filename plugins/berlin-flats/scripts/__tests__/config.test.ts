import { describe, expect, test } from "bun:test";
import { writeFileSync, mkdtempSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { loadConfig } from "../config.ts";

describe("loadConfig", () => {
  test("loads the bundled TOML config", () => {
    const cfg = loadConfig();
    expect(cfg.search.max_warm_rent_eur).toBeGreaterThan(0);
    expect(cfg.portals.enabled.length).toBeGreaterThan(0);
    expect(cfg.profile.name.length).toBeGreaterThan(0);
  });

  test("throws clearly for missing config files", () => {
    expect(() => loadConfig("/no/such/config.toml")).toThrow();
  });

  test("throws clearly for malformed TOML", () => {
    const dir = mkdtempSync(join(tmpdir(), "berlin-flats-config-"));
    const bad = join(dir, "bad.toml");
    writeFileSync(bad, "[search\nmax_warm_rent_eur = 1");
    expect(() => loadConfig(bad)).toThrow();
  });
});
