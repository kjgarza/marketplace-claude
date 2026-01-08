---
name: suggest-performance-fix
description: Identify performance issues and bottlenecks suggesting optimizations a senior developer would recommend. Use when user mentions performance/optimization/speed issues, asks "why is this slow?" or similar questions, code contains obvious performance anti-patterns (N+1 queries, unnecessary loops, etc.), user works on performance-critical code paths, performance profiling shows bottlenecks, or large data processing or database operations detected.
---

# Suggest Performance Fix

Identify performance issues and bottlenecks in code, suggesting specific optimizations.

## Performance Issue Categories

### 1. Algorithmic Complexity
- **Nested Loops**: O(n²) or worse time complexity
- **Inefficient Search**: Linear search when hash lookup possible
- **Redundant Calculations**: Computing same value multiple times
- **Inefficient Sorting**: Using bubble sort instead of quicksort/mergesort
- **String Concatenation**: Building strings in loops

### 2. Database Performance
- **N+1 Query Problem**: Loading related data in a loop
- **Missing Indexes**: Queries on unindexed columns
- **SELECT ***: Fetching unnecessary columns
- **No Query Pagination**: Loading all records at once
- **Missing Connection Pooling**: Creating new connection per query
- **Lack of Prepared Statements**: Re-parsing queries

### 3. Memory Issues
- **Memory Leaks**: Objects not released/garbage collected
- **Excessive Allocations**: Creating unnecessary objects
- **Large In-Memory Data**: Loading entire datasets into RAM
- **Caching Issues**: Not caching expensive operations
- **Deep Cloning**: Expensive deep copies when shallow would work

### 4. I/O Performance
- **Synchronous I/O**: Blocking operations in async context
- **No Batching**: Multiple small I/O operations instead of batch
- **Missing Compression**: Large payloads without compression
- **No Streaming**: Loading entire files into memory
- **Excessive File I/O**: Reading/writing files repeatedly

### 5. Frontend/API Performance
- **No Lazy Loading**: Loading all data upfront
- **Missing CDN**: Serving static assets from origin
- **Large Bundle Size**: Shipping unnecessary code
- **Render Blocking**: Blocking page render with scripts
- **Missing Caching Headers**: Not utilizing browser cache
- **Excessive API Calls**: Multiple calls when one would suffice

### 6. Concurrency Issues
- **Missing Parallelization**: Sequential when parallel possible
- **Race Conditions**: Unprotected shared state
- **Lock Contention**: Too much synchronization
- **Thread Pool Exhaustion**: Not limiting concurrent operations

## Analysis Process

1. Identify hotspots - Find expensive operations
2. Measure complexity - Calculate time/space complexity
3. Check patterns - Match against known anti-patterns
4. Estimate impact - Predict performance gain from fix
5. Prioritize - Focus on high-impact optimizations
6. Generate fix - Suggest specific code improvements

## Performance Analysis Techniques
- Complexity analysis (Big O notation)
- Pattern matching for known anti-patterns
- Static analysis of queries and loops
- Resource usage estimation
- Comparison with best practices

## Return Value

Return object:
```json
{
  "file": "api/users.js",
  "issues": [
    {
      "type": "N+1 Query",
      "severity": "critical",
      "location": {
        "line": 45,
        "function": "getUsersWithPosts"
      },
      "description": "Loading posts for each user in a loop (N+1 query pattern)",
      "currentPerformance": {
        "timeComplexity": "O(n)",
        "queriesExecuted": "1 + n",
        "estimatedLatency": "50ms + (n × 20ms)"
      },
      "optimizedPerformance": {
        "timeComplexity": "O(1)",
        "queriesExecuted": "2",
        "estimatedLatency": "70ms (constant)"
      },
      "impact": "high",
      "effort": "small",
      "suggestedFix": {
        "approach": "Use JOIN or eager loading",
        "codeExample": "// Before...\n// After...",
        "estimatedSpeedup": "10-100x faster depending on n"
      }
    }
  ],
  "recommendations": [
    {
      "priority": 1,
      "title": "Fix N+1 query in getUsersWithPosts",
      "impact": "80% reduction in API response time",
      "effort": "30 minutes"
    }
  ]
}
```

## Examples

### Example 1: N+1 Query Detection
**Context**: User has API endpoint that loads users and their posts

**Autonomous Invocation**: Skill detects the pattern and reports:
```
Performance Issue Detected: N+1 Query Problem

Location: api/users.js, line 45

Current Code:
async function getUsersWithPosts() {
  const users = await db.query('SELECT * FROM users');
  
  for (const user of users) {
    user.posts = await db.query('SELECT * FROM posts WHERE user_id = ?', [user.id]);
  }
  
  return users;
}

Problem:
- Executes 1 query to get users
- Then executes n additional queries (one per user) to get posts
- With 100 users, this is 101 database queries!

Performance Impact:
- Current: ~50ms + (100 × 20ms) = 2,050ms (2 seconds!)
- Each additional user adds 20ms

Optimized Solution:
async function getUsersWithPosts() {
  const users = await db.query('SELECT * FROM users');
  const userIds = users.map(u => u.id);
  
  // Single query to get all posts
  const posts = await db.query(
    'SELECT * FROM posts WHERE user_id IN (?)',
    [userIds]
  );
  
  // Group posts by user_id in application code
  const postsByUser = posts.reduce((acc, post) => {
    if (!acc[post.user_id]) acc[post.user_id] = [];
    acc[post.user_id].push(post);
    return acc;
  }, {});
  
  users.forEach(user => {
    user.posts = postsByUser[user.id] || [];
  });
  
  return users;
}

Alternative (SQL JOIN):
const results = await db.query(`
  SELECT 
    u.*,
    p.id as post_id,
    p.title as post_title,
    p.content as post_content
  FROM users u
  LEFT JOIN posts p ON p.user_id = u.id
`);

// Then reshape results in application code

Performance Improvement:
- Optimized: ~70ms (constant, regardless of user count)
- 30x faster with 100 users
- 100x faster with 1000 users

Estimated effort: 30 minutes
Impact: Critical for scalability
```

### Example 2: Inefficient Algorithm
**Context**: User has sorting implementation in code

**Autonomous Invocation**: Skill identifies algorithmic issue:
```
Performance Issue Detected: Inefficient Algorithm

Location: utils/sort.js, line 23

Current Code:
function sortUsers(users) {
  // Bubble sort implementation
  for (let i = 0; i < users.length; i++) {
    for (let j = 0; j < users.length - 1; j++) {
      if (users[j].name > users[j + 1].name) {
        [users[j], users[j + 1]] = [users[j + 1], users[j]];
      }
    }
  }
  return users;
}

Problem:
- Time Complexity: O(n²) - quadratic growth
- With 1,000 users: ~1,000,000 comparisons
- With 10,000 users: ~100,000,000 comparisons

Performance Impact:
- 100 users: ~5ms
- 1,000 users: ~450ms
- 10,000 users: ~45 seconds (!!!)

Optimized Solution:
function sortUsers(users) {
  return users.sort((a, b) => a.name.localeCompare(b.name));
}

Built-in Array.sort() uses optimized algorithm (typically Timsort):
- Time Complexity: O(n log n)
- With 10,000 users: ~130,000 comparisons (vs 100M)

Performance Improvement:
- 100 users: 5ms → <1ms
- 1,000 users: 450ms → 3ms (150x faster)
- 10,000 users: 45s → 40ms (1,125x faster!)

Additional Optimization (for very large datasets):
// If sorting is a frequent operation, consider:
1. Maintain sorted order during insertion
2. Use indexed database column and sort in DB
3. Cache sorted results

Estimated effort: 5 minutes
Impact: Critical at scale
```

### Example 3: Missing Database Index
**Context**: User reports slow query performance

**Autonomous Invocation**: Skill analyzes query:
```
Performance Issue Detected: Missing Database Index

Location: repositories/user-repo.js, line 67

Current Code:
async function findUsersByStatus(status) {
  return await db.query(
    'SELECT * FROM users WHERE status = ?',
    [status]
  );
}

Problem:
- Query filters on 'status' column
- No index on 'status' column
- Database must scan entire table (table scan)

Performance Impact (with 100,000 users):
- Current: ~500ms (full table scan)
- After index: ~5ms (index lookup)
- 100x improvement!

Query Execution Plan (Current):
- Type: ALL (full table scan)
- Rows examined: 100,000
- Rows returned: ~5,000

Recommended Fix:
1. Add database index:
   CREATE INDEX idx_users_status ON users(status);

2. Verify index is being used:
   EXPLAIN SELECT * FROM users WHERE status = 'active';

Query Execution Plan (After Index):
- Type: ref (index lookup)
- Rows examined: ~5,000 (only matching rows)
- Rows returned: ~5,000

Additional Considerations:
- Index adds ~5MB storage (minimal cost)
- Slightly slower writes (updates must update index)
- Worth it for read-heavy columns

If multiple filters are common:
   CREATE INDEX idx_users_status_created 
   ON users(status, created_at);

This supports queries like:
   WHERE status = 'active' AND created_at > '2024-01-01'

Estimated effort: 5 minutes
Impact: Critical for query performance
```

## Error Handling

- If file type not recognized: Skip analysis or use generic patterns
- If measurements missing: Provide theoretical analysis only
- If context insufficient: Ask for more information about use case
- If no issues found: Provide confirmation that code looks performant

## Priority Matrix

Issues are prioritized by:
- **Critical**: 10x+ improvement possible, high traffic code path
- **High**: 5-10x improvement, medium traffic
- **Medium**: 2-5x improvement or low traffic
- **Low**: < 2x improvement, optimization edge cases

## Integration with Workflow

- **Proactive**: Catches issues before they reach production
- **Educational**: Explains complexity and tradeoffs
- **Measurable**: Provides concrete performance estimates
- **Actionable**: Specific code examples for fixes
- **Prioritized**: Focuses on high-impact optimizations

## Related Skills
- `detect-code-smells`: General code quality issues
- `security-pattern-check`: Security-focused analysis

## Notes

Following the senior developer principle: "Premature optimization is the root of all evil, but that doesn't mean ignore obvious issues." This skill focuses on clear performance anti-patterns, not micro-optimizations.

Performance optimization should be:
1. Measured (know the current performance)
2. Targeted (fix the actual bottleneck)
3. Verified (confirm the improvement)
4. Balanced (against code complexity)

