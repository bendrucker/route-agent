# Architecture

## System Overview

The Route Agent is built on Claude Agent SDK, using MCP (Model Context Protocol) to integrate multiple data sources. The architecture prioritizes deep research over quick responses.

```mermaid
flowchart TB
    subgraph User["User Interface"]
        CC[Claude Code / CLI]
    end

    subgraph Agent["Route Planning Agent"]
        QU[Query Understanding]
        RE[Research Engine]
        RS[Route Synthesis]
        CP[Checkpoint Manager]
        GPX[GPX Generator]
    end

    subgraph MCP["MCP Tool Layer"]
        SM[Strava MCP]
        GM[Google Maps MCP]
        OSM[OpenStreetMap Tools]
        PJ[PJAMCYCLING Tools]
        MORE[Additional Sources...]
    end

    CC <--> Agent
    QU --> RE
    RE --> RS
    RS --> GPX
    CP -.-> QU
    CP -.-> RE
    CP -.-> RS

    RE <--> SM
    RE <--> GM
    RE <--> OSM
    RE <--> PJ
    RE <--> MORE
```

## Component Details

### Query Understanding

Parses user intent into structured route requirements:

- **Destination(s)**: Named places, climbs, or coordinates
- **Distance**: Target range (e.g., 80-100 miles)
- **Constraints**: Must-visit points, avoid areas, surface preferences
- **Reference**: Past activities to use as starting points

```mermaid
flowchart LR
    Input["'Route to Tunitas Creek<br/>via Pescadero, ~90 miles'"]

    subgraph Parse["Query Understanding"]
        NER[Named Entity Recognition]
        Intent[Intent Classification]
        Constraints[Constraint Extraction]
    end

    Output["Structured Query:<br/>- destination: Tunitas Creek Rd<br/>- waypoint: Pescadero<br/>- distance: 85-95 mi<br/>- type: climbing route"]

    Input --> Parse --> Output
```

### Research Engine

Orchestrates parallel data gathering. This is the "deep research" core - willing to make many tool calls across multiple sources.

**Research Phases:**

1. **Context Gathering**: Pull relevant Strava history, identify past routes in target area
2. **Climb Discovery**: Query PJAMCYCLING for climbs near destination
3. **Place Search**: Find cafes, grocery stores, water stops via Google Maps + OSM
4. **Route Candidates**: Use Google Maps routing to connect waypoints
5. **Enrichment**: Street View analysis, elevation profiles, segment data

```mermaid
sequenceDiagram
    participant Agent
    participant Strava
    participant Google
    participant OSM
    participant PJAM

    Agent->>Strava: Get activities near destination
    Agent->>PJAM: Get climbs in area
    Agent->>Google: Search cafes/stores along corridor
    Agent->>OSM: Find water fountains

    Strava-->>Agent: Past rides, segments
    PJAM-->>Agent: Climb profiles
    Google-->>Agent: Place data
    OSM-->>Agent: Water stops

    Agent->>Agent: Synthesize into route candidates
    Agent->>Google: Get routing for candidates
    Google-->>Agent: Turn-by-turn, elevation

    Agent->>Agent: Rank and present options
```

### Checkpoint Manager

Controls the interaction flow. The user remains "in the driver's seat" through structured checkpoints:

```mermaid
stateDiagram-v2
    [*] --> QueryReceived
    QueryReceived --> ConfirmIntent: Parse query
    ConfirmIntent --> Research: User confirms
    ConfirmIntent --> QueryReceived: User clarifies

    Research --> PresentFindings: Gather data
    PresentFindings --> SelectRoute: User reviews
    PresentFindings --> Research: User requests more

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
| Confirm Intent | Verify parsed query is correct | Confirm, clarify, add constraints |
| Present Findings | Show research results | Select interesting options, request more |
| Select Route | Choose from candidates | Pick route, request alternatives |
| Refine Route | Fine-tune details | Adjust stops, reorder waypoints |
| Present Final | Review before generation | Approve or tweak |

### Route Synthesis

Combines research into coherent route candidates:

1. **Segment Stitching**: Connect waypoints using known segments from Strava history
2. **Stop Integration**: Insert cafe/water stops at appropriate intervals
3. **Climb Sequencing**: Order climbs for optimal energy management
4. **Distance Optimization**: Adjust route to hit target mileage

### GPX Generator

Produces final GPX file with:
- Waypoints for key stops
- Track points for the route
- Metadata (name, description, expected stats)

## MCP Integration Strategy

Each data source is wrapped as an MCP server:

```mermaid
flowchart LR
    subgraph Existing["Existing MCPs"]
        SM[strava-mcp<br/>github.com/...]
        GM[Google Maps<br/>Grounding Light]
    end

    subgraph Build["To Build"]
        OSM[osm-cycling-mcp]
        PJ[pjamcycling-mcp]
        EL[elevation-mcp]
    end

    subgraph Agent["Agent"]
        RE[Research Engine]
    end

    RE <--> SM
    RE <--> GM
    RE <--> OSM
    RE <--> PJ
    RE <--> EL
```

## Agent SDK Structure

```typescript
// Conceptual structure - not final implementation

const routeAgent = createAgent({
  name: "route-planner",
  tools: [
    stravaMCP,
    googleMapsMCP,
    osmTools,
    pjamTools,
    elevationTools,
  ],

  checkpoints: {
    confirmIntent: async (query) => { /* ... */ },
    presentFindings: async (research) => { /* ... */ },
    selectRoute: async (candidates) => { /* ... */ },
    refineroute: async (selected) => { /* ... */ },
    presentFinal: async (route) => { /* ... */ },
  },

  workflow: async (input) => {
    const query = await parseQuery(input);
    await checkpoint("confirmIntent", query);

    const research = await gatherResearch(query);
    await checkpoint("presentFindings", research);

    const candidates = await synthesizeRoutes(research);
    const selected = await checkpoint("selectRoute", candidates);

    const refined = await refineRoute(selected);
    await checkpoint("presentFinal", refined);

    return generateGPX(refined);
  }
});
```

## Open Questions

1. **Caching Strategy**: How long to cache Strava/place data between sessions?
2. **Parallel vs Sequential Research**: When to fan out vs. iterate based on findings?
3. **Error Handling**: What if a data source is unavailable?
4. **Route Quality Scoring**: How to rank candidate routes objectively?
