---
description: Definition of Done template — copy to DOD.md in any new plugin directory
---

# Definition of Done — \<plugin-name\> plugin

## Goal

The plugin is **done** when it can autonomously:
1. \<primary action — e.g. "search X and return results"\>
2. \<secondary action\>
3. \<output — e.g. "present a ranked list with metadata"\>

---

## Acceptance Criteria

### AC-1 · \<Core Function\>

- [ ] \<Concrete, testable condition\>
- [ ] \<Concrete, testable condition\>

### AC-2 · \<Secondary Function\>

- [ ] \<Concrete, testable condition\>

### AC-3 · Output Quality

- [ ] Output is formatted markdown with: \<required fields\>
- [ ] Results reflect user preferences from `.claude/<plugin-name>.local.md`

---

## Autoresearch Loop Parameters

Used when running `/autoresearch` to iteratively improve the plugin.

### Metric
```
METRIC_COMMAND:     bash scripts/test-pipeline.sh
METRIC_EXTRACTION:  "score: (\d+)" from stdout
METRIC_DIRECTION:   higher_is_better
TARGET:             ≥ <N> <units>
```

### Scope
```
IN_SCOPE_FILES:
  - scripts/          # pipeline logic
  - skills/           # skill instructions

OUT_OF_SCOPE_FILES:
  - .claude-plugin/plugin.json
  - skills/*/references/  # reference data, read-only
```

### Constraints
- No new dependencies beyond `scripts/package.json`
- Each experiment run must complete within **3 minutes**
- Must not modify data outside plugin's own namespace

---

## Done Checklist

- [ ] `.claude-plugin/plugin.json` exists and is valid JSON
- [ ] All AC pass
- [ ] `scripts/test-pipeline.sh` exists and prints the metric line
- [ ] `bash scripts/validate-plugin.sh <plugin-name>` passes
- [ ] End-to-end run completes in < 3 minutes on a warm machine
- [ ] `marketplace.json` entry added/updated
