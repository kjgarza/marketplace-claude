# Design Critique Guidelines

This reference provides best practices for facilitating productive design critique sessions that improve design quality while maintaining team collaboration.

## Purpose of Critique

Design critique is a structured process to provide feedback that helps improve the design in line with its objectives. The goal is to collaboratively improve the work, not to judge the designer or assert personal preferences.

## Core Principles

### 1. Critique the Work, Not the Person
Focus feedback on the design artifact and its effectiveness, never on the designer's abilities or intentions.

**Good**: "This button placement might make it hard for users to find"
**Bad**: "You should have known to put the button there"

### 2. Tie Feedback to Goals
Always relate comments to whether the design meets the intended user needs and business goals. Avoid "I just don't like this."

**Good**: "This element might not align with the goal of making the signup quick, because the extra step adds friction"
**Bad**: "I don't like this color"

### 3. Be Specific and Candid
Vague praise or criticism isn't useful. Point out exactly what and where you see an issue or something good.

**Good**: "The contrast between text and background on the form is low (WCAG AA requires 4.5:1, this measures 2.8:1), which could hurt readability for users with vision impairments"
**Bad**: "The colors don't work"

Don't hold back concerns for fear of offending, but deliver them constructively.

### 4. Balance Positives and Negatives
Note what is working well in the design, not only problems. This ensures successful elements remain in the next iteration and encourages the team.

**Example**: "The navigation structure is clear and intuitive (positive). One concern is the search bar visibility – it's small and users might overlook it (issue)."

### 5. Start with Problems Before Solutions
First identify what isn't achieving the goal and why. Only then discuss possible ways to fix it.

**Approach**:
1. "I'm concerned users might overlook the Save button" (identify problem)
2. "Maybe because it's at the bottom and blends in" (diagnose why)
3. "One solution could be to stick it in the header or make it more prominent" (suggest fix)

Jumping straight to "Move that button here" might shortcut understanding the underlying issue.

### 6. Offer Suggestions, Not Mandates
Phrase design ideas as suggestions ("What if we…") rather than commands ("Change this to…").

**Good**: "What if we tried making the CTA button larger to improve visibility?"
**Bad**: "Make that button bigger"

The designer should have latitude to explore the best fix – multiple suggestions can be considered or tested. Avoid "design by committee" where a critique becomes a group design session forcing a specific change.

### 7. Respect and Empathy
Critiques should be professional and about the design, never personal. Everyone (designer and critics) must feel safe.

Acknowledge the work done: "I see the intent here; one area I think could improve is…"

## Critique Structure

### Before the Session

**Set clear scope**:
- What artifacts are being critiqued (wireframes, high-fi mockups, prototype)?
- What stage is the design in (early exploration, near-final)?
- What specific questions does the designer have?

**Define objectives**:
- What user goals should this design achieve?
- What business goals?
- What constraints or requirements apply?

**Share materials in advance**:
- Give reviewers time to examine the design
- Include context (user research, requirements, etc.)

### During the Session

**1. Designer Presents (5-10 minutes)**
- Context: problem being solved, user needs, goals
- Design rationale: key decisions and trade-offs
- Specific questions for feedback

**2. Clarifying Questions (5 minutes)**
- Ask questions to understand, not to critique yet
- "What user segment is this for?"
- "What's the expected flow into this screen?"

**3. Feedback Round (20-30 minutes)**
- Use structured approach (see facilitation methods below)
- Focus on objectives and goals
- Balance positives and areas for improvement
- Tie feedback to user/business impact

**4. Designer Responds (5 minutes)**
- Designer can clarify intent
- Ask follow-up questions
- Note action items

**5. Wrap-up (5 minutes)**
- Summarize key feedback themes
- Identify action items
- Decide what will change vs. what won't
- Thank participants

### After the Session

**Document findings**:
- Key feedback points
- Action items with owners
- Decisions made
- Open questions

**Designer iterates**:
- Incorporate feedback
- Make design changes
- Prepare for next review if needed

## Facilitation Methods

### Round-Robin
Each person gives feedback in turn. Ensures all voices are heard, prevents dominant personalities from taking over.

**Process**:
1. Go around the table/room
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

### Rose, Thorn, Bud
Similar to above, nature metaphor format.

**Format**:
- **Rose**: Something great (positive)
- **Thorn**: Something painful (issue)
- **Bud**: Something with potential (opportunity)

### Start, Stop, Continue
Feedback organized by action type.

**Format**:
- **Start**: Things to begin doing
- **Stop**: Things to discontinue
- **Continue**: Things working well to keep

### Goal-Based Critique
Frame all feedback relative to specific goals.

**Process**:
1. List the design goals at top of whiteboard
2. For each goal, discuss: Does the design achieve it?
3. Where gaps exist, suggest improvements
4. Ignore issues unrelated to stated goals (out of scope)

## Common Critique Scenarios

### Scenario 1: Early Exploration (Low Fidelity)
**Focus on**:
- Overall concept and approach
- Information architecture
- User flow and logic
- Major usability concerns

**Avoid**:
- Pixel-pushing and visual polish
- Color and typography details (unless critical to concept)
- Implementation specifics

**Feedback examples**:
- "The three-step wizard flow makes sense for onboarding"
- "I'm unclear how users get back to the dashboard from here"
- "Consider whether new users need the advanced options visible upfront"

### Scenario 2: High-Fidelity Design
**Focus on**:
- Visual hierarchy and clarity
- Consistency with design system
- Accessibility (contrast, text size, touch targets)
- Edge cases and error states

**Appropriate to discuss**:
- Specific UI elements and polish
- Detailed interactions
- Responsive behavior

**Feedback examples**:
- "The button hierarchy is clear – primary action stands out"
- "This error message text might be too technical for users"
- "On mobile, the bottom navigation might conflict with gesture controls"

### Scenario 3: Responsive/Multi-platform Design
**Focus on**:
- Platform-appropriate patterns
- Touch target sizes (Fitts's Law)
- Adaptation quality across breakpoints
- Platform-specific conventions

**Feedback examples**:
- "This menu pattern works on desktop but might not be thumb-friendly on mobile"
- "Consider iOS native bottom sheet pattern instead of custom modal"
- "The information density works on desktop but may overwhelm on small screens"

## Giving Constructive Feedback

### The Feedback Formula

**Observation + Impact + Suggestion**

1. **Observation**: What you see (objective)
2. **Impact**: Why it matters (tied to goals)
3. **Suggestion**: Possible improvement (optional)

**Example**:
"The form has 12 required fields (observation). Research shows that forms with >7 fields have significantly lower completion rates, and our goal is to maximize signups (impact). What if we broke this into a multi-step form or made some fields optional? (suggestion)"

### Heuristic-Based Feedback

Reference established principles to ground feedback objectively:

**Hick's Law**: "This screen presents users with 8 equally-weighted actions, which might increase decision time. Could we highlight the primary action?"

**Fitts's Law**: "The submit button is small and positioned far from the form fields. Making it larger and closer might improve completion rate."

**Affordances**: "These text elements look like links (blue, underlined) but aren't clickable. That might confuse users."

**Feedback principle**: "When users click save, there's no visible confirmation. Adding feedback (success message or state change) would reassure users their action worked."

### Framework-Based Feedback

Reference product frameworks when relevant:

**Jobs-to-be-Done**: "The job users are trying to do is quickly find relevant articles. This design requires 3 clicks to start a search. Could we make search more prominent?"

**User-Centered Design**: "Have we tested this flow with actual users yet? It's unclear if this matches their mental model."

**Kano Model**: "This animation is a nice delighter, but we should ensure all basic features (must-haves) work perfectly first."

## Receiving Feedback as a Designer

### Stay Open
Listen to understand, not to defend. Don't interrupt or immediately justify decisions.

### Ask Clarifying Questions
"Can you elaborate on what you mean by confusing?"
"What specific goal are you concerned this doesn't meet?"

### Separate Personal from Professional
Feedback on your design is not feedback on your worth as a designer.

### Evaluate Feedback Critically
Not all feedback is equal. Consider:
- Is it tied to goals and user needs?
- Is it supported by evidence or heuristics?
- Does it come from relevant expertise?

You have the final say on what feedback to incorporate.

### Close the Loop
After iterating, show how feedback was incorporated (or explain why it wasn't).

## Anti-Patterns to Avoid

### Design by Committee
**Problem**: Critique becomes design session where everyone tries to redesign together.
**Solution**: Identify problems, suggest directions, but let designer synthesize and iterate.

### Personal Preference Disguised as Feedback
**Problem**: "I don't like blue" without tying to goals or evidence.
**Solution**: Require feedback to reference goals, user needs, or design principles.

### Too Late Feedback
**Problem**: Fundamental concerns raised at final review when it's too late to pivot.
**Solution**: Critique early and often, especially for major decisions.

### Scope Creep
**Problem**: Feedback introduces new requirements or features not in original goals.
**Solution**: Keep stated goals visible, defer new ideas to backlog.

### Echo Chamber
**Problem**: Only designers critique, missing user/engineering/business perspective.
**Solution**: Include cross-functional participants in critiques.

### Vague Feedback
**Problem**: "Make it pop", "Needs more polish", "Something feels off"
**Solution**: Push for specificity. "What exactly feels off? Can you point to it?"

## Sample Critique Comments

### Good Examples

"The homepage effectively draws attention to the primary CTA (goal: drive signups). One concern: new users might not understand what 'Sync workflow' means without more context. Consider adding a subtitle or icon to clarify."

"I appreciate the minimal design approach – it aligns with our brand. However, the low contrast between the text and background (1.8:1) doesn't meet WCAG accessibility standards. We should increase contrast to at least 4.5:1 to ensure readability for users with vision impairments."

"The three-step onboarding flow is logical and moves users efficiently toward activation (our key metric). I wonder if step 2 could be skipped for returning users? That might reduce time-to-value."

### Bad Examples

"I hate this." (Not constructive, no reasoning)

"Why didn't you use the dropdown component from the design system?" (Accusatory tone, not exploring rationale)

"This is exactly how I would do it!" (Not helpful – no insights for improvement)

"We should add a chat feature here." (Scope creep, introducing new requirements)

"Make the logo bigger." (Solution without problem identification)

## Critique Culture

### Building a Positive Critique Culture

**Regular cadence**: Schedule recurring critique sessions (e.g., weekly design reviews).

**Psychological safety**: Establish ground rules that everyone follows. No judgment, focus on work.

**Practice**: The more you critique, the better everyone gets at giving and receiving feedback.

**Model behavior**: Leaders should demonstrate good critique practices.

**Celebrate iteration**: Recognize when designs improve based on feedback. Reinforce that critique leads to better outcomes.

**Cross-functional participation**: Invite engineers, product managers, support, sales to critiques. Diverse perspectives improve designs.

### Critique Checklist

Before each session:
- [ ] Clear goals and constraints defined
- [ ] Scope of review communicated
- [ ] Materials shared in advance
- [ ] Diverse perspectives invited
- [ ] Time allocated (45-60 min typical)

During session:
- [ ] Designer presents context and questions
- [ ] Feedback tied to goals
- [ ] Specific observations, not vague opinions
- [ ] Balance of positives and improvements
- [ ] Solutions offered as suggestions
- [ ] Respectful, professional tone

After session:
- [ ] Action items documented
- [ ] Next steps clear
- [ ] Designer has autonomy to synthesize feedback
- [ ] Follow-up planned if needed

## Integration with Commands

These guidelines support the `/facilitate-design-critique` command, which helps structure and run effective critique sessions using these principles.

