#!/usr/bin/env python3
"""Repair quoted-printable damage in Gmail-API fixture bodies so they match what KTN would deliver.

The Gmail MCP decodes "=10" in "jobListingId=1010..." to byte 0x10. Real SMTP delivery to KTN
is decoded properly, so feeding damaged bodies to Miniflux would test the fixture, not the pipeline.
  clean_fixtures.py in.jsonl out.jsonl
"""
import json, re, sys

src, dst = sys.argv[1], sys.argv[2]
with open(src) as f, open(dst, "w") as out:
    for line in f:
        m = json.loads(line)
        # Control bytes other than tab/LF/CR are QP escapes that were decoded by mistake.
        m["htmlBody"] = re.sub(r"[\x00-\x08\x0b\x0c\x0e-\x1f]",
                               lambda c: "=" + format(ord(c.group()), "02X"), m["htmlBody"])
        out.write(json.dumps(m) + "\n")
print(f"cleaned {src} -> {dst}")
