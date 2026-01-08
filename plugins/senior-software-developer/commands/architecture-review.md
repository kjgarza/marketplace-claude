# Architecture Review

## Overview
Conduct a comprehensive architecture review of your codebase, evaluating system design, scalability, maintainability, and adherence to best practices. This command provides senior-level analysis with actionable recommendations.

## Steps

### 1. Understand Context
- Identify the type of system (web app, microservices, monolith, distributed system, etc.)
- Determine the technology stack and frameworks in use
- Understand the business domain and requirements
- Review any existing architecture documentation

### 2. Analyze System Structure
- **Module Organization**: Evaluate how code is organized into modules, packages, or services
- **Separation of Concerns**: Check if responsibilities are properly separated
- **Dependencies**: Map out dependencies between components
- **Coupling**: Identify tight coupling that may hinder maintainability
- **Cohesion**: Assess if related functionality is grouped appropriately

### 3. Evaluate Architectural Patterns
- Identify design patterns in use (MVC, MVVM, Repository, Factory, etc.)
- Assess if patterns are applied correctly and consistently
- Look for anti-patterns (God objects, circular dependencies, etc.)
- Evaluate if the chosen patterns fit the problem domain

### 4. Review Scalability & Performance
- **Horizontal Scalability**: Can the system scale by adding more instances?
- **Vertical Scalability**: Are there bottlenecks that limit scaling up?
- **Caching Strategy**: Is caching used appropriately?
- **Database Design**: Review query patterns, indexes, and data models
- **Asynchronous Processing**: Are long-running tasks handled asynchronously?
- **Rate Limiting**: Are there protections against abuse?

### 5. Assess Reliability & Resilience
- **Error Handling**: Is error handling comprehensive and graceful?
- **Fault Tolerance**: How does the system handle failures?
- **Circuit Breakers**: Are there protections against cascading failures?
- **Retry Logic**: Are transient failures handled appropriately?
- **Monitoring**: Is the system observable and debuggable?
- **Health Checks**: Are health endpoints implemented?

### 6. Security Review
- **Authentication**: How are users authenticated?
- **Authorization**: Is access control properly implemented?
- **Input Validation**: Are inputs sanitized and validated?
- **Secrets Management**: How are sensitive credentials stored?
- **API Security**: Are APIs protected against common attacks (SQL injection, XSS, CSRF)?
- **Data Encryption**: Is sensitive data encrypted at rest and in transit?

### 7. Code Quality Assessment
- **Testing**: Review test coverage and quality
- **Documentation**: Assess if code and APIs are well-documented
- **Code Complexity**: Identify overly complex methods or classes
- **Code Duplication**: Look for DRY violations
- **Naming Conventions**: Check for clear, consistent naming
- **Type Safety**: Evaluate use of types and interfaces

### 8. DevOps & Deployment
- **CI/CD Pipeline**: Review automated testing and deployment
- **Infrastructure as Code**: Is infrastructure versioned and reproducible?
- **Containerization**: Is Docker or similar technology used appropriately?
- **Configuration Management**: How are environment-specific configs handled?
- **Rollback Strategy**: Can deployments be easily rolled back?

### 9. Generate Recommendations
Provide prioritized recommendations in three categories:

**Critical Issues** (fix immediately):
- Security vulnerabilities
- Data loss risks
- Scalability blockers

**Important Improvements** (plan for next sprint):
- Performance optimizations
- Code quality issues
- Missing tests

**Nice-to-Haves** (technical debt backlog):
- Refactoring opportunities
- Documentation gaps
- Tool upgrades

### 10. Create Action Plan
- Estimate effort for each recommendation (small/medium/large)
- Identify quick wins vs. long-term improvements
- Suggest phased approach for major refactoring
- Highlight dependencies between improvements

## Checklist

- [ ] System context and requirements understood
- [ ] Module structure and organization reviewed
- [ ] Design patterns and anti-patterns identified
- [ ] Scalability and performance assessed
- [ ] Reliability and error handling evaluated
- [ ] Security vulnerabilities checked
- [ ] Code quality metrics reviewed
- [ ] Testing coverage analyzed
- [ ] DevOps practices evaluated
- [ ] Prioritized recommendations provided
- [ ] Action plan with estimates created

## Examples

### Example 1: Review a Microservices Architecture
```
/architecture-review

Please review the architecture of our e-commerce platform:
- 5 microservices (auth, products, orders, payments, notifications)
- Node.js with Express
- PostgreSQL databases per service
- RabbitMQ for inter-service communication
- Deployed on Kubernetes
```

### Example 2: Review a Monolithic Application
```
/architecture-review

Analyze our legacy Django monolith:
- 50k lines of Python code
- Single PostgreSQL database
- Redis for caching
- Considering breaking into microservices
```

## Configuration

### Scope Options
You can focus the review on specific areas:
- `--focus=security`: Deep dive on security issues
- `--focus=performance`: Emphasize scalability and performance
- `--focus=maintainability`: Focus on code quality and structure
- `--focus=cost`: Analyze infrastructure cost optimization

### Output Format
- `--format=summary`: High-level executive summary
- `--format=detailed`: Comprehensive analysis (default)
- `--format=checklist`: Actionable task list

## Best Practices

1. **Be Holistic**: Consider technical, business, and team constraints
2. **Prioritize**: Not all issues are equally important
3. **Be Pragmatic**: Perfect is the enemy of good
4. **Consider Context**: What works for one system may not work for another
5. **Think Long-term**: Balance immediate needs with future maintainability

## Related Commands

- `/code-review`: Review specific code changes or files
- `/system-design`: Design a new system or feature
- `/refactor-strategy`: Create a plan for large-scale refactoring
- `/performance-audit`: Deep dive on performance optimization

