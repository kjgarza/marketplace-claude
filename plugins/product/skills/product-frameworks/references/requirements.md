# Requirements and Documentation

This reference covers best practices for documenting product requirements, including PRD structure, user story formats, and acceptance criteria guidelines.

## Product Requirements Document (PRD) Structure

### Purpose
A PRD defines what the product or feature is intended to do and outlines the requirements and constraints. It serves as a communication tool between product, design, development, and stakeholders to ensure alignment on what's being built.

### Core Sections

#### 1. Project Overview
High-level summary of what's being built and why.

**Include**:
- Brief description of the feature/product
- Background and context
- Link to strategic goals or OKRs
- Problem being solved
- Expected business impact

**Example**:
```
## Overview
We're building a bulk export feature that allows users to download 
multiple documents at once. This addresses the #1 customer request 
from enterprise users and unblocks expansion into large organizations. 
Expected impact: Increase enterprise conversion by 15%.
```

#### 2. Participants & Stakeholders
Who is involved in the project and their roles.

**Include**:
- Product owner
- Engineering lead
- Design lead
- Key stakeholders (with decision authority)
- Subject matter experts
- QA/Test lead

**Why it matters**: Clear ownership prevents confusion and ensures the right people are consulted for decisions.

#### 3. Goals and Objectives
What are the business objectives and user objectives? Define success metrics.

**Structure**:
- **Business goals**: Revenue, retention, efficiency, strategic positioning
- **User goals**: Problems solved, value delivered, experience improved
- **Success metrics**: How we'll measure if this worked

**Example**:
```
### Goals
**Business**: Increase enterprise deal closure rate by 15%
**User**: Enable users to export 100+ documents in under 2 minutes
**Success Metrics**:
- 40% of enterprise users adopt bulk export within 3 months
- Average export time < 1 minute for 100 documents
- Export-related support tickets decrease by 50%
```

#### 4. User Personas / Use Cases
Whom is this for? Briefly describe target users or personas and their needs.

**Include**:
- Primary persona(s)
- Key use cases or scenarios
- User jobs-to-be-done
- Context of use

**Example**:
```
### Primary Persona: Enterprise Administrator
Sarah manages document workflows for a 500-person organization. 
She needs to export documents monthly for compliance reporting. 
Currently she exports files one at a time, taking 3+ hours.

**Use Case**: Monthly compliance report generation
1. Sarah identifies 200+ documents needing export
2. She wants to select all and export in one operation
3. She needs organized output (folders by category)
4. She requires audit trail of what was exported
```

#### 5. Features & Requirements
List the functional requirements. Often captured as user stories with acceptance criteria.

**Organization approaches**:
- **By user story**: One story per capability
- **By epic**: Group related features
- **By priority**: Must/Should/Could/Won't (MoSCoW)

**Include**:
- Functional requirements (what it does)
- Non-functional requirements (performance, security, compliance)
- Acceptance criteria (how we know it works)
- Priority/importance

**Example**:
```
### Features

**F1: Multi-select documents** (Must-have)
As an administrator, I want to select multiple documents at once
so that I can export them in bulk.

Acceptance Criteria:
- User can select documents via checkboxes
- "Select all" option available
- Can filter and select filtered subset
- Max 1000 documents per selection

**F2: Batch export** (Must-have)
As an administrator, I want to export selected documents as a single ZIP
so that I can download everything at once.

Acceptance Criteria:
- Generates ZIP file with all selected documents
- Preserves folder structure
- Includes metadata manifest
- Shows progress indicator
- Completes within 2 minutes for 100 documents
```

#### 6. Assumptions and Constraints
Document any assumptions and technical or business constraints.

**Assumptions**: Things you believe to be true but haven't fully validated.

**Example assumptions**:
- Users have modern browsers supporting large downloads
- Average document size is <5MB
- Users have bandwidth for 100MB+ downloads

**Constraints**: Limitations that must be respected.

**Example constraints**:
- Must use existing document storage API (no changes)
- Must comply with SOC2 audit trail requirements
- Cannot impact regular single-document export performance
- Must complete in Q1 (resource constraint)

#### 7. User Experience & Design
Link to wireframes, mockups, or flow diagrams.

**Include**:
- High-level UX flow
- Key screens or wireframes (link to Figma/design tool)
- Interaction patterns
- Edge cases and error states

**Example**:
```
### UX Flow
1. User navigates to documents list
2. Checkboxes appear next to each document
3. User selects documents or clicks "Select all"
4. "Export selected (N)" button appears
5. Click triggers export with progress modal
6. Download begins automatically when ready
7. Success message with download link

[Figma mockups: link]
```

#### 8. Out of Scope
Explicitly mention things that will NOT be done in this iteration/project.

**Why it matters**: Prevents scope creep and manages expectations.

**Example**:
```
### Out of Scope
- Scheduled/automated exports (future consideration)
- Export to formats other than ZIP (v1 is ZIP only)
- Cloud storage integration (Google Drive, Dropbox)
- Email delivery of large exports
- Exports >1000 documents (v1 limit)
```

#### 9. Open Questions / To-be-Decided
A list of issues or decisions that are still under investigation.

**Keep visible**: Encourages the team to resolve them.

**Example**:
```
### Open Questions
- Q: What happens if a user's selection includes documents they 
  no longer have access to?
  Owner: Product team. Target resolution: Jan 15
  
- Q: Should we support pausing/resuming large exports?
  Owner: Engineering lead. Depends on technical feasibility study.
  
- Q: What file naming convention for the ZIP?
  Owner: UX team. Testing with users this week.
```

#### 10. Timeline/Milestones
Target release date or milestones (MVP by date, beta launch, etc.).

**Include**:
- Key dates and deliverables
- Dependencies on other teams/projects
- Release phases if applicable

**Example**:
```
### Timeline
- Jan 20: Design complete, ready for dev
- Feb 10: Backend API complete
- Feb 20: Frontend implementation complete
- Feb 27: QA and bug fixes
- Mar 5: Beta release to 10 enterprise customers
- Mar 19: General availability

**Dependencies**:
- Infrastructure team to increase storage API rate limits by Feb 1
```

#### 11. Appendices (Optional)
Any additional info like market research, customer feedback snippets, technical diagrams.

### PRD Best Practices

**Clarity and brevity**: Enough detail to guide development and clarify intent, but not so much that it becomes bloated or quickly outdated.

**Use consistent template**: Use the same template across your team so everyone knows where to find information.

**Ensure the "why" is clear**: The background and objectives help team members make micro-decisions aligned with the goal if something isn't specified.

**Living document**: Keep it updated as decisions are made or requirements change, rather than treating it as a static contract.

**Visual aids**: Include diagrams, flows, and mockups. A picture is worth a thousand words.

**Collaborative creation**: Involve design, engineering, and stakeholders in writing and reviewing the PRD. Alignment is the goal.

## User Story Format

### Standard Template
```
As a <user role>, I want <goal/desire> so that <benefit/value>.
```

This format encapsulates who the feature is for, what they want to accomplish, and why.

### Components

**User role** (Who): The type of user (e.g., power user, administrator, new user). May reference a persona or user segment.

**Goal/desire** (What): The user's desired action or feature (e.g., a spell-checker tool, ability to export data).

**Benefit/value** (Why): The reason or value behind the request (e.g., avoid worrying about mistakes, which hints at improving efficiency/accuracy).

### Examples

**Example 1**:
```
As a power user, I want a spell-checker, so that I don't have to 
worry about spelling mistakes.
```

**Example 2**:
```
As an administrator, I want to bulk-assign permissions, so that I can 
onboard new team members quickly without clicking through each user.
```

**Example 3**:
```
As a mobile user, I want offline access to my recent documents, so that 
I can review work during my commute without internet.
```

### Acceptance Criteria

While the story defines the need, you should list conditions of satisfaction.

**Format**: Given/When/Then or checklist

**Example (checklist)**:
```
User Story: As a power user, I want a spell-checker

Acceptance Criteria:
- Spell-checker underlines misspelled words in red
- Right-click on underlined word shows correction suggestions
- User can add words to personal dictionary
- Spell-check works in real-time as user types
- Works for English, Spanish, and French languages
```

**Example (Given/When/Then)**:
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

### User Story Best Practices

**Keep stories small and independent**: Aim for stories deliverable in a single sprint. If a story is too big ("epic"), break it down.

**The "so that" clause is critical**: If you can't articulate the benefit, the feature might not be justified. It clarifies the value and helps with prioritization.

**Not always "want"**: Sometimes it could be "I need [mandatory action]" or "I am required to [do X]" (for compliance scenarios) – but the structure of role/goal/reason still holds.

**Include persona context**: If you have established personas, reference them in the "As a" section.

**Collaborate on stories**: Product, design, and engineering should all contribute to story creation and acceptance criteria.

## Writing Effective Requirements

### Characteristics of Good Requirements

**Specific**: Clear and unambiguous. Avoid vague terms like "fast" or "intuitive" without definition.

**Measurable**: Include criteria that can be objectively verified.

**Achievable**: Technically and practically feasible within constraints.

**Relevant**: Tied to user needs and business goals.

**Testable**: QA should be able to verify the requirement is met.

### Common Pitfalls

**Solution instead of requirement**: "Use a dropdown menu" is a solution. "User needs to select from 5 categories" is a requirement. Allow design/engineering flexibility.

**Too vague**: "System should be fast" vs. "Page load time <2 seconds for 95th percentile"

**Too prescriptive**: Overly detailed requirements constrain innovation. Balance specificity with flexibility.

**No prioritization**: Everything can't be P0. Use MoSCoW or similar to indicate priority.

**Missing acceptance criteria**: Without clear criteria, teams can't know when they're done.

### Requirements Checklist

Before finalizing requirements, verify:

- [ ] Is the requirement necessary for the user or business goal?
- [ ] Is it clear and unambiguous?
- [ ] Can it be tested/verified?
- [ ] Is the priority clear (Must/Should/Could)?
- [ ] Are there acceptance criteria?
- [ ] Have stakeholders reviewed and agreed?
- [ ] Are dependencies and constraints documented?
- [ ] Is the "why" (benefit) articulated?

## Jobs-to-be-Done Framework

### Concept
Focus on the "job" the user is trying to accomplish, rather than just product features. Users "hire" a product to get a job done.

### Application to Requirements

**Frame requirements as jobs**: Instead of "User wants a drill", recognize the job is "User needs to hang a picture" (which requires a hole in the wall).

**Understand the job context**:
- **Functional job**: The practical task (make a hole)
- **Emotional job**: How the user wants to feel (confident it will hold)
- **Social job**: How the user wants to be perceived (competent DIYer)

**Example**:
```
Feature request: "Add a timer to the meditation app"

JTBD reframe:
Job: "Help me stay focused for my full meditation session without 
worrying about time"

Better requirements emerge:
- Timer with gentle end notification
- Option to extend session mid-meditation
- Visual progress indicator (optional)
- Silent countdown so user can stop checking
```

### Using JTBD in PRDs

Include a "Jobs-to-be-Done" section in PRDs to ensure features align with underlying user goals:

```
## Jobs-to-be-Done

**Job**: Enable researchers to share findings with colleagues without 
compromising confidentiality

**Current solution**: Email PDF attachments with manual redaction
**Pain points**: Time-consuming, error-prone, lacks audit trail
**Desired outcome**: Share securely in <1 minute with confidence

This informs our sharing feature requirements...
```

## Documentation Workflow

### Creating a PRD

1. **Discovery**: Gather user research, stakeholder input, competitive analysis
2. **Draft**: Write initial PRD with overview, goals, and high-level requirements
3. **Collaborate**: Review with design and engineering, refine requirements
4. **User stories**: Break down requirements into stories with acceptance criteria
5. **Review**: Get stakeholder sign-off on scope and priorities
6. **Iterate**: Update PRD as decisions are made and scope evolves
7. **Reference**: Use as source of truth throughout development

### Maintaining Requirements

**Version control**: Track changes to PRD over time

**Change log**: Document significant requirement changes and rationale

**Single source of truth**: Keep requirements in one place (avoid scattered docs)

**Regular reviews**: Revisit PRD in sprint planning and retrospectives

**Post-launch**: Update with actual outcomes and learnings for future reference

## Integration with Commands

These templates and guidelines support:

- **`/create-prd`**: Uses PRD structure as template
- **`/create-user-stories`**: Applies user story format and best practices
- **`/analyze-feature-request`**: Ensures requests are framed as user needs with clear value

