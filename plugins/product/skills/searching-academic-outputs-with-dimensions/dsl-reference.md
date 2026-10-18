# Dimensions Search Language (DSL) Reference

Quick reference for constructing Dimensions API queries.

## Query Structure

```
search <source> [in <index>] [for "<terms>"] [where <filters>] return <result> [limit N] [skip N]
```

## Sources

| Source | Description |
|--------|-------------|
| `publications` | Research papers, articles, books, chapters |
| `grants` | Research funding awards |
| `patents` | Patent applications and grants |
| `clinical_trials` | Clinical trial records |
| `researchers` | Researcher profiles |
| `datasets` | Research datasets |
| `policy_documents` | Policy documents citing research |

## Search Indexes

Use `in <index>` to search specific fields:

| Index | Description |
|-------|-------------|
| `full_data` | All searchable text (default) |
| `title_only` | Title field only |
| `title_abstract_only` | Title and abstract |
| `authors` | Author names |
| `concepts` | Extracted concepts/noun-phrases |

Example:
```
search publications in title_only for "machine learning"
```

## Search Operators

### Boolean Operators

**IMPORTANT**: Boolean operators must be **UPPERCASE** and placed **inside** the quoted search term.

- `AND` - Both terms required
- `OR` - Either term matches
- `NOT` - Exclude term

```
search publications for "cancer AND treatment"
search publications for "python OR java"
search publications for "machine learning NOT deep learning"
search publications for "(diabetes OR obesity) AND treatment"
```

**Note**: Lowercase `and`/`or` in the `where` clause combines filter conditions (e.g., `where year=2024 and type="article"`), but search terms require UPPERCASE operators.

### Wildcards
- `*` - Multiple characters
- `?` - Single character

```
search publications for "neuro*"
search publications for "colo?r"
```

### Phrase Search
Use quotes for exact phrases:
```
search publications for "climate change"
```

### Proximity Search
Find words within N words of each other:
```
search publications for "formal model"~10
```

## Filter Operators

Use in `where` clause:

| Operator | Description | Example |
|----------|-------------|---------|
| `=` | Equals | `year=2024` |
| `!=` | Not equals | `type!="book"` |
| `>` | Greater than | `year>2020` |
| `<` | Less than | `times_cited<100` |
| `>=` | Greater or equal | `year>=2020` |
| `<=` | Less or equal | `year<=2023` |
| `~` | Contains/partial match | `journal.title~"Nature"` |
| `in` | In list/range | `year in [2020:2024]` |
| `is empty` | Field is empty | `doi is empty` |
| `is not empty` | Field has value | `doi is not empty` |

### Range Filters
```
where year in [2020:2024]
where citations_count in [10:100]
```

### List Filters
```
where type in ["article", "book"]
where research_orgs.name in ["MIT", "Stanford"]
```

### Combining Filters
```
where year=2024 and type="article"
where (year>2020 or times_cited>100) and type="article"
```

## Return Options

### Return Entire Records
```
return publications
```

### Return Specific Fields
Use `+` to combine fields:
```
return publications[id+title+doi+year+authors]
```

### Common Field Sets
```
return publications[basics]    # id, title, doi, type, year
return publications[extras]    # Extended fields
```

### Facets/Aggregations
Return aggregated data:
```
return research_orgs
return funders
return year
```

With aggregation functions:
```
return research_orgs aggregate count
return funders aggregate funding_usd sum
return year aggregate citations_count avg
```

### Sorting
```
return publications sort by year desc
return publications sort by times_cited desc
return grants sort by funding_usd desc
```

### Limiting Results
```
return publications limit 100
return publications limit 50 skip 100  # Pagination
```

## Common Fields by Source

### Publications
- `id`, `title`, `doi`, `pmid`
- `year`, `date`, `type`
- `authors`, `corresponding_authors`
- `journal`, `volume`, `issue`, `pages`
- `times_cited`, `recent_citations`
- `altmetric`, `field_citation_ratio`
- `research_orgs`, `funders`
- `abstract`, `concepts`

### Grants
- `id`, `title`, `abstract`
- `start_year`, `end_year`, `start_date`, `end_date`
- `funding_usd`, `funding_eur`, `original_currency`
- `funders`, `research_orgs`, `researchers`
- `funder_countries`

### Patents
- `id`, `title`, `abstract`
- `filing_year`, `publication_year`, `granted_year`
- `assignees`, `inventors`
- `jurisdiction`, `legal_status`
- `cpc_codes`, `ipcr_codes`

### Clinical Trials
- `id`, `title`, `brief_title`
- `phase`, `study_type`, `conditions`
- `interventions`, `investigators`
- `registry`, `date`

### Researchers
- `id`, `first_name`, `last_name`, `orcid_id`
- `current_research_org`
- `total_grants`, `total_publications`

## Special Characters

Escape these characters with backslash: `^ " : ~ \ [ ] { } ( ) ! | & +`

```
search publications for "E\. coli"
search publications for "cost\-benefit"
```

## Example Queries

### Find highly cited papers on a topic
```
search publications for "deep learning" where times_cited>1000 return publications[title+doi+times_cited] sort by times_cited desc limit 20
```

### Find NIH-funded grants on cancer
```
search grants for "cancer" where funders.name~"National Institutes of Health" return grants[title+funding_usd+start_year] sort by funding_usd desc limit 20
```

### Find recent patents by company
```
search patents where assignees.name~"Google" and filing_year>=2022 return patents[title+filing_year] limit 20
```

### Get publication counts by organization
```
search publications for "artificial intelligence" where year=2024 return research_orgs aggregate count sort by count desc limit 10
```

### Find researchers in a field
```
search publications for "quantum computing" return researchers aggregate count sort by count desc limit 20
```

## Documentation Links

- Full DSL Documentation: https://docs.dimensions.ai/dsl/language.html
- API Reference: https://docs.dimensions.ai/dsl/
- dimcli Documentation: https://digital-science.github.io/dimcli/
