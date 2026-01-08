---
name: detect-code-smells
description: Detect common code smells and anti-patterns providing feedback on quality issues a senior developer would catch during review. Use when user opens/views code files, asks for code review or quality assessment, mentions code quality/refactoring/improvements, when files contain code smell patterns, or during code review discussions.
---

# Detect Code Smells

Detect common code smells and anti-patterns in code, providing immediate feedback on quality issues.

## Code Smell Categories

### 1. Complexity Smells
- **Long Method**: Functions/methods > 50 lines
- **Long Parameter List**: > 4 parameters
- **Complex Conditionals**: Deeply nested if/else, complex boolean expressions
- **High Cyclomatic Complexity**: > 10 branches
- **Deep Nesting**: > 4 levels of indentation

### 2. Duplication Smells
- **Duplicate Code**: Repeated code blocks
- **Similar Functions**: Functions with nearly identical logic
- **Magic Numbers**: Hardcoded numbers without explanation
- **String Duplication**: Repeated string literals

### 3. Naming Smells
- **Unclear Names**: Single letter variables (except loop counters)
- **Hungarian Notation**: Unnecessary type prefixes
- **Inconsistent Naming**: Mixed camelCase/snake_case
- **Abbreviated Names**: Unclear abbreviations (mgr, ctx, tmp)
- **Misleading Names**: Name doesn't match behavior

### 4. Object-Oriented Smells
- **God Class**: Class > 500 lines or too many responsibilities
- **Data Class**: Class with only getters/setters
- **Feature Envy**: Method uses more of another class than its own
- **Inappropriate Intimacy**: Classes too dependent on internal details
- **Lazy Class**: Class doing too little to justify existence

### 5. Functional Smells
- **Side Effects**: Function modifies external state unexpectedly
- **Non-Pure Functions**: Functions with hidden dependencies
- **Mutability Issues**: Unexpected mutation of objects
- **Callback Hell**: Deeply nested callbacks

### 6. Architecture Smells
- **Circular Dependencies**: Module A depends on B, B depends on A
- **Missing Abstraction**: Concrete implementations without interfaces
- **Tight Coupling**: Hard dependencies on specific implementations
- **Leaky Abstraction**: Implementation details exposed through interface

## Detection Process

1. Parse file - Analyze syntax tree and structure
2. Identify patterns - Look for known code smell patterns
3. Calculate metrics - Measure complexity, length, duplication
4. Assess severity - Determine impact of each smell
5. Generate report - Provide actionable feedback

## Analysis Techniques
- Abstract Syntax Tree (AST) parsing
- Pattern matching against known smells
- Metric calculation (LOC, complexity, coupling)
- Comparison with language-specific best practices
- Context-aware analysis (test files have different standards)

## Return Value

Return object:
```json
{
  "file": "path/to/file.js",
  "language": "javascript",
  "overallScore": 7.5,
  "smells": [
    {
      "type": "Long Method",
      "severity": "warning",
      "location": {
        "line": 42,
        "endLine": 95,
        "function": "processUserData"
      },
      "description": "Function 'processUserData' is 53 lines long",
      "suggestion": "Extract smaller functions for validation, transformation, and persistence",
      "impact": "Harder to understand, test, and maintain",
      "effort": "medium"
    },
    {
      "type": "Complex Conditional",
      "severity": "warning",
      "location": {
        "line": 67,
        "column": 8
      },
      "description": "Nested conditional with 5 levels of nesting",
      "suggestion": "Extract conditions into well-named boolean variables or separate functions",
      "impact": "Difficult to understand logic flow",
      "effort": "small"
    }
  ],
  "metrics": {
    "linesOfCode": 234,
    "averageComplexity": 4.2,
    "maxComplexity": 12,
    "duplicationPercentage": 8.5
  },
  "recommendations": [
    "Extract 'processUserData' into smaller single-purpose functions",
    "Replace complex conditional at line 67 with early returns",
    "Consider extracting repeated validation logic into a helper function"
  ]
}
```

## Examples

### Example 1: Detecting Long Method
**Context**: User opens `user-service.js` containing a 150-line function

**Autonomous Invocation**: Skill automatically analyzes the file and reports:
```
Code Smell Detected: Long Method

Function 'handleUserRegistration' (lines 23-172) is 150 lines long.

Impact: This function is doing too many things, making it:
- Hard to understand at a glance
- Difficult to test thoroughly
- Prone to bugs when modified
- Challenging to reuse parts of its logic

Suggestion: Extract into smaller functions:
- validateRegistrationData() - lines 23-45
- checkEmailAvailability() - lines 46-68
- createUserAccount() - lines 69-98
- sendWelcomeEmail() - lines 99-130
- logRegistrationEvent() - lines 131-172

This follows the Single Responsibility Principle and makes each piece independently testable.
```

### Example 2: Detecting Complex Conditional
**Context**: User working on file with deeply nested if/else

**Autonomous Invocation**: Skill detects and suggests:
```
Code Smell Detected: Complex Conditional

Lines 45-72 contain a deeply nested conditional (5 levels deep) with multiple boolean conditions.

Current pattern:
if (user) {
  if (user.isActive) {
    if (user.hasPermission('admin')) {
      if (validateToken(user.token)) {
        // ... more nesting
      }
    }
  }
}

Refactoring suggestion using guard clauses:
if (!user) return null;
if (!user.isActive) return null;
if (!user.hasPermission('admin')) return null;
if (!validateToken(user.token)) return null;

// Now do the work without nesting

Benefits: Reduces cognitive load, clearer failure conditions, easier to test edge cases.
```

### Example 3: Detecting Code Duplication
**Context**: User reviewing file with repeated code blocks

**Autonomous Invocation**: Skill identifies DRY violation:
```
Code Smell Detected: Duplicate Code

Found 3 nearly identical code blocks:
- Lines 34-42 (in fetchUserById)
- Lines 78-86 (in fetchUserByEmail)
- Lines 112-120 (in fetchUserByUsername)

All three blocks implement the same error handling and response formatting logic.

Suggestion: Extract common logic into a helper function:

function handleUserFetchResponse(result, errorMessage) {
  if (!result) {
    throw new Error(errorMessage);
  }
  return formatUserResponse(result);
}

Then simplify each call site:
const user = await db.query(...);
return handleUserFetchResponse(user, 'User not found');

Impact: Reduces maintenance burden, ensures consistent behavior, fewer bugs.
```

## Error Handling

- If file cannot be parsed: Return error with details about syntax issue
- If language not supported: Suggest manual review or generic analysis
- If file is too large (> 10k lines): Warn about God Object and suggest splitting
- If file is test file: Apply different standards (longer functions acceptable)
- If file is generated: Skip analysis or warn user

## Context Awareness

### Test Files
- Allow longer functions (tests often have setup/teardown)
- Allow more duplication (explicit tests > DRY)
- Different naming conventions acceptable

### Configuration Files
- JSON/YAML: Check for structural issues
- Don't apply code smell rules meant for logic

### Legacy Code
- Flag issues but acknowledge inherited constraints
- Prioritize critical issues over stylistic ones
- Suggest incremental improvement approach

### Generated Code
- Identify if file is auto-generated
- Suggest improving generator rather than generated code
- Skip some smell checks

## Integration with Development Workflow

- **Non-intrusive**: Provides info but doesn't block work
- **Actionable**: Specific suggestions with examples
- **Educational**: Explains why something is a smell
- **Prioritized**: Critical issues highlighted over minor ones
- **Context-sensitive**: Understands different file types

## Related Skills
- `suggest-performance-fix`: Focuses on performance issues
- `security-pattern-check`: Focuses on security concerns

## Notes

This skill acts as a senior developer looking over your shoulder, catching issues that might be missed during fast-paced development. It doesn't replace human code review but augments it by catching obvious issues early.

