# Senior Software Developer Plugin

Expert-level development assistance for architecture, code review, system design, and technical leadership. This plugin provides senior-level guidance across all aspects of software engineering, from code quality to system architecture.

## Features

### 🎯 Commands

#### `/architecture-review`
Conduct comprehensive architecture reviews of your codebase. Evaluates:
- System structure and module organization
- Design patterns and anti-patterns
- Scalability and performance considerations
- Security and reliability
- Code quality and testing
- DevOps practices

**Example:**
```
/architecture-review

Review our e-commerce microservices architecture:
- 5 services (auth, products, orders, payments, notifications)
- Node.js with PostgreSQL
- Kubernetes deployment
```

#### `/code-review`
Perform thorough, senior-level code reviews. Analyzes:
- Design and architecture alignment
- Code quality and readability
- Logic and correctness
- Performance implications
- Security vulnerabilities
- Test coverage
- API design

**Example:**
```
/code-review src/services/payment-processor.ts

Focus on security and error handling for payment processing logic.
```

#### `/system-design`
Design robust, scalable systems from scratch. Guides through:
- Requirements gathering (functional and non-functional)
- Capacity estimation
- API design
- Data modeling
- Architecture patterns
- Scalability strategy
- Reliability and resilience
- Security design
- Monitoring and observability

**Example:**
```
/system-design

Design a real-time chat application:
- Support 1M concurrent users
- 1-on-1 and group chats
- Message history and file sharing
- End-to-end encryption
```

#### `/refactor-strategy`
Create comprehensive refactoring strategies for legacy code. Includes:
- Current state assessment
- Risk analysis
- Refactoring approach (Strangler Fig, Branch by Abstraction, etc.)
- Incremental phase planning
- Testing strategy
- Data migration planning
- Rollback procedures

**Example:**
```
/refactor-strategy

Plan migration from monolith to microservices:
- 100k LOC Django app
- PostgreSQL database
- Zero downtime requirement
- 6-month timeline
```

#### `/technical-debt-audit`
Comprehensive technical debt analysis. Covers:
- Code quality, architecture, testing, documentation debt
- Automated and manual assessment
- Impact quantification
- Prioritization framework
- Reduction roadmap
- Prevention practices

**Example:**
```
/technical-debt-audit

Audit our 5-year-old e-commerce platform:
- Test coverage ~40%
- Frequent production issues
- Team velocity declining
```

### 🤖 Senior Developer Agent

Activates automatically to provide expert-level guidance on:
- Architecture and system design decisions
- Code review and quality feedback
- Technical tradeoff analysis
- Performance optimization
- Security best practices
- Refactoring and technical debt
- Technology selection
- Career and skill development

The agent provides pragmatic, context-aware advice that balances best practices with real-world constraints.

### 🧠 Autonomous Skills

#### Detect Code Smells
Automatically identifies code quality issues:
- Complexity smells (long methods, deep nesting)
- Duplication (DRY violations)
- Naming issues
- Object-oriented anti-patterns
- Architecture problems

**When Invoked:**
- When viewing code files
- During code reviews
- When code quality is discussed

#### Suggest Performance Fix
Proactively identifies performance bottlenecks:
- Algorithmic complexity issues (O(n²) problems)
- N+1 query problems
- Missing database indexes
- Memory leaks
- I/O inefficiencies
- Frontend/API performance issues

**When Invoked:**
- When performance is mentioned
- When obvious anti-patterns are detected
- During performance-critical code analysis

#### Security Pattern Check
Autonomously catches security vulnerabilities:
- Injection vulnerabilities (SQL, command, XSS)
- Authentication/authorization issues
- Sensitive data exposure
- Hardcoded secrets
- Missing input validation
- Cryptographic weaknesses
- Known vulnerable dependencies

**When Invoked:**
- When working with security-sensitive code
- When handling user input
- When security is discussed
- During auth, payment, or data access code review

#### VS Code Extension Builder
Comprehensive guide for creating VS Code extensions from scratch:
- Project scaffolding and initialization
- Extension types (commands, language support, webviews)
- VS Code API usage and patterns
- Activation events configuration
- Packaging and publishing
- Best practices and UX guidelines

**When Invoked:**
- When user wants to create/build a VS Code extension
- When discussing VS Code extension development
- When asking about VS Code Extension API
- When mentioning plugin/extension architecture

### ⚡ Event Hooks

The plugin includes intelligent hooks that enhance your workflow:

#### On File Save
- Silent notification for code quality checks on source files
- Excludes test files and build artifacts

#### On File Open
- Prompts security review for authentication-related files
- Offers targeted assistance based on file type

#### On Git Commit
- Optional code review before committing
- Helps maintain code quality standards

#### On Error Detection
- Suggests performance optimization when performance issues detected
- Provides context-appropriate assistance

#### On Chat Messages
- Suggests `/system-design` when architecture questions are asked
- Suggests `/refactor-strategy` when refactoring is discussed
- Intelligent command recommendations based on context

#### On Project Open
- Welcome message with available commands
- Shows once per project for non-intrusive onboarding

## Installation

### From Marketplace (Recommended)
```
/plugin add senior-software-developer
```

### From Local Directory
```
/plugin add ./plugins/senior-software-developer
```

### From GitHub
```
/plugin add https://github.com/your-username/senior-software-developer
```

## Usage Examples

### Example 1: Get Architecture Feedback
```
User: We're building a new feature that needs to handle 10k requests/second. 
      Should we add it to our monolith or create a separate service?

Senior Developer Agent: Let me help you think through this decision...

[Provides detailed analysis of tradeoffs, considers current architecture,
team size, complexity, and gives specific recommendation with rationale]
```

### Example 2: Code Review with Security Focus
```
/code-review src/api/auth.js --focus=security

[Analyzes authentication code, identifies security vulnerabilities like
SQL injection, hardcoded secrets, missing rate limiting, and provides
specific secure code examples]
```

### Example 3: Design a New System
```
/system-design

Design a video streaming platform:
- 10M daily active users
- Upload and stream videos
- Multiple quality options (480p to 4K)
- Recommendations engine
- Social features

[Provides complete system design including architecture diagrams,
API design, data modeling, scalability strategy, cost estimates]
```

### Example 4: Autonomous Security Check
```
[User opens payment-processor.js file]

🚨 Security Pattern Check (Autonomous):
Critical vulnerability detected: SQL Injection on line 45

[Provides detailed explanation of vulnerability, attack scenario,
and secure code example with parameterized queries]
```

### Example 5: Build a VS Code Extension
```
User: I want to create a VS Code extension that formats JSON files.

VS Code Extension Builder (Autonomous):
I'll help you build a VS Code extension for JSON formatting.

[Provides complete workflow:]
1. Project setup with Yeoman generator
2. Command registration in package.json
3. Implementation with proper error handling
4. Activation events configuration
5. Testing in Extension Development Host
6. Packaging and publishing guidance

[Delivers working extension code with best practices]
```

## Configuration

### Adjusting Hook Sensitivity

Edit `hooks/hooks.json` to customize when hooks trigger:

```json
{
  "event": "on_file_save",
  "conditions": {
    "filePattern": "*.{js,ts}",  // Adjust file types
    "excludePattern": "*.test.*"  // Adjust exclusions
  }
}
```

### Disabling Specific Hooks

Comment out or remove hooks you don't want:
```json
{
  "hooks": [
    // { "event": "on_file_save", ... },  // Disabled
    { "event": "on_git_commit", ... }     // Active
  ]
}
```

### Skill Invocation Tuning

Skills are invoked based on context. To adjust sensitivity, modify skill parameters in your chat:
```
/code-review --severity=critical  // Only critical issues
/code-review --severity=info      // All issues including minor ones
```

## Requirements

- Claude Code v1.0+
- No external dependencies
- Works with all programming languages (language-specific analysis for supported languages)

## Supported Languages

### Full Support (with language-specific analysis)
- JavaScript/TypeScript
- Python
- Java
- Go
- Ruby
- PHP
- C#
- Rust

### General Support (pattern-based analysis)
- All other languages

## Permissions

This plugin requires:
- **File Read**: To analyze code files
- **No External Network**: All analysis is local
- **No Data Collection**: Your code never leaves your machine

## Best Practices

### When to Use Each Command

- **`/architecture-review`**: Periodic health checks, before major changes, onboarding reviews
- **`/code-review`**: Pull requests, before committing, learning sessions
- **`/system-design`**: New projects, major features, architectural decisions
- **`/refactor-strategy`**: Legacy code modernization, major refactoring, reducing tech debt
- **`/technical-debt-audit`**: Quarterly reviews, project health checks, planning sprints

### Getting the Most from the Agent

1. **Provide Context**: Share team size, scale, constraints
2. **Ask Why**: Request explanations for recommendations
3. **Discuss Tradeoffs**: Explore alternatives and pros/cons
4. **Be Specific**: Detailed questions get detailed answers
5. **Iterate**: Follow up questions to dive deeper

### Working with Autonomous Skills

- Skills provide immediate feedback but don't block your work
- Review suggestions when convenient
- Skills learn from context and improve recommendations
- Dismiss notifications that aren't relevant to your current task

## Troubleshooting

### Hooks Not Triggering
- Check `hooks/hooks.json` syntax is valid JSON
- Verify file patterns match your files
- Check that hooks aren't excluded by `excludePattern`

### Skills Not Activating
- Ensure context is clear (mention security, performance, etc.)
- Skills activate based on invocation criteria in SKILL.md files
- Try being more explicit: "check for security issues"

### Commands Not Found
- Verify plugin is installed: `/plugin list`
- Reinstall if needed: `/plugin remove senior-software-developer` then `/plugin add ...`

## Contributing

### Adding New Commands
1. Create new `.md` file in `commands/`
2. Follow the command template structure
3. Update `plugin.json` if needed (usually auto-detected)

### Adding New Skills
1. Create directory in `skills/skill-name/`
2. Add `SKILL.md` with skill definition
3. Optionally add supporting scripts
4. Update `plugin.json` to include skill path

### Improving Existing Content
1. Fork the repository
2. Make your improvements
3. Test locally with `/plugin add ./path/to/plugin`
4. Submit pull request

## Roadmap

- [ ] Add more language-specific analysis patterns
- [ ] Integration with popular linters and security scanners
- [ ] Performance profiling integration
- [ ] Architectural decision record (ADR) generation
- [ ] Team collaboration features
- [ ] Custom rule definitions
- [ ] Integration with issue trackers

## FAQ

**Q: Will this slow down my development?**
A: No. Skills and hooks are non-blocking and provide opt-in assistance. You control when to engage with suggestions.

**Q: Does this replace human code review?**
A: No. It augments human review by catching common issues, allowing human reviewers to focus on higher-level concerns.

**Q: Is my code sent anywhere?**
A: No. All analysis happens locally. Your code never leaves your machine.

**Q: Can I customize the advice for my team's standards?**
A: Yes. You can fork the plugin and customize command files, skill criteria, and hooks to match your team's practices.

**Q: What's the difference between the agent and skills?**
A: The agent responds to your questions conversationally. Skills autonomously detect issues based on context without being asked.

**Q: How do I disable autonomous features?**
A: Remove or comment out hooks in `hooks/hooks.json` and skills from `plugin.json`.

## Support

- Issues: [GitHub Issues](https://github.com/claude-code/senior-software-developer/issues)
- Discussions: [GitHub Discussions](https://github.com/claude-code/senior-software-developer/discussions)
- Documentation: [Wiki](https://github.com/claude-code/senior-software-developer/wiki)

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Acknowledgments

Built with inspiration from senior developers across the industry who mentor, review code, and share knowledge generously. This plugin aims to democratize access to senior-level guidance.

---

**Made with ❤️ by the Claude Code community**

*Version 1.0.0*

