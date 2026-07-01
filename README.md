# Claude Plugin Marketplace

A collection of useful Claude Code plugins for development workflows, research, and productivity.

## Installation

Add this marketplace to your Claude Code installation:

```
/plugin marketplace add kjgarza/marketplace-claude
```

Or via the CLI:

```bash
claude plugin marketplace add kjgarza/marketplace-claude
```

## Available Plugins

| Plugin | Category | Description |
|--------|----------|-------------|
| **kjgarza-base** | utilities | Base MCP server configuration with puppeteer, fetch, sequential thinking, and context7 documentation servers |
| **scholarly-comms-researcher** | documentation | Expert agent for scholarly communication research with Dimensions database integration and academic search capabilities |
| **senior-software-developer** | development | Expert-level development assistance for architecture, code review, system design, and technical leadership |
| **kjgarza-product** | productivity | Product management toolkit with document processing, integrations, and research capabilities |

## Installing Plugins

After adding the marketplace, install individual plugins:

```
/plugin install kjgarza-base@marketplace-claude
/plugin install scholarly-comms-researcher@marketplace-claude
/plugin install senior-software-developer@marketplace-claude
/plugin install kjgarza-product@marketplace-claude
```

## Using with Codex CLI / other agents

Skills follow the [Agent Skills standard](https://agentskills.io). Install any skill into a project for both Claude Code and Codex CLI with:

```
npx skills add kjgarza/marketplace-claude --skill <skill-name>
```

See [docs/CODEX.md](docs/CODEX.md) for portability conventions and Codex subagent adapters.

## Plugin Details

### kjgarza-base

Foundation plugin with MCP server configurations for:
- Puppeteer (browser automation)
- Fetch (HTTP requests)
- Sequential thinking
- Context7 documentation

**Skills**: `project-scaffold`, `skill-creator`

### scholarly-comms-researcher

Expert agent for academic research and scholarly communication:
- Literature reviews with Dimensions database
- Scholar evaluation
- Scientific writing guidance
- Research visualization

**Skills**: `literature-review`, `scholar-evaluation`, `scientific-brainstorming`, `scientific-critical-thinking`, `scientific-visualization`, `scientific-writing`, `scikit-survival`

### senior-software-developer

Senior engineering expertise for:
- Architecture reviews
- Code reviews
- System design
- Technical leadership

**Commands**: `/architecture-review`, `/code-review`, `/system-design`, `/refactor-strategy`, `/technical-debt-audit`

**Skills**: `chrome-extension-builder`, `cli-generator`, `detect-code-smells`, `mcp-builder`, `monorepo-generator`, `security-pattern-check`, `suggest-performance-fix`, `vscode-extension-builder`

### kjgarza-product

Product management toolkit:
- Document processing (PDF, DOCX, XLSX, PPTX)
- Integration with Coda, Google Drive
- Research with Dimensions API
- Product frameworks and planning

**Commands**: `/create-prd`, `/create-user-stories`, `/analyze-intel`, `/analyze-feature-request`, `/prioritize-backlog`, `/plan-usability-test`, `/facilitate-design-critique`, `/search-user-research`

**Agents**: `product-manager`, `scholarly-comms-researcher`, `senior-dev-advisor`

## License

MIT License - see [LICENSE.md](LICENSE.md) for details.

## Author

Kristian Garza ([@kjgarza](https://github.com/kjgarza))
