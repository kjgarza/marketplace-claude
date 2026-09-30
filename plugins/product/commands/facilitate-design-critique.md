---
description: Facilitate a structured design critique session with constructive feedback
argument-hint: [design artifact or link]
---

# Facilitate Design Critique

Provide structured design critique for: **$ARGUMENTS**

## Your Task

Review the design artifact above and provide constructive feedback using established critique frameworks. Structure your feedback to improve design quality while focusing on goals and user needs.

## Purpose

Design critique is a structured process to collaboratively improve design work by providing feedback tied to goals and user needs. The aim is to enhance the design, not judge the designer.

## Steps

### 1. Pre-Critique Preparation

**Define Scope for "$ARGUMENTS"**:
- What artifacts are being critiqued? (wireframes, mockups, prototype, flows)
- What stage is the design in? (early exploration, near-final)
- What specific feedback questions does the designer have?

**Set Objectives**:
- What user goals should this design achieve?
- What business goals?
- What constraints or requirements apply?

**Share Materials**:
- Distribute design artifacts in advance
- Include context (user research, requirements, design rationale)
- Give reviewers time to examine before the session

**Invite Participants**:
- Include cross-functional perspectives (engineering, product, design, QA)
- Aim for 4-8 participants (enough diversity, not too crowded)
- Ensure all understand critique guidelines

### 2. Session Structure (45-60 minutes)

**Designer Presents (5-10 minutes)**:
- Context: problem being solved, user needs, goals
- Design rationale: key decisions and trade-offs
- Specific questions for feedback

**Clarifying Questions (5 minutes)**:
- Ask questions to understand, not to critique yet
- "What user segment is this for?"
- "What's the expected flow into this screen?"

**Feedback Round (20-30 minutes)**:
- Use structured facilitation method (see below)
- Focus on objectives and goals
- Balance positives and areas for improvement
- Tie feedback to user/business impact

**Designer Responds (5 minutes)**:
- Designer can clarify intent
- Ask follow-up questions
- Note action items

**Wrap-up (5 minutes)**:
- Summarize key feedback themes
- Identify action items with owners
- Decide what will change vs. what won't
- Thank participants

### 3. Document and Follow-up

**Capture**:
- Key feedback points
- Action items with owners
- Decisions made
- Open questions

**Designer Iterates**:
- Incorporate feedback
- Make design changes
- Prepare for next review if needed

## Facilitation Methods

Choose a method that fits your team culture and session goals.

### Round-Robin
Each person gives feedback in turn. Ensures all voices are heard.

**Process**:
1. Go around the table/video call
2. Each person shares 1-3 observations
3. Can pass if nothing new to add
4. Multiple rounds if needed

### I Like, I Wish, What If
Structured feedback format that balances positive and constructive.

**Format**:
- **I like**: What's working well
- **I wish**: What could be improved (framed as aspiration)
- **What if**: Suggestions for exploration

**Example**:
- "I like how the navigation is clean and minimal"
- "I wish the key CTA was more prominent"
- "What if we tried a contrasting color for the primary action?"

### Goal-Based Critique
Frame all feedback relative to specific goals.

**Process**:
1. List the design goals
2. For each goal, discuss: Does the design achieve it?
3. Where gaps exist, suggest improvements
4. Ignore issues unrelated to stated goals (out of scope)

## Critique Ground Rules

Establish these rules at the start of each session:

### 1. Tie Feedback to Goals
Always relate comments to whether the design meets user needs and business goals.

**Good**: "This element might not align with the goal of quick signup, because the extra step adds friction"
**Bad**: "I don't like this color"

### 2. Be Specific and Candid
Point out exactly what and where you see an issue or something good.

**Good**: "The contrast between text and background measures 2.8:1, which doesn't meet WCAG AA standards (4.5:1 required)"
**Bad**: "The colors don't work"

### 3. Balance Positives and Negatives
Note what is working well, not only problems.

**Example**: "The information hierarchy is clear (positive). The submit button is small and might be missed (issue)."

### 4. Problems Before Solutions
Identify what isn't working and why, then suggest fixes.

**Approach**:
1. "Users might overlook the Save button" (identify problem)
2. "It's at the bottom and blends in" (diagnose why)
3. "What if we made it more prominent or moved it to the header?" (suggest)

### 5. Suggest, Don't Mandate
Phrase ideas as suggestions ("What if...") not commands ("Change this to...").

**Good**: "What if we tried making the CTA button larger?"
**Bad**: "Make that button bigger"

### 6. Critique the Work, Not the Person
Focus on the design artifact, never on the designer's abilities.

**Good**: "This button placement might make it hard for users to find"
**Bad**: "You should have known to put the button there"

## Using Frameworks in Critique

Reference established design principles and frameworks to ground feedback objectively:

### Design Principles

**Hick's Law**: "This screen presents 8 equally-weighted actions, which might increase decision time. Could we highlight the primary action?"

**Fitts's Law**: "The submit button is small and far from the form fields. Making it larger and closer might improve completion rate."

**Affordances**: "These text elements look like links but aren't clickable. That might confuse users."

**Feedback principle**: "When users click save, there's no visible confirmation. Adding feedback would reassure users."

**Reference**: See [design-principles.md](../skills/product-frameworks/references/design-principles.md) for detailed heuristics.

### Product Frameworks

**Jobs-to-be-Done**: "The job users are trying to do is quickly find articles. This design requires 3 clicks to start a search. Could we make search more prominent?"

**User-Centered Design**: "Have we tested this flow with actual users? It's unclear if this matches their mental model."

## Anti-Patterns to Avoid

### Design by Committee
**Problem**: Critique becomes design session where everyone redesigns together.
**Solution**: Identify problems and directions, but let designer synthesize.

### Personal Preference Disguised as Feedback
**Problem**: "I don't like blue" without tying to goals or evidence.
**Solution**: Require feedback to reference goals, user needs, or design principles.

### Too Late Feedback
**Problem**: Fundamental concerns raised at final review when too late to pivot.
**Solution**: Critique early and often, especially for major decisions.

### Vague Feedback
**Problem**: "Make it pop", "Needs more polish", "Something feels off"
**Solution**: Push for specificity. "What exactly feels off? Can you point to it?"

## Output Format

At the end of the session, summarize:

### Feedback Summary
- **What's working well**: [List positives]
- **Areas for improvement**: [List issues with severity]
- **Key themes**: [Patterns across feedback]

### Action Items
- [Action item 1] - Owner: [Name] - Due: [Date]
- [Action item 2] - Owner: [Name] - Due: [Date]

### Decisions
- [Decision 1]: [What was decided and why]
- [Decision 2]: [What was decided and why]

### Open Questions
- [Question 1]: [What needs to be resolved]
- [Question 2]: [What needs to be resolved]

## Examples

### Example 1: Early Wireframe Critique
```
Context: Mobile app onboarding flow, early wireframes

Designer presents: 3-step onboarding concept
Key question: "Is the flow intuitive for first-time users?"

Feedback (I Like, I Wish, What If):
- I like the progressive disclosure approach
- I wish the value proposition was clearer in step 1
- What if we added illustrations to make each step more engaging?

Action items:
- Designer: Add clearer value prop to step 1
- PM: Validate step sequence with user research
- Next critique: High-fidelity designs with updated flow
```

### Example 2: High-Fidelity UI Critique
```
Context: Dashboard redesign, near-final mockups

Goal-based critique:
Goal 1: Help users quickly identify key metrics
- ✓ Card layout makes scanning easy
- ⚠ Concern: Too many metrics shown at once (Hick's Law)
- Suggestion: Let users customize which metrics are visible

Goal 2: Improve mobile experience
- ✓ Responsive breakpoints work well
- ⚠ Touch targets on small screens below 44x44px (Fitts's Law)
- Suggestion: Increase button sizes on mobile

Action items:
- Designer: Increase mobile touch targets to 44x44px minimum
- Engineering: Assess feasibility of customizable metrics
- Next: Usability test with 5 users
```

## Best Practices

- **Critique early and often**: Don't wait until designs are "perfect"
- **Time-box discussions**: Keep sessions focused and on schedule
- **Stay objective**: Use frameworks and principles to ground feedback
- **Create safety**: Establish that all feedback is about improving the work
- **Document decisions**: Capture rationale for future reference
- **Follow through**: Ensure action items are completed

## Facilitation Checklist

**Before session**:
- [ ] Scope and objectives defined
- [ ] Materials shared in advance
- [ ] Diverse perspectives invited
- [ ] Time allocated (45-60 min)
- [ ] Ground rules ready to review

**During session**:
- [ ] Designer presents context and questions
- [ ] Clarifying questions before feedback
- [ ] Feedback tied to goals
- [ ] Specific observations, not vague opinions
- [ ] Balance of positives and improvements
- [ ] Solutions offered as suggestions
- [ ] Respectful, professional tone maintained

**After session**:
- [ ] Action items documented
- [ ] Decisions captured
- [ ] Next steps clear
- [ ] Designer has autonomy to synthesize feedback

## Related Commands

- [/plan-usability-test](plan-usability-test.md) - Validate design decisions with users
- [/create-user-stories](create-user-stories.md) - Ensure designs meet user needs

## Framework References

For comprehensive critique guidelines:
- **Complete critique practices**: [critique-guidelines.md](../skills/product-frameworks/references/critique-guidelines.md)
- **Design principles for feedback**: [design-principles.md](../skills/product-frameworks/references/design-principles.md)
- **User-centered design philosophy**: [design-processes.md](../skills/product-frameworks/references/design-processes.md)

