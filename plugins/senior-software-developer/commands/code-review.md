# Code Review


## Overview
Perform a thorough, senior-level code review focusing on design, maintainability, performance, security, and best practices. Provides constructive feedback with specific suggestions for improvement.

## Steps

### 1. Understand the Change
- What problem is this code solving?
- What is the scope and impact of the change?
- Are there any related files or systems affected?
- Review any associated requirements, tickets, or PRs

### 2. Review Design & Architecture
- **Fits into Architecture**: Does this change align with the overall system design?
- **Design Patterns**: Are appropriate patterns used?
- **Abstraction Level**: Is the abstraction appropriate (not too abstract, not too concrete)?
- **SOLID Principles**: 
  - Single Responsibility: Does each class/function have one reason to change?
  - Open/Closed: Open for extension, closed for modification?
  - Liskov Substitution: Are inheritance relationships correct?
  - Interface Segregation: Are interfaces focused and minimal?
  - Dependency Inversion: Depend on abstractions, not concretions?

### 3. Evaluate Code Quality
- **Readability**: Is the code easy to understand?
- **Naming**: Are variables, functions, and classes well-named?
- **Complexity**: Are functions/methods too complex? (Check cyclomatic complexity)
- **Length**: Are files or functions too long?
- **DRY**: Is there code duplication?
- **Magic Numbers**: Are constants properly named and defined?
- **Comments**: Are comments helpful (explain why, not what)?

### 4. Check Logic & Correctness
- **Edge Cases**: Are edge cases handled?
- **Error Handling**: Are errors caught and handled appropriately?
- **Null Safety**: Are null/undefined values handled?
- **Type Safety**: Are types used correctly?
- **Logic Errors**: Are there any logical mistakes?
- **Off-by-one Errors**: Check loop boundaries and array indices

### 5. Performance Review
- **Algorithmic Complexity**: What's the time/space complexity?
- **Unnecessary Operations**: Are there redundant calculations?
- **Database Queries**: N+1 queries? Missing indexes?
- **Caching**: Should results be cached?
- **Memory Leaks**: Are resources properly cleaned up?
- **Lazy Loading**: Should data be loaded on-demand?

### 6. Security Assessment
- **Input Validation**: Are all inputs validated and sanitized?
- **SQL Injection**: Are queries parameterized?
- **XSS**: Is output escaped appropriately?
- **Authentication**: Are auth checks present where needed?
- **Authorization**: Are permission checks correct?
- **Sensitive Data**: Is PII/credentials handled securely?
- **Rate Limiting**: Are there protections against abuse?

### 7. Testing Review
- **Test Coverage**: Are new features tested?
- **Test Quality**: Do tests verify correct behavior?
- **Edge Cases**: Are edge cases tested?
- **Mocking**: Are external dependencies properly mocked?
- **Test Naming**: Are test names descriptive?
- **Assertions**: Are assertions specific and meaningful?

### 8. API & Interface Design
- **API Design**: Is the API intuitive and consistent?
- **Backward Compatibility**: Does this break existing contracts?
- **Versioning**: Is versioning handled if needed?
- **Documentation**: Is the API documented?
- **Error Messages**: Are error messages helpful?

### 9. Dependencies & Imports
- **Necessary Dependencies**: Are all dependencies needed?
- **Version Constraints**: Are versions pinned appropriately?
- **Security Vulnerabilities**: Any known CVEs?
- **License Compatibility**: Are licenses compatible?
- **Import Organization**: Are imports organized logically?

### 10. Documentation
- **Code Documentation**: Are complex parts explained?
- **API Documentation**: Is public API documented?
- **README Updates**: Does README need updating?
- **Changelog**: Should CHANGELOG be updated?
- **Migration Guides**: Are breaking changes documented?

### 11. Provide Feedback
Structure feedback as:

**Critical Issues** (must fix before merge):
- Security vulnerabilities
- Bugs or logic errors
- Breaking changes without migration path

**Important Suggestions** (should address):
- Design improvements
- Performance issues
- Missing tests
- Code quality concerns

**Nitpicks** (optional improvements):
- Minor style issues
- Better naming suggestions
- Refactoring opportunities

**Praise** (positive feedback):
- Well-designed solutions
- Good test coverage
- Clear documentation

## Checklist

- [ ] Purpose and scope understood
- [ ] Architecture alignment verified
- [ ] Code quality assessed
- [ ] Logic and correctness verified
- [ ] Performance implications considered
- [ ] Security vulnerabilities checked
- [ ] Test coverage reviewed
- [ ] API design evaluated
- [ ] Dependencies reviewed
- [ ] Documentation checked
- [ ] Constructive feedback provided

## Examples

### Example 1: Review a Pull Request
```
/code-review

Please review this PR that adds user authentication:
- Implements JWT-based auth
- Adds login/logout endpoints
- Includes middleware for protected routes
- 85% test coverage
```

### Example 2: Review a Specific File
```
/code-review src/services/payment-processor.ts

Focus on security and error handling for payment processing logic.
```

### Example 3: Review Recent Changes
```
/code-review --since=HEAD~3

Review the last 3 commits in the feature branch.
```

## Configuration

### Focus Areas
- `--focus=security`: Emphasize security review
- `--focus=performance`: Deep dive on performance
- `--focus=testing`: Focus on test coverage and quality
- `--focus=design`: Emphasize architecture and design patterns

### Strictness Level
- `--strict`: Flag all issues including nitpicks
- `--normal`: Balanced review (default)
- `--lenient`: Focus only on critical issues

## Best Practices

1. **Be Constructive**: Suggest improvements, don't just criticize
2. **Explain Why**: Help the author learn, not just fix issues
3. **Prioritize**: Distinguish between must-fix and nice-to-have
4. **Acknowledge Good Work**: Give positive feedback too
5. **Be Specific**: Point to exact lines and provide examples
6. **Consider Context**: Understand constraints and tradeoffs
7. **Ask Questions**: If something is unclear, ask for clarification

## Common Issues to Watch For

### Logic Issues
- Off-by-one errors in loops
- Incorrect boolean logic
- Race conditions
- Unhandled edge cases

### Security Issues
- Unvalidated user input
- Hardcoded credentials
- Missing authentication checks
- Insecure random number generation

### Performance Issues
- N+1 query problems
- Unnecessary database calls
- Memory leaks
- Blocking I/O operations

### Maintainability Issues
- God classes/functions
- Deep nesting
- Complex conditionals
- Tight coupling

## Related Commands

- `/architecture-review`: Review overall system architecture
- `/refactor-strategy`: Plan refactoring for legacy code
- `/security-audit`: Deep security analysis
- `/performance-audit`: Detailed performance review

