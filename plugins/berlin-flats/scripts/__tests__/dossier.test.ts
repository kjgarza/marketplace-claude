import { describe, expect, test } from "bun:test";
import { checkDossier } from "../dossier.ts";

const NOW = new Date("2026-07-07T12:00:00Z");
const allExist = { exists: () => true, now: NOW };

describe("checkDossier", () => {
  test("no config at all → every required doc missing, not ready", () => {
    const report = checkDossier(undefined, allExist);
    expect(report.ready).toBe(false);
    const schufa = report.items.find((i) => i.key === "schufa")!;
    expect(schufa.status).toBe("missing");
    expect(schufa.required).toBe(true);
  });

  test("fresh schufa with existing file is ok", () => {
    const report = checkDossier({ schufa: { path: "/docs/schufa.pdf", issued: "2026-06-20" } }, allExist);
    expect(report.items.find((i) => i.key === "schufa")!.status).toBe("ok");
  });

  test("schufa older than 90 days is stale", () => {
    const report = checkDossier({ schufa: { path: "/docs/schufa.pdf", issued: "2026-03-01" } }, allExist);
    const schufa = report.items.find((i) => i.key === "schufa")!;
    expect(schufa.status).toBe("stale");
    expect(schufa.detail).toContain("90");
  });

  test("configured path that does not exist is file_not_found", () => {
    const report = checkDossier(
      { schufa: { path: "/docs/schufa.pdf", issued: "2026-06-20" } },
      { exists: () => false, now: NOW }
    );
    expect(report.items.find((i) => i.key === "schufa")!.status).toBe("file_not_found");
  });

  test("ready only when all required docs are ok", () => {
    const docs = {
      schufa: { path: "/d/schufa.pdf", issued: "2026-06-20" },
      payslips: { path: "/d/payslips/" },
      id: { path: "/d/id.pdf" },
      selbstauskunft: { path: "/d/selbstauskunft.pdf" },
    };
    expect(checkDossier(docs, allExist).ready).toBe(true);
  });
});
