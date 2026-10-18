---
name: require-simplify-before-commit
enabled: true
event: bash
pattern: git\s+commit
action: block
---

**Code quality check required before committing.**

You must run `/simplify` to review the code for reuse, quality, and efficiency before creating a commit.

**Steps:**
1. Stop this commit
2. Run `/simplify` to check the changed code
3. Fix any issues found
4. Then proceed with the commit
