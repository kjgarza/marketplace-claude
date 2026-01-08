---
description: Prioritize backlog items using RICE and other PM frameworks
argument-hint: [backlog items or context]
---

# Prioritize Backlog

Apply prioritization frameworks to: **$ARGUMENTS**

## Your Task

Systematically prioritize the backlog items above using proven PM frameworks. Produce a ranked list with RICE scores, priority tiers, and actionable recommendations for sprint/quarter planning.

## Steps

1. **Gather Backlog Items**
   - Parse "$ARGUMENTS" for backlog items to prioritize
   - Search Coda for roadmap and backlog documents
   - Review Dovetail for user research supporting items
   - Identify stakeholder requests

2. **Score Each Item**
   - Apply RICE framework (Reach, Impact, Confidence, Effort)
   - Consider strategic alignment
   - Factor in dependencies
   - Assess urgency vs. importance

3. **Apply Prioritization Framework**
   
   **RICE Scoring (Primary):**
   - **Reach**: How many users per quarter?
   - **Impact**: Minimal (0.25), Low (0.5), Medium (1), High (2), Massive (3)
   - **Confidence**: High (100%), Medium (80%), Low (50%)
   - **Effort**: Person-months estimate
   - **Score**: (Reach × Impact × Confidence) / Effort
   
   **Kano Model (Context):**
   - Categorize features as Basic/Performance/Delighter
   - Ensure all Basics are covered first
   - Balance Performance features with some Delighters
   
   **Pareto Principle (80/20 Rule):**
   - Identify the vital 20% of features driving 80% of value
   - Focus on optimizing high-impact features
   
   **Lifecycle-Aware Prioritization:**
   - Adjust strategy based on product stage (Introduction/Growth/Maturity/Decline)
   - Introduction: Focus on must-haves and validation
   - Growth: Balance quick wins with strategic bets
   - Maturity: Apply Pareto heavily, optimize vital 20%
   
   **Reference**: See [product-frameworks](../skills/product-frameworks/) skill for detailed frameworks:
   - [prioritization-frameworks.md](../skills/product-frameworks/references/prioritization-frameworks.md) for RICE, MoSCoW, Kano, Pareto
   - [lifecycle-guidance.md](../skills/product-frameworks/references/lifecycle-guidance.md) for stage-specific strategies

4. **Consider Additional Factors**
   - Strategic initiatives and OKRs
   - Technical debt and maintenance
   - Competitive pressure
   - Regulatory or security requirements
   - Quick wins vs. long-term investments

5. **Generate Prioritized List**
   - Rank by RICE score
   - Group into priority tiers (P0-P3)
   - Suggest sprint/quarter assignments
   - Identify trade-offs and dependencies

## Prioritization Frameworks

### RICE Framework (Primary)
Best for comparing diverse features objectively. Provides quantitative scoring for data-driven decisions.

**Detailed guidance**: [prioritization-frameworks.md](../skills/product-frameworks/references/prioritization-frameworks.md)

### Kano Model (Supplementary)
Categorizes features by customer satisfaction impact:
- **Basic Features (Must-haves)**: Absence causes dissatisfaction, presence is expected
- **Performance Features (Satisfiers)**: More is better, linear satisfaction
- **Delighters (Exciters)**: Unexpected features that create wow moments

**When to use**: Ensure basic features are covered before adding delighters. In mature products, focus on performance features and sprinkle delighters.

**Detailed guidance**: [prioritization-frameworks.md](../skills/product-frameworks/references/prioritization-frameworks.md)

### Pareto Principle (80/20 Rule)
Identify the 20% of features that drive 80% of user value.

**Application**: 
- Focus optimization on high-usage features
- Consider deprecating rarely-used features
- In mature products, ruthlessly focus on the vital few

**Detailed guidance**: [prioritization-frameworks.md](../skills/product-frameworks/references/prioritization-frameworks.md)

### Lifecycle-Aware Prioritization
Adjust prioritization based on product stage:

**Introduction**: 
- Must-haves only, keep scope tight
- High confidence items, minimize risk
- Focus on product-market fit validation

**Growth**:
- Balance quick wins with strategic bets
- Invest in differentiation and scalability
- High reach features matter more

**Maturity**:
- Pareto principle heavily (optimize vital 20%)
- Retention over acquisition features
- Efficiency and cost reduction

**Decline**:
- Minimal investment (harvest) or bold bets (reinvention)
- Only critical fixes unless pivoting

**Detailed guidance**: [lifecycle-guidance.md](../skills/product-frameworks/references/lifecycle-guidance.md)

### MoSCoW Method (Supporting)
- **Must have**: Critical for launch
- **Should have**: Important but not critical
- **Could have**: Nice to have
- **Won't have**: Out of scope

### Value vs. Effort Matrix
Plot items on 2x2 matrix:
- High value, low effort → Do first (quick wins)
- High value, high effort → Plan carefully
- Low value, low effort → Do if time permits
- Low value, high effort → Don't do

## Output Format

### Prioritized Backlog

| Rank | Feature | RICE Score | Priority | Quarter | Rationale |
|------|---------|------------|----------|---------|-----------|
| 1 | Feature A | 85 | P0 | Q1 | High user demand, low effort |
| 2 | Feature B | 72 | P0 | Q1 | Strategic initiative |
| 3 | Feature C | 45 | P1 | Q2 | Good impact, higher effort |

### Priority Tiers

**P0 - Critical (Do Now)**
- Features essential for product strategy
- High RICE scores (>70)
- Blocking other initiatives

**P1 - High Priority (Do Next)**
- Important features with strong justification
- RICE scores 40-70
- Clear user value

**P2 - Medium Priority (Do Later)**
- Nice-to-have features
- RICE scores 20-40
- Enhancement opportunities

**P3 - Low Priority (Consider)**
- Nice-to-have with unclear impact
- RICE scores <20
- Defer or decline candidates

### Supporting Evidence
For each high-priority item:
- User research insights (Dovetail links)
- Usage data or analytics
- Competitive context
- Strategic alignment

### Recommendations
- Suggested sprint planning
- Resource allocation advice
- Risk callouts
- Trade-off decisions

## Examples

### Example 1: Sprint Planning
```
User: "We have 25 backlog items. Help me prioritize for next sprint."

[Command analyzes]:
- Scores each item with RICE
- Searches Dovetail for supporting research
- Considers team capacity
- Recommends top 5-7 items for sprint
```

### Example 2: Quarterly Roadmap
```
User: "Prioritize our backlog for Q2 planning"

[Command generates]:
- Full RICE scoring for all items
- Groups into quarters
- Identifies dependencies
- Suggests quarterly themes
```

## Best Practices

### Do:
- Be transparent about scoring methodology
- Ground decisions in user research and data
- Consider opportunity cost
- Review and update priorities regularly
- Communicate trade-offs clearly
- Factor in team velocity and capacity

### Don't:
- Prioritize solely by stakeholder requests
- Ignore technical debt
- Overlook quick wins
- Forget to validate assumptions
- Neglect to communicate decisions

## Common Pitfalls

1. **HiPPO (Highest Paid Person's Opinion)**
   - Solution: Use data-driven frameworks like RICE

2. **Feature Bloat**
   - Solution: Ruthlessly cut low-impact items

3. **Ignoring Technical Debt**
   - Solution: Reserve 20% capacity for maintenance

4. **Analysis Paralysis**
   - Solution: Set time limits for prioritization exercises

5. **Shifting Priorities**
   - Solution: Define stable planning horizons (quarters)

## Related Commands

- [/analyze-feature-request](analyze-feature-request.md) - Deep dive on specific features
- [/create-prd](create-prd.md) - Document high-priority features
- [/search-user-research](search-user-research.md) - Find supporting evidence

## Framework References

For detailed guidance on prioritization methods:
- **RICE, MoSCoW, Kano, Pareto**: [prioritization-frameworks.md](../skills/product-frameworks/references/prioritization-frameworks.md)
- **Lifecycle-aware strategies**: [lifecycle-guidance.md](../skills/product-frameworks/references/lifecycle-guidance.md)
- **Combining frameworks**: [prioritization-frameworks.md](../skills/product-frameworks/references/prioritization-frameworks.md) (Decision Framework section)

## Checklist

Before finalizing prioritization:
- [ ] All items scored with consistent framework
- [ ] User research consulted for evidence
- [ ] Strategic alignment verified
- [ ] Dependencies identified
- [ ] Team capacity considered
- [ ] Trade-offs documented
- [ ] Stakeholders aligned
- [ ] Rationale documented for decisions

