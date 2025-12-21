# Architecture

## System Overview

The Route Agent is built on Claude Agent SDK, using MCP (Model Context Protocol) to integrate multiple data sources. The architecture uses **composable skills** to manage context and enable conditional invocation based on route requirements.

```mermaid
flowchart TB
    subgraph User["User Interface"]
        CC[Claude Code / CLI]
    end

    subgraph Orchestrator["Route Planning Orchestrator"]
        QU[Query Understanding]
        SI[Skill Invoker]
        CP[Checkpoint Manager]
        RS[Route Synthesis]
        GPX[GPX Generator]
    end

    subgraph Skills["Composable Skills"]
        S1[History Analysis]
        S2[Climb Planning]
        S3[Weather Planning]
        S4[Stop Planning]
        S5[Route Optimization]
        S6[Safety Assessment]
    end

    subgraph Tools["MCP Tool Layer"]
        T1[Strava MCP]
        T2[Google Maps MCP]
        T3[Weather API]
        T4[OSM Tools]
        T5[Climb Data]
        T6[Elevation]
    end

    CC <--> Orchestrator
    QU --> SI
    SI --> S1 & S2 & S3 & S4 & S5 & S6
    S1 & S2 & S3 & S4 & S5 & S6 --> RS
    RS --> GPX
    CP -.-> QU
    CP -.-> SI
    CP -.-> RS

    S1 <--> T1
    S2 <--> T5 & T6
    S3 <--> T3
    S4 <--> T2 & T4
    S5 <--> T2 & T6
    S6 <--> T2 & T4
```

## Core Concepts

### Skills vs Tools

**Tools** are external data sources (Strava API, Google Maps, weather services). They return raw data.

**Skills** are composable agent capabilities that use tools and encode domain expertise. Each skill:
- Has focused context (doesn't need to know about everything)
- Can be invoked conditionally based on route requirements
- Returns structured summaries, not raw data dumps
- May use one or more tools

This separation allows the orchestrator to invoke only relevant skills, keeping context focused and avoiding overload.

### Conditional Skill Invocation

Not every route needs every skill:

| Skill | Always? | Conditional Triggers |
|-------|---------|---------------------|
| History Analysis | Yes | - |
| Route Optimization | Yes | - |
| Climb Planning | No | Climbing route, user mentions climbs |
| Weather Planning | No | Adverse conditions, long routes, summer heat |
| Stop Planning | No | Routes > 40mi, user mentions stops |
| Safety Assessment | No | Unfamiliar roads, user asks about safety |

```mermaid
flowchart LR
    Query --> Parse
    Parse --> |Always| History[History Analysis]
    Parse --> |Always| Route[Route Optimization]
    Parse --> |Climbing?| Climb[Climb Planning]
    Parse --> |Weather concern?| Weather[Weather Planning]
    Parse --> |Long route?| Stops[Stop Planning]
    Parse --> |New roads?| Safety[Safety Assessment]
```

## Component Details

### Query Understanding

Parses user intent into structured route requirements and determines which skills to invoke:

- **Destination(s)**: Named places, climbs, or coordinates
- **Distance**: Target range (e.g., 80-100 miles)
- **Constraints**: Must-visit points, avoid areas, surface preferences
- **Reference**: Past activities to use as starting points
- **Skill Triggers**: What conditions require which skills

```mermaid
flowchart LR
    Input["'Route to Tunitas Creek<br/>via Pescadero, ~90 miles'"]

    subgraph Parse["Query Understanding"]
        NER[Named Entity Recognition]
        Intent[Intent Classification]
        Triggers[Skill Trigger Detection]
    end

    Output["Structured Query +<br/>Skills: [History, Climb,<br/>Route, Stops]"]

    Input --> Parse --> Output
```

### Skill Invoker

Orchestrates skill execution based on query analysis:

1. **Parallel Fan-out**: Independent skills run concurrently
2. **Sequential Dependencies**: Some skills inform others
3. **Context Isolation**: Each skill gets focused context
4. **Result Aggregation**: Combine skill outputs for synthesis

```mermaid
sequenceDiagram
    participant Orchestrator
    participant History as History Skill
    participant Climb as Climb Skill
    participant Weather as Weather Skill
    participant Stops as Stop Skill
    participant Route as Route Skill

    Orchestrator->>History: Analyze past rides in area
    Orchestrator->>Climb: Find climbs near destination
    Orchestrator->>Weather: Check conditions

    History-->>Orchestrator: Past routes, segments
    Climb-->>Orchestrator: Climb options, profiles
    Weather-->>Orchestrator: Forecast, wind analysis

    Note over Orchestrator: Wait for context skills

    Orchestrator->>Route: Optimize route with context
    Orchestrator->>Stops: Plan stops along route

    Route-->>Orchestrator: Route candidates
    Stops-->>Orchestrator: Stop recommendations

    Orchestrator->>Orchestrator: Synthesize final plan
```

### Checkpoint Manager

Controls the interaction flow. The user remains "in the driver's seat" through structured checkpoints:

```mermaid
stateDiagram-v2
    [*] --> QueryReceived
    QueryReceived --> ConfirmIntent: Parse query
    ConfirmIntent --> SkillExecution: User confirms
    ConfirmIntent --> QueryReceived: User clarifies

    SkillExecution --> PresentFindings: Skills complete
    PresentFindings --> SelectRoute: User reviews
    PresentFindings --> SkillExecution: User requests more

    SelectRoute --> RefineRoute: User picks candidate
    RefineRoute --> PresentFinal: Adjustments made
    RefineRoute --> SelectRoute: Major changes

    PresentFinal --> GenerateGPX: User approves
    PresentFinal --> RefineRoute: User tweaks

    GenerateGPX --> [*]: Output file
```

**Checkpoint Types:**

| Checkpoint | Purpose | User Actions |
|------------|---------|--------------|
| Confirm Intent | Verify parsed query and skill selection | Confirm, clarify, add constraints |
| Present Findings | Show skill results | Select interesting options, request more |
| Select Route | Choose from candidates | Pick route, request alternatives |
| Refine Route | Fine-tune details | Adjust stops, reorder waypoints |
| Present Final | Review before generation | Approve or tweak |

### Route Synthesis

Combines skill outputs into coherent route candidates:

1. **Segment Stitching**: Connect waypoints using known segments from History skill
2. **Stop Integration**: Insert cafe/water stops from Stop Planning skill
3. **Climb Sequencing**: Order climbs from Climb Planning skill
4. **Weather Adjustment**: Factor in Weather Planning recommendations
5. **Safety Notes**: Include warnings from Safety Assessment skill

### GPX Generator

Produces final GPX file with:
- Waypoints for key stops (cafes, water, photo ops)
- Track points for the route
- Metadata (name, description, expected stats)
- Notes/warnings in waypoint descriptions

## Skill Implementation

Skills can be implemented as:
1. **Prompt-based skills**: Instructions + tool access
2. **Sub-agents**: Independent agents with focused context
3. **Hybrid**: Sub-agent for complex skills, prompts for simple ones

```typescript
// Conceptual structure - not final implementation

// Skill as sub-agent
const climbPlanningSkill = createAgent({
  name: "climb-planner",
  tools: [climbDataTool, elevationTool, stravaSegments],
  prompt: `You are an expert at planning cycling climbs...`,
});

// Skill as prompt template
const stopPlanningSkill = {
  name: "stop-planner",
  tools: [googlePlaces, osmWater],
  invoke: async (routeCorridor, constraints) => {
    // Use tools with focused context
  }
};

// Orchestrator
const routeAgent = createAgent({
  name: "route-planner",
  skills: [
    historySkill,
    climbPlanningSkill,
    weatherSkill,
    stopPlanningSkill,
    routeOptimizationSkill,
    safetySkill,
  ],

  workflow: async (input) => {
    const query = await parseQuery(input);
    const skillsNeeded = determineSkills(query);
    await checkpoint("confirmIntent", { query, skillsNeeded });

    const skillResults = await invokeSkills(skillsNeeded, query);
    await checkpoint("presentFindings", skillResults);

    const candidates = await synthesizeRoutes(skillResults);
    const selected = await checkpoint("selectRoute", candidates);

    const refined = await refineRoute(selected);
    await checkpoint("presentFinal", refined);

    return generateGPX(refined);
  }
});
```

## Context Management

Each skill operates with focused context to avoid overload:

| Skill | Context Needs | Typical Size |
|-------|--------------|--------------|
| History Analysis | User query, geographic bounds | Low |
| Climb Planning | Target area, user preferences, past climbs | Medium |
| Weather Planning | Route geometry, timing, duration | Medium |
| Stop Planning | Route corridor, distance markers, timing | Medium |
| Route Optimization | Waypoints, constraints, skill outputs | Medium |
| Safety Assessment | Specific road segments to evaluate | Low-Medium |

The orchestrator maintains global context; skills receive only what they need.

## Open Questions

1. **Skill Granularity**: Are 6 skills the right decomposition? Should Stop Planning be split into Food/Water/Resupply?

2. **Skill Dependencies**: Should some skills see other skills' outputs, or should the orchestrator aggregate?

3. **Caching Across Skills**: Shared cache for common geographic queries?

4. **Error Handling**: What if a skill fails? Degrade gracefully or block?

5. **Sub-agent vs Skill**: When is a skill complex enough to warrant its own sub-agent?

See [tools-and-skills.md](tools-and-skills.md) for detailed skill definitions and tool catalog.
