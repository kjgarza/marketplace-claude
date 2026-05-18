---
name: init
description: Initialize berlin-flats config by updating config/config.toml from user-provided search preferences
argument-hint: "[name=<profile>] [districts=<comma-separated>] [move_in_earliest=YYYY-MM-DD] [move_in_latest=YYYY-MM-DD] [max_warm_rent_eur=<number>] [min_rooms=<number>] [max_rooms=<number>]"
allowed-tools: Read, Write, Edit, Bash(cp:*)
---

# Initialize Berlin Flats Config

Set up `config/config.toml` from user input arguments so `/berlin-flats:hunt` and `/berlin-flats:triage` run with the user’s profile.

## Steps

1. Read `config/config.toml` as the baseline template.

2. Parse `$ARGUMENTS` as optional `key=value` pairs for common fields:
   - `name`
   - `districts` (comma-separated list)
   - `move_in_earliest`
   - `move_in_latest`
   - `max_warm_rent_eur`
   - `min_rooms`
   - `max_rooms`

3. If required search profile values are missing (at minimum `districts` or rent constraints), ask the user before writing.

4. Create a backup: `config/config.toml.bak`.

5. Update `config/config.toml` with provided values while preserving all fields not specified by the user.

6. Confirm which values were changed and point the user to run `/berlin-flats:hunt`.

