# job-search

Finds matching roles, prepares application materials, and identifies LinkedIn contacts at target companies.

## Installation

```
/plugin install job-search@marketplace-claude
```

## Skills

- `job-search` - Find, score and prepare applications for roles against a locally configured candidate profile (`load-context.sh --init` to set up)
- `find-jobs` - Search job boards, match roles to a candidate profile, draft cover letters
- `find-linkedin-contacts` - Find hiring managers and team members to reach out to (consumes `find-jobs` output)

## Requirements

`job-search` scripts need `bash`, `curl`, `jq`, `grep`, `sed` and `perl` (Ashby HTML to text). Optional: `JINA_API_KEY` for the Jina Reader fallback, used when a posting isn't on a supported ATS API.

In your target-companies file, the **Board** column (`<ats>:<slug>`, e.g. `greenhouse:anthropic`) is optional. If a file has no Board column, or a company's Board is `-`, nothing is swept for it and the skill uses the career page instead.

## License

MIT License
