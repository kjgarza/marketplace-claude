# Technical Debt Audit

## Overview
Conduct a comprehensive audit of technical debt across your codebase, prioritizing issues and creating a roadmap for addressing accumulated debt. This command helps identify, quantify, and prioritize technical debt for systematic reduction.

## Steps

### 1. Define Technical Debt Categories

#### Code Quality Debt
- Complex, hard-to-understand code
- Code duplication (DRY violations)
- Poor naming and inconsistent conventions
- Lack of comments or outdated documentation
- Long functions/classes (God objects)
- Deep nesting and high cyclomatic complexity

#### Architecture Debt
- Violations of SOLID principles
- Tight coupling between components
- Missing abstractions
- Circular dependencies
- Inappropriate design patterns
- Monolithic components that should be split

#### Testing Debt
- Low or no test coverage
- Brittle tests (too tightly coupled to implementation)
- Missing integration/E2E tests
- Slow test suites
- Flaky tests
- Outdated test data

#### Documentation Debt
- Missing or outdated README
- No API documentation
- Undocumented configuration
- No architecture diagrams
- Missing runbooks
- Stale inline comments

#### Infrastructure Debt
- Manual deployment processes
- No infrastructure as code
- Outdated dependencies
- Security vulnerabilities (CVEs)
- Inefficient resource usage
- No monitoring/alerting

#### Performance Debt
- N+1 query problems
- Missing database indexes
- Inefficient algorithms
- Memory leaks
- No caching strategy
- Unoptimized assets

#### Security Debt
- Known vulnerabilities
- Missing authentication/authorization
- Hardcoded secrets
- Lack of input validation
- No security audits
- Outdated security practices

### 2. Measure Technical Debt

#### Automated Analysis Tools
- **Code Quality**: SonarQube, CodeClimate, ESLint, Pylint
- **Security**: Snyk, Dependabot, npm audit, OWASP ZAP
- **Test Coverage**: Coverage.py, Istanbul, JaCoCo
- **Complexity**: McCabe complexity, cognitive complexity
- **Dependencies**: npm outdated, pip list --outdated

#### Manual Assessment
- Code review sessions
- Team surveys on pain points
- Developer velocity tracking
- Bug/incident analysis
- Time spent on maintenance vs features

#### Key Metrics
- **Code Churn**: Frequency of changes to files
- **Bug Density**: Bugs per 1000 lines of code
- **Test Coverage**: Percentage of code covered by tests
- **Cyclomatic Complexity**: Code complexity score
- **Dependency Age**: How outdated are dependencies?
- **Build Time**: Time to build and test
- **Deployment Frequency**: How often can you deploy?
- **Mean Time to Recovery**: How quickly can you fix issues?

### 3. Quantify Impact

For each debt item, assess:

#### Severity
- **Critical**: Blocks progress, frequent source of bugs
- **High**: Significant impact on velocity or quality
- **Medium**: Noticeable but manageable impact
- **Low**: Minor inconvenience

#### Frequency
- How often does this cause problems?
- How many developers are affected?
- Is it getting worse over time?

#### Cost
- **Ongoing Cost**: Time wasted per week/month
- **Opportunity Cost**: Features not built due to debt
- **Risk Cost**: Potential for major incidents
- **Team Morale Cost**: Developer frustration

Example: "Complex authentication code causes 5 hours/week of debugging and is involved in 40% of security bugs"

### 4. Identify Root Causes

Why did debt accumulate?
- **Deadline Pressure**: Rushed to ship, skipped quality
- **Lack of Knowledge**: Team didn't know better approach
- **Legacy System**: Inherited from previous team
- **Technology Change**: Framework/library became outdated
- **Requirements Change**: Original design no longer fits
- **Lack of Refactoring**: No time allocated for cleanup

Understanding root causes helps prevent future accumulation.

### 5. Create Debt Inventory

Build a comprehensive list with:
- **Item**: Description of debt
- **Category**: Code/Architecture/Testing/etc.
- **Location**: File/module/component
- **Severity**: Critical/High/Medium/Low
- **Effort**: Hours/days to fix
- **Impact**: What improves when fixed?
- **Dependencies**: What must be fixed first?

Example format:
```
| Item | Category | Location | Severity | Effort | Impact |
|------|----------|----------|----------|--------|--------|
| UserService is 2000 lines | Architecture | src/services/user.ts | High | 5 days | Easier to maintain, better testability |
| No integration tests | Testing | tests/ | Critical | 10 days | Catch more bugs, confidence in deploys |
| Hardcoded API keys | Security | config/* | Critical | 1 day | Security compliance, rotate secrets |
```

### 6. Prioritization Framework

Use a scoring system to prioritize:

**Priority Score = (Impact × Frequency × Severity) / Effort**

#### Impact (1-10)
- How much improvement when fixed?
- Developer velocity increase
- Bug reduction
- Performance gain

#### Frequency (1-10)
- How often is this pain felt?
- Number of developers affected
- Frequency of related bugs

#### Severity (1-10)
- How bad is it when it manifests?
- Can it cause outages?
- Does it block work?

#### Effort (story points or days)
- How long to fix?
- Complexity of the fix
- Risk of breaking things

#### Quick Wins
High priority score with low effort:
- Update outdated dependencies
- Add missing indexes
- Extract large functions
- Add critical tests

#### Long-term Projects
High impact but high effort:
- Major refactoring
- Architecture changes
- Test suite overhaul
- Database migration

### 7. Create Reduction Roadmap

#### Phase 1: Critical & Quick Wins (Month 1)
- Security vulnerabilities
- High-impact, low-effort items
- Blocking issues

#### Phase 2: High-Impact Items (Months 2-3)
- Architecture improvements
- Test coverage increase
- Performance optimizations

#### Phase 3: Medium-Priority Items (Months 4-6)
- Code quality improvements
- Documentation updates
- Infrastructure modernization

#### Phase 4: Nice-to-Haves (Ongoing)
- Minor refactoring
- Style consistency
- Legacy cleanup

### 8. Establish Debt Prevention Practices

#### Definition of Done
Add to your DoD:
- [ ] Tests written and passing
- [ ] Code reviewed
- [ ] Documentation updated
- [ ] No new lint warnings
- [ ] Performance impact assessed

#### Code Review Guidelines
- Flag new technical debt
- Suggest improvements
- Don't accumulate debt for deadlines without explicit tradeoff discussion

#### Regular Refactoring Time
- Dedicate 20% of sprint to debt reduction
- "Tech debt Fridays"
- Include refactoring in estimates

#### Monitoring and Metrics
- Track debt metrics over time
- Set targets (e.g., maintain >80% test coverage)
- Review metrics in retrospectives

#### Team Culture
- Make it safe to identify and discuss debt
- Celebrate debt reduction
- Share learnings
- Don't blame for past decisions

### 9. Implement Boy Scout Rule

"Leave the code better than you found it"

When working on a feature:
- If you touch a file, improve it slightly
- Extract a function, add a test, improve naming
- Small, incremental improvements
- Debt reduction becomes part of daily work

### 10. Track Progress

#### Metrics Dashboard
- Code coverage trend
- Complexity trend
- Vulnerability count
- Build time
- Deployment frequency
- Debt backlog burn-down

#### Regular Reviews
- Monthly debt review meetings
- Quarterly retrospectives
- Annual architecture review

#### Celebrate Wins
- Share improvements with team
- Quantify impact (e.g., "tests now run 50% faster")
- Recognize contributors

## Checklist

- [ ] Technical debt categories defined
- [ ] Automated analysis tools run
- [ ] Manual assessment conducted
- [ ] Key metrics collected
- [ ] Impact quantified for each item
- [ ] Root causes identified
- [ ] Comprehensive debt inventory created
- [ ] Prioritization framework applied
- [ ] Reduction roadmap created
- [ ] Prevention practices established
- [ ] Boy Scout Rule adopted
- [ ] Progress tracking set up

## Examples

### Example 1: Audit an E-commerce Platform
```
/technical-debt-audit

Audit our e-commerce platform:
- 5 years old, original team left
- Test coverage ~40%
- Deployment takes 2 hours
- Frequent production issues
- Team velocity declining
```

### Example 2: Audit After Rapid Growth
```
/technical-debt-audit

We grew from 2 to 15 engineers in 1 year. Codebase has:
- Inconsistent patterns across teams
- Duplicate implementations of similar features
- No shared component library
- Documentation is sparse
```

### Example 3: Inherited Legacy System
```
/technical-debt-audit

Inherited PHP monolith:
- 150k lines of code
- PHP 5.6 (EOL)
- No tests
- jQuery spaghetti
- Need modernization plan
```

## Best Practices

1. **Be Objective**: Use metrics, not opinions
2. **Be Comprehensive**: Don't just focus on code quality
3. **Involve the Team**: Get input from all developers
4. **Quantify Impact**: Use data to prioritize
5. **Start Small**: Pick quick wins to build momentum
6. **Make It Ongoing**: Debt audit is not one-time
7. **Communicate Up**: Help leadership understand cost of debt
8. **Don't Blame**: Focus on improvement, not fault
9. **Track Trends**: Is debt increasing or decreasing?
10. **Balance**: Some debt is acceptable tradeoff

## Common Pitfalls

- **Analysis Paralysis**: Spending too long analyzing, not fixing
- **Perfectionism**: Trying to fix everything at once
- **No Follow-through**: Creating plan but not executing
- **Ignoring Root Causes**: Fixing symptoms without addressing why debt accumulates
- **No Time Allocated**: Expecting debt reduction to happen "when there's time"
- **Tool Over-reliance**: Trusting automated tools without context
- **Neglecting Documentation**: Only focusing on code

## Output Format

The audit should produce:
1. **Executive Summary**: High-level findings and recommendations
2. **Debt Inventory**: Detailed list of all debt items
3. **Prioritization Matrix**: Visual representation of priority scores
4. **Roadmap**: Timeline for addressing debt
5. **Metrics Dashboard**: Current state and targets
6. **Prevention Plan**: How to avoid future debt accumulation

## Related Commands

- `/architecture-review`: Deep dive on architecture debt
- `/code-review`: Review specific code for quality issues
- `/refactor-strategy`: Plan how to address major debt items
- `/security-audit`: Focus on security-related debt

