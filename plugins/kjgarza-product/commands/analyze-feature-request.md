---
description: Analyze a feature request using RICE, Kano, and other PM frameworks
argument-hint: [feature request description]
---

# Analyze Feature Request

Evaluate this feature request using PM frameworks: **$ARGUMENTS**

## Your Task

Analyze the feature request above to determine its viability, impact, and strategic fit. Use the frameworks below to produce a data-driven recommendation on whether to pursue this opportunity.

## Steps

1. **Gather Context**
   - Parse the feature request "$ARGUMENTS" for key details
   - Search for related user research in Dovetail
   - Check Coda for any existing PRDs or roadmap items
   - Review any relevant technical documentation

2. **Apply Product Frameworks**
   - Use RICE scoring (Reach, Impact, Confidence, Effort)
   - Apply Kano Model to categorize feature type (Basic/Performance/Delighter)
   - Apply Jobs-to-be-Done framework to understand user needs
   - Consider product lifecycle stage for context-appropriate prioritization
   - Evaluate against current product strategy and OKRs
   - Apply 80/20 rule: Is this in the vital 20% that drives value?
   - Consider competitive landscape
   
   **Reference**: See [product-frameworks](../skills/product-frameworks/) skill for detailed guidance on:
   - Prioritization frameworks (RICE, Kano, Pareto)
   - Lifecycle-aware prioritization strategies

3. **Analyze Impact**
   - Estimate user reach (how many users affected)
   - Assess impact on user value (1-3 scale: minimal, moderate, massive)
   - Evaluate business impact (revenue, retention, acquisition)
   - Consider strategic alignment with product vision

4. **Assess Feasibility**
   - Technical complexity and dependencies
   - Resource requirements (engineering, design, PM time)
   - Timeline estimates
   - Risk factors and constraints

5. **Generate Recommendation**
   - Present RICE score with breakdown
   - Recommend priority level (P0-P3)
   - Suggest next steps (build, research more, defer, decline)
   - Identify key assumptions to validate

## Output Format

Present the analysis in a structured format:

### Feature Summary
- **Request**: [Brief description]
- **Requested by**: [Source]
- **Strategic alignment**: [How it fits strategy]

### RICE Score Analysis
- **Reach**: [Number of users/quarter]
- **Impact**: [0.25-3 scale: 3=Massive, 2=High, 1=Medium, 0.5=Low, 0.25=Minimal]
- **Confidence**: [Percentage: 100%=High, 80%=Medium, 50%=Low]
- **Effort**: [Person-months estimate]
- **Final RICE Score**: [Calculated: (Reach × Impact × Confidence) / Effort]

### Kano Model Classification
- **Category**: [Basic/Performance/Delighter]
- **Rationale**: [Why this classification]
- **Implication**: [What this means for prioritization]

### Lifecycle Context
- **Product stage**: [Introduction/Growth/Maturity/Decline]
- **Stage-appropriate priority**: [How lifecycle affects this feature's priority]

### Supporting Evidence
- User research insights from Dovetail
- Competitive analysis
- Usage data or analytics
- Strategic objectives

### Recommendation
- **Priority**: [P0/P1/P2/P3]
- **Decision**: [Build/Research/Defer/Decline]
- **Rationale**: [Key reasons for recommendation]
- **Next steps**: [Actionable items]
- **Risks**: [Key risks and mitigations]

## Examples

### Example 1: User-Requested Feature
```
User: "We've had 10 customers request bulk export functionality"

[Command analyzes]:
- Searches Dovetail for export-related feedback
- Checks Coda for roadmap and PRD status
- Calculates RICE score
- Provides prioritization recommendation
```

### Example 2: Competitive Feature
```
User: "Competitor X just launched real-time collaboration. Should we build this?"

[Command analyzes]:
- Reviews strategic positioning
- Assesses user demand from research
- Evaluates effort vs. impact
- Recommends whether to pursue
```

## Best Practices

- Ground analysis in user research data, not just opinions
- Be transparent about confidence levels and assumptions
- Consider opportunity cost (what else could we build)
- Include both quantitative and qualitative factors
- Make clear, actionable recommendations
- Document key assumptions for future reference

## Related Commands

- [/create-prd](create-prd.md) - Create a PRD if feature is approved
- [/prioritize-backlog](prioritize-backlog.md) - Compare against other backlog items
- [/search-user-research](search-user-research.md) - Find supporting evidence in Dovetail

## Framework References

For deeper understanding of the frameworks used:
- **RICE Scoring**: [prioritization-frameworks.md](../skills/product-frameworks/references/prioritization-frameworks.md)
- **Kano Model**: [prioritization-frameworks.md](../skills/product-frameworks/references/prioritization-frameworks.md)
- **Pareto Principle**: [prioritization-frameworks.md](../skills/product-frameworks/references/prioritization-frameworks.md)
- **Lifecycle Guidance**: [lifecycle-guidance.md](../skills/product-frameworks/references/lifecycle-guidance.md)
- **Jobs-to-be-Done**: [requirements.md](../skills/product-frameworks/references/requirements.md)

