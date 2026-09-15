#!/usr/bin/env python3
"""Build a KTN-shaped Atom feed from fixture emails so Miniflux can be tested without live delivery.

Mirrors Kill the Newsletter's feed shape: one <entry> per received email, a fresh
id + alternate link per delivery, subject as title, HTML body as content.

  make_feed.py fixtures.jsonl out.xml            # one entry per fixture line
  make_feed.py fixtures.jsonl out.xml --redeliver # append a second copy of every email with new ids
"""
import argparse, json, uuid
from xml.sax.saxutils import escape

ap = argparse.ArgumentParser()
ap.add_argument("fixtures")
ap.add_argument("out")
ap.add_argument("--redeliver", action="store_true")
a = ap.parse_args()

mails = [json.loads(l) for l in open(a.fixtures) if l.strip()]
copies = [(m, "a") for m in mails] + ([(m, "b") for m in mails] if a.redeliver else [])

entries = []
for m, copy in copies:
    # KTN assigns a new random entry id per delivery; a stable id per (mail, copy) keeps reruns idempotent.
    eid = uuid.uuid5(uuid.NAMESPACE_URL, f"{m['id']}/{copy}").hex
    entries.append(f"""  <entry>
    <id>urn:kill-the-newsletter:{eid}</id>
    <title>{escape(m.get('subject', ''))}</title>
    <author><name>noreply@example.com</name></author>
    <updated>{m['date']}</updated>
    <link rel="alternate" type="text/html" href="http://fixtures:8000/alternates/{eid}.html"/>
    <content type="html">{escape(m['htmlBody'])}</content>
  </entry>""")

with open(a.out, "w") as f:
    f.write(f"""<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <id>urn:kill-the-newsletter:spike-fixture</id>
  <title>spike-fixture</title>
  <link rel="self" href="http://fixtures:8000/feed.xml"/>
  <updated>{max(m['date'] for m in mails)}</updated>
{chr(10).join(entries)}
</feed>
""")
print(f"wrote {len(entries)} entries to {a.out}")
