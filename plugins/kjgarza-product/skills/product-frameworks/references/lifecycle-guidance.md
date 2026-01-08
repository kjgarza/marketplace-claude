# Product Lifecycle Guidance

This reference provides strategic guidance for different stages of the product lifecycle, helping tailor approaches to the current maturity of your product.

## Overview

Products generally move through four main stages over their market life (plus a preliminary development phase before launch). Each stage requires different strategic priorities, resource allocation, and success metrics.

## The Four Lifecycle Stages

### 1. Introduction Stage

#### Characteristics
- Product is launched to market
- Sales/users grow slowly initially
- High investment, low returns
- Focus on early adopters
- Establishing market fit

#### Strategic Priorities

**Market Validation**:
- Confirm product-market fit
- Gather early user feedback intensively
- Validate core value proposition
- Identify ideal customer profile

**Awareness Building**:
- Focus marketing on early adopters
- Build brand recognition
- Educate market about the solution
- Create initial case studies

**Product Refinement**:
- Iterate rapidly based on user feedback
- Fix critical bugs and usability issues
- Ensure core features work excellently
- Resist feature bloat – keep scope tight

#### Prioritization Strategy

**Must-haves only**: Focus on the minimum viable product. Ensure all Basic features (Kano Model) work flawlessly before adding Performance or Delighter features.

**High confidence items**: Stick to validated needs. Low confidence experiments are risky when establishing market presence.

**Quick wins**: Prioritize features that can be delivered quickly to accelerate learning cycles.

**User research intensive**: Invest heavily in understanding why users adopt (or don't).

#### Key Metrics
- User acquisition rate
- Activation and onboarding completion
- Early retention (Day 1, Day 7)
- Customer satisfaction (NPS, CSAT)
- Product-market fit score
- Feedback quality and frequency

#### Resource Allocation
- 60% core feature stability and quality
- 30% user research and iteration
- 10% growth experiments

### 2. Growth Stage

#### Characteristics
- Product proves its value
- User adoption increases rapidly
- Revenue growth accelerates
- Competitors emerge or intensify
- Scaling challenges appear

#### Strategic Priorities

**Scale Operations**:
- Improve infrastructure and performance
- Handle increased load gracefully
- Optimize costs as usage grows
- Build operational efficiency

**Differentiation**:
- Add features that competitors lack
- Strengthen unique value proposition
- Build defensible advantages (network effects, data, integrations)
- Expand to adjacent use cases

**Market Expansion**:
- Reach broader audiences beyond early adopters
- Enter new market segments
- Expand geographic reach
- Develop partnerships and channels

**User Success**:
- Improve onboarding and activation
- Reduce time to value
- Build self-service resources
- Establish customer success programs

#### Prioritization Strategy

**Balance quick wins with strategic bets**: Use RICE scoring heavily. High reach features matter more now.

**Performance features (Kano)**: Invest in features that linearly improve satisfaction and differentiate from competitors.

**Some delighters**: Add unexpected features that create wow moments and word-of-mouth.

**Scalability investments**: Technical debt and infrastructure must keep pace with growth.

#### Key Metrics
- Monthly Active Users (MAU) growth rate
- Customer Acquisition Cost (CAC)
- Activation rate and time to value
- User retention curves
- Revenue growth rate
- Market share gains
- Net Promoter Score (NPS)

#### Resource Allocation
- 40% new features and differentiation
- 25% infrastructure and scalability
- 20% user experience improvements
- 15% growth marketing and expansion

### 3. Maturity Stage

#### Characteristics
- Growth stabilizes and slows
- Market saturation in core segments
- Revenue is high but growth is low
- Intense competition
- User base is large and diverse

#### Strategic Priorities

**Optimization and Retention**:
- Fine-tune user experience
- Reduce friction and pain points
- Improve engagement and stickiness
- Prevent churn to competitors

**Efficiency**:
- Reduce costs and improve margins
- Automate operations
- Streamline workflows
- Technical debt paydown

**Incremental Innovation**:
- Refresh and modernize
- Add depth to existing features
- Serve power users better
- Find niche opportunities

**Diversification**:
- Explore adjacent markets
- Build platform capabilities
- Develop complementary products
- Create ecosystem value

#### Prioritization Strategy

**Pareto principle heavily**: Focus on the vital 20% of features driving 80% of value. Optimize those ruthlessly.

**Retention over acquisition**: Features that reduce churn are more valuable than features for new users.

**Efficiency wins**: Features that reduce support burden, improve self-service, or cut costs have compounding value.

**Strategic experiments**: Use freed-up resources to explore reinvention or new opportunities.

#### Key Metrics
- Customer Lifetime Value (LTV)
- Churn rate and retention cohorts
- Engagement depth (DAU/MAU ratio)
- Net Revenue Retention (NRR)
- Operational efficiency metrics
- Customer satisfaction and loyalty
- Margin and profitability

#### Resource Allocation
- 35% optimization and retention
- 25% efficiency and cost reduction
- 20% incremental innovation
- 20% strategic experiments and new opportunities

### 4. Decline Stage

#### Characteristics
- Usage or sales decline
- Market saturation or technology shift
- Competitive pressure or obsolescence
- Negative or flat growth
- Question of product viability

#### Strategic Priorities

**Harvest or Exit**:
- Maximize remaining value
- Reduce investment and costs
- Focus on profitable customer segments
- Prepare for eventual sunset

**Find Niche**:
- Identify loyal user segments
- Serve specific use cases well
- Maintain but don't expand
- Become "stable legacy" product

**Reinvention**:
- Pivot to new market or use case
- Major redesign or repositioning
- Technology refresh or modernization
- Merge with other products

**Graceful Sunset**:
- Plan end-of-life strategy
- Support user migration
- Preserve data and value
- Maintain brand reputation

#### Prioritization Strategy

**Minimal investment**: Only critical bug fixes and security updates for harvest strategy.

**Niche focus**: If serving remaining users, focus ruthlessly on their specific needs.

**Bold bets**: If reinventing, be willing to make major changes. Incremental won't save a declining product.

**User respect**: Prioritize migration tools, data export, and communication if sunsetting.

#### Key Metrics
- Remaining user base size
- Profitability and margins
- Support costs
- Competitive alternatives usage
- User sentiment
- Churn rate among remaining users

#### Resource Allocation

**For harvest**:
- 70% cost reduction and efficiency
- 20% critical maintenance
- 10% migration support

**For reinvention**:
- 60% new vision and major changes
- 30% validation and testing
- 10% maintaining existing product

## Lifecycle-Aware Prioritization Examples

### Same Feature, Different Stages

**Feature**: Advanced analytics dashboard

**Introduction stage**: 
- Priority: Low (Could have)
- Rationale: Users need basic features first. Analytics can wait.

**Growth stage**:
- Priority: High (Should have)
- Rationale: Power users need visibility. Helps with expansion sales.

**Maturity stage**:
- Priority: Medium (Could have)
- Rationale: Only if it serves the vital 20% of users or reduces churn.

**Decline stage**:
- Priority: Very low (Won't have)
- Rationale: No ROI on new features. Focus on cost reduction.

### Budget Allocation by Stage

| Category | Introduction | Growth | Maturity | Decline |
|----------|-------------|--------|----------|---------|
| Core features | 60% | 40% | 35% | 20% |
| Infrastructure | 10% | 25% | 25% | 10% |
| Growth/Expansion | 5% | 20% | 10% | 0% |
| Optimization | 15% | 15% | 30% | 10% |
| Innovation/Experiments | 10% | 15% | 20% | 60%* |

*In decline, innovation is either minimal (harvest) or maximal (reinvention)

## Determining Your Product's Stage

### Quantitative Indicators

**Growth rate**:
- >50% YoY: Likely Growth
- 10-50% YoY: Late Growth or Early Maturity
- 0-10% YoY: Maturity
- <0% YoY: Decline

**Market penetration**:
- <10% of TAM: Introduction
- 10-40% of TAM: Growth
- 40-70% of TAM: Maturity
- >70% of TAM: Late Maturity or Decline

**Competitive intensity**:
- Few competitors: Introduction
- Competitors entering: Growth
- Many established competitors: Maturity
- Consolidation happening: Decline

### Qualitative Indicators

**User feedback patterns**:
- Introduction: "Is this for me?" "How does this work?"
- Growth: "Can it do X?" "I need it for Y use case"
- Maturity: "Why doesn't it have feature X that competitor has?"
- Decline: "I'm switching to Z" or silence

**Team focus**:
- Introduction: Product-market fit experiments
- Growth: Scaling and feature expansion
- Maturity: Optimization and efficiency
- Decline: Maintenance or reinvention debates

## Using Lifecycle Context in Commands

When using product management commands, consider lifecycle stage:

### `/analyze-feature-request`
- Introduction: Bias toward features validating core value prop
- Growth: Favor features with high reach and differentiation
- Maturity: Prioritize retention impact over acquisition
- Decline: Question whether any new features make sense

### `/prioritize-backlog`
- Introduction: Ruthlessly cut everything but essentials
- Growth: Balance quick wins with strategic bets
- Maturity: Apply Pareto heavily, focus on vital 20%
- Decline: Minimal investment unless reinventing

### `/create-prd`
- Introduction: Include extensive user research validation
- Growth: Emphasize scalability and competitive analysis
- Maturity: Focus on business case and efficiency gains
- Decline: Require very strong justification or reinvention vision

## Lifecycle Transitions

### Introduction → Growth
- Validate product-market fit before scaling
- Ensure core experience is solid
- Have infrastructure plan ready
- Prepare for competitive response

### Growth → Maturity
- Don't chase growth at all costs
- Build sustainable margins
- Invest in retention and efficiency
- Develop next growth vectors

### Maturity → Decline
- Recognize declining economics early
- Make clear strategic choice (harvest/niche/reinvent)
- Don't incrementally invest in declining product
- Consider sunsetting with dignity

### Avoiding Decline
- Reinvest in maturity (don't milk too much)
- Continuous innovation and refresh
- Expand to adjacent markets
- Build platform and ecosystem
- Stay ahead of technology shifts

## Summary

Product lifecycle stage profoundly affects prioritization, resource allocation, and strategic choices. Always consider where your product is in its lifecycle when making product decisions. What works in one stage may be wrong for another. Use lifecycle awareness to contextualize other frameworks (RICE, Kano, MoSCoW) for better decisions.

