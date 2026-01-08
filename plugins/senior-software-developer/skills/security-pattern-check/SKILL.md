---
name: security-pattern-check
description: Identify security vulnerabilities and anti-patterns providing feedback on security issues a senior developer would catch. Use when user mentions security/vulnerability/safety concerns, code involves user input/authentication/data access, working with sensitive data (passwords/PII/financial), code includes SQL queries/file operations/external API calls, user asks about security best practices, or security-sensitive files are being modified (auth, payment, data access).
---

# Security Pattern Check

Identify security vulnerabilities and anti-patterns in code, providing immediate feedback on security issues.

## Security Issue Categories

### 1. Injection Vulnerabilities
- **SQL Injection**: Unparameterized queries with user input
- **NoSQL Injection**: Unsanitized MongoDB queries
- **Command Injection**: Shell commands with user input
- **LDAP Injection**: Unescaped LDAP queries
- **XPath Injection**: Dynamic XPath expressions

### 2. Authentication & Authorization
- **Missing Authentication**: Unprotected endpoints
- **Weak Passwords**: No password strength requirements
- **Hardcoded Credentials**: Passwords/keys in code
- **Insecure Password Storage**: Plaintext or weak hashing (MD5, SHA1)
- **Missing Authorization**: No permission checks
- **Broken Access Control**: Users accessing resources they shouldn't

### 3. Sensitive Data Exposure
- **Logging Sensitive Data**: Passwords, tokens in logs
- **Insecure Storage**: Unencrypted sensitive data
- **Missing Encryption**: No TLS/SSL
- **Weak Encryption**: DES, RC4, custom crypto
- **Exposed Secrets**: API keys, tokens in code/config
- **Information Disclosure**: Stack traces, verbose errors to users

### 4. Cross-Site Scripting (XSS)
- **Reflected XSS**: Echoing user input in HTML
- **Stored XSS**: Saving unsanitized input to database
- **DOM XSS**: Client-side script injection
- **Missing Output Encoding**: Not escaping HTML/JavaScript

### 5. Cross-Site Request Forgery (CSRF)
- **Missing CSRF Tokens**: State-changing requests without tokens
- **Incorrect Token Validation**: Weak or missing validation
- **GET for State Changes**: Using GET for mutations

### 6. Security Misconfiguration
- **Debug Mode in Production**: Verbose error messages
- **Default Credentials**: Using default admin/admin
- **Unnecessary Services**: Unused endpoints or features enabled
- **Missing Security Headers**: No CSP, X-Frame-Options, etc.
- **Directory Listing**: Exposing file structure
- **Improper Error Handling**: Revealing system details

### 7. Cryptographic Issues
- **Weak Random Number Generation**: Math.random() for security
- **Insufficient Key Length**: Short encryption keys
- **Weak Hash Functions**: MD5, SHA1 for security purposes
- **ECB Mode**: Using ECB instead of CBC/GCM
- **No Salt**: Password hashing without salt
- **Predictable Tokens**: Sequential or guessable tokens

### 8. API Security
- **Missing Rate Limiting**: No protection against abuse
- **Excessive Data Exposure**: Returning more data than needed
- **Missing Input Validation**: Not validating request parameters
- **Improper Assets Management**: Exposing old/unused endpoints
- **Security Misconfiguration**: CORS allowing any origin

### 9. Component Vulnerabilities
- **Known Vulnerable Dependencies**: Using libraries with CVEs
- **Outdated Packages**: Using old versions with known issues
- **Unverified Dependencies**: Not checking package integrity

### 10. File & Resource Issues
- **Path Traversal**: User-controlled file paths
- **Unrestricted File Upload**: No validation on uploads
- **XML External Entity (XXE)**: Parsing untrusted XML
- **Insecure Deserialization**: Deserializing untrusted data
- **Resource Exhaustion**: No limits on resource usage

## Analysis Process

1. Identify input points - Find user input, external data
2. Trace data flow - Follow data through application
3. Check validation - Verify input sanitization
4. Review auth/authz - Check access controls
5. Examine crypto - Review encryption usage
6. Scan dependencies - Check for known CVEs
7. Assess configuration - Review security settings
8. Generate report - Prioritize by risk

## Return Value

Return object:
```json
{
  "file": "api/auth.js",
  "securityScore": 6.5,
  "riskLevel": "high",
  "vulnerabilities": [
    {
      "type": "SQL Injection",
      "severity": "critical",
      "cwe": "CWE-89",
      "owasp": "A03:2021 – Injection",
      "location": {
        "line": 34,
        "function": "loginUser"
      },
      "description": "User input directly interpolated into SQL query",
      "risk": {
        "confidentiality": "high",
        "integrity": "high",
        "availability": "medium",
        "exploitability": "easy"
      },
      "exploitScenario": "Attacker can bypass authentication or extract database contents",
      "codeExample": "// Current vulnerable code...",
      "fix": {
        "approach": "Use parameterized queries",
        "codeExample": "// Secure version...",
        "effort": "small"
      },
      "references": [
        "https://owasp.org/www-community/attacks/SQL_Injection",
        "https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html"
      ]
    }
  ],
  "recommendations": [
    "Implement parameterized queries for all database access",
    "Add input validation middleware",
    "Enable security headers (CSP, X-Frame-Options)",
    "Rotate and secure API keys using environment variables"
  ],
  "compliance": {
    "owasp": ["A03:2021", "A07:2021"],
    "pciDss": ["6.5.1"],
    "cwe": ["CWE-89", "CWE-798"]
  }
}
```

## Examples

### Example 1: SQL Injection Detection
**Context**: User has login function with string concatenation

**Autonomous Invocation**: Skill detects vulnerability:
```
🚨 CRITICAL SECURITY VULNERABILITY DETECTED: SQL Injection

Location: api/auth.js, line 34

Vulnerable Code:
async function loginUser(username, password) {
  const query = `SELECT * FROM users WHERE username = '${username}' AND password = '${password}'`;
  const user = await db.query(query);
  return user;
}

Vulnerability: SQL Injection (CWE-89, OWASP A03:2021)

Risk Assessment:
- Severity: CRITICAL
- Exploitability: Easy (no special tools needed)
- Impact: Complete database compromise

Attack Scenario:
An attacker could input:
  username: admin' --
  password: anything

Resulting query:
  SELECT * FROM users WHERE username = 'admin' --' AND password = 'anything'

The '--' comments out the rest, bypassing password check!

Worse attack:
  username: admin'; DROP TABLE users; --
  password: anything

This could DELETE YOUR ENTIRE USERS TABLE!

Secure Fix (Parameterized Query):
async function loginUser(username, password) {
  // Use parameterized query (prevents injection)
  const query = 'SELECT * FROM users WHERE username = ? AND password = ?';
  const user = await db.query(query, [username, password]);
  return user;
}

Additional Security Measures:
1. Hash passwords (never store plaintext)
   - Use bcrypt, scrypt, or Argon2
   - Example: const hashedPassword = await bcrypt.hash(password, 10);

2. Add rate limiting to prevent brute force
   - Limit login attempts per IP
   - Add exponential backoff after failures

3. Use prepared statements consistently across all queries

4. Implement logging for failed login attempts

5. Consider multi-factor authentication

References:
- OWASP SQL Injection: https://owasp.org/www-community/attacks/SQL_Injection
- SQL Injection Prevention: https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html

Estimated effort to fix: 30 minutes
Priority: FIX IMMEDIATELY (before deploying to production)
```

### Example 2: Hardcoded Secrets
**Context**: User has API key directly in code

**Autonomous Invocation**: Skill identifies exposure:
```
🚨 SECURITY ISSUE DETECTED: Hardcoded Secrets

Location: services/payment.js, line 12

Vulnerable Code:
const STRIPE_API_KEY = 'sk_live_51HqK2bL4z8pQxYz...';

const stripe = require('stripe')(STRIPE_API_KEY);

Problem: Exposed Credentials (CWE-798)

Risks:
1. API key visible in version control history (git)
2. Exposed to anyone with code access
3. Cannot rotate key without code change
4. May be accidentally shared (screenshots, pairing, etc.)
5. If key is compromised, attacker can make payments with your account

This is a LIVE API key - production payments are at risk!

Secure Fix:
1. Remove key from code immediately:
   git rm --cached services/payment.js
   git commit -m "Remove hardcoded API key"

2. Rotate the compromised key in Stripe dashboard
   - Generate new key
   - Revoke old key

3. Use environment variables:
   // .env file (add to .gitignore!)
   STRIPE_API_KEY=sk_live_51HqK2bL4z8pQxYz...

   // services/payment.js
   const stripe = require('stripe')(process.env.STRIPE_API_KEY);

4. For production, use secret management:
   - AWS Secrets Manager
   - Azure Key Vault
   - HashiCorp Vault
   - Kubernetes Secrets

5. Add to .gitignore:
   .env
   .env.local
   .env.*.local

6. Create .env.example (without real values):
   STRIPE_API_KEY=your_stripe_key_here

Best Practices:
- Never commit secrets to git
- Use different keys for dev/staging/prod
- Rotate keys regularly
- Monitor key usage for anomalies
- Use secret scanning tools (git-secrets, truffleHog)

Immediate Actions:
1. ❗ Rotate Stripe API key NOW
2. ❗ Move to environment variables
3. ❗ Check git history for other exposed secrets
4. ❗ Review access logs for suspicious activity

Estimated effort: 15 minutes
Priority: CRITICAL - Fix immediately
```

### Example 3: Missing Input Validation
**Context**: User has API endpoint accepting user input

**Autonomous Invocation**: Skill identifies missing validation:
```
⚠️  SECURITY ISSUE DETECTED: Missing Input Validation

Location: api/users.js, line 45

Vulnerable Code:
app.post('/api/users', async (req, res) => {
  const { username, email, age } = req.body;
  
  const user = await db.createUser({ username, email, age });
  res.json(user);
});

Problems:
1. No validation on input types
2. No length limits
3. No format validation (email)
4. No sanitization (XSS risk)

Risk: Moderate to High
- Data integrity issues
- Potential for XSS
- Database errors from unexpected input
- Business logic bypass

Attack Scenarios:

1. Type Confusion:
   POST { "age": "definitely not a number" }
   Could cause database errors or logic bugs

2. Extremely Long Input:
   POST { "username": "A".repeat(1000000) }
   Could cause memory issues or DoS

3. XSS Injection:
   POST { "username": "<script>alert('xss')</script>" }
   If username is displayed in HTML, executes JavaScript

4. Email Format:
   POST { "email": "not-an-email" }
   Breaks email functionality

Secure Fix:
// Option 1: Manual validation
app.post('/api/users', async (req, res) => {
  const { username, email, age } = req.body;
  
  // Validate types
  if (typeof username !== 'string' || typeof email !== 'string') {
    return res.status(400).json({ error: 'Invalid input types' });
  }
  
  // Validate lengths
  if (username.length < 3 || username.length > 50) {
    return res.status(400).json({ error: 'Username must be 3-50 characters' });
  }
  
  // Validate format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Invalid email format' });
  }
  
  // Validate ranges
  const ageNum = parseInt(age);
  if (isNaN(ageNum) || ageNum < 13 || ageNum > 120) {
    return res.status(400).json({ error: 'Age must be between 13 and 120' });
  }
  
  // Sanitize for XSS (if needed for display)
  const sanitizedUsername = escapeHtml(username);
  
  const user = await db.createUser({
    username: sanitizedUsername,
    email,
    age: ageNum
  });
  
  res.json(user);
});

// Option 2: Use validation library (Recommended)
const { body, validationResult } = require('express-validator');

app.post('/api/users',
  // Validation middleware
  body('username')
    .isString()
    .trim()
    .isLength({ min: 3, max: 50 })
    .escape(), // Prevents XSS
  body('email')
    .isEmail()
    .normalizeEmail(),
  body('age')
    .isInt({ min: 13, max: 120 }),
  
  async (req, res) => {
    // Check validation results
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { username, email, age } = req.body;
    const user = await db.createUser({ username, email, age });
    res.json(user);
  }
);

Additional Security Measures:
1. Rate limiting (prevent abuse)
   app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));

2. Schema validation (Joi, Yup, Zod)
   const schema = Joi.object({
     username: Joi.string().min(3).max(50).required(),
     email: Joi.string().email().required(),
     age: Joi.number().integer().min(13).max(120).required()
   });

3. Content-Type validation
   Only accept application/json, reject others

4. Size limits
   app.use(express.json({ limit: '10kb' }));

Best Practices:
- Whitelist valid input, don't blacklist bad input
- Validate on server side (client validation is not secure)
- Fail securely (reject invalid input)
- Provide clear error messages (but don't reveal system details)
- Log suspicious validation failures

Estimated effort: 1 hour
Priority: HIGH - Add before next deployment
```

## Error Handling

- If language not supported: Provide generic security guidance
- If context insufficient: Ask for framework/usage details
- If no issues found: Confirm and suggest security best practices
- If false positive suspected: Provide rationale and allow override

## Risk Scoring

Issues scored by CVSS-like criteria:
- **Critical (9.0-10.0)**: SQL injection, RCE, auth bypass
- **High (7.0-8.9)**: XSS, CSRF, sensitive data exposure
- **Medium (4.0-6.9)**: Missing security headers, weak crypto
- **Low (0.1-3.9)**: Information disclosure, minor config issues

## Integration with Workflow

- **Proactive**: Catches vulnerabilities during development
- **Educational**: Explains attack scenarios and impact
- **Standards-Based**: References OWASP, CWE, compliance requirements
- **Actionable**: Provides specific secure code examples
- **Prioritized**: Critical issues highlighted first

## Compliance Mapping

Maps findings to:
- OWASP Top 10 (2021)
- CWE (Common Weakness Enumeration)
- PCI-DSS requirements
- HIPAA security rules
- GDPR data protection requirements

## Related Skills
- `detect-code-smells`: General code quality
- `suggest-performance-fix`: Performance optimization

## Notes

This skill embodies the senior developer mindset: "Security is not an afterthought." It catches common vulnerabilities early when they're cheap to fix, rather than in production where they're expensive disasters.

Security principles:
1. Defense in depth (multiple layers)
2. Least privilege (minimal permissions)
3. Fail securely (deny by default)
4. Don't trust user input (validate everything)
5. Keep it simple (complex systems are insecure)

