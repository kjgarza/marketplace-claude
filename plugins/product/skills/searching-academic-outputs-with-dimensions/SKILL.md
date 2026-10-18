---
name: searching-academic-outputs-with-dimensions
description: Search for academic literature, empirical evidence, and scholarly research using the Dimensions database. Use when seeking research papers to support product decisions, find empirical studies, conduct literature reviews, explore funding patterns, validate hypotheses with academic sources, or discover research trends. Supports publications, grants, patents, clinical trials, and researcher profiles. Triggers on requests for "academic evidence", "empirical research", "find studies", "literature search", or "research to support decisions".
---


# Overview

Query the Dimensions academic database to find publications, grants, patents, clinical trials, and researchers using the shortwing CLI.

Queries use the Dimensions Search Language (DSL) piped to shortwing.

**Reference Documentation:**
- [dsl-reference.md](dsl-reference.md) — Full DSL syntax, operators, fields, and example queries

**Authentication:** Requires API key from https://app.dimensions.ai/account/tokens. Configure credentials in `~/.dimensions/dsl.ini` or use environment variables (`DIMENSIONS_KEY`, `DIMENSIONS_ENDPOINT`). See Authentication section in [dsl-reference.md](dsl-reference.md) for details.

# Quick Start

```bash
# Search publications
echo 'search publications for "machine learning" return publications limit 10' | shortwing

# Search grants
echo 'search grants for "artificial intelligence" return grants[title+funding_usd] limit 10' | shortwing

# Find researchers
echo 'search researchers for "John Smith" return researchers[first_name+last_name+current_research_org] limit 10' | shortwing
```

# Query Structure

```
search <source> [for "<terms>"] [where <filters>] return <result> [limit N]
```

# Available Sources

| Source | Description |
|--------|-------------|
| `publications` | Research papers, articles, books |
| `grants` | Research funding awards |
| `patents` | Patent applications and grants |
| `clinical_trials` | Clinical trial records |
| `researchers` | Researcher profiles |
| `datasets` | Research datasets |

# Common Query Patterns

| Task | Query |
|------|-------|
| Search by keyword | `search publications for "CRISPR" return publications limit 20` |
| Filter by year | `search publications where year=2024 return publications limit 10` |
| Search title only | `search publications in title_only for "climate change" return publications limit 10` |
| Highly cited papers | `search publications for "AI" where times_cited>100 return publications sort by times_cited desc limit 10` |
| Grants by funder | `search grants where funders.name~"NIH" return grants[title+funding_usd] limit 10` |
| Recent patents | `search patents where filing_year>=2023 return patents[title+assignees] limit 10` |
| Clinical trials | `search clinical_trials for "diabetes" return clinical_trials[title+phase] limit 10` |
| Aggregations | `search publications for "robotics" return research_orgs aggregate count sort by count desc limit 10` |

# Return Specific Fields

Use `+` to combine fields:
```bash
echo 'search publications for "quantum" return publications[id+title+doi+year+times_cited] limit 10' | shortwing
```

# Filter Operators

| Operator | Example |
|----------|---------|
| `=` equals | `year=2024` |
| `>` greater than | `times_cited>100` |
| `~` contains | `journal.title~"Nature"` |
| `in` range | `year in [2020:2024]` |
| `and/or` combine | `year=2024 and type="article"` |

# Boolean Search Operators

Boolean operators in search terms must be **UPPERCASE** and **inside** the quotes:

| Pattern | Example |
|---------|---------|
| AND (both required) | `for "machine learning AND healthcare"` |
| OR (either matches) | `for "python OR java"` |
| NOT (exclude) | `for "AI NOT robotics"` |
| Grouped | `for "(cancer OR tumor) AND treatment"` |
| Exact phrase | `for "\"peer feedback\""` (escaped quotes) |
| Proximity | `for "\"formal model\"~10"` (within 10 words) |

**Important**: Lowercase `and/or` in the `where` clause combines filters, but search terms require UPPERCASE `AND/OR/NOT`.

# Tips for Precise Results

1. **Use targeted search indexes** for relevant results:
   ```bash
   # Most specific - title only
   echo 'search publications in title_only for "machine learning" return publications limit 20' | shortwing

   # Good balance - title and abstract
   echo 'search publications in title_abstract_only for "peer feedback AND writing" return publications limit 20' | shortwing
   ```

2. **Use phrase searches** for exact multi-word terms:
   ```bash
   echo 'search publications in title_abstract_only for "\"formative assessment\" AND \"higher education\"" return publications limit 20' | shortwing
   ```

3. **Combine search with filters** to narrow scope:
   ```bash
   echo 'search publications in title_abstract_only for "\"peer review\"" where year>=2020 and times_cited>10 return publications[title+doi+times_cited+year] limit 20' | shortwing
   ```

4. **Filter by citation count** to find influential papers:
   ```bash
   echo 'search publications for "cognitive load" where times_cited>50 return publications sort by times_cited desc limit 10' | shortwing
   ```

# General Tips

- Always use double quotes around search terms: `for "search term"`
- Use `~` for partial string matching: `where journal.title~"Nature"`
- Use `limit` to control result size
- See [dsl-reference.md](dsl-reference.md) for complete syntax and all available fields

# Error Handling

| Error | Solution |
|-------|----------|
| shortwing not found | Install from ~/aves/shortwing: `cd ~/aves/shortwing && uv pip install .` |
| Configuration error (exit code 2) | Set `DIMENSIONS_KEY` env var or create `~/.dimensions/dsl.ini` |
| Invalid credentials | Get new key from https://app.dimensions.ai/account/tokens |
| Query syntax error (exit code 1) | Check DSL syntax in [dsl-reference.md](dsl-reference.md) |
