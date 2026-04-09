# Solution Diversity Dimensions

When generating 8 solutions per problem, ensure diversity across all five dimensions. No two solutions for the same problem should occupy the same position on more than two dimensions.

## The 5 Dimensions

### 1. Scope
- **minimal** — Smallest viable thing, ships in days
- **focused** — Clear single-purpose tool, ships in weeks
- **moderate** — Multi-feature product, ships in a quarter
- **ambitious** — Platform-level, multi-quarter effort

### 2. User Interaction Model
Each solution must use a different primary interaction model where possible:
- **web** — Browser-based dashboard or app
- **cli** — Terminal tool
- **api** — Developer-facing programmatic interface
- **bot** — Conversational (Slack, Teams, chat)
- **notification** — Push-based (email, alerts, digests)
- **extension** — Browser extension or IDE plugin
- **mobile** — Native or PWA mobile app
- **embedded** — Widget inside an existing system

### 3. Automation Level
- **fully_manual** — Human does the work, tool organizes it
- **assisted** — Tool suggests, human decides
- **semi_automated** — Tool does routine work, human handles exceptions
- **fully_automated** — Runs autonomously, human monitors

### 4. Capability Reliance
- **mostly_existing** — Built primarily on existing capabilities (cap_XX)
- **balanced** — Mix of existing and aspirational
- **mostly_aspirational** — Requires significant new capabilities (asp_XX)

### 5. Approach
- **preventive** vs. **reactive** — Stop the problem vs. respond to it
- **centralized** vs. **distributed** — One system vs. many coordinating
- **real-time** vs. **batch** — Continuous vs. periodic processing
