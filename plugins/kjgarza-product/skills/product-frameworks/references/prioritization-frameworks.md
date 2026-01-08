# Prioritization Frameworks

This reference provides detailed guidance on proven frameworks for prioritizing features, initiatives, and product decisions.

## RICE Scoring

### Definition
A quantitative method to prioritize features/initiatives by scoring them on Reach, Impact, Confidence, and Effort, then calculating a composite score.

### Components

#### Reach
How many users or events will this impact in a given time frame? (e.g., "5000 users/month would use this"). Higher reach means more potential value.

**How to estimate**:
- Review usage analytics for similar features
- Segment user base and estimate adoption rate
- Consider time frame (per month, per quarter)
- Use conservative estimates if uncertain

**Example scales**:
- Small feature: 100-1,000 users/quarter
- Medium feature: 1,000-10,000 users/quarter
- Large feature: 10,000+ users/quarter

#### Impact
How big of an effect will this have per user? This can be on a rough scale.

**Standard scale**:
- **3 = Massive impact**: Dramatically improves user value, solves major pain point
- **2 = High impact**: Significantly improves experience
- **1 = Medium impact**: Moderate improvement
- **0.5 = Low impact**: Small improvement
- **0.25 = Minimal impact**: Tiny enhancement

**Considerations**:
- User pain point severity
- Value created vs. existing alternatives
- Frequency of use
- Depth of improvement

#### Confidence
How confident are you in the accuracy of the reach and impact estimates? This guards against overly optimistic guesses.

**Scale**:
- **100% = High confidence**: Strong data, validated assumptions
- **80% = Medium confidence**: Some data, reasonable assumptions
- **50% = Low confidence**: Mostly assumptions, needs validation

**When to use each level**:
- 100%: Validated through research, analytics, or past similar features
- 80%: Directionally supported by data but not fully validated
- 50%: Hypothesis or early idea without much evidence

#### Effort
The cost to deliver this feature, typically in person-months or a similar unit for the team. Lower effort means a higher priority, all else equal.

**How to estimate**:
- Consult with engineering team
- Include design, development, QA, and deployment time
- Consider dependencies and risks
- Account for maintenance burden

**Example scales**:
- Small: 1-2 person-weeks
- Medium: 1-2 person-months
- Large: 3-6 person-months
- Extra large: 6+ person-months

### Calculating RICE Score

**Formula**: RICE Score = (Reach × Impact × Confidence) / Effort

**Example 1**:
- Reach: 1,000 users/quarter
- Impact: 3 (massive)
- Confidence: 80% (0.8)
- Effort: 2 person-weeks
- **Score**: (1,000 × 3 × 0.8) / 2 = **1,200**

**Example 2**:
- Reach: 5,000 users/quarter
- Impact: 1 (medium)
- Confidence: 90% (0.9)
- Effort: 8 person-weeks
- **Score**: (5,000 × 1 × 0.9) / 8 = **562.5**

Even though Example 2 reaches more users, Example 1 scores higher due to far greater impact and lower effort.

### Usage Guidelines

**Comparative, not absolute**: RICE scores are most useful for comparing items, not as absolute measures.

**Involve the team**: Get input from analytics for Reach, design/PM for Impact, and engineering for Effort to improve accuracy.

**Don't let numbers blindly dictate**: Use RICE as a guide. Strategic considerations may override pure scoring.

**Reassess regularly**: Confidence and estimates improve over time; update scores as you learn more.

## MoSCoW Method

### Definition
A simple categorization technique for requirements: Must have, Should have, Could have, Won't have. Often used in scoping to decide what goes into a release or MVP.

### Categories

#### Must-haves (M)
Non-negotiable essentials. If even one "must" requirement is missing, the product/feature is not viable.

**Characteristics**:
- Critical for launch
- Product fails without it
- Legal/regulatory requirements
- Core value proposition

**Example**: For a taxi app, riders must be able to request a ride.

**Keep this list minimal**: If everything is a must, you haven't actually prioritized.

#### Should-haves (S)
Important but not absolutely critical. If time/resources permit, these are next priority. Lack of a "should" may cause pain, but there's a workaround.

**Characteristics**:
- High value but not critical
- Painful to lack but manageable
- Significant user/business benefit
- Next in line after musts

**Example**: In-app chat with the driver – very useful, but if missing at launch, users could still manage via phone.

#### Could-haves (C)
Nice-to-have features or ideas. They have a relatively small impact. These are often the first to drop if schedule is tight.

**Characteristics**:
- Low impact on core experience
- Cosmetic or convenience improvements
- Niche use cases
- Easy to defer

**Example**: Theme customization, minor UI polish, edge case features.

#### Will not have (W)
Explicitly out of scope for this time frame. Listing these helps manage expectations (internally and with stakeholders).

**Characteristics**:
- Good ideas for later
- Out of scope for this release
- Too low priority given constraints
- Explicitly deferred

**Example**: "Will not include Android version in v1" (but may revisit in v2).

### Usage Guidelines

**In planning meetings**: Take your list of proposed features and assign each a category by consensus.

**Scope management**: Musts are the foundation of delivery plans; shoulds and coulds help prioritize the backlog if time allows more work.

**Clear communication**: This technique ensures everyone is clear on what's critical versus optional.

**Revisit regularly**: Something that was a "could" may become a "must" if circumstances change (e.g., regulatory requirement).

## Kano Model

### Concept
A framework to categorize product features by how they affect customer satisfaction.

### The Three Main Categories

#### 1. Basic Features (Must-haves/Threshold)
Fundamental expectations that customers take for granted. If these are absent, the user is extremely dissatisfied, but meeting them doesn't significantly increase satisfaction (it's just expected).

**Characteristics**:
- Baseline requirements
- Customers assume they exist
- Absence causes major dissatisfaction
- Presence doesn't create delight

**Example**: In a messaging app, the ability to send and receive messages is a must-have baseline.

**Implication**: These are table stakes. Must be satisfied first before anything else matters.

#### 2. Performance Features (One-dimensional/Satisfiers)
"More is better" features that directly affect satisfaction in proportion to how well the feature is executed. Users explicitly demand these.

**Characteristics**:
- Linear satisfaction relationship
- Better execution = higher satisfaction
- Competitive differentiators
- Customers can articulate demand

**Example**: Faster load times, better battery life, more storage – the better you deliver, the happier the user.

**Implication**: Invest here to differentiate and increase satisfaction proportionally.

#### 3. Delighters (Excitement features/Attractive)
Unexpected, pleasant surprises that can greatly delight users when present, but users don't miss them if absent. They often create "wow" moments.

**Characteristics**:
- Unexpected and innovative
- Disproportionate satisfaction when present
- No dissatisfaction when absent
- Create buzz and word-of-mouth

**Example**: When GIF support was first added to messaging apps (users didn't ask for it but loved it), fun animations, novel features.

**Note**: Delighters can become must-haves over time as they turn into industry standards. What was exciting yesterday becomes expected today.

### Using Kano for Planning

**Ensure all Must-haves are satisfied first**: They are ticket-to-entry. Users will not tolerate their absence.

**Then invest in Performance features**: These improve competitive differentiation or user satisfaction linearly.

**Sprinkle in Delighters**: To exceed user expectations and create buzz.

**Map features to categories**: When prioritizing, explicitly categorize each feature. For a new product, don't omit basic expectations. For an existing product, use Kano surveys or user feedback to discover what features might now delight users versus what's become expected.

### Kano Surveys

Ask users two questions per feature:
1. **Functional**: "How would you feel if this feature were present?"
2. **Dysfunctional**: "How would you feel if this feature were absent?"

Response options: I like it / I expect it / I'm neutral / I can tolerate it / I dislike it

Map responses to Kano categories based on the combination of answers.

## 80/20 Rule (Pareto Principle)

### Insight
Roughly 80% of effects come from 20% of causes. In product terms, a small set of features often drives the majority of usage or value. Likewise, a minority of bugs cause most crashes, etc.

### Implications for Product Management

**Prioritize the "vital few"**: Identify the core 20% of features that deliver 80% of user value or usage, and focus on making those excellent. For example, if users mainly use 2–3 functions of your app, ensure those are intuitive and performant.

**Trim or defer the "trivial many"**: Features that don't significantly impact the user's goals. Simpler products can be more usable (less cognitive load) and easier to maintain.

**Use analytics**: Find which tasks or pages are most frequented – these likely are the 20% that matter most.

**Bug fixing**: Tackle the top issues causing most trouble before edge cases.

### Application in Practice

**Feature analysis**:
- Identify which features drive 80% of usage
- Double down on improving those
- Consider deprecating rarely-used features

**Backlog prioritization**:
- In a backlog of 100 feature ideas, which few will yield the biggest payoff?
- Rank those higher
- Be comfortable saying "no" to the long tail

**Design focus**:
- Highlight the key elements most users need
- Hide or remove less-used controls
- Create clear visual hierarchy based on usage

**Problem-solving**:
- Which 20% of issues cause 80% of support tickets?
- Focus resolution efforts there first

## Combining Frameworks

### RICE + Kano
Use Kano to categorize features (Basic/Performance/Delighter), then use RICE to prioritize within each category. All basics must be covered, but within Performance features, RICE helps rank them.

### RICE + MoSCoW
Use MoSCoW for initial rough cut (Must/Should/Could), then apply RICE scoring to Should and Could items to create detailed priority order.

### Kano + Pareto
Use Pareto analysis to identify the vital few features driving value, then use Kano to understand which category they fall into (Basic/Performance/Delighter).

### Lifecycle-Aware Prioritization
Adjust prioritization based on product stage:
- **Introduction**: Focus on Must-haves (MoSCoW) and Basics (Kano)
- **Growth**: Balance Performance features with some Delighters
- **Maturity**: Optimize the vital 20% (Pareto), add Delighters to re-engage
- **Decline**: Maintain only the essential basics, reduce investment

## Decision Framework

When prioritizing, ask:

1. **Is this a Kano basic?** → If yes, it's required (MoSCoW Must)
2. **What's the RICE score?** → Use to rank non-basics
3. **Is this in the vital 20%?** → If yes, prioritize higher
4. **What's our lifecycle stage?** → Adjust strategy accordingly
5. **Can we validate assumptions?** → Lower confidence = higher risk

This multi-framework approach provides robust, evidence-based prioritization.

