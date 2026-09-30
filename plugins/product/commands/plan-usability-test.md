---
description: Plan a structured usability test for validating designs with users
argument-hint: [feature or design to test]
---

# Plan Usability Test

Create a usability test plan for: **$ARGUMENTS**

## Your Task

Design a comprehensive usability test for the feature/design above. Produce a complete test plan including goals, participant criteria, task scenarios, and success metrics that will validate design decisions with real users.

## Purpose

Usability testing involves observing real users as they interact with your product to identify usability problems, discover improvement opportunities, and validate design decisions. Proper planning is essential for effective testing.

## Steps

### 1. Define Test Goals

Based on "$ARGUMENTS", articulate what questions the usability test should answer. Prioritize top goals so the test stays focused.

**Good goals**:
- "Can first-time users find the account settings?"
- "Is the checkout process easy to complete?"
- "Do users understand the dashboard metrics?"
- "Can users successfully complete a document export?"

**Poor goals**:
- "Test the whole app" (too broad)
- "See if users like it" (too vague)
- "Make sure it works" (that's QA testing)

**Limit to 3-5 key goals** per session to ensure adequate time per task.

### 2. Choose Test Format

#### Moderated vs. Unmoderated

**Moderated Tests**:
- Facilitator present (in-person or video call)
- Can probe and ask follow-up questions
- Yields deeper insights
- More time-intensive, smaller sample

**When to use**: Early validation, complex workflows, exploring "why" behind behavior

**Unmoderated Tests**:
- Users complete tasks independently
- Faster data collection, more users
- Lower cost per participant
- Can't probe in real-time

**When to use**: Specific task validation, quantitative metrics, large samples

#### In-Person vs. Remote

**In-Person**:
- Observe body language and environment
- Easier rapport building
- Limited geographic reach

**When to use**: Complex products, users needing help, observing physical context

**Remote**:
- Test users anywhere
- Easier scheduling
- Users in natural environment
- Requires reliable technology

**When to use**: Distributed users, budget constraints, web/mobile products

#### Lab vs. Field

**Lab/Controlled**:
- Consistent setup
- Fewer variables
- Convenient for facilitator

**When to use**: Most usability testing

**Field Testing**:
- Users in actual context
- Reveals context-specific issues
- Harder to control

**When to use**: Context-dependent products (mobile apps in stores, field tools)

### 3. Recruit Participants

#### Define Target Audience
Identify characteristics matching your user base (use personas).

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
- **Multiple segments**: 5 users per segment (e.g., 5 new + 5 power users = 10 total)

#### Recruitment Methods
- Customer database or CRM
- User research panels (UserTesting, Respondent.io)
- Social media and forums
- Website intercept
- Referrals

#### Create Screener Survey
Short questionnaire to filter candidates matching criteria.

**Example questions**:
- "How often do you use project management software?" (Daily/Weekly/Monthly/Never)
- "What tools do you currently use for [task]?"
- "Have you participated in user research in the past 6 months?" (to get fresh perspectives)

### 4. Prepare Task Scenarios

Write realistic tasks derived from test goals. Present as scenarios or goals, not step-by-step instructions.

#### Task Writing Principles

**Good task**: 
"You want to buy a specific book and have it delivered by Friday. Use this website to do that."
- Goal-oriented
- Realistic context
- No clues about how

**Bad task**: 
"Click 'Search', enter a book title, click 'Add to cart', then checkout"
- Prescriptive (tells exactly what to do)
- Tests instruction-following, not usability

#### Task Types

**Exploratory tasks**: 
"Imagine you just signed up. Explore the app and share your first impressions."

**Specific tasks**: 
"Find how much storage space you're currently using."
"Change your password."

**Comparison tasks**: 
"Which of these two checkout flows do you find clearer?"

#### Task Quantity
- **3-5 tasks** for 30-minute session
- **5-8 tasks** for 60-minute session
- Prioritize most critical tasks first

### 5. Pilot Test

Conduct trial run with colleague or one user before real sessions.

**Validates**:
- Tasks are clear and achievable
- Prototype/system works
- Session timing is appropriate
- Screener identifies right participants

**Adjust based on pilot**:
- Reword confusing tasks
- Fix technical issues
- Adjust time allocation
- Refine facilitation

### 6. Setup Logistics

#### For In-Person Tests
- Reserve quiet, private space
- Set up recording equipment (if documenting)
- Test all hardware/software beforehand
- Prepare comfortable seating, offer water

#### For Remote Tests
- Choose reliable platform (Zoom, Teams, UserTesting)
- Verify prototype/site is accessible
- Send connection details in advance
- Have backup communication method

#### General Setup
- Prepare consent forms (if recording)
- Set up note-taking method
- Optional: Second person to take notes
- Prepare compensation (if applicable)

## Session Structure (60 minutes typical)

### Introduction (5 minutes)
- Make participant comfortable
- Introduce yourself and purpose
- "We're testing the product, not you"
- Confirm consent to proceed/record
- Explain they can stop anytime

### Context Questions (5 minutes)
- "Tell me about your current workflow for [task]"
- "Have you used similar apps?"
- "What's most important when [doing task]?"

### Explain Think-Aloud (2 minutes)
- "Please talk me through what you're thinking"
- "If you're looking for something, tell me what"
- "Share any reactions or questions out loud"
- Demonstrate with quick example

### Run Tasks (30-40 minutes)
- Present one scenario at a time
- Observe without interfering
- Only intervene if completely stuck
- Prompt to keep thinking aloud: "What are you thinking?"
- Stay neutral – no hints or reactions

**After each task**:
- "How was that experience?"
- "Anything confusing or frustrating?"
- "On a scale of 1-5, how difficult was that?"

### Post-Task Discussion (5-10 minutes)
- "What was the most frustrating part?"
- "What did you like most?"
- "If you could change one thing, what would it be?"
- "Would you use this? Why or why not?"
- "How does this compare to [current tool]?"

### Closing (2 minutes)
- Thank participant
- Explain how input will be used
- Process compensation
- Answer their questions

## Metrics to Collect

### Task Success Rate
Did the user complete the task correctly?

**Levels**:
- **Success**: Completed correctly, independently
- **Partial success**: Completed with hints or after errors
- **Failure**: Could not complete

**Formula**: (# successful tasks) / (total # attempted)

### Time on Task
How long to complete successfully?

Useful for comparing designs or tracking improvements.

### Error Rate
How many errors did users make?

**Types**: Wrong action, recovery needed, help requested

### Satisfaction Ratings
Ask users to rate after each task or overall.

**Scales**:
- Difficulty: 1 (very easy) to 5 (very difficult)
- Confidence: 1 (not confident) to 5 (very confident)
- Satisfaction: 1 (very unsatisfied) to 5 (very satisfied)

### System Usability Scale (SUS)
Standardized 10-question survey for overall usability.

**Score**: 0-100 scale (68 is average)

**When to use**: Post-session for overall assessment

## Test Plan Document

Create a written test plan including:

### 1. Test Overview
- Study goals (3-5 questions to answer)
- What's being tested (product/feature)
- Test date and duration
- Facilitator and observers

### 2. Methodology
- Test format (moderated/unmoderated, remote/in-person)
- Number of participants
- Session length
- Recording approach

### 3. Participants
- Target audience description
- Screening criteria
- Recruitment approach
- Sample size and segmentation

### 4. Task Scenarios
- List of tasks with descriptions
- Expected completion criteria
- Priority order

### 5. Metrics
- What will be measured (success rate, time, satisfaction)
- How data will be collected
- Success criteria for each task

### 6. Session Protocol
- Introduction script
- Think-aloud instructions
- Task presentation order
- Post-task questions
- Closing script

### 7. Logistics
- Location/platform
- Equipment needs
- Participant compensation
- Team roles (facilitator, note-taker, observers)

## Output Format

When planning a usability test, provide:

### Test Plan Summary
- **Goals**: [3-5 key questions]
- **Format**: [Moderated/unmoderated, remote/in-person]
- **Participants**: [N users, segmentation]
- **Timeline**: [Test dates]

### Task Scenarios
1. **Task 1**: [Scenario description]
   - Goal: [What user should accomplish]
   - Success criteria: [How we know they succeeded]
   
2. **Task 2**: [Scenario description]
   - Goal: [What user should accomplish]
   - Success criteria: [How we know they succeeded]

### Screening Questions
- Question 1: [Text]
- Question 2: [Text]
- [etc.]

### Metrics to Collect
- Task success rate (target: >80%)
- Time on task (target: <2 minutes for key tasks)
- Error rate (target: <20%)
- Satisfaction (target: >4/5)

### Logistics Checklist
- [ ] Participants recruited
- [ ] Session scheduled
- [ ] Platform/space confirmed
- [ ] Recording equipment tested
- [ ] Consent forms prepared
- [ ] Note-taking method ready
- [ ] Compensation arranged

## Examples

### Example 1: E-commerce Checkout Test
```
Goal: Validate new checkout flow reduces abandonment

Format: Remote moderated, 8 participants (4 new, 4 returning customers)

Tasks:
1. "You want to buy this jacket and have it by Friday. Complete your purchase."
2. "You realize you need a different size. Update your order before it ships."
3. "You're not ready to buy. Save the item for later."

Success Metrics:
- >90% complete checkout without assistance
- <2 minutes average time
- <1 error per user
- >4/5 satisfaction rating

Next Steps:
- Recruit via customer panel
- Test next week (Mon-Wed)
- Analyze and report findings by Friday
```

### Example 2: Dashboard Usability Test
```
Goal: Determine if users can find and understand key metrics

Format: In-person unmoderated, 6 users (mixed experience levels)

Tasks:
1. "Find how many active projects you have."
2. "Identify which project is closest to deadline."
3. "Export the last month's activity report."

Success Metrics:
- >80% task success
- <30 seconds to find each metric
- >3.5/5 confidence rating

Insights Sought:
- Do users understand metric labels?
- Is information hierarchy clear?
- Are export options discoverable?
```

## Analysis Guidance

After testing, analyze findings:

### 1. Compile Data
- Review notes and recordings
- Calculate metrics (success rates, times, etc.)
- Extract quotes and observations

### 2. Identify Patterns
- Issues occurring across multiple users (high priority)
- Single-user issues (edge cases)
- Positive findings (what worked well)

### 3. Severity Rating
- **Critical**: Prevents completion, affects many users
- **High**: Significant frustration, affects most users
- **Medium**: Minor frustration, affects some users
- **Low**: Cosmetic, affects few users

### 4. Create Report
- Executive summary with key findings
- Detailed findings with evidence (quotes, clips)
- Severity and frequency for each issue
- Recommendations with action items

**Reference**: See [usability-testing.md](../skills/product-frameworks/references/usability-testing.md) for detailed analysis guidance.

## Best Practices

- **Test early and often**: Don't wait for final designs
- **Focus on goals**: Every task should answer a specific question
- **Stay neutral**: Don't lead participants or react to their actions
- **Let them struggle**: That's where you learn about problems
- **Document everything**: Take notes, record sessions (with consent)
- **Act on findings**: Usability testing is only valuable if you iterate

## Common Mistakes to Avoid

- **Leading questions**: "Isn't this easy?" biases response
- **Helping too much**: Guiding users hides usability problems
- **Testing too late**: Waiting until final design makes fixes expensive
- **Testing only once**: Need to test → fix → re-test
- **Ignoring findings**: Conducting tests but not acting wastes effort

## Usability Testing Checklist

**Planning Phase**:
- [ ] Test goals defined (3-5 key questions)
- [ ] Format chosen and justified
- [ ] Target audience defined
- [ ] Screening criteria created
- [ ] Task scenarios written
- [ ] Pilot test completed

**Recruitment Phase**:
- [ ] 5+ participants per segment recruited
- [ ] Screener survey deployed
- [ ] Sessions scheduled
- [ ] Confirmation emails sent
- [ ] Compensation arranged

**Preparation Phase**:
- [ ] Test plan documented
- [ ] Space/platform configured
- [ ] Recording equipment tested
- [ ] Consent forms prepared
- [ ] Facilitator prepared
- [ ] Observers briefed

**Ready to Test**:
- [ ] All logistics confirmed
- [ ] Backup plans in place
- [ ] Team roles assigned
- [ ] Post-test analysis plan ready

## Related Commands

- [/facilitate-design-critique](facilitate-design-critique.md) - Review designs before testing
- [/create-user-stories](create-user-stories.md) - Ensure test scenarios match user needs
- [/search-user-research](search-user-research.md) - Build on existing research

## Framework References

For comprehensive usability testing guidance:
- **Complete testing methodology**: [usability-testing.md](../skills/product-frameworks/references/usability-testing.md)
- **User-centered design context**: [design-processes.md](../skills/product-frameworks/references/design-processes.md)

