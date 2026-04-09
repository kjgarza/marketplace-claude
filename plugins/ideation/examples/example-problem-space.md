---
run_id: ideation-run-01
created_at: 2026-04-08T14:30:00Z
version: "1.0"
problem_count: 3
capability_count: 4
aspirational_count: 2
timeline: exploring
---

# Problem areas

## prob_01: Researchers can't discover relevant datasets

**Who is affected**: Data scientists in the research division
**What happens today**: They manually search across 5 different portals, often missing relevant datasets entirely
**What should happen instead**: A single search that surfaces relevant datasets across all sources with context
**Severity**: 4/5

## prob_02: No visibility into API usage patterns

**Who is affected**: Platform engineering team
**What happens today**: Usage data exists in logs but nobody analyzes it; outages are discovered reactively
**What should happen instead**: Real-time awareness of usage anomalies and capacity trends
**Severity**: 3/5

## prob_03: Publication metadata is disconnected from internal projects

**Who is affected**: Research managers and grant writers
**What happens today**: Manually cross-referencing publications with project codes in spreadsheets
**What should happen instead**: Automatic linking between publications and the projects/grants that produced them
**Severity**: 5/5

---

# Existing capabilities

## cap_01: Publications metadata API

**Type**: api
**Description**: REST API returning metadata (title, authors, DOI, abstract) for ~2M publications
**Maturity**: production
**Constraints**: No full text, rate limited to 100 req/s, no semantic search

## cap_02: Internal project database

**Type**: data
**Description**: PostgreSQL database of all active and archived projects with PI, funding source, dates
**Maturity**: production
**Constraints**: No API layer — direct DB access only, schema is undocumented

## cap_03: Cloud infrastructure (AWS)

**Type**: infrastructure
**Description**: Existing AWS account with ECS, S3, RDS, and a small EKS cluster
**Maturity**: production
**Constraints**: Budget approval needed for new services over $500/mo

## cap_04: Data engineering team

**Type**: expertise
**Description**: 3-person team experienced with Python, Airflow, dbt, and data pipeline design
**Maturity**: production
**Constraints**: Currently at 80% capacity on existing commitments

---

# Aspirational capabilities

## asp_01: Publication embeddings

**Type**: data
**What it would provide**: Vector embeddings of all 2M publication abstracts, enabling semantic similarity search
**What's needed to get there**: Run an embedding model (e.g., Voyage or OpenAI) over the abstract corpus, store in a vector DB
**Estimated effort**: weeks
**Dependencies**: cap_01 (publications API for source data), cap_03 (infrastructure for vector DB)

## asp_02: Publications MCP server

**Type**: api
**What it would provide**: An MCP server wrapping the publications API, making it accessible to LLM-based tools and agents
**What's needed to get there**: Build a FastMCP wrapper around the existing REST API with search, get, and batch-get tools
**Estimated effort**: days
**Dependencies**: cap_01 (publications API)

---

# Solution constraints

**Must**:
- Work within existing AWS infrastructure
- Be usable by non-technical researchers
- Respect publication access rights and licensing

**Must not**:
- Require a new headcount to maintain
- Expose raw database credentials to end users
- Duplicate data that already exists in source systems

**Target users**: Researchers, research managers, data scientists
**Technical environment**: AWS, Python ecosystem, browser-based UIs preferred
**Timeline pressure**: exploring
