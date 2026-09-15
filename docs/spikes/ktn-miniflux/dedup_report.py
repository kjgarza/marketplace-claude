#!/usr/bin/env python3
"""Q3 metric: how often the same job_key shows up across entries in pull.py JSONL output."""
import collections, json, sys

rows = [json.loads(l) for path in sys.argv[1:] for l in open(path) if l.strip()]
by_key = collections.defaultdict(set)
for r in rows:
    by_key[r["job_key"]].add(r["entry_id"])
entries = {r["entry_id"] for r in rows}
repeats = {k: v for k, v in by_key.items() if len(v) > 1}
sightings = len(rows)
unique = len(by_key)
print(f"entries={len(entries)} job_sightings={sightings} unique_jobs={unique}")
print(f"duplicate_sightings={sightings - unique} ({(sightings - unique) / max(sightings, 1):.0%} of sightings)")
print(f"jobs_seen_in_2+_entries={len(repeats)} ({len(repeats) / max(unique, 1):.0%} of unique jobs)")
for k, v in sorted(repeats.items(), key=lambda kv: -len(kv[1])):
    print(f"  {len(v)}x {k}")
