# Kristian Garza - Candidate Profile

## Identity

- **Name**: Kristian Garza
- **Current Role**: Senior AI Engineer at Digital Science
- **Location**: Berlin, Germany
- **Languages**: English, German, Spanish
- **ORCID**: 0000-0003-3484-6875
- **LinkedIn**: https://www.linkedin.com/in/kjgarza
- **GitHub**: https://github.com/kjgarza
- **Portfolio**: https://kjgarza.github.io/

## Positioning Statement

Senior AI Engineer with a rare cross-disciplinary profile: production LLM engineering, open science infrastructure (DataCite, PID Graph, FAIR data), UX research and design systems, and 18+ academic publications. Bridges frontier AI with real-world domain systems at the intersection of scholarly infrastructure and machine learning.

## Target Role Parameters

- **Seniority**: Above-senior — Staff, Lead, Principal, Manager, Director
- **Arrangement**: Remote-first, Europe-based (Berlin preferred)
- **Tracks**:
  - Track A: Frontier AI labs (Anthropic, OpenAI, Google DeepMind, etc.)
  - Track B: Research infrastructure organizations (CZI, Crossref, ORCID, OpenAlex, etc.)

## Case Study Proof Points

### 1. Query Translation API (Digital Science) — AI/LLM Depth

**Situation**: Researchers struggled with complex Dimensions database query syntax, creating high barriers to data access.

**Action**: Architected and launched a FastAPI microservice using LangChain + OpenAI for entity extraction, pgvector for semantic search, and a full NLP-to-structured-query pipeline. Deployed on Kubernetes with Sentry/Prometheus monitoring.

**Metrics**:
- End-to-end system from concept to production
- Semantic entity resolution via vector embeddings (PostgreSQL + pgvector)
- Cross-domain query support: publications, grants, clinical trials, patents
- Full CI/CD with GitLab CI, Docker, Kubernetes (Skaffold)

**Tech**: FastAPI, LangChain, OpenAI, pgvector, PostgreSQL, Solr, Docker, Kubernetes, Redis, Pytest

**Use when positioning for**: Lead/Principal Engineer roles emphasizing AI architecture and production LLM systems

### 2. Redesigning DataCite Harvesting Services (DataCite) — UX Research Leadership

**Situation**: DataCite's harvesting services were significantly underutilized despite market willingness to pay, representing missed revenue.

**Action**: Led comprehensive UX research: 56-person focus group across 10 organizations, design sprint with 7 internal collaborators, cognitive walkthroughs, and concept testing. Facilitated using Miro, prototyped in Figma.

**Metrics**:
- **42% reduction in lead time** — research scoped MVP for faster delivery
- **4 new paying customer relationships** established
- **12 new users** adopted snapshot feature immediately
- 56 focus group participants, 83 "how might we" notes generated

**Use when positioning for**: Engineering Manager or Head of roles emphasizing cross-functional coordination, user research, and business impact

### 3. DataCite Design System (DataCite) — Team/Process Leadership

**Situation**: DataCite's suite of web services (Commons, Fabrica, homepage, widgets) lacked visual consistency, confusing members and slowing developers.

**Action**: Led design system creation using Atomic Design principles. Managed a 4-person team (designer, developer, PM, design manager). Conducted component inventory, two rounds of UX evaluations, and stakeholder engagement. Delivered Figma component library, design system website, and JavaScript package.

**Metrics**:
- Unified aesthetic across entire DataCite frontend ecosystem
- WCAG accessibility compliance achieved
- Storybook component library for developer adoption
- Bootstrap-compatible implementation

**Use when positioning for**: Head of Design/Engineering roles emphasizing design systems, team building, and cross-org alignment

### 4. Usage Reports API / Sashimi (DataCite) — Backend Engineering Scale

**Situation**: Research institutions needed standardized usage metrics tracking, but reports exceeding 10MB caused system crashes and storage costs were high.

**Action**: Designed and delivered Sashimi — a Rails API implementing SUSHI protocol for usage reports at 50,000-dataset scale. Implemented hybrid S3/MySQL storage, JWT auth, on-the-fly compression, and intelligent report subsetting.

**Metrics**:
- **70% storage cost reduction** via hybrid S3/MySQL architecture
- **50,000-dataset scale** without performance degradation
- **10x faster processing** than previous manual methods
- Reports >10MB handled via compression and subsetting

**Tech**: Ruby on Rails, Amazon S3, MySQL, JWT, JSON Schema

**Use when positioning for**: Staff/Principal Engineer roles emphasizing distributed systems, API design, and cost optimization

### 5. Data Usage Processing Innovation (DataCite) — Product Design

**Situation**: Existing data usage processing services depended on weblogs, creating challenges for sharing across distributed borders.

**Action**: Led product design for a web tracker alternative. Conducted 85-response survey, facilitated Group Expert Walkthrough with 10 participants, used Figma wireframing and Gherkin syntax for acceptance criteria.

**Metrics**:
- 85 survey responses informing product direction
- 10 expert walkthrough participants validating design
- Comprehensive product spec delivered to engineering

## Technical Stack (by domain)

### AI/ML & LLMs
- LangChain, LlamaIndex, OpenAI APIs, Hugging Face Transformers
- SageMaker, pgvector, semantic search
- AI SDK, MCP (Model Context Protocol)
- Pydantic, FastAPI

### Backend & Infrastructure
- Python, Ruby, TypeScript, JavaScript, Node.js
- Ruby on Rails, FastAPI
- Docker, Kubernetes, AWS, Terraform
- Elasticsearch, MySQL, PostgreSQL, GraphQL
- Event-driven architecture, microservices
- APISIX (API gateway)

### Frontend & Design
- React, Vue.js
- Figma, Miro, Storybook
- Design systems, Atomic Design
- Bootstrap, Tailwind CSS

### Research & Data
- Persistent Identifiers (DOI, ORCID, ROR)
- Schema.org, FAIR data principles
- Open science, open data infrastructure
- SUSHI protocol, usage metrics

### Methods & Process
- Design thinking, Double Diamond
- Design sprints, Lego Serious Play
- Usability testing, contextual inquiry
- Scrum, Agile, DevOps, DesignOps

## Publications (selected by theme)

### LLMs & Scholarly Metadata
- "The Impact of Language User Interfaces on Finding Scholarly Repositories" (2023)
- "ParrotGPT: On the Advantages of Large Language Models Tools for Academic Metadata Schema Mapping" (2023)
- "Academic Publishing web forms meet your demise: The unstoppable rise of large language models" (2023)
- "Revolutionizing Metadata Schema Mapping with ChatGPT" (2022)
- "Breaking a Metadata Barrier: Improving discoverability with automatic subject classification" (2023)

### Design & UX
- "DataCite Design System is ready to be worn" (2023)
- "Refining our Thinking: How we are improving DataCite design processes" (2022)

### Research Infrastructure & PIDs
- "You shoulda put a PID on it: Leveraging the PID Graph for DMPs" (2021)
- "Are You There, Metadata? It's Me, the Bibliometrician" (2021)
- "The DataCite MDC Stack" (2020)
- "Datacite Citation Display: Unlocking Data Citations" (2020)
- "The FAIR Island Project: Tracking the impact of field station research" (2022)
- "New Research Work on COVID-19 as the pandemic develops" (2020)

### Data & Repositories
- "D4.7 Tools for finding and selecting certified repositories for researchers" (2022)
- "2021 FAIR Island Annual Report" (2022)

**Total**: 18+ publications spanning LLMs, metadata, PIDs, and open science.

## Side Projects (initiative signals)

| Project | What it shows |
|---------|---------------|
| **Dataset Discovery Agent** | AI agent for automating discovery/evaluation of open research datasets (AI SDK) |
| **Parrot GPT** | Python toolkit using GPT-3/3.5 for bibliographic metadata translation across schemas |
| **Election Program AI Analyser** | GPT-based tool simplifying 2025 Bundestag election programs for voters |
| **SnowyOwl** | Async AI dev tool: write task specs, receive completed PRs overnight |
| **Technology Radar** | Personal tech radar categorizing tools into Adopt/Trial tiers |
| **Kitchen Timer** | GPT Vision app extracting structured data from recipe photos |
| **CrossFit WOD Viewer** | AI-powered workout explanation and scaling tool |

## Dynamic Positioning Frames

Choose the frame based on each job posting's emphasis:

| Frame | When to use | Lead evidence |
|-------|-------------|---------------|
| **Lead/Principal Engineer** | Role emphasizes technical architecture, mentorship, system design | Query Translation API, Sashimi API, distributed systems |
| **Engineering Manager** | Role emphasizes cross-functional coordination, team building | Harvesting Services (56-person research), Design System (4-person team) |
| **Head of / Director** | Role owns a domain (Head of AI, Director of Infrastructure) | Combination: AI depth + infrastructure scale + design leadership |
| **Staff Engineer** | Role emphasizes deep IC work with org-wide influence | Publications record + production systems + cross-domain expertise |
