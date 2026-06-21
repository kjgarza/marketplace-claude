# marketplace-claude justfile
# Usage: just <recipe> [args]

# Show available recipes
default:
    @just --list

# ── Validation ──────────────────────────────────────────────────────────────

# Validate marketplace.json, plugin.json files, and all SKILL.md frontmatter
validate:
    python3 scripts/validate.py

# Check that every changed plugin has a version bump (staged changes)
check-bumped:
    python3 scripts/check-version-bumped.py

# Install git pre-commit hook
# Version bump check is NOT included — runs in CI only via check-bumped-ci
install-hooks:
    #!/usr/bin/env bash
    set -euo pipefail
    HOOK=.git/hooks/pre-commit
    printf '#!/usr/bin/env bash\nset -e\npython3 scripts/validate.py\n# Version bump check runs in CI only (just check-bumped-ci)\n' > "$HOOK"
    chmod +x "$HOOK"
    echo "pre-commit hook installed at $HOOK"

# Check version bumps vs a base ref (CI gate — run before merging, not on every commit)
check-bumped-ci base="origin/main":
    python3 scripts/check-version-bumped.py --base {{base}}

# ── Version bumping ──────────────────────────────────────────────────────────

# Bump the top-level marketplace version  (patch|minor|major)
bump-marketplace part="patch":
    python3 scripts/bump-version.py marketplace {{part}}

# List all plugin names
plugins:
    python3 scripts/bump-version.py list

# Bump a single plugin's version
# Semver guide:
#   patch — fix/typo in skill instructions or scripts
#   minor — new skill, command, or agent added
#   major — skill removed/renamed or breaking behavior change
bump-plugin name part="patch":
    python3 scripts/bump-version.py plugin {{name}} {{part}}

# Bump ALL plugins at once  (patch|minor|major)
bump-all part="patch":
    #!/usr/bin/env bash
    set -euo pipefail
    for name in $(python3 scripts/bump-version.py list); do
        python3 scripts/bump-version.py plugin "$name" {{part}}
    done

# ── Release ──────────────────────────────────────────────────────────────────

# Validate, commit version bumps, and tag (run after bump-*)
release:
    #!/usr/bin/env bash
    set -euo pipefail
    just validate
    version=$(python3 -c "import json; d=json.load(open('.claude-plugin/marketplace.json')); print(d['metadata']['version'])")
    echo "Releasing v$version"
    git add .claude-plugin/marketplace.json plugins/*/.claude-plugin/plugin.json plugins/*/plugin.json 2>/dev/null || true
    git diff --cached --quiet && echo "Nothing to commit" && exit 0
    git commit -m "chore: release v$version"
    git tag "v$version"
    echo "Tagged v$version — push with: git push && git push --tags"
