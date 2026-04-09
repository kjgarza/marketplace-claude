---
run_id: ideation-run-01
created_at: 2026-04-08T15:00:00Z
input_file: problem_space.md
version: "1.0"
solution_count: 24
problems_addressed: [prob_01, prob_02, prob_03]
---

# Solutions

## Problem: prob_01 — Researchers can't discover relevant datasets

### sol_01_01: DataScout

**Tagline**: One search bar to find every dataset you didn't know existed
**Interaction model**: web
**Automation level**: assisted
**Scope**: focused

**Description**:

A lightweight web search interface that federates queries across all five dataset portals simultaneously. Researchers type a natural language query and get ranked results from every source, with preview cards showing schema, size, freshness, and relevance score. Results are deduplicated where the same dataset appears in multiple portals.

The search is powered by publication embeddings (asp_01) to go beyond keyword matching — a query like "neuronal signaling in mouse cortex" would surface datasets whose associated publications discuss similar topics, even if the dataset title doesn't contain those exact words.

**Uses existing capabilities**:
- cap_01 (Publications metadata API): Source of publication-dataset linkages for relevance scoring
- cap_03 (AWS infrastructure): Hosts the search service and frontend

**Needs aspirational capabilities**:
- asp_01 (Publication embeddings): Core to semantic search — **effort: weeks** — *critical*

**Key features**:
- Federated search across all 5 portals
- Semantic relevance ranking via embeddings
- Dataset preview cards with schema and sample rows
- Save and share search results with team members

**Target user persona**: A mid-career researcher starting a new project who needs to find what data already exists before collecting their own

**Success metric**: Time from "I need data on X" to finding a relevant dataset drops from ~2 hours to under 5 minutes

---

### sol_01_02: DataDigest

**Tagline**: A weekly briefing on datasets that match your interests
**Interaction model**: notification
**Automation level**: fully_automated
**Scope**: minimal

**Description**:

Instead of making researchers search, DataDigest brings datasets to them. Each researcher fills out a brief interest profile (keywords, research areas, preferred data types). Every Monday, the system scans for newly added or updated datasets across all portals and emails a personalized digest of relevant datasets. Think of it as a Google Scholar alert, but for datasets.

No embeddings needed — this works with keyword matching against the existing metadata API. Low effort, high signal.

**Uses existing capabilities**:
- cap_01 (Publications metadata API): Keyword matching against publication metadata linked to datasets
- cap_04 (Data engineering team): Build and maintain the weekly pipeline in Airflow

**Needs aspirational capabilities**:
- None — works entirely with existing capabilities

**Key features**:
- Interest profile setup (5-minute onboarding)
- Weekly email digest with top 5 matching datasets
- One-click "not relevant" feedback to improve future matching
- Digest archive accessible via web

**Target user persona**: A busy PI who doesn't have time to search but wants to stay aware of new data relevant to their group's work

**Success metric**: 40% of researchers open the digest weekly; 10% click through to a dataset they hadn't seen before
