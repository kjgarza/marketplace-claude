---
name: watch
description: Run the flat hunt in a continuous loop, polling portals every 90-120 seconds. Notifies on new listings. Use when you want ongoing monitoring.
argument-hint: "[--interval=90]"
allowed-tools: Bash, Read
---

Run the hunt in a continuous polling loop.

```bash
cd $CLAUDE_PLUGIN_ROOT && node -e "
import('./scripts/hunt.js').then(async ({ hunt }) => {
  const intervalMs = parseInt('$ARGUMENTS'.match(/--interval=(\d+)/)?.[1] || '120') * 1000;
  console.log('[watch] Starting loop, interval:', intervalMs / 1000, 's');
  while (true) {
    await hunt();
    console.log('[watch] Sleeping', intervalMs / 1000, 's...');
    await new Promise(r => setTimeout(r, intervalMs));
  }
});
" 2>&1
```

This runs until interrupted (Ctrl+C). Between each poll:
- Results are saved to the SQLite DB
- New pending listings trigger a notification message here
- Run /triage in a separate session to review the queue

Quiet hours (22:00–07:00 Berlin time): warn the user if they start watch during quiet hours, as notifications may be intrusive.
