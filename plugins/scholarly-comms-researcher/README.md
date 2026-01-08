# Scholarly Communications Researcher

Expert agent plugin for scholarly communication research with integrated Dimensions database access for querying academic publications, grants, patents, and researchers.

## Features

This plugin provides:

- **Expert Agent**: Dr. Research - PhD-level expertise in scholarly communication and infrastructure
- **Database Access**: Autonomous skill to query the Dimensions academic database via dimcli CLI
- **Comprehensive Coverage**: Publications, grants, patents, clinical trials, and researcher profiles

## Installation

### From Local Path

```bash
/plugin add ./plugins/scholarly-comms-researcher
```

### From Marketplace

```bash
/plugin install scholarly-comms-researcher
```

## Components

### 1. Scholarly Communications Researcher Agent

An expert agent with PhD-level knowledge in:

- **Scholarly Publishing**: Journal models, preprints, OA publishing, publishing platforms
- **Peer Review**: Traditional and innovative review models, quality assurance
- **Research Infrastructure**: DOIs, ORCIDs, RORs, repositories, FAIR data
- **Metrics & Impact**: Bibliometrics, altmetrics, citation analysis, assessment frameworks
- **Policy & Governance**: OA mandates (Plan S, NIH), funder requirements, copyright
- **Emerging Trends**: AI in publishing, decentralized infrastructure, research integrity

**Model**: Sonnet  
**Color**: Cyan

**When to Use**:
- Analyzing trends in scholarly communication
- Comparing publishing models or infrastructure options
- Understanding persistent identifiers and metadata standards
- Synthesizing literature on academic publishing topics
- Generating policy recommendations
- Researching open access and research data management

### 2. Search Academic Outputs Skill

Autonomous skill that queries the Dimensions database using DSL (Dimensions Search Language).

**Capabilities**:
- Search publications by keywords, authors, DOIs
- Find grants by funder, topic, or funding amount
- Discover patents by assignee or technology
- Locate clinical trials by condition or phase
- Find researcher profiles and publication counts
- Aggregate data (citations, funding, organizations)

**Invocation**: Claude automatically uses this skill when academic database queries are needed.

## Requirements

### System Dependencies

1. **Python 3.7+** with pip
2. **dimcli** - Dimensions CLI tool

### Installation

```bash
# Install dimcli
pip install dimcli -U

# Configure with your API key
dimcli --init
```

### Dimensions API Access

You need a Dimensions API key:

1. Go to https://app.dimensions.ai/account/tokens
2. Generate an API key
3. Run `dimcli --init` and enter your key

The key is stored in `~/.dimensions/dsl.ini`:

```ini
[instance.live]
url=https://app.dimensions.ai
key=your-api-key-here
```

## Usage

### Using the Agent

Invoke the agent for scholarly communication expertise:

```
@scholarly-comms-researcher What are the current trends in diamond open access publishing?
```

Or let Claude decide to use it:

```
Can you explain how Plan S is affecting European research publishing?
```

### Using the Database Skill

The skill activates automatically when needed:

```
Find the top 20 most cited papers on CRISPR from the last 5 years
```

```
What NIH-funded grants on Alzheimer's disease were awarded in 2024?
```

```
Show me recent AI patents filed by Google
```

### Example Queries

**Publication Search**:
```
Search for publications on "quantum computing" published in 2024 with high citations
```

**Grant Analysis**:
```
Find all NSF grants on climate change with funding over $1M
```

**Trend Analysis**:
```
What are the publishing trends in open access over the last decade?
```

**Infrastructure Research**:
```
Explain the persistent identifier landscape and how DOIs, ORCIDs, and RORs work together
```

## DSL Query Reference

The skill uses Dimensions Search Language (DSL). See `skills/search-academic-outputs/dsl-reference.md` for complete syntax.

### Quick Examples

```bash
# Search publications
search publications for "machine learning" return publications[title+doi+year] limit 20

# Filter by criteria
search publications where year=2024 and citations_count>100 return publications

# Search grants by funder
search grants where funders.name~"NIH" return grants[title+funding_usd] limit 10

# Aggregate data
search publications for "AI" return research_orgs aggregate count sort by count desc
```

## Permissions

This plugin requires:

- **Bash tool access**: To execute `dimcli` commands
- **Network access**: To query the Dimensions API
- **File read access**: For DSL reference documentation

## Configuration

No additional configuration needed beyond installing and configuring dimcli.

### Optional: Verify Installation

```bash
# Test dimcli
echo 'search publications for "test" return publications limit 1' | dimcli

# Check configuration
cat ~/.dimensions/dsl.ini
```

## Troubleshooting

### dimcli not found

Install dimcli:
```bash
pip install dimcli -U
```

### API authentication errors

Reconfigure your API key:
```bash
dimcli --init
```

Or manually edit `~/.dimensions/dsl.ini` with your key.

### Query syntax errors

Check the DSL reference guide in `skills/search-academic-outputs/dsl-reference.md` for proper syntax.

Common issues:
- Always use quotes around search terms: `for "search term"`
- Use `~` for partial matching: `where journal.title~"Nature"`
- Escape special characters: `"E\. coli"`

## Agent Expertise Areas

The scholarly-comms-researcher agent excels at:

1. **Research Questions**: Comprehensive answers with context, evidence, and citations
2. **Trend Analysis**: Historical context, current state, drivers, and future trajectories
3. **Comparative Analysis**: Structured frameworks comparing options and trade-offs
4. **Literature Synthesis**: Thematic organization, consensus vs. debate, research gaps
5. **Policy Questions**: Multi-stakeholder perspectives and implementation considerations

## Documentation

- **Full DSL Documentation**: https://docs.dimensions.ai/dsl/language.html
- **Dimensions API**: https://docs.dimensions.ai/dsl/
- **dimcli Documentation**: https://digital-science.github.io/dimcli/

## Contributing

To extend this plugin:

1. Add new agent variations in `agents/`
2. Create additional skills in `skills/`
3. Update documentation
4. Test locally with `/plugin add ./plugins/scholarly-comms-researcher`

## License

MIT License - See LICENSE file for details

## Support

For issues or questions:
- Email: kj.garza@gmail.com
- Repository: https://github.com/kjgarza/marketplace-claude

## Version History

### 1.0.0 (Initial Release)
- Dr. Research expert agent for scholarly communication
- Dimensions database integration via dimcli
- Autonomous academic search skill
- Comprehensive DSL query reference

