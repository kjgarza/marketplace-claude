import { describe, expect, test } from "bun:test";
import { loadPortalProfile } from "../portal-profile.ts";

describe("loadPortalProfile", () => {
  test("parses the real kleinanzeigen.yaml profile and exposes detail field baselines", () => {
    const profile = loadPortalProfile("kleinanzeigen");
    expect(profile.portal).toBe("kleinanzeigen");
    expect(profile.extraction.detail?.expected_field_count).toBe(7);
    expect(profile.extraction.detail?.fields?.title.presence_rate).toBe(1.0);
    expect(profile.extraction.detail?.fields?.sqm.presence_rate).toBe(0.70);
  });

  test("throws a clear error for a portal with no profile file", () => {
    expect(() => loadPortalProfile("not-a-real-portal")).toThrow();
  });
});
