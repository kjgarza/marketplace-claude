# Usability Testing

This reference provides comprehensive guidance for planning, conducting, and analyzing usability tests to validate design decisions with real users.

## Overview

Usability testing involves observing real users as they interact with your product to identify usability problems, discover improvement opportunities, and validate design decisions. It's one of the most valuable methods for ensuring user-centered design.

## Planning a Usability Test

### 1. Define Test Goals

Clearly articulate what questions you want the usability test to answer. Prioritize top goals so the test stays focused.

**Good goals**:
- "Can first-time users find the account settings?"
- "Is the checkout process easy to complete?"
- "Do users understand the dashboard metrics?"
- "Can users successfully complete a document export?"

**Poor goals**:
- "Test the whole app" (too broad)
- "See if users like it" (too vague)
- "Make sure it works" (that's QA, not usability testing)

**Limit to 3-5 key goals** per session to ensure adequate time per task.

### 2. Choose Test Format

#### Moderated vs. Unmoderated

**Moderated Tests**:
- Facilitator is present (in-person or via video call)
- Can guide, probe, and ask follow-up questions
- Yields deeper insights through dialogue
- More time-intensive, smaller sample size

**When to use**: Early design validation, complex workflows, exploring "why" behind behavior

**Unmoderated Tests**:
- Users complete tasks independently using a tool or script
- Faster data collection, can reach more users
- Lower cost per participant
- Can't probe in real-time

**When to use**: Specific task validation, quantitative metrics, large sample needs, remote testing at scale

#### In-Person vs. Remote

**In-Person**:
- Observe body language and environment cues
- Easier to build rapport
- Can handle technical issues quickly
- Limited geographic reach

**When to use**: Complex products, users who need technical help, observing physical context

**Remote**:
- Can test users anywhere geographically
- Often easier to schedule
- Users in their natural environment
- Requires reliable technology

**When to use**: Distributed user base, budget/time constraints, testing web/mobile products

#### Lab vs. Field

**Lab/Controlled Environment**:
- Consistent setup across sessions
- Fewer variables, easier to compare
- Convenient for facilitator
- Artificial context

**When to use**: Most usability testing, especially evaluative testing

**Field Testing**:
- Users in their actual context of use
- Reveals context-specific issues
- Harder to control variables
- More time and travel

**When to use**: Products highly dependent on environment (e.g., mobile app used in store, field service tools)

### 3. Recruit Participants

#### Define Target Audience
Identify characteristics that match your user base (leveraging personas or user profiles).

**Screening criteria examples**:
- Role/job title
- Experience level with similar products
- Frequency of use
- Demographics (age, location, tech-savviness)
- Specific behaviors or needs

#### How Many Participants?

**Nielsen's recommendation**: 5 users per distinct user group uncover ~85% of usability issues.

**Considerations**:
- **5 users**: Good for qualitative insight, finding major issues
- **8-10 users**: Better coverage, more confidence
- **Multiple segments**: 5 users per segment (e.g., 5 new users + 5 power users = 10 total)

**Quantitative studies**: Need larger samples (30+) for statistical significance, but most usability testing is qualitative.

#### Recruitment Methods
- Customer database or CRM
- User research panels (UserTesting, Respondent.io)
- Social media and community forums
- Intercept on website
- Referrals from existing users

#### Screener Surveys
Create a short questionnaire to filter candidates who match your criteria.

**Example questions**:
- "How often do you use project management software?" (Daily/Weekly/Monthly/Never)
- "What tools do you currently use for [task]?" (Open response)
- "Have you participated in user research in the past 6 months?" (Yes/No – sometimes you want fresh perspective)

### 4. Prepare Task Scenarios

Write realistic tasks for users to attempt, derived from your test goals. Present tasks as scenarios or goals, not step-by-step instructions.

#### Task Writing Principles

**Good task**: "You want to buy a specific book and have it delivered by Friday. Use this website to do that."
- Goal-oriented
- Realistic context
- No clues about how to accomplish

**Bad task**: "Click 'Search', enter a book title, click 'Add to cart', then checkout"
- Prescriptive (tells user exactly what to do)
- Tests instruction-following, not usability

#### Task Types

**Exploratory tasks**: Open-ended, see how users navigate generally.
- "Imagine you just signed up. Explore the app and share your first impressions."

**Specific tasks**: Targeted, with a clear end point.
- "Find how much storage space you're currently using."
- "Change your password."

**Comparison tasks**: Choose between options.
- "Which of these two checkout flows do you find clearer?"

#### Task Quantity
- **3-5 tasks** for a 30-minute session
- **5-8 tasks** for a 60-minute session
- Prioritize most critical tasks first (in case of time constraints)

### 5. Pilot Test

Conduct a trial run with a colleague or one user before real sessions.

**Validates**:
- Tasks are clear and achievable
- Prototype or system is working properly
- Session timing is appropriate
- Screener identifies right participants

**Adjust** based on pilot:
- Reword confusing tasks
- Fix technical issues
- Adjust time allocation
- Refine facilitation approach

## Conducting the Test

### Setup and Logistics

#### For In-Person Tests
- Quiet, private space
- Recording equipment (camera, screen recorder) if documenting
- Test all hardware/software beforehand
- Comfortable seating, offer water

#### For Remote Tests
- Choose reliable screen-sharing platform (Zoom, Teams, UserTesting)
- Verify prototype/site is accessible to user
- Send connection details and instructions in advance
- Have backup communication method (phone)

#### General Setup
- Consent forms ready (if recording or required by organization)
- Note-taking method or software set up
- Optional: Second team member to take notes while moderator focuses on participant

### Session Structure

#### 1. Introduction (5 minutes)

**Make participant comfortable**:
- Introduce yourself and your role
- Explain the purpose: "We're testing the product, not you"
- Confirm consent to proceed and record (if applicable)
- Explain they can stop anytime if uncomfortable

**Set expectations**:
- "There are no wrong answers"
- "Your honest feedback helps us improve"
- "If something is confusing, that's valuable information"

#### 2. Context Questions (5 minutes)

Ask background questions to understand participant's profile.

**Examples**:
- "Tell me about your current workflow for [task]"
- "Have you used similar apps or tools?"
- "What's most important to you when [doing task]?"

**Note**: Don't spend too long here; you want most time on tasks.

#### 3. Explain Think-Aloud Protocol (2 minutes)

Encourage participants to narrate their thoughts as they work.

**Instructions**:
- "Please talk me through what you're thinking as you go"
- "If you're looking for something, tell me what"
- "Share any reactions, frustrations, or questions out loud"

**Demonstrate**: Show a quick example of thinking aloud with an unrelated task.

#### 4. Run Tasks (20-40 minutes)

Present one scenario at a time. Observe how they proceed.

**Moderator's role**:
- Avoid interfering; let them struggle (that's the data!)
- Only intervene if completely stuck or to move on
- Prompt to keep thinking aloud if they go silent: "What are you thinking?"
- Stay neutral – no hints, no reactions that influence them

**Observations to note**:
- Where do they hesitate or get confused?
- What do they click/tap first?
- Do they find what they need?
- What errors occur?
- How long does it take?
- What do they say (frustration, delight)?

**After each task**:
- Ask follow-up: "How was that experience?"
- "Anything confusing or frustrating?"
- "On a scale of 1-5, how difficult was that?"
- But avoid leading questions: "Wasn't that easy?" (biases response)

#### 5. Post-Task Discussion (5-10 minutes)

After all tasks, ask overall questions:
- "What was the most frustrating part of this experience?"
- "What did you like most?"
- "If you could change one thing, what would it be?"
- "Would you use this? Why or why not?"
- "How does this compare to [current tool]?"

#### 6. Closing (2 minutes)

- Thank them for their time and feedback
- Explain how their input will be used
- Process any compensation (if applicable)
- Answer any questions they have about the product or study

### Moderation Techniques

#### Stay Neutral
Don't react with expressions (winces, cheers) that might influence behavior.

**User asks**: "Is this right?"
**Good response**: "What do you think? How confident do you feel?"
**Bad response**: "Yes!" or "Nope, try again"

#### Probe When Needed
If user says something vague, ask for clarification:
- "Can you tell me more about that?"
- "What made you think that?"
- "Why did you choose that option?"

#### Handling Silence
If user goes quiet, gently prompt:
- "What are you looking for?"
- "Talk me through what you're thinking"

#### When Stuck
If user is completely stuck and distressed:
- Give a small hint to move forward: "Try looking in the top menu"
- Or move to next task: "Let's try something else"
- Note this as a critical failure point

## Collecting Metrics

Decide beforehand if you will collect quantitative data alongside qualitative observations.

### Task Success Rate
Did the user complete the task correctly?

**Formula**: (# successful tasks) / (total # attempted tasks)

**Example**: 4 of 5 users completed Task A without assistance = 80% success rate

**Levels**:
- **Success**: Completed correctly, independently
- **Partial success**: Completed with hints or after errors
- **Failure**: Could not complete

### Time on Task
How long did it take to complete the task?

Measure from start of task to successful completion. Useful for comparing designs or tracking improvements.

**Example**: Average time to checkout: Design A = 2:30 mins, Design B = 1:45 mins

### Error Rate
How many errors did users make?

**Types of errors**:
- Wrong action taken
- Recovery needed
- Help requested

**Example**: 3 of 5 users clicked the wrong button initially = 60% error rate on that step

### Satisfaction Ratings
Ask users to rate their experience after each task or overall.

**Scales**:
- Difficulty: 1 (very easy) to 5 (very difficult)
- Confidence: 1 (not confident) to 5 (very confident)
- Satisfaction: 1 (very unsatisfied) to 5 (very satisfied)

### System Usability Scale (SUS)
A standardized 10-question survey for overall usability.

**When to use**: Post-session for overall product assessment

**Score**: 0-100 scale (68 is average)

**Questions** (5-point Likert scale):
- "I think I would like to use this system frequently"
- "I found the system unnecessarily complex"
- [8 more questions]

**Benefit**: Industry-standard, can compare across products/studies

## Analysis and Reporting

### 1. Compile Findings

Review notes, recordings, and metrics from all sessions.

**Look for patterns**:
- Issues that occurred across multiple users (high priority)
- Single-user issues (edge cases or outliers)
- Positive findings (what worked well)

**Methods**:
- Affinity mapping: Group similar issues/observations
- Spreadsheet: Track each issue, its severity, and how many users encountered it
- Highlight clips: Extract video segments showing key issues

### 2. Severity Rating

Categorize usability issues by severity to prioritize fixes.

**Critical**:
- Prevents task completion
- Affects many users
- No workaround available
- Example: "Users cannot find the 'Submit' button"

**High**:
- Causes significant frustration or delay
- Affects most users
- Workaround is difficult
- Example: "Form validation errors are unclear, causing multiple attempts"

**Medium**:
- Causes minor frustration
- Affects some users
- Workaround exists
- Example: "Users expect 'Cancel' button on left but it's on right (convention mismatch)"

**Low**:
- Cosmetic or minor inconvenience
- Affects few users
- Easy workaround
- Example: "Icon color doesn't match brand exactly"

### 3. Create Report

Structure findings for stakeholders.

#### Executive Summary
- Number of participants and methodology
- Key findings (3-5 major issues)
- Overall recommendations
- Success metrics (if quantitative)

#### Detailed Findings

For each issue:
- **Description**: What happened
- **Frequency**: How many users encountered it (e.g., 4/5)
- **Severity**: Critical/High/Medium/Low
- **Impact**: Why it matters (business/user impact)
- **Evidence**: Quotes or screenshots
- **Recommendation**: How to fix

**Example**:
```
Issue #1: Users cannot find account settings
- Severity: High
- Frequency: 4 of 5 users (80%)
- Impact: Prevents users from managing their profile, likely causes 
  support tickets
- Evidence: "I've been looking for 2 minutes and can't find where to 
  change my email" – Participant 3
- Recommendation: Add "Settings" link to main navigation or user menu
```

#### Positive Findings
Include what worked well so those elements are preserved.

#### Metrics Summary (if collected)
- Task success rates
- Average times
- Satisfaction scores
- SUS score if administered

#### Appendices
- Test plan
- Task scenarios
- Participant demographics
- Raw data

### 4. Share and Socialize

**Debrief meeting**: Gather team to review findings, ideally soon after testing
- Show highlight clips
- Discuss patterns
- Brainstorm solutions

**Written report**: Circulate to broader stakeholders

**Research repository**: Store findings for future reference

### 5. Prioritize and Act

Turn usability issues into action items.

**Prioritization**:
- High severity + high frequency = Highest priority
- Critical blockers fix immediately
- Medium/low severity with easy fixes = Quick wins
- Low severity + low frequency = Backlog or won't fix

**Create tickets**: Document issues in backlog with:
- Description of problem (not solution)
- Link to research findings
- Priority/severity
- Assign to team for solution design

**Re-test**: After fixes, validate that issues are resolved with follow-up testing

## Usability Testing Checklist

### Before Testing

**Planning**:
- [ ] Test goals defined (3-5 key questions)
- [ ] Format chosen (moderated/unmoderated, remote/in-person)
- [ ] Target audience defined with screening criteria
- [ ] 5+ participants per segment recruited
- [ ] Task scenarios written (goal-oriented, realistic)
- [ ] Consent forms prepared (if recording)
- [ ] Pilot test completed and adjustments made

**Logistics**:
- [ ] Space reserved (if in-person) or tool configured (if remote)
- [ ] Recording equipment tested
- [ ] Prototype/product accessible and working
- [ ] Note-taking method ready
- [ ] Session schedule confirmed with participants

### During Testing

- [ ] Participant made comfortable, consent obtained
- [ ] Think-aloud protocol explained
- [ ] Tasks presented one at a time
- [ ] Moderator stays neutral, doesn't lead
- [ ] Observations noted (struggles, errors, comments)
- [ ] Follow-up questions asked after each task
- [ ] Post-task overall questions asked
- [ ] Participant thanked and compensated (if applicable)

### After Testing

- [ ] Findings compiled from all sessions
- [ ] Patterns and issues identified
- [ ] Severity ratings assigned
- [ ] Metrics calculated (success rate, time, etc.)
- [ ] Report created with recommendations
- [ ] Findings shared with team
- [ ] Action items created and prioritized
- [ ] Follow-up testing planned for fixes

## Special Considerations

### Testing with Diverse Users

Ensure your participant pool reflects the diversity of your user base:
- Range of abilities (include users with disabilities if product is public-facing)
- Age diversity
- Tech-savviness levels
- Cultural backgrounds if internationally used

Consider accessibility testing specifically:
- Test with screen readers
- Test with keyboard-only navigation
- Test with low vision or colorblindness simulations

### Remote Unmoderated Testing

If using a platform like UserTesting or Maze:
- Write very clear task instructions (no moderator to clarify)
- Include post-task questions for qualitative feedback
- Set up success criteria in the tool (e.g., reached checkout page)
- Review recordings to understand behavior beyond metrics

### Guerrilla Testing

Quick, informal testing with available users (e.g., coffee shop, library).

**Pros**: Fast, cheap, real-world context
**Cons**: May not match exact user profile, less control

**Use for**: Early validation, quick feedback loops, low stakes decisions

### A/B Testing vs. Usability Testing

**A/B Testing**:
- Quantitative comparison of variants
- Large sample size, in production
- Answers "which performs better?"

**Usability Testing**:
- Qualitative understanding of behavior
- Small sample, controlled setting
- Answers "why does this happen?"

**Use together**: Usability testing explains the "why" behind A/B test results.

## Common Mistakes to Avoid

**Leading questions**: "Isn't this easy?" → Biases response
**Helping too much**: Guiding user to correct answer → Hides usability problems
**Testing too late**: Waiting until final design → Expensive to fix
**Testing only once**: One round isn't enough for iteration → Test → Fix → Re-test
**Ignoring findings**: Conducting tests but not acting on results → Wasted effort
**Confirmation bias**: Only noting issues that confirm existing beliefs → Miss unexpected problems

## Integration with Commands

These guidelines support the `/plan-usability-test` command, which helps structure test plans, write scenarios, and prepare for sessions using these best practices.

## Resources for Deeper Learning

- **Books**: "Don't Make Me Think" by Steve Krug, "Rocket Surgery Made Easy" by Steve Krug
- **Methods**: Nielsen Norman Group articles on usability testing
- **Tools**: UserTesting, Maze, Lookback, Optimal Workshop for various testing formats

