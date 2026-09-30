---
description: Transform requirements into user stories with acceptance criteria
argument-hint: [feature or requirement description]
---

# Create User Stories

Transform the following requirement into well-formed user stories: **$ARGUMENTS**

## Your Task

Analyze the requirement above and create comprehensive user stories that capture user needs, goals, and value. Follow the framework below to produce clear, actionable stories with proper acceptance criteria.

## Standard User Story Format

```
As a [user role], I want [goal/desire] so that [benefit/value].
```

This format encapsulates:
- **Who**: The type of user (role or persona)
- **What**: The desired action or feature
- **Why**: The reason or value behind the request

## Steps

### 1. Understand the Requirement

Based on "$ARGUMENTS", determine:
- What problem are we solving?
- Who is this for?
- What job is the user trying to do? (Jobs-to-be-Done)
- What value does this provide?
- What constraints or context apply?

**Gather context**:
- Review feature request or PRD
- Search Dovetail for user research
- Identify affected user personas
- Understand user workflows

### 2. Identify User Roles

Define who the stories are for. Use established personas when available.

**Examples**:
- New user vs. power user
- Administrator vs. team member
- Free tier vs. paid customer
- Mobile user vs. desktop user
- Internal user vs. external customer

**Be specific**: "Marketing manager" is better than "user"

### 3. Write User Stories

For each piece of functionality, write a story following the template.

**Example 1**:
```
As a power user, I want a spell-checker so that I don't have to 
worry about spelling mistakes.
```

**Example 2**:
```
As an administrator, I want to bulk-assign permissions so that I can 
onboard new team members quickly without clicking through each user.
```

**Example 3**:
```
As a mobile user, I want offline access to my recent documents so that 
I can review work during my commute without internet.
```

### 4. Write Acceptance Criteria

For each story, define conditions of satisfaction – how we know it's done correctly.

**Format Options**:

**Checklist Format**:
```
User Story: As a power user, I want a spell-checker

Acceptance Criteria:
- Spell-checker underlines misspelled words in red
- Right-click on underlined word shows correction suggestions
- User can add words to personal dictionary
- Spell-check works in real-time as user types
- Works for English, Spanish, and French languages
```

**Given/When/Then Format** (Behavior-Driven Development style):
```
User Story: As an administrator, I want to bulk-assign permissions

Acceptance Criteria:
- Given: I have selected 10 users
  When: I choose "Assign permissions" and select "Editor" role
  Then: All 10 users receive Editor permissions
  
- Given: Bulk operation is in progress
  When: The operation is processing
  Then: I see a progress indicator
  
- Given: Bulk operation completes
  When: All users are updated
  Then: I receive a success confirmation with count
```

### 5. Break Down Epics

If a story is too large to complete in one sprint, it's an "epic" that should be broken down.

**Epic Example**:
```
As a user, I want collaboration features so that my team can work together.
```

This is too broad. Break it down:

**Story 1**:
```
As a team member, I want to share documents with colleagues so that 
we can review work together.
```

**Story 2**:
```
As a document owner, I want to control who can edit vs. view so that 
I can protect sensitive content.
```

**Story 3**:
```
As a collaborator, I want to see who's currently viewing a document 
so that I know when to coordinate with them.
```

**Story 4**:
```
As a team member, I want real-time updates when others edit so that 
I see changes immediately.
```

### 6. Prioritize Stories

Use prioritization frameworks to order stories:

**MoSCoW Method**:
- **Must have**: Critical for launch
- **Should have**: Important but not critical
- **Could have**: Nice to have
- **Won't have**: Out of scope

**Value to User**:
- Which stories deliver the most user value?
- Which solve the biggest pain points?

**Dependencies**:
- Which stories must be built first?
- What's the logical implementation order?

**Reference**: See [prioritization-frameworks.md](../skills/product-frameworks/references/prioritization-frameworks.md)

## User Story Guidelines

### Keep Stories Small and Independent

**INVEST Criteria**:
- **Independent**: Can be implemented without depending on other stories
- **Negotiable**: Details can be discussed and refined
- **Valuable**: Provides clear value to users
- **Estimable**: Team can estimate effort
- **Small**: Completable in one sprint
- **Testable**: Can verify it works correctly

### The "So That" Clause is Critical

If you can't articulate the benefit, question whether the feature is justified.

**Without "so that"**: "As a user, I want a dashboard"
**With "so that"**: "As a user, I want a dashboard so that I can see my key metrics at a glance without navigating through multiple pages"

The benefit clarifies value and helps with prioritization.

### Avoid Solution-Focused Stories

Focus on user needs, not implementation details.

**Bad (solution-focused)**: 
"As a user, I want a dropdown menu for selecting categories"

**Good (need-focused)**: 
"As a user, I want to categorize my documents so that I can organize and find them easily"

The design team can then decide if a dropdown, tags, folders, or another UI is best.

### Use Active Voice

Write clearly and directly.

**Good**: "As a user, I want to export data"
**Avoid**: "Data should be exportable by the user"

## Jobs-to-be-Done Integration

Frame stories around the job users are trying to accomplish.

**Traditional approach**: "User wants a drill"

**Jobs-to-be-Done reframe**: 
"User needs to hang a picture" (which requires a hole in the wall)

**Better user story**:
```
As a homeowner, I want to make precise holes in walls so that 
I can hang pictures securely without damaging the wall.
```

This opens up solution space (drill, nail gun, adhesive hooks, etc.).

**Application**:
- Understand the underlying job
- Consider functional, emotional, and social dimensions
- Write stories that focus on the job outcome

**Reference**: See [requirements.md](../skills/product-frameworks/references/requirements.md) for Jobs-to-be-Done framework.

## Output Format

### User Story Card

```markdown
### Story: [Short title]

**As a** [user role]
**I want** [goal/action]
**So that** [benefit/value]

**Acceptance Criteria:**
- [ ] Criterion 1
- [ ] Criterion 2
- [ ] Criterion 3

**Priority:** [Must/Should/Could/Won't] or [P0/P1/P2/P3]

**Estimate:** [Story points or t-shirt size]

**Dependencies:** [Other stories this depends on, if any]

**Notes:** [Additional context, constraints, or considerations]
```

### Story Set for a Feature

When creating stories for a feature, provide:

**Feature**: [Feature name]

**User Need**: [Underlying user problem or job-to-be-done]

**Stories**:

1. **Story Title** (Must have)
   - As a [role], I want [goal] so that [benefit]
   - Acceptance: [criteria]

2. **Story Title** (Should have)
   - As a [role], I want [goal] so that [benefit]
   - Acceptance: [criteria]

3. **Story Title** (Could have)
   - As a [role], I want [goal] so that [benefit]
   - Acceptance: [criteria]

**Out of Scope**:
- [What we're NOT doing in this iteration]

## Examples

### Example 1: Export Feature Stories

**Feature**: Bulk document export

**User Need**: Users need to download multiple documents at once for offline work or compliance reporting.

**Stories**:

1. **Multi-select documents** (Must have)
   ```
   As an administrator, I want to select multiple documents at once 
   so that I can export them in bulk without clicking each individually.
   
   Acceptance Criteria:
   - User can select documents via checkboxes
   - "Select all" option available
   - Can filter list and select filtered subset
   - Selected count displays: "N documents selected"
   - Max 1000 documents per selection
   ```

2. **Batch export to ZIP** (Must have)
   ```
   As an administrator, I want to export selected documents as a single ZIP 
   so that I can download everything at once.
   
   Acceptance Criteria:
   - Given: User has selected documents
     When: User clicks "Export selected"
     Then: System generates ZIP file with all documents
   - ZIP preserves folder structure
   - ZIP includes metadata manifest
   - Progress indicator shows during generation
   - Export completes within 2 minutes for 100 documents
   ```

3. **Export with filters** (Should have)
   ```
   As an administrator, I want to export documents matching specific criteria 
   so that I can get exactly what I need for reports.
   
   Acceptance Criteria:
   - Can filter by date range, category, owner before export
   - Export includes only filtered documents
   - Filter state is clear in export manifest
   ```

4. **Schedule automated exports** (Could have)
   ```
   As an administrator, I want to schedule recurring exports 
   so that I can automate monthly compliance reporting.
   
   Acceptance Criteria:
   - Can set export schedule (daily/weekly/monthly)
   - Can define export criteria and recipient email
   - Receives notification when export completes
   ```

**Out of Scope for v1**:
- Export to formats other than ZIP
- Cloud storage integration (Google Drive, Dropbox)
- Exports >1000 documents

### Example 2: Onboarding Flow Stories

**Feature**: First-time user onboarding

**User Need**: New users need to understand the product and get to value quickly.

**Stories**:

1. **Welcome screen** (Must have)
   ```
   As a new user, I want to see a welcome message explaining the product 
   so that I understand what it does before diving in.
   
   Acceptance Criteria:
   - Welcome screen appears on first login only
   - Clear 1-sentence value proposition
   - "Get started" CTA button
   - "Skip" option for returning users who cleared cookies
   ```

2. **Quick setup wizard** (Must have)
   ```
   As a new user, I want a guided setup process 
   so that I can configure essential settings without feeling lost.
   
   Acceptance Criteria:
   - 3-step wizard: Profile → Preferences → First action
   - Progress indicator shows "Step 2 of 3"
   - Can go back to previous step
   - Can skip and complete later
   - Takes <2 minutes to complete
   ```

3. **Sample data** (Should have)
   ```
   As a new user, I want to see example data in the product 
   so that I can understand how it works before adding my own.
   
   Acceptance Criteria:
   - Sample project with realistic data loads on first use
   - Clear indication it's sample data ("Try editing this example")
   - Easy to delete sample and start fresh
   - Sample showcases key features
   ```

## Best Practices

### Do:
- Write from user perspective, not system perspective
- Include the "so that" clause to clarify value
- Keep stories small and completable in one sprint
- Write acceptance criteria before development starts
- Collaborate with design and engineering on stories
- Refine stories during backlog grooming
- Use consistent format across all stories

### Don't:
- Write stories as technical tasks ("Refactor database schema")
- Make stories too large (break down epics)
- Skip the "why" (the benefit clause)
- Write acceptance criteria that are vague or untestable
- Create stories without consulting user research
- Assume one story format fits all situations

## Common Pitfalls

**Too technical**: 
"As a developer, I want to implement caching"
→ Technical task, not user story. Put in engineering backlog.

**Too vague**: 
"As a user, I want the app to be fast"
→ Not actionable. Be specific about what should be fast and measurable criteria.

**No clear value**: 
"As a user, I want a settings page"
→ Missing the "so that". Why do they need it? What settings matter?

**Solution, not need**: 
"As a user, I want a carousel on the homepage"
→ Prescribes solution. Better: "As a user, I want to discover new content easily..."

## Story Writing Checklist

Before finalizing a story:
- [ ] Follows "As a/I want/So that" format
- [ ] User role is specific (not just "user")
- [ ] Goal is clear and actionable
- [ ] Benefit explains the "why"
- [ ] Acceptance criteria are testable
- [ ] Story is small enough for one sprint
- [ ] Priority is assigned
- [ ] Dependencies identified
- [ ] Team reviewed and understood the story

## Related Commands

- [/create-prd](create-prd.md) - Stories feed into PRD documentation
- [/prioritize-backlog](prioritize-backlog.md) - Use stories in backlog prioritization
- [/analyze-feature-request](analyze-feature-request.md) - Validate need before creating stories

## Framework References

For comprehensive guidance on user stories and requirements:
- **User story format and examples**: [requirements.md](../skills/product-frameworks/references/requirements.md)
- **Jobs-to-be-Done framework**: [requirements.md](../skills/product-frameworks/references/requirements.md)
- **PRD structure and requirements**: [requirements.md](../skills/product-frameworks/references/requirements.md)
- **MoSCoW prioritization**: [prioritization-frameworks.md](../skills/product-frameworks/references/prioritization-frameworks.md)

