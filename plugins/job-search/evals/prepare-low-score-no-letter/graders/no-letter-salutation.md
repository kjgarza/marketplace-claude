---
type: regex
pattern: '^\s*\**(Dear|Hello|Hi)\b'
flags: m
match: not_contains
target: last_message
---
