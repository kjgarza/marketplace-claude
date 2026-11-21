---
max_turns: 12
allowed_tools: [Read, Glob, Grep, Bash, Write, Skill]
disallowed_tools: [Agent, WebSearch, WebFetch]
tags: ['hard-stop', 'freshness']
---

Analyze this job posting against my profile: https://jobs.larkfield.example/staff-data-engineer-knowledge-graph

The page is saved at posting.md in the current directory, so read that file instead of fetching the URL.
