# ReadItLater Digest

Generate themed weekly digests from Obsidian ReadItLater bookmarks. Scans your inbox folder, clusters bookmarks by theme, produces a digest note with Obsidian wikilinks, and archives processed files.

## Prerequisites

- [Bun](https://bun.sh/) runtime (uses `bun:sqlite`)

## Skills

| Skill | Description |
|-------|-------------|
| `/readitlater-digest:digest` | Run the full pipeline: scan, cluster, generate digest, archive |
| `/readitlater-digest:status` | Show bookmark counts, digest history, and top domains |

## Configuration

Copy `settings-template.md` to `.claude/readitlater-digest.local.md` in your project root:

```yaml
---
vault_path: /path/to/your/obsidian/vault
inbox_folder: ReadItLater Inbox
digest_folder: Digests
archive_folder: ReadItLater Inbox/Archive
---
```

## Usage

Run manually:

```
/readitlater-digest:digest
```

Dry run (scan only, no digest generated):

```
/readitlater-digest:digest --dry-run
```

Specify week start:

```
/readitlater-digest:digest --week 2026-03-16
```

Automate with `/loop`:

```
/loop 1d /readitlater-digest:digest
```

## How it works

1. **Init** - Creates/verifies SQLite database in vault root
2. **Scan** - Parses `.md` files in inbox, extracts title/URL/date from frontmatter
3. **Cluster** - Groups bookmarks into 3-7 themes using content analysis
4. **Generate** - Writes a digest note with `[[wikilinks]]` back to originals
5. **Update** - Marks bookmarks as processed in the database
6. **Archive** - Moves processed files to archive folder
