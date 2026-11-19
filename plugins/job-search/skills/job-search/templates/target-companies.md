# Target Companies

Three tiers. The skill uses tiers to prioritise results and pick an approach.

**Board** is the company's public job-board API as `<ats>:<slug>` (`ashby`, `greenhouse` or `lever`), e.g. `ashby:openai`, `greenhouse:anthropic`. One `fetch-board.sh` call reads the whole board with posted dates and costs no browser budget, so fill it in wherever one exists. Find a slug by probing: `for ats in ashby greenhouse lever; do bash fetch-board.sh $ats <slug> | jq -c '{ats,count,error}'; done`. Leave it as `-` when there is none; the skill then uses the career page in Notes.

## Tier 1 — Dream Companies

| Company | Why it fits | Target teams | Board | Notes |
|---------|-------------|--------------|-------|-------|
| **<Company>** | <fit> | <teams> | <ats:slug or -> | <career page URL, angle> |

## Tier 2 — Strong Fit

| Company | Why it fits | Target teams | Board | Notes |
|---------|-------------|--------------|-------|-------|
| **<Company>** | <fit> | <teams> | <ats:slug or -> | <notes> |

## Tier 3 — Emerging / Selective

| Company | Why it fits | Target teams | Board | Notes |
|---------|-------------|--------------|-------|-------|
| **<Company>** | <fit> | <teams> | <ats:slug or -> | <notes> |

## Search Strategy by Tier

### Tier 1
- <e.g. Apply proactively even without a perfect role match>

### Tier 2
- <e.g. Apply to open roles, reach out to hiring managers>

### Tier 3
- <e.g. Apply selectively to strong matches only>
