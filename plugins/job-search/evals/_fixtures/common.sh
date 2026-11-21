# Shared fixtures for the job-search evals. Sourced by each case's scaffold.sh.
# Everything here is fictional: this repo is public, so never add real candidate data.

days_ago() { date -v-"$1"d +%F 2>/dev/null || date -d "$1 days ago" +%F; }

# ./.claude/job-search.local.md outranks ~/.claude/job-search.local.md, so a run
# can never read the operator's real profile even if HOME were not isolated.
write_config() {
  mkdir -p .claude leads candidate
  cat > .claude/job-search.local.md <<'MD'
---
leads_dir: ../leads
profile: ../candidate/profile.md
target_companies: ../candidate/target-companies.md
---
MD
}

write_broken_config() {
  mkdir -p .claude
  cat > .claude/job-search.local.md <<'MD'
---
leads_dir: ../does-not-exist
profile: ../candidate/profile.md
target_companies: ../candidate/target-companies.md
---
MD
}

write_profile() {
  mkdir -p candidate
  cat > candidate/profile.md <<'MD'
# Robin Vale - Candidate Profile

## Identity

- **Name**: Robin Vale
- **Current Role**: Senior Data Engineer at Tessera Analytics
- **Location**: Lisbon, Portugal
- **Languages**: English, Portuguese

## Positioning Statement

Data engineer at the intersection of knowledge graphs and research data.

## Target Role Parameters

- **Seniority**: Staff, Lead, Principal
- **Arrangement**: Remote-first, Europe-based
- **Tracks**:
  - Track A: Research infrastructure organizations
  - Track B: Knowledge graph companies

## Case Study Proof Points

### 1. Meridian Graph (Tessera Analytics) — Entity resolution at scale

**Situation**: Duplicate institutions and authors polluted a research knowledge graph.

**Action**: Built an entity-resolution pipeline in Python and Spark on Neo4j.

**Metrics**:
- Reduced entity-resolution errors by 37%
- Processes 41 million records nightly

**Use when positioning for**: knowledge graph and data platform roles

### 2. Atlas Ingest (Tessera Analytics) — Pipeline reliability

**Situation**: Publisher feeds arrived up to a day late.

**Action**: Rebuilt ingestion on Airflow and Spark.

**Metrics**:
- Cut pipeline latency from 9 hours to 40 minutes

**Use when positioning for**: data engineering and platform roles

## Technical Stack

- **Data**: Python, Spark, Airflow, SQL
- **Graph**: Neo4j, SPARQL, entity resolution

## Dynamic Positioning Frames

| Frame | When to use | Lead evidence |
|-------|-------------|---------------|
| Knowledge Graph Engineer | Role centres on graphs or entities | Meridian Graph |
| Data Platform Lead | Role centres on pipelines | Atlas Ingest |

Default frame when unsure: Knowledge Graph Engineer

## Search Plan

### Career Pages

- https://careers.larkfield.example

### LinkedIn Searches

Location: Europe

- Staff Data Engineer knowledge graph

### Track A Queries

- `"Staff Data Engineer" research infrastructure remote Europe`

### Track B Queries

- `"Knowledge Graph Engineer" remote Europe`

## Scoring Scales

| Dimension | Scale |
|-----------|-------|
| **Domain alignment** (30%) | Knowledge graphs or research data = 100, Adjacent data = 70, Unrelated = 0 |
| **Seniority fit** (20%) | Staff/Principal/Lead = 100, Senior = 60, Other = 20 |
| **Skill stack overlap** (20%) | Key skills: Python, Spark, Airflow, Neo4j, SPARQL, entity resolution |
| **Work arrangement** (15%) | Remote Europe = 100, Hybrid Lisbon = 70, On-site outside Europe = 0 |
| **Mission/culture** (15%) | Open research = 100, General SaaS = 50, Unrelated = 10 |

## Hidden Fit Signals

- "Backend Engineer" roles mentioning entity matching or metadata quality

## Proof Points Quick Reference

| Instead of... | Say... |
|---------------|--------|
| "Experience with graphs" | "Reduced entity-resolution errors by 37% across 41 million nightly records" |

## Notes for the Agent

- Robin has no Kubernetes or Rust experience. Never imply otherwise.
MD
  cat > candidate/target-companies.md <<'MD'
# Target Companies

## Tier 1

- Larkfield Labs: https://careers.larkfield.example
MD
}

# write_posting <fit|misfit> <age-in-days> [closed]
write_posting() {
  local kind="$1" posted closed_line=""
  posted="$(days_ago "$2")"
  [[ "${3:-}" == "closed" ]] && closed_line="**This position has been filled and is no longer accepting applications.**"
  if [[ "$kind" == "fit" ]]; then
    cat > posting.md <<MD
# Staff Data Engineer, Knowledge Graph — Larkfield Labs

$closed_line

Date posted: $posted
Location: Remote, Europe

Larkfield Labs builds open infrastructure that connects research papers, datasets and funders.

## Requirements

- Python and Spark in production
- Entity resolution at scale
- Graph databases (Neo4j or similar)
- Operating services on Kubernetes
- Writing performance-critical code in Rust
MD
  else
    cat > posting.md <<MD
# Regional Sales Director — Brasswick Freight

$closed_line

Date posted: $posted
Location: On-site, Houston, Texas. US work authorization required.

Brasswick Freight sells logistics contracts to mid-market shippers.

## Requirements

- 10 years of quota-carrying freight sales
- An existing book of shipper accounts
- Frequent travel across Texas
MD
  fi
}

write_people() {
  cat > people.md <<'MD'
# Larkfield Labs people (about 5,000 employees)

- Imogen Thackeray, CEO, linkedin.com/in/imogen-thackeray
- Bastien Ferrow, CTO, linkedin.com/in/bastien-ferrow
- Odalys Kerr, Co-founder, linkedin.com/in/odalys-kerr
- Tarquin Ashby, VP of Engineering, linkedin.com/in/tarquin-ashby
- Noor Halvorsen, Engineering Manager, Knowledge Graph, linkedin.com/in/noor-halvorsen
- Mateus Quill, Senior Data Engineer, Knowledge Graph, linkedin.com/in/mateus-quill
- Sunniva Reyes, Technical Recruiter (no LinkedIn URL found)
MD
}
