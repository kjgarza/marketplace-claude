---
name: triage
description: Review pending flat listings queue. Accept, reject, snooze, or initiate contact for each listing. Use after /hunt to act on results.
allowed-tools: Bash, Read
---

Read pending listings from the SQLite state DB:

```bash
cd $CLAUDE_PLUGIN_ROOT && node -e "
import('./scripts/db.js').then(({ getQueue }) => {
  const listings = getQueue('pending');
  console.log(JSON.stringify(listings, null, 2));
});
" 2>&1
```

For each listing, present:
- **Title** and URL
- District | Cold rent | Warm rent | Rooms | sqm
- Scam score and verdict
- Description excerpt (first 200 chars)

Ask the user for each: **(a)ccept, (r)eject, (s)nooze, (c)ontact, or (q)uit?**

To update verdict (replace VERDICT with accepted/rejected/snoozed and ID with the listing id):

```bash
cd $CLAUDE_PLUGIN_ROOT && node -e "
import('./scripts/db.js').then(({ setVerdict }) => {
  setVerdict(ID, 'VERDICT');
  console.log('updated');
});
" 2>&1
```

On **(c)ontact**: invoke the scribe agent to draft a message for this listing. Provide the listing JSON as context.

After all listings are reviewed, show summary:
- Accepted: N
- Rejected: N
- Snoozed: N
- Contacted: N
