# Refactor Strategy

## Overview
Create a comprehensive, risk-mitigated strategy for refactoring legacy code or large-scale architectural changes. This command helps plan refactoring that can be done incrementally without breaking production systems.

## Steps

### 1. Assess Current State

#### Understand the Problem
- What are the pain points with the current code?
- Why does it need refactoring?
- What specific issues are you trying to solve?
- What is the business impact?

#### Analyze the Codebase
- Code complexity metrics (cyclomatic complexity, nesting depth)
- Code duplication
- Test coverage
- Dependencies and coupling
- Technical debt accumulation
- Performance bottlenecks

#### Identify Constraints
- Must maintain backward compatibility?
- Zero downtime requirement?
- Team size and expertise
- Time and budget constraints
- External dependencies

### 2. Define Target State

#### Desired Outcome
- What does "good" look like?
- What architectural pattern are you moving toward?
- What will be better after refactoring?
- How will you measure success?

#### Success Metrics
- Code quality metrics improvement
- Performance improvements
- Reduction in bugs/incidents
- Developer velocity increase
- Test coverage increase

### 3. Risk Assessment

Identify risks:
- **Breaking Changes**: What could break?
- **Data Migration**: Does data need to be migrated?
- **Downtime**: Will there be service interruption?
- **Performance**: Could performance degrade?
- **Team Knowledge**: Does the team understand the changes?
- **Dependencies**: What external systems are affected?

For each risk:
- **Likelihood**: High/Medium/Low
- **Impact**: High/Medium/Low
- **Mitigation**: How to reduce risk?

### 4. Choose Refactoring Strategy

#### Strangler Fig Pattern (Recommended for Large Changes)
- Build new system alongside old
- Gradually route traffic to new system
- Decommission old system once fully replaced
- **Pros**: Low risk, incremental, can rollback
- **Cons**: Temporary complexity, longer timeline

#### Big Bang Refactor
- Rewrite everything at once
- Deploy all changes together
- **Pros**: Clean break, simpler during refactor
- **Cons**: High risk, long development, difficult rollback

#### Branch by Abstraction
- Create abstraction layer
- Implement new version behind abstraction
- Switch implementations
- Remove abstraction once complete
- **Pros**: No branching issues, incremental
- **Cons**: Requires careful abstraction design

#### Feature Flags
- Deploy both old and new code
- Use flags to control which version runs
- Gradually roll out new version
- **Pros**: Easy rollback, gradual rollout
- **Cons**: Code complexity during transition

### 5. Break Down Into Phases

Create incremental phases:

**Phase 1: Foundation**
- Set up new structure
- Add comprehensive tests
- Create abstractions
- No user-facing changes

**Phase 2: Parallel Implementation**
- Implement new version alongside old
- Verify correctness
- Shadow traffic for testing

**Phase 3: Gradual Migration**
- Route small percentage of traffic
- Monitor metrics
- Increase percentage if stable

**Phase 4: Complete Migration**
- Route all traffic to new version
- Keep old version for rollback
- Monitor for issues

**Phase 5: Cleanup**
- Remove old code
- Remove feature flags
- Update documentation

Each phase should:
- Be independently deployable
- Take 1-4 weeks
- Have clear success criteria
- Be reversible

### 6. Testing Strategy

#### Before Refactoring
- Add characterization tests (test current behavior)
- Increase test coverage of areas being changed
- Document current behavior

#### During Refactoring
- Maintain or increase test coverage
- Add tests for new code
- Ensure tests pass after each change
- Use TDD for new implementations

#### After Refactoring
- Run full regression test suite
- Performance testing
- Load testing
- Security testing
- User acceptance testing

#### Testing Techniques
- **Parallel Run**: Run old and new code, compare outputs
- **Shadow Traffic**: Send copy of real traffic to new code
- **Canary Deployment**: Deploy to small percentage of users
- **Blue-Green Deployment**: Switch between old and new versions
- **A/B Testing**: Compare metrics between versions

### 7. Data Migration Plan (if applicable)

#### Assess Data Changes
- Schema changes needed?
- Data transformations required?
- Historical data migration?

#### Migration Strategy
- **Dual Writes**: Write to both old and new datastores
- **Backfill**: Migrate historical data in background
- **Validation**: Verify data consistency
- **Rollback**: Plan for reverting data changes

#### Steps
1. Add dual writes (write to old and new)
2. Backfill historical data
3. Validate data consistency
4. Switch reads to new datastore
5. Stop writes to old datastore
6. Archive old data

### 8. Deployment Strategy

#### Gradual Rollout
- Deploy to dev environment
- Deploy to staging
- Deploy to production (1% of traffic)
- Monitor metrics
- Increase to 10%, 50%, 100%

#### Monitoring During Rollout
- Error rates
- Response times
- Resource utilization
- Business metrics
- User feedback

#### Rollback Plan
- Automated rollback triggers
- Manual rollback procedure
- How quickly can you rollback?
- Data rollback considerations

### 9. Communication Plan

#### Team Communication
- Share refactoring plan with team
- Conduct design review
- Pair programming for complex parts
- Daily standups during critical phases
- Retrospectives after each phase

#### Stakeholder Communication
- Explain business value
- Communicate timeline
- Set expectations for disruptions
- Report progress regularly
- Celebrate milestones

#### Documentation
- Update architecture docs
- Create runbooks
- Document new patterns
- Update onboarding materials
- Record decisions and tradeoffs

### 10. Implementation Guidelines

#### Code Quality Standards
- Follow existing code style
- Use consistent naming
- Add meaningful comments
- Keep functions small
- Reduce complexity

#### Incremental Changes
- Small, frequent commits
- Each commit should compile and pass tests
- Frequent deployments
- Quick feedback loops

#### Continuous Monitoring
- Set up dashboards
- Create alerts for anomalies
- Track key metrics
- Log important events

### 11. Create Refactoring Backlog

Break work into stories:
- Each story should be completable in 1-3 days
- Stories should be independently valuable
- Prioritize by risk and value
- Include testing and documentation tasks

Example stories:
1. Add characterization tests for UserService
2. Extract UserRepository interface
3. Implement new UserRepository with PostgreSQL
4. Add feature flag for UserRepository selection
5. Deploy with flag disabled
6. Enable flag for 1% of traffic
7. Monitor and increase to 100%
8. Remove old implementation

### 12. Post-Refactoring Review

After completion:
- Measure against success metrics
- Conduct retrospective
- Document lessons learned
- Identify remaining technical debt
- Plan next refactoring iteration

## Checklist

- [ ] Current state assessed and documented
- [ ] Target state clearly defined
- [ ] Risks identified and mitigation planned
- [ ] Refactoring strategy selected
- [ ] Work broken into incremental phases
- [ ] Testing strategy defined
- [ ] Data migration plan created (if needed)
- [ ] Deployment strategy planned
- [ ] Communication plan established
- [ ] Implementation guidelines set
- [ ] Refactoring backlog created
- [ ] Monitoring and rollback procedures defined

## Examples

### Example 1: Refactor Monolith to Microservices
```
/refactor-strategy

Plan migration of our monolithic e-commerce app to microservices:
- Current: Single Django app, 100k LOC, PostgreSQL
- Target: 5 microservices (users, products, orders, payments, notifications)
- Constraints: Zero downtime, maintain existing APIs
- Timeline: 6 months
```

### Example 2: Replace Legacy Authentication System
```
/refactor-strategy

Migrate from custom auth to Auth0:
- Current: Custom JWT implementation, user database
- Target: Auth0 with OAuth 2.0
- 50k active users
- Must migrate existing user accounts
- Maintain current user experience
```

### Example 3: Database Migration
```
/refactor-strategy

Migrate from MySQL to PostgreSQL:
- 500GB database
- 24/7 uptime requirement
- Complex queries using MySQL-specific features
- Need to test query performance
```

## Best Practices

1. **Test First**: Add tests before refactoring
2. **Incremental Changes**: Small, frequent deployments
3. **Measure Everything**: Track metrics before and after
4. **Communicate Often**: Keep team and stakeholders informed
5. **Plan for Rollback**: Always have an escape hatch
6. **Pair Program**: Complex refactoring benefits from collaboration
7. **Document Decisions**: Explain why, not just what
8. **Celebrate Progress**: Acknowledge milestones
9. **Learn and Iterate**: Adjust strategy based on feedback
10. **Don't Gold-Plate**: Focus on solving the problem, not perfection

## Anti-Patterns to Avoid

- **Big Bang Refactor**: Rewriting everything at once
- **Refactor Without Tests**: Changing code without safety net
- **Scope Creep**: Adding features during refactoring
- **Perfectionism**: Spending too long on diminishing returns
- **No Monitoring**: Not tracking impact of changes
- **Ignoring Feedback**: Not adapting based on results
- **Solo Refactoring**: Not involving team in major changes

## Related Commands

- `/architecture-review`: Assess current architecture
- `/code-review`: Review refactored code
- `/system-design`: Design target architecture
- `/technical-debt-audit`: Identify areas needing refactoring

