---
description: Generate a comprehensive PRD for a feature or product initiative
argument-hint: [feature or product name]
---

# Create Product Requirements Document (PRD)

Generate a comprehensive PRD for: **$ARGUMENTS**

## Your Task

Create a complete Product Requirements Document for the feature/product above. Follow the structure below to produce a PRD that incorporates user research, technical considerations, success metrics, and a clear execution plan.

## Steps

1. **Gather Requirements for "$ARGUMENTS"**
   - Interview stakeholders about feature goals
   - Search Dovetail for relevant user research
   - Review Coda for related product documentation
   - Identify technical constraints and dependencies

2. **Define Problem & Opportunity**
   - Articulate the user problem or opportunity
   - Apply Jobs-to-be-Done framework to understand user's underlying goal
   - Apply Double Diamond process: ensure problem is well-defined before jumping to solution
   - Quantify market opportunity
   - Define success criteria
   
   **Reference**: See [product-frameworks](../skills/product-frameworks/) skill for:
   - Jobs-to-be-Done framing ([requirements.md](../skills/product-frameworks/references/requirements.md))
   - Double Diamond process ([design-processes.md](../skills/product-frameworks/references/design-processes.md))

3. **Specify Solution**
   - Detail functional requirements
   - Define user stories and acceptance criteria
   - Create user flow diagrams (if needed)
   - Specify edge cases and error states

4. **Plan Execution**
   - Break down into phases/milestones
   - Identify dependencies and risks
   - Estimate timeline and resources
   - Define launch criteria

5. **Define Metrics**
   - Specify success metrics (North Star, KPIs)
   - Define measurement approach
   - Set targets and goals
   - Plan experimentation strategy

## PRD Structure

Use the comprehensive PRD template from the [product-frameworks](../skills/product-frameworks/) skill ([requirements.md](../skills/product-frameworks/references/requirements.md)).

### 1. Overview
- **Title**: Feature/Product name
- **Owner**: PM responsible
- **Status**: Draft/Review/Approved
- **Last updated**: Date
- **Stakeholders**: Key people involved

### 2. Problem Statement
- What user problem are we solving?
- What job is the user trying to do? (Jobs-to-be-Done)
- Why is this important now?
- What happens if we don't solve this?
- User research evidence (link to Dovetail)

### 3. Goals & Success Metrics
- Business objectives
- User value objectives
- Key metrics (with targets)
- How we'll measure success
- North Star metric (if applicable)

### 4. User Stories & Requirements
- User personas affected
- User stories in standard format:
  - "As a [user role], I want [goal] so that [benefit]"
  - Include acceptance criteria for each story
- Functional requirements
- Non-functional requirements (performance, security, etc.)
- MoSCoW prioritization (Must/Should/Could/Won't have)
- Out of scope (what we're NOT building)

**Reference**: See [requirements.md](../skills/product-frameworks/references/requirements.md) for:
- Detailed PRD structure guidance
- User story format and examples
- Acceptance criteria best practices

### 5. User Experience
- User flows (key paths)
- Wireframes or mockups (if available)
- Edge cases and error handling
- Accessibility requirements

### 6. Technical Considerations
- Architecture overview
- APIs or integrations needed
- Data models
- Performance requirements
- Security considerations

### 7. Dependencies & Risks
- Internal dependencies (teams, systems)
- External dependencies (vendors, partners)
- Technical risks
- Business risks
- Mitigation strategies

### 8. Timeline & Phases
- Phase 1: MVP (minimum viable product)
- Phase 2: Enhancements
- Phase 3: Scale
- Key milestones and dates

### 9. Launch Plan
- Beta testing approach
- Rollout strategy (% of users)
- Communication plan
- Support readiness

### 10. Open Questions
- Unresolved decisions
- Items needing research
- Assumptions to validate

### 11. Appendices (Optional)
- Market research
- Customer feedback snippets
- Technical diagrams
- Competitive analysis

## Framework References

The PRD structure follows industry best practices. For detailed guidance:
- **Complete PRD template**: [requirements.md](../skills/product-frameworks/references/requirements.md)
- **User story format**: [requirements.md](../skills/product-frameworks/references/requirements.md)
- **Jobs-to-be-Done framing**: [requirements.md](../skills/product-frameworks/references/requirements.md)
- **Double Diamond context**: [design-processes.md](../skills/product-frameworks/references/design-processes.md)

## Output

The command will:
1. Create a new Markdown file for the PRD
2. Populate it with the structured content
3. Link to relevant Dovetail insights
4. Suggest saving to Coda for team collaboration
5. Generate a checklist for PRD review

## Examples

### Example 1: New Feature PRD
```
User: "Create a PRD for the bulk export feature we discussed"

[Command generates]:
- Searches Dovetail for export-related research
- Checks Coda for related docs
- Creates structured PRD with all sections
- Includes RICE score from previous analysis
```

### Example 2: Product Enhancement PRD
```
User: "We need a PRD for improving search performance"

[Command generates]:
- Reviews user feedback about search
- Documents performance requirements
- Creates phased rollout plan
- Defines success metrics
```

## Review Checklist

Before finalizing, verify:
- [ ] Problem statement is clear and evidence-based
- [ ] Success metrics are specific and measurable
- [ ] User stories cover all key scenarios
- [ ] Technical feasibility confirmed with engineering
- [ ] Dependencies and risks identified
- [ ] Timeline is realistic
- [ ] Launch plan is detailed
- [ ] Stakeholders reviewed and approved

## Best Practices

- Start with "why" before "what"
- Ground requirements in user research
- Be specific about success metrics
- Include both happy paths and edge cases
- Make assumptions explicit
- Keep it living document (update as you learn)
- Use visuals where helpful (flows, mockups)
- Get cross-functional review (eng, design, data)

## Related Commands

- [/analyze-feature-request](analyze-feature-request.md) - Before creating PRD
- `/update-roadmap` - After PRD approval
- [/search-user-research](search-user-research.md) - Find supporting research

