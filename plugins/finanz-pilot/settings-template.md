---
# finanz-pilot settings — copy to .claude/finanz-pilot.local.md in your workspace
# vault_root: directory that contains the `finance/` folder (data + reports).
# Defaults to the current working directory if unset.
vault_root: /Volumes/Verbatim-Vi560-Media/Development/output
# Optional: how many days before a data file is considered stale (default 90).
staleness_days: 90
---

# Finanz-Pilot — local settings

This file pins where your finance data lives so the `finanzberater` agent and skills don't have
to guess from the current working directory.

Expected layout under `vault_root`:

```
finance/
  data/      pension.md, employment.md, bank-accounts.md, monthly-budget.md, property-goals.md
  reports/   generated analysis reports (dated)
```

Populate the data files from the templates in the plugin's `templates/` directory.
