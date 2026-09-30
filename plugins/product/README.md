# product

Product management toolkit: PRDs, user stories, backlog prioritization, usability tests and design critiques, backed by document-processing skills and Coda / Google Drive / Dimensions search.

## Installation

```
/plugin install product@marketplace-claude
```

## Commands

| Command | Description |
|---------|-------------|
| `/product:create-prd` | Create a Product Requirements Document |
| `/product:create-user-stories` | Generate user stories from requirements |
| `/product:analyze-intel` | Analyze competitive intelligence |
| `/product:analyze-feature-request` | Evaluate feature requests |
| `/product:prioritize-backlog` | Help prioritize product backlog |
| `/product:plan-usability-test` | Plan usability testing sessions |
| `/product:facilitate-design-critique` | Guide design critique sessions |
| `/product:search-user-research` | Search user research data |

## Agents

### product-manager

Expert product strategy agent for roadmapping, prioritization, and stakeholder communication. Uses the document skills (`docx`, `pdf`, `xlsx`) and Coda search below.

## Output styles

- `product-manager` — PM voice; pairs with the `new-yorker-style` skill for prose.

## Skills

- `product-frameworks` - Product design frameworks used by every command
- `new-yorker-style` - Writing style guide (used by the `product-manager` output style)
- `docx`, `pdf`, `pptx`, `xlsx` - Office document handling (`pdf` is also used by the bookclub plugin)
- `searching-academic-outputs-with-dimensions` - Academic evidence search (used by `analyze-intel`, `create-user-stories`)
- `searching-documents-with-coda` - Coda integration
- `searching-documents-with-google-drive` - Google Drive search

## License

MIT License
