---
name: product-frameworks-for-design-and-management
description: Comprehensive product design and management frameworks including UX heuristics (Hick's Law, Fitts's Law), design processes (Double Diamond, Lean UX, Agile, User-Centered Design), prioritization methods (RICE, MoSCoW, Kano Model, Pareto Principle), product lifecycle guidance, PRD templates, user story formats, design critique guidelines, and usability testing checklists. Use when analyzing features, creating product documentation, facilitating design reviews, planning user research, applying UX principles to interfaces, or making product decisions that require framework-based guidance.
---

# Product Frameworks

## Overview

Comprehensive product design and management frameworks to guide strategic decisions, improve user experience, and structure product workflows.

**Reference Files:**
- [references/design-principles.md](references/design-principles.md) — Hick's Law, Fitts's Law, affordances, feedback
- [references/design-processes.md](references/design-processes.md) — Double Diamond, Agile, Lean UX, User-Centered Design
- [references/prioritization-frameworks.md](references/prioritization-frameworks.md) — RICE, MoSCoW, Kano Model, Pareto Principle
- [references/lifecycle-guidance.md](references/lifecycle-guidance.md) — Product stage strategies
- [references/requirements.md](references/requirements.md) — PRD templates, user stories, acceptance criteria
- [references/critique-guidelines.md](references/critique-guidelines.md) — Design review facilitation
- [references/usability-testing.md](references/usability-testing.md) — Test planning and analysis

---

## Pseudo Code Framework: Decision Engine

### Main Entry Point

```pseudo
FUNCTION ProductFrameworkEngine(request)
  INPUT:
    request: {
      taskType: string,              // e.g., "feature_evaluation", "design_review"
      context: {
        productStage: string,        // "introduction", "growth", "maturity", "decline"
        teamSize: number,
        timeline: string,            // "urgent", "normal", "exploratory"
        existingArtifacts: array     // e.g., ["wireframes", "user_research"]
      },
      specificNeeds: array,          // e.g., ["prioritization", "ux_heuristics"]
      constraints: object            // e.g., {budget: "low", resources: "limited"}
    }

  OUTPUT:
    recommendation: {
      primaryFrameworks: array,      // Main frameworks to apply
      supportingFrameworks: array,   // Complementary frameworks
      referenceFiles: array,         // Files to load
      actionPlan: array,             // Step-by-step guidance
      expectedOutputs: array,        // Deliverables to produce
      warnings: array                // Context-specific cautions
    }

  BEGIN
    // Step 1: Analyze request and extract key parameters
    analysis = AnalyzeRequest(request)

    // Step 2: Select appropriate frameworks based on task type
    frameworks = SelectFrameworks(analysis.taskType, request.specificNeeds)

    // Step 3: Load and combine framework guidance
    guidance = LoadFrameworkGuidance(frameworks, request.context)

    // Step 4: Generate contextualized recommendations
    recommendation = GenerateRecommendation(guidance, request.context, request.constraints)

    // Step 5: Build action plan with intermediate outputs
    recommendation.actionPlan = BuildActionPlan(frameworks, request.context)

    RETURN recommendation
  END
END FUNCTION
```

---

### Core Decision Logic: Framework Selection

```pseudo
FUNCTION SelectFrameworks(taskType, specificNeeds)
  INPUT:
    taskType: string               // Primary task category
    specificNeeds: array           // Additional requirements

  OUTPUT:
    selectedFrameworks: {
      primary: array,              // Main frameworks to use
      supporting: array,           // Additional helpful frameworks
      referenceFiles: array        // Files to load
    }

  BEGIN
    selectedFrameworks = {primary: [], supporting: [], referenceFiles: []}

    // Switch case for task type selection
    SWITCH (taskType)

      CASE "feature_evaluation":
        selectedFrameworks.primary.add("RICE_Scoring")
        selectedFrameworks.primary.add("Kano_Model")
        selectedFrameworks.referenceFiles.add("prioritization-frameworks.md")

        IF "lifecycle_context" IN specificNeeds:
          selectedFrameworks.supporting.add("Lifecycle_Guidance")
          selectedFrameworks.referenceFiles.add("lifecycle-guidance.md")
        END IF

        IF "user_value" IN specificNeeds:
          selectedFrameworks.supporting.add("Jobs_To_Be_Done")
          selectedFrameworks.referenceFiles.add("requirements.md")
        END IF
        BREAK

      CASE "design_review":
        selectedFrameworks.primary.add("Critique_Guidelines")
        selectedFrameworks.referenceFiles.add("critique-guidelines.md")

        IF "ux_heuristics" IN specificNeeds:
          selectedFrameworks.supporting.add("Design_Principles")
          selectedFrameworks.referenceFiles.add("design-principles.md")
        END IF

        IF "usability_concerns" IN specificNeeds:
          selectedFrameworks.supporting.add("Usability_Testing")
          selectedFrameworks.referenceFiles.add("usability-testing.md")
        END IF
        BREAK

      CASE "discovery_planning":
        selectedFrameworks.primary.add("Double_Diamond")
        selectedFrameworks.referenceFiles.add("design-processes.md")

        IF "research_methods" IN specificNeeds:
          selectedFrameworks.supporting.add("Usability_Testing")
          selectedFrameworks.referenceFiles.add("usability-testing.md")
        END IF

        IF "iterative_approach" IN specificNeeds:
          selectedFrameworks.supporting.add("Lean_UX")
          selectedFrameworks.referenceFiles.add("design-processes.md")
        END IF
        BREAK

      CASE "ui_optimization":
        selectedFrameworks.primary.add("Hicks_Law")
        selectedFrameworks.primary.add("Fitts_Law")
        selectedFrameworks.referenceFiles.add("design-principles.md")

        IF "user_testing" IN specificNeeds:
          selectedFrameworks.supporting.add("Usability_Testing")
          selectedFrameworks.referenceFiles.add("usability-testing.md")
        END IF
        BREAK

      CASE "requirements_documentation":
        selectedFrameworks.primary.add("PRD_Template")
        selectedFrameworks.primary.add("User_Stories")
        selectedFrameworks.referenceFiles.add("requirements.md")

        IF "acceptance_criteria" IN specificNeeds:
          selectedFrameworks.supporting.add("Acceptance_Criteria_Format")
          selectedFrameworks.referenceFiles.add("requirements.md")
        END IF
        BREAK

      CASE "strategy_planning":
        selectedFrameworks.primary.add("Lifecycle_Guidance")
        selectedFrameworks.referenceFiles.add("lifecycle-guidance.md")

        IF "prioritization" IN specificNeeds:
          selectedFrameworks.supporting.add("MoSCoW")
          selectedFrameworks.supporting.add("Pareto_Principle")
          selectedFrameworks.referenceFiles.add("prioritization-frameworks.md")
        END IF
        BREAK

      CASE "user_research":
        selectedFrameworks.primary.add("Usability_Testing")
        selectedFrameworks.referenceFiles.add("usability-testing.md")

        IF "design_process" IN specificNeeds:
          selectedFrameworks.supporting.add("User_Centered_Design")
          selectedFrameworks.referenceFiles.add("design-processes.md")
        END IF
        BREAK

      DEFAULT:
        // General product work - provide overview
        selectedFrameworks.primary.add("General_Guidance")
        selectedFrameworks.referenceFiles.add("ALL")
        BREAK

    END SWITCH

    RETURN selectedFrameworks
  END
END FUNCTION
```

---

### Intermediate Processing: Context Analysis

```pseudo
FUNCTION LoadFrameworkGuidance(frameworks, context)
  INPUT:
    frameworks: {
      primary: array,
      supporting: array,
      referenceFiles: array
    }
    context: {
      productStage: string,
      teamSize: number,
      timeline: string,
      existingArtifacts: array
    }

  OUTPUT:
    guidance: {
      frameworkDetails: array,      // Detailed framework information
      applicableStrategies: array,  // Stage-specific strategies
      priorityLevel: string,        // "high", "medium", "low"
      combinationAdvice: array      // How to combine frameworks
    }

  BEGIN
    guidance = {frameworkDetails: [], applicableStrategies: [], combinationAdvice: []}

    // Load primary framework details
    FOR EACH framework IN frameworks.primary:
      details = FetchFrameworkDetails(framework)
      guidance.frameworkDetails.add(details)
    END FOR

    // Add supporting framework context
    FOR EACH framework IN frameworks.supporting:
      details = FetchFrameworkDetails(framework)
      guidance.frameworkDetails.add(details)
    END FOR

    // Apply context-specific filtering
    SWITCH (context.productStage)
      CASE "introduction":
        guidance.applicableStrategies = [
          "Focus on problem validation",
          "Prioritize must-have features",
          "Emphasize user research and discovery",
          "Apply Lean UX for rapid iteration"
        ]
        guidance.priorityLevel = "high"
        BREAK

      CASE "growth":
        guidance.applicableStrategies = [
          "Scale successful features",
          "Use RICE for feature prioritization",
          "Implement performance optimizations",
          "Conduct usability testing at scale"
        ]
        guidance.priorityLevel = "high"
        BREAK

      CASE "maturity":
        guidance.applicableStrategies = [
          "Optimize and refine existing features",
          "Focus on incremental improvements",
          "Apply Pareto Principle (80/20 rule)",
          "Maintain competitive differentiation"
        ]
        guidance.priorityLevel = "medium"
        BREAK

      CASE "decline":
        guidance.applicableStrategies = [
          "Minimize investment in new features",
          "Focus on retention and efficiency",
          "Consider pivot or sunset strategies",
          "Maintain only critical functionality"
        ]
        guidance.priorityLevel = "low"
        BREAK
    END SWITCH

    // Generate combination advice
    IF frameworks.primary.contains("RICE_Scoring") AND frameworks.supporting.contains("Kano_Model"):
      guidance.combinationAdvice.add({
        frameworks: ["RICE", "Kano"],
        strategy: "Use RICE for quantitative scoring, Kano for qualitative categorization",
        benefit: "Comprehensive prioritization with both metrics and user satisfaction"
      })
    END IF

    IF frameworks.primary.contains("Double_Diamond") AND frameworks.supporting.contains("Lean_UX"):
      guidance.combinationAdvice.add({
        frameworks: ["Double Diamond", "Lean UX"],
        strategy: "Use Double Diamond for structure, Lean UX for rapid iteration within phases",
        benefit: "Structured but flexible discovery process"
      })
    END IF

    RETURN guidance
  END
END FUNCTION
```

---

### Output Generation: Action Plan Builder

```pseudo
FUNCTION BuildActionPlan(frameworks, context)
  INPUT:
    frameworks: {
      primary: array,
      supporting: array
    }
    context: {
      productStage: string,
      teamSize: number,
      timeline: string
    }

  OUTPUT:
    actionPlan: [
      {
        step: number,
        action: string,
        framework: string,
        inputs: array,
        intermediateOutputs: array,
        tools: array,
        duration: string
      }
    ]

  BEGIN
    actionPlan = []
    stepNumber = 1

    // Generate steps based on primary frameworks
    FOR EACH framework IN frameworks.primary:

      SWITCH (framework)

        CASE "RICE_Scoring":
          actionPlan.add({
            step: stepNumber++,
            action: "Calculate RICE scores for features",
            framework: "RICE_Scoring",
            inputs: [
              "Feature list",
              "Reach estimates (users per quarter)",
              "Impact ratings (3=massive, 2=high, 1=medium, 0.5=low)",
              "Confidence percentages",
              "Effort estimates (person-months)"
            ],
            intermediateOutputs: [
              "RICE score per feature = (Reach × Impact × Confidence) / Effort",
              "Ranked feature list by score",
              "Confidence intervals for uncertain estimates"
            ],
            tools: ["Spreadsheet", "Calculator", "Estimation workshop"],
            duration: GetDuration("RICE_Scoring", context.timeline)
          })
          BREAK

        CASE "Kano_Model":
          actionPlan.add({
            step: stepNumber++,
            action: "Categorize features using Kano Model",
            framework: "Kano_Model",
            inputs: [
              "Feature list",
              "User research data",
              "Customer satisfaction surveys"
            ],
            intermediateOutputs: [
              "Basic features (must-haves)",
              "Performance features (more is better)",
              "Delight features (unexpected positive)",
              "Indifferent features (no impact)",
              "Reverse features (negative impact)"
            ],
            tools: ["Kano questionnaire", "User interviews", "Survey analysis"],
            duration: GetDuration("Kano_Model", context.timeline)
          })
          BREAK

        CASE "Double_Diamond":
          actionPlan.add({
            step: stepNumber++,
            action: "Execute Double Diamond discovery process",
            framework: "Double_Diamond",
            inputs: [
              "Problem statement",
              "Stakeholder insights",
              "User research questions"
            ],
            intermediateOutputs: [
              "Phase 1 (Discover): User insights, problem space map",
              "Phase 2 (Define): Problem definition, opportunity areas",
              "Phase 3 (Develop): Solution concepts, prototypes",
              "Phase 4 (Deliver): Final solution, implementation plan"
            ],
            tools: ["User research", "Brainstorming", "Prototyping", "Testing"],
            duration: GetDuration("Double_Diamond", context.timeline)
          })
          BREAK

        CASE "Critique_Guidelines":
          actionPlan.add({
            step: stepNumber++,
            action: "Facilitate structured design critique",
            framework: "Critique_Guidelines",
            inputs: [
              "Design artifacts (wireframes, mockups, prototypes)",
              "Design goals and constraints",
              "Critique participants"
            ],
            intermediateOutputs: [
              "Presenter overview (5-10 min)",
              "Clarifying questions (5 min)",
              "Structured feedback (15-20 min)",
              "Designer response (5 min)",
              "Action items and next steps"
            ],
            tools: ["Critique checklist", "Feedback template", "Notes document"],
            duration: GetDuration("Critique_Guidelines", context.timeline)
          })
          BREAK

        CASE "Usability_Testing":
          actionPlan.add({
            step: stepNumber++,
            action: "Plan and execute usability testing",
            framework: "Usability_Testing",
            inputs: [
              "Test objectives",
              "Participant criteria",
              "Tasks to test",
              "Prototype or product"
            ],
            intermediateOutputs: [
              "Test plan with scenarios",
              "Participant recruitment (5+ users)",
              "Session recordings and notes",
              "Metrics: Success rate, time on task, error rate",
              "Findings report with severity ratings"
            ],
            tools: ["Testing platform", "Screen recording", "Analysis template"],
            duration: GetDuration("Usability_Testing", context.timeline)
          })
          BREAK

        CASE "PRD_Template":
          actionPlan.add({
            step: stepNumber++,
            action: "Create Product Requirements Document",
            framework: "PRD_Template",
            inputs: [
              "Product vision",
              "Stakeholder requirements",
              "User personas",
              "Technical constraints"
            ],
            intermediateOutputs: [
              "Overview and objectives",
              "User personas and use cases",
              "Feature specifications",
              "Success metrics",
              "Timeline and milestones",
              "Out of scope items"
            ],
            tools: ["PRD template", "Collaboration tool", "Review process"],
            duration: GetDuration("PRD_Template", context.timeline)
          })
          BREAK

        DEFAULT:
          actionPlan.add({
            step: stepNumber++,
            action: "Apply general framework guidance",
            framework: framework,
            inputs: ["Context-specific requirements"],
            intermediateOutputs: ["Framework-specific deliverables"],
            tools: ["Reference documentation"],
            duration: "Variable"
          })
          BREAK

      END SWITCH
    END FOR

    // Add integration step if multiple frameworks
    IF frameworks.primary.length > 1 OR frameworks.supporting.length > 0:
      actionPlan.add({
        step: stepNumber++,
        action: "Integrate and synthesize framework outputs",
        framework: "Integration",
        inputs: [
          "All intermediate outputs from previous steps"
        ],
        intermediateOutputs: [
          "Unified recommendation",
          "Prioritized action items",
          "Decision rationale document"
        ],
        tools: ["Synthesis workshop", "Decision matrix"],
        duration: GetDuration("Integration", context.timeline)
      })
    END IF

    RETURN actionPlan
  END
END FUNCTION
```

---

### Helper Function: Duration Estimation

```pseudo
FUNCTION GetDuration(framework, timeline)
  INPUT:
    framework: string
    timeline: string              // "urgent", "normal", "exploratory"

  OUTPUT:
    duration: string              // Estimated time range

  BEGIN
    SWITCH (timeline)
      CASE "urgent":
        durationMultiplier = 0.5
        BREAK
      CASE "normal":
        durationMultiplier = 1.0
        BREAK
      CASE "exploratory":
        durationMultiplier = 2.0
        BREAK
      DEFAULT:
        durationMultiplier = 1.0
        BREAK
    END SWITCH

    // Base durations (in hours)
    baseDurations = {
      "RICE_Scoring": 4,
      "Kano_Model": 8,
      "Double_Diamond": 40,
      "Critique_Guidelines": 2,
      "Usability_Testing": 20,
      "PRD_Template": 8,
      "Integration": 3
    }

    IF framework IN baseDurations:
      estimatedHours = baseDurations[framework] * durationMultiplier
      RETURN FormatDuration(estimatedHours)
    ELSE:
      RETURN "Variable - see reference documentation"
    END IF
  END
END FUNCTION
```

---

### Final Output Generator

```pseudo
FUNCTION GenerateRecommendation(guidance, context, constraints)
  INPUT:
    guidance: {
      frameworkDetails: array,
      applicableStrategies: array,
      priorityLevel: string,
      combinationAdvice: array
    }
    context: object
    constraints: object

  OUTPUT:
    recommendation: {
      summary: string,
      primaryFrameworks: array,
      supportingFrameworks: array,
      referenceFiles: array,
      actionPlan: array,
      expectedOutputs: array,
      warnings: array,
      successMetrics: array
    }

  BEGIN
    recommendation = {}

    // Generate executive summary
    recommendation.summary = GenerateSummary(guidance, context)

    // Populate framework recommendations
    recommendation.primaryFrameworks = ExtractPrimaryFrameworks(guidance)
    recommendation.supportingFrameworks = ExtractSupportingFrameworks(guidance)
    recommendation.referenceFiles = ExtractReferenceFiles(guidance)

    // Define expected outputs
    recommendation.expectedOutputs = [
      "Strategic decisions grounded in frameworks",
      "Prioritized feature lists or action items",
      "Documentation artifacts (PRDs, user stories, test plans)",
      "Design feedback or critique notes",
      "Data-driven recommendations"
    ]

    // Generate context-specific warnings
    IF constraints.budget == "low":
      recommendation.warnings.add("Limited budget may restrict comprehensive user research")
    END IF

    IF constraints.resources == "limited":
      recommendation.warnings.add("Consider focusing on highest-impact frameworks first")
    END IF

    IF context.timeline == "urgent":
      recommendation.warnings.add("Compressed timeline may require parallel workstreams")
    END IF

    // Define success metrics
    recommendation.successMetrics = [
      "Framework application completeness",
      "Stakeholder alignment on decisions",
      "Quality of deliverables produced",
      "Time to decision or implementation",
      "Team satisfaction with process"
    ]

    RETURN recommendation
  END
END FUNCTION
```

---

## Quick Start (Pseudo Code Execution)

To use this decision engine:

1. **Define your request**
```pseudo
request = {
  taskType: "feature_evaluation",
  context: {
    productStage: "growth",
    teamSize: 5,
    timeline: "normal"
  },
  specificNeeds: ["prioritization", "lifecycle_context"],
  constraints: {budget: "medium", resources: "adequate"}
}
```

2. **Execute the engine**
```pseudo
recommendation = ProductFrameworkEngine(request)
```

3. **Review and apply outputs**
```pseudo
PRINT recommendation.primaryFrameworks
PRINT recommendation.actionPlan
EXECUTE actionPlan
```

---

## Framework Summaries

**Design Principles:** Hick's Law (choice overload), Fitts's Law (target sizing), affordances, feedback loops, system status visibility

**Design Processes:** Double Diamond (Discover→Define→Develop→Deliver), Agile, Lean UX, User-Centered Design

**Prioritization:** RICE Scoring, MoSCoW (Must/Should/Could/Won't), Kano Model, 80/20 Rule

**Lifecycle:** Introduction, Growth, Maturity, Decline stage strategies

**Documentation:** PRD structure, user story format, acceptance criteria

---

## Best Practices

**Progressive Loading:** Don't load all references at once. Start with the most relevant file, then add others as needed.

**Context-Specific Application:** Frameworks are guidance, not rigid rules. Apply with judgment based on your product context.

**Complementary Frameworks:**
- Kano Model + RICE = comprehensive prioritization
- Double Diamond + Lean UX = structured but iterative discovery
- User-Centered Design + Usability Testing = validated user focus

**Shared Language:** Use framework terminology to align teams and communicate with stakeholders.
