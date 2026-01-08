# System Design

## Overview
Design a robust, scalable system from scratch or plan major architectural changes. This command guides you through senior-level system design considerations including requirements, architecture, scalability, reliability, and tradeoffs.

## Steps

### 1. Gather Requirements

#### Functional Requirements
- What features does the system need?
- What are the core use cases?
- What operations will users perform?
- What data needs to be stored and retrieved?
- What are the inputs and outputs?

#### Non-Functional Requirements
- **Scale**: How many users? Requests per second? Data volume?
- **Performance**: Latency requirements? Throughput targets?
- **Availability**: Uptime requirements (99.9%, 99.99%, etc.)?
- **Consistency**: Strong consistency or eventual consistency?
- **Durability**: Data loss tolerance?
- **Security**: Authentication, authorization, encryption needs?
- **Compliance**: GDPR, HIPAA, SOC2, etc.?

#### Constraints
- Budget limitations
- Timeline constraints
- Team expertise
- Technology restrictions
- Regulatory requirements

### 2. Capacity Estimation

Calculate:
- **Traffic Estimates**: QPS (queries per second), peak vs. average
- **Storage Estimates**: Data size per record × number of records × growth rate
- **Bandwidth Estimates**: Request size × QPS
- **Memory Estimates**: Cache size, in-memory data structures
- **Compute Requirements**: CPU/RAM per instance × number of instances

### 3. Define APIs

Design clean, RESTful APIs:
- **Endpoints**: What operations are exposed?
- **Request/Response**: What data is sent and received?
- **Authentication**: How are requests authenticated?
- **Rate Limiting**: What are the limits?
- **Versioning**: How will APIs evolve?
- **Error Handling**: What error codes and messages?

Example:
```
POST /api/v1/users
GET /api/v1/users/{id}
PUT /api/v1/users/{id}
DELETE /api/v1/users/{id}
GET /api/v1/users?page=1&limit=20
```

### 4. Data Model Design

#### Database Selection
- **Relational (SQL)**: PostgreSQL, MySQL
  - Use for: Structured data, ACID transactions, complex queries
- **NoSQL Document**: MongoDB, Couchbase
  - Use for: Flexible schema, hierarchical data
- **NoSQL Key-Value**: Redis, DynamoDB
  - Use for: Simple lookups, caching, sessions
- **NoSQL Wide-Column**: Cassandra, HBase
  - Use for: High write throughput, time-series data
- **Graph**: Neo4j, Amazon Neptune
  - Use for: Relationship-heavy data (social graphs, recommendations)

#### Schema Design
- Define entities and relationships
- Identify primary keys and foreign keys
- Plan for indexes
- Consider partitioning/sharding strategy
- Design for query patterns

### 5. High-Level Architecture

#### Architecture Patterns
- **Monolithic**: Single deployable unit
  - Pros: Simple, easy to develop/deploy initially
  - Cons: Hard to scale, couples everything together
- **Microservices**: Independent services
  - Pros: Scalable, independent deployment, technology diversity
  - Cons: Complex, distributed system challenges
- **Serverless**: Event-driven functions
  - Pros: Auto-scaling, pay-per-use, no server management
  - Cons: Cold starts, vendor lock-in, complex debugging
- **Event-Driven**: Async message passing
  - Pros: Decoupled, resilient, scalable
  - Cons: Complexity, eventual consistency

#### Core Components
- **Load Balancer**: Distribute traffic (nginx, HAProxy, ALB)
- **API Gateway**: Single entry point, rate limiting, auth
- **Application Servers**: Business logic
- **Cache Layer**: Redis, Memcached
- **Message Queue**: RabbitMQ, Kafka, SQS
- **Database**: Primary and replica(s)
- **Object Storage**: S3, GCS for files/media
- **CDN**: CloudFront, Cloudflare for static assets
- **Search**: Elasticsearch, Algolia
- **Monitoring**: Prometheus, Grafana, DataDog

### 6. Detailed Component Design

For each major component:
- **Responsibility**: What does it do?
- **APIs**: How do other components interact with it?
- **Data**: What data does it store/process?
- **Scale**: How does it scale?
- **Failure Modes**: What happens when it fails?

### 7. Scalability Strategy

#### Horizontal Scaling
- Stateless services (can add more instances)
- Load balancing across instances
- Database sharding
- Read replicas for databases

#### Vertical Scaling
- Increase CPU/RAM of instances
- More limited than horizontal scaling

#### Caching Strategy
- **Cache Aside**: App reads from cache, falls back to DB
- **Write-Through**: Writes go to cache and DB simultaneously
- **Write-Behind**: Writes go to cache, async to DB
- What to cache: Hot data, expensive queries
- Cache invalidation: TTL, event-based

#### Database Scaling
- **Replication**: Master-slave for read scaling
- **Sharding**: Partition data across databases
- **Denormalization**: Trade storage for read performance
- **CQRS**: Separate read and write models

### 8. Reliability & Resilience

#### Availability
- **Redundancy**: No single point of failure
- **Replication**: Multiple copies of data
- **Health Checks**: Detect and remove unhealthy instances
- **Auto-scaling**: Handle traffic spikes

#### Failure Handling
- **Retry Logic**: Exponential backoff for transient failures
- **Circuit Breaker**: Stop calling failing services
- **Fallback**: Degrade gracefully
- **Timeouts**: Don't wait forever
- **Idempotency**: Safe to retry operations

#### Disaster Recovery
- **Backups**: Regular automated backups
- **Multi-region**: Deploy across regions
- **RPO/RTO**: Recovery Point/Time Objectives
- **Runbooks**: Incident response procedures

### 9. Security Design

- **Authentication**: OAuth 2.0, JWT, SSO
- **Authorization**: RBAC, ABAC, policies
- **Encryption**: TLS in transit, encryption at rest
- **Secrets Management**: Vault, AWS Secrets Manager
- **Network Security**: VPC, security groups, WAF
- **Rate Limiting**: Prevent abuse
- **Audit Logging**: Track security events
- **Penetration Testing**: Regular security assessments

### 10. Monitoring & Observability

- **Metrics**: Response times, error rates, throughput
- **Logging**: Centralized logging (ELK, Splunk)
- **Tracing**: Distributed tracing (Jaeger, Zipkin)
- **Alerting**: PagerDuty, OpsGenie
- **Dashboards**: Real-time system health visibility
- **SLOs/SLIs**: Define and track service levels

### 11. Tradeoffs & Alternatives

For each major decision, document:
- Why this approach?
- What alternatives were considered?
- What are the tradeoffs?
- What could change this decision?

Example: "Chose MongoDB over PostgreSQL because..."

### 12. Create Design Artifacts

Generate:
- **Architecture Diagram**: High-level component view
- **Sequence Diagrams**: Key user flows
- **Data Flow Diagram**: How data moves through system
- **Deployment Diagram**: Infrastructure layout
- **API Specification**: OpenAPI/Swagger docs

## Checklist

- [ ] Functional requirements defined
- [ ] Non-functional requirements specified
- [ ] Capacity estimates calculated
- [ ] APIs designed
- [ ] Data model created
- [ ] Architecture pattern selected
- [ ] Core components identified
- [ ] Scalability strategy defined
- [ ] Reliability measures planned
- [ ] Security designed
- [ ] Monitoring strategy defined
- [ ] Tradeoffs documented
- [ ] Design artifacts created

## Examples

### Example 1: Design a URL Shortener
```
/system-design

Design a URL shortening service like bit.ly:
- 100M URLs shortened per day
- Read-heavy (100:1 read-to-write ratio)
- Low latency (<100ms)
- High availability (99.99%)
- Custom short URLs supported
```

### Example 2: Design a Chat System
```
/system-design

Design a real-time chat application:
- Support 1M concurrent users
- 1-on-1 and group chats
- Message history
- Read receipts
- File sharing
- End-to-end encryption
```

### Example 3: Design a Video Streaming Platform
```
/system-design

Design a video streaming service:
- 10M daily active users
- Upload and stream videos
- Different quality options (480p, 720p, 1080p, 4K)
- Recommendations based on viewing history
- Social features (likes, comments, shares)
```

## Best Practices

1. **Start High-Level**: Begin with big picture, then drill down
2. **Ask Clarifying Questions**: Don't assume, verify requirements
3. **Calculate Numbers**: Estimate scale and capacity
4. **Consider Tradeoffs**: No perfect solution, document choices
5. **Think About Failure**: How does each component fail?
6. **Be Pragmatic**: Balance perfection with deadlines and budget
7. **Iterate**: Design is iterative, refine as you go
8. **Document Decisions**: Explain the "why" behind choices

## Common Patterns & Techniques

### Load Distribution
- Round-robin
- Least connections
- Consistent hashing
- Geo-based routing

### Data Consistency
- Eventual consistency
- Strong consistency
- Causal consistency
- Read-your-writes consistency

### Communication
- Synchronous (REST, gRPC)
- Asynchronous (message queues)
- Pub/Sub (event-driven)
- WebSockets (real-time)

### Caching
- CDN (edge caching)
- Application cache (Redis)
- Database query cache
- Object cache

## Related Commands

- `/architecture-review`: Review existing architecture
- `/refactor-strategy`: Plan migration from old to new design
- `/capacity-planning`: Deep dive on capacity estimation
- `/database-design`: Focus on data modeling

