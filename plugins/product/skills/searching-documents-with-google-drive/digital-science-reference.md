# Digital Science Reference

Reference links and documentation for Digital Science products and tools.

## Internal Documentation

| Resource | Description |
|----------|-------------|
| [scripts/check_rclone.sh](scripts/check_rclone.sh) | Verify rclone installation and configuration |
| [scripts/search_gdrive.sh](scripts/search_gdrive.sh) | Search files in Google Drive |
| [scripts/download_gdrive.sh](scripts/download_gdrive.sh) | Download files from Google Drive |
| [scripts/sync_standups.sh](scripts/sync_standups.sh) | Sync standup documents |

## Digital Science Products

| Product | Description | Documentation |
|---------|-------------|---------------|
| **Dimensions** | Academic database for publications, grants, patents | [docs.dimensions.ai](https://docs.dimensions.ai) |
| **Overleaf** | Collaborative LaTeX editor | [overleaf.com/learn](https://www.overleaf.com/learn) |
| **Figshare** | Research data repository | [help.figshare.com](https://help.figshare.com) |
| **Altmetric** | Research attention tracking | [altmetric.com/support](https://www.altmetric.com/support) |
| **ReadCube Papers** | Reference management | [readcube.com/papers](https://www.readcube.com/papers/) |
| **Symplectic** | Research information management | [symplectic.co.uk](https://www.symplectic.co.uk) |

## External Tools

| Tool | Documentation |
|------|---------------|
| rclone | [rclone.org/docs](https://rclone.org/docs/) |
| rclone Google Drive | [rclone.org/drive](https://rclone.org/drive/) |

## Authentication

### rclone Setup

**Prerequisites:**
1. Install rclone: `brew install rclone`
2. Configure: `rclone config`
   - Name remote: `gdrive`
   - Select: Google Drive
   - Complete OAuth flow

**Verify configuration:**
```bash
./scripts/check_rclone.sh
```

**Reconnect if needed:**
```bash
rclone config reconnect gdrive:
```

### Security Notes

- This skill only accesses files the authenticated user has permission to view
- rclone uses OAuth authentication; no passwords are stored
- Configure with `drive.readonly` scope if only read access is needed
- Service account authentication is supported for non-interactive use

### Google Drive API Scopes

| Scope | Access Level |
|-------|--------------|
| `drive.readonly` | Read-only access to all files |
| `drive` | Full access to all files |
| `drive.file` | Access only to files created by app |

