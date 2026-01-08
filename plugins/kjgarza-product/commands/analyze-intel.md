---
description: Analyze the relevance of new information (text, link, or document) to the current product/project
argument-hint: [URL, text, or description of new information]
---

# Analyze Intelligence

Analyze the relevance and implications of: **$ARGUMENTS**

## Purpose

This command helps product teams quickly assess whether new information—market news, competitor updates, research papers, user feedback, technology announcements, or any other signal—is relevant to their product strategy and requires action.

## Your Task

Systematically analyze the provided information and produce a structured relevance assessment with clear recommendations on whether and how to act as well as a few comments to share with the team.

## Steps

### 1. Resolve the Information

**If URL provided:**
- Fetch and extract the content using WebFetch
- Identify the source type (news article, blog post, research paper, documentation, social media, etc.)
- Note publication date and author credibility

**If text provided:**
- Parse the key claims and information
- Identify the source if mentioned
- Note any context clues

**If reference to a document:**
- Read the document from the filesystem
- Extract key points and claims

### 2. Understand Current Product Context

- Review CLAUDE.md for project context
- Check recent standup notes or documentation for current priorities
- Identify the product's:
  - Current stage (ideation, development, launch, growth, maturity)
  - Target users and personas
  - Key value propositions
  - Active hypotheses being tested
  - Known risks and concerns

### 3. Assess Relevance

Score the information across multiple dimensions:

| Dimension | Score (1-5) | Criteria |
|-----------|-------------|----------|
| **Direct Relevance** | | Does this directly affect our product, users, or market? |
| **Timing Urgency** | | Do we need to act now, soon, or can this wait? |
| **Competitive Impact** | | Does this change our competitive position? |
| **Strategic Alignment** | | Does this affect our strategy or validate/invalidate assumptions? |
| **User Impact** | | Does this change what our users need or expect? |

**Overall Relevance Score:** Average of dimensions (1-5)
- **5 - Critical:** Requires immediate attention and likely action
- **4 - High:** Should be discussed this week, may require action
- **3 - Moderate:** Worth noting, discuss when relevant
- **2 - Low:** Tangentially related, file for future reference
- **1 - Minimal:** Not relevant to current product focus

### 4. Identify Implications

For relevant information, analyze:

**Opportunities:**
- Does this create new possibilities for the product?
- Can we leverage this for competitive advantage?
- Does this validate our direction?

**Threats:**
- Does this invalidate assumptions we're making?
- Does this create competitive pressure?
- Does this introduce new risks?

**Dependencies:**
- Does this affect our technical approach?
- Does this change our timeline?
- Does this require new capabilities?

### 5. Generate Recommendations

Based on relevance and implications, recommend:

**Action Level:**
- 🔴 **Act Now** — Immediate response required
- 🟡 **Act Soon** — Address within 1-2 weeks
- 🟢 **Monitor** — Track but no immediate action
- ⚪ **Archive** — Note for reference, no action needed

**Specific Actions:**
- Who should be informed?
- What decisions need to be made?
- What additional research is needed?
- How does this affect current priorities?

## Output Format

### Intelligence Brief

```markdown
## Summary
[2-3 sentence summary of the information and its source]

## Source Assessment
- **Type:** [News/Research/Competitor/Technology/User Feedback/Regulatory/Other]
- **Credibility:** [High/Medium/Low] — [Rationale]
- **Freshness:** [Publication date and timeliness]

## Relevance Assessment

| Dimension | Score | Rationale |
|-----------|-------|-----------|
| Direct Relevance | X/5 | [Brief explanation] |
| Timing Urgency | X/5 | [Brief explanation] |
| Competitive Impact | X/5 | [Brief explanation] |
| Strategic Alignment | X/5 | [Brief explanation] |
| User Impact | X/5 | [Brief explanation] |

**Overall Score:** X/5 — [Critical/High/Moderate/Low/Minimal]

## Key Implications

### Opportunities
- [Opportunity 1]
- [Opportunity 2]

### Threats
- [Threat 1]
- [Threat 2]

### Assumptions Affected
- [Assumption that may need revisiting]

## Recommendations

**Action Level:** [🔴 Act Now / 🟡 Act Soon / 🟢 Monitor / ⚪ Archive]

**Recommended Actions:**
1. [Specific action with owner if known]
2. [Specific action]

**Discussion Points:**
- [Question to raise with team]

**Related To:**
- [Current initiative or workstream this relates to]
```

## Information Type Frameworks

### Competitor Intelligence

When analyzing competitor news:
- What specifically did they ship/announce?
- Does this overlap with our roadmap?
- Does this change user expectations in our market?
- What's their apparent strategy?
- How does their approach differ from ours?

### Technology Updates

When analyzing technology changes:
- Does this enable something we couldn't do before?
- Does this obsolete our current approach?
- What's the adoption timeline?
- What's the integration effort?

### User Research / Feedback

When analyzing user signals:
- Does this validate or challenge our assumptions?
- Is this representative or anecdotal?
- How does this compare to our current understanding?
- What questions does this raise?

### Market / Industry News

When analyzing market changes:
- Does this expand or contract our addressable market?
- Does this change buyer behavior or priorities?
- Are there regulatory implications?
- What's the timeline for impact?

### Academic Research

When analyzing research papers:
- What problem does this solve?
- Is this applicable to our domain?
- What's the maturity level (theory vs. applied)?
- Who are the authors and institutions?

## Examples

### Example 1: Competitor Announcement
```
User: /analyze-intel https://techcrunch.com/competitor-launches-ai-writing-assistant

[Command analyzes]:
- Fetches article content
- Identifies competitor and feature set
- Compares to current product roadmap
- Assesses overlap and differentiation
- Recommends team discussion points
```

### Example 2: User Feedback
```
User: /analyze-intel "Three users this week mentioned they want real-time collaboration in the editor"

[Command analyzes]:
- Parses the feedback
- Checks against current user research
- Assesses alignment with roadmap
- Evaluates effort vs. impact
- Recommends whether to investigate further
```

### Example 3: Technology Change
```
User: /analyze-intel OpenAI just released a new model with 2x context window

[Command analyzes]:
- Identifies technical implications
- Assesses impact on current architecture
- Evaluates migration effort
- Recommends adoption timeline
```

### Example 4: Research Paper
```
User: /analyze-intel https://arxiv.org/abs/2024.12345 - new approach to claim detection

[Command analyzes]:
- Fetches and parses paper abstract/content
- Assesses applicability to product
- Compares to current approach
- Evaluates implementation feasibility
- Recommends whether to investigate or adopt
```

## Decision Tree

```
Is the information directly about our product/users/market?
├── Yes → High baseline relevance, proceed with full analysis
└── No → Is it about adjacent space or enabling technology?
    ├── Yes → Moderate baseline, assess indirect implications
    └── No → Low baseline, quick scan for any connection
        ├── Connection found → Elevate to moderate, analyze
        └── No connection → Archive with minimal analysis
```

## Integration with Product Process

After analysis, consider:

- **If high relevance:** Add to next standup/planning discussion
- **If affects roadmap:** Update backlog, use [/prioritize-backlog](prioritize-backlog.md)
- **If raises questions:** Use [/search-user-research](search-user-research.md) for context
- **If new feature idea:** Use [/analyze-feature-request](analyze-feature-request.md)
- **If validated need:** Use [/create-prd](create-prd.md) to document

## Quality Checklist

Before finalizing analysis:
- [ ] Source credibility assessed
- [ ] Information recency noted
- [ ] Current product context considered
- [ ] All relevance dimensions scored
- [ ] Implications (opportunities + threats) identified
- [ ] Clear action recommendation provided
- [ ] Owner/stakeholder identified if action needed
- [ ] Related initiatives or workstreams noted

## Common Pitfalls

1. **Overreacting to noise**
   - Solution: Assess source credibility and sample size

2. **Underreacting to weak signals**
   - Solution: Look for patterns across multiple signals

3. **Competitor obsession**
   - Solution: Always bring back to user value

4. **Analysis paralysis**
   - Solution: Time-box analysis, make a call

5. **Ignoring timing**
   - Solution: Explicitly assess urgency vs. importance

## Related Commands

- [/analyze-feature-request](analyze-feature-request.md) — Deep dive on feature ideas
- [/prioritize-backlog](prioritize-backlog.md) — Reprioritize if needed
- [/search-user-research](search-user-research.md) — Find supporting context
- [/create-prd](create-prd.md) — Document if action needed
