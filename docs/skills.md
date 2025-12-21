# Skills

Skills are composable research patterns that use [tools](tools.md) to accomplish route planning tasks. Each skill encapsulates domain expertise and can be invoked conditionally based on route requirements.

See [architecture.md](architecture.md) for orchestration model and design decisions.

## Skill Architecture

```mermaid
graph TB
    subgraph Orchestrator["Route Planning Orchestrator"]
        QU[Query Understanding]
        Plan[Planning Engine]
        Synth[Route Synthesis]
    end

    subgraph Skills["Composable Skills"]
        S1[History Analysis]
        S2[Climb Planning]
        S3[Weather Planning]
        S4[Food Stop Planning]
        S5[Water Stop Planning]
        S6[Route Optimization]
        S7[Narrative Research]
        S8[Safety Assessment]
    end

    Plan --> S1 & S2 & S3 & S4 & S5 & S6 & S7 & S8
    S1 & S2 & S3 & S4 & S5 & S6 & S7 & S8 --> Synth
```

## Conditional Invocation

| Skill | Always? | Triggers |
|-------|---------|----------|
| [History Analysis](#1-history-analysis) | Yes | - |
| [Route Optimization](#6-route-optimization) | Yes | - |
| [Climb Planning](#2-climb-planning) | No | Climbing route, user mentions climbs |
| [Weather Planning](#3-weather-planning) | No | Adverse conditions, long routes, summer heat |
| [Food Stop Planning](#4-food-stop-planning) | No | Routes > 40mi, user mentions food/cafe |
| [Water Stop Planning](#5-water-stop-planning) | No | Hot weather, remote areas, summer rides |
| [Narrative Research](#7-narrative-research) | No | New areas, user wants local intel |
| [Safety Assessment](#8-safety-assessment) | No | Unfamiliar roads, user asks about safety |

**Note on Food vs Water**: Every food stop is implicitly a water stop. A dedicated water stop is for drinking water only (fountains, stores). Water stops are critical in summer heat; may be skipped entirely in winter.

---

## Skill Definitions

### 1. History Analysis

**Purpose**: Understand past rides relevant to current query

**Invocation**: Always (foundational context)

**Tools**: [Strava MCP](tools.md#1-activity-history-strava)

**Research Pattern**:
1. Parse geographic bounds from user query
2. Query Strava for activities in that area
3. Query Strava for routes in that area
4. Extract segments used before
5. Identify familiar vs. new territory
6. Surface relevant past rides as context

**Outputs**:
- Relevant past activities
- Reusable route segments
- "New roads" opportunities
- User's historical preferences for this area

---

### 2. Climb Planning

**Purpose**: Research and select climbs for the route

**Invocation**: When route involves climbing or user mentions climbs

**Tools**: [PJAMM](tools.md#4-climb-data-pjamm), [Strava MCP](tools.md#1-activity-history-strava) (segments)

**Research Pattern**:
1. Identify target area from route/destination
2. Query PJAMM for climbs in area
3. Cross-reference with Strava segments
4. Check which climbs user has already done
5. Analyze profiles (gradient, length, difficulty)
6. Consider sequencing (harder first? save legs?)
7. Prepare alternatives at different difficulty levels

**Outputs**:
- Recommended climbs with profiles
- PJAMM narratives and photos
- Sequencing suggestions
- Alternate climb options
- "New climbs" you haven't done yet

---

### 3. Weather Planning

**Purpose**: Assess weather impact on route timing and safety

**Invocation**: Adverse conditions, long routes, summer heat

**Tools**: [WeatherKit](tools.md#5-weather-apple-weatherkit)

**Research Pattern**:
1. Get route geometry and estimated duration
2. Calculate sample points (every 10 min of ride time)
3. Query WeatherKit for each sample point
4. Analyze wind direction vs. route direction (headwind/tailwind)
5. Identify weather windows
6. Flag precipitation timing
7. Consider heat/cold management

**Outputs**:
- Recommended start time
- Weather warnings
- Segment-by-segment conditions
- Headwind/tailwind analysis
- Contingency suggestions

---

### 4. Food Stop Planning

**Purpose**: Find cafes and restaurants along route

**Invocation**: Routes > 40mi, user mentions food

**Tools**: [Google Maps MCP](tools.md#3-place-search-google-maps)

**Research Pattern**:
1. Calculate ideal stop distances based on route length
2. Identify points along route at those distances
3. Search for cafes/restaurants near each point
4. Check hours (critical for early/late rides)
5. Assess cyclist-friendliness (outdoor seating, etc.)
6. Rank by quality and convenience
7. Identify backup options

**Outputs**:
- Prioritized food stop recommendations
- Hours of operation
- Distance/timing for each stop
- Backup options if primary closed

---

### 5. Water Stop Planning

**Purpose**: Find water-only stops (fountains, stores) for hydration

**Invocation**: Hot weather, summer rides, remote areas

**Tools**: [OSM Overpass](tools.md#6-water--infrastructure-osm), [Google Maps MCP](tools.md#3-place-search-google-maps)

**Research Pattern**:
1. Analyze route for remote sections
2. Consider weather (hot = more stops needed)
3. Query OSM for drinking water fountains
4. Identify parks with water facilities
5. Find stores as backup water sources
6. Assess reliability (seasonal fountains?)
7. Plan spacing for heat management

**Outputs**:
- Water stop locations
- Reliability assessment
- Distance between water sources
- Heat management recommendations

---

### 6. Route Optimization

**Purpose**: Synthesize waypoints into optimal route

**Invocation**: Always (core synthesis)

**Tools**: [GraphHopper](tools.md#2-routing-engine-graphhopper)

**Research Pattern**:
1. Parse waypoints from user query
2. Incorporate segments from [History Analysis](#1-history-analysis)
3. Request cycling-optimized route from GraphHopper
4. Analyze elevation profile
5. Check for highways or unsuitable roads
6. Generate route variants (shorter/flatter vs. scenic/hilly)
7. Integrate stops from other skills

**Outputs**:
- Primary route recommendation
- Alternative variants
- Elevation profile
- Turn-by-turn directions
- GPX file

---

### 7. Narrative Research

**Purpose**: Enrich routes with local intel from multiple sources

**Invocation**: New areas, user wants local intel

**Tools**: [PJAMM](tools.md#4-climb-data-pjamm), Web Search

**Research Pattern**:
1. Identify key locations/climbs on route
2. Gather PJAMM narratives (if available)
3. Search web for ride reports, forum posts
4. Look for local knowledge ("watch for...", "best view at...")
5. Synthesize into route notes
6. Flag any warnings or tips

**Outputs**:
- Local intel notes
- Points of interest
- Warnings and tips
- Photo opportunities

**Degradation**: If sources unavailable, skip this enrichment. Route still usable. See [Tool Criticality](architecture.md#tool-criticality).

---

### 8. Safety Assessment

**Purpose**: Evaluate route safety and road quality

**Invocation**: Unfamiliar roads, user asks about safety

**Tools**: [Street Imagery](tools.md#8-street-imagery-p3---deferred), [OSM Overpass](tools.md#6-water--infrastructure-osm)

**Research Pattern**:
1. Identify segments on unfamiliar roads
2. Check OSM for surface type and road class
3. Analyze Street View for road width/shoulder
4. Identify highway crossings or dangerous intersections
5. Suggest safer alternatives where possible
6. Prepare caution notes for GPX

**Outputs**:
- Safety warnings
- Alternative road suggestions
- "Caution" waypoints for GPX
- Surface quality notes

---

## Skill Invocation Flow

```mermaid
flowchart TD
    Query[User Query] --> Parse[Parse Intent]

    Parse --> Always{Always Invoke}
    Always --> History[History Analysis]
    Always --> Optimize[Route Optimization]

    Parse --> Climbing{Climbing?}
    Climbing -->|Yes| ClimbSkill[Climb Planning]

    Parse --> Weather{Weather?}
    Weather -->|Yes| WeatherSkill[Weather Planning]

    Parse --> Food{Long route?}
    Food -->|Yes| FoodSkill[Food Stop Planning]

    Parse --> Water{Hot weather?}
    Water -->|Yes| WaterSkill[Water Stop Planning]

    Parse --> NewArea{New area?}
    NewArea -->|Yes| NarrativeSkill[Narrative Research]

    Parse --> Unfamiliar{New roads?}
    Unfamiliar -->|Yes| SafetySkill[Safety Assessment]

    History & Optimize & ClimbSkill & WeatherSkill --> Synthesize
    FoodSkill & WaterSkill & NarrativeSkill & SafetySkill --> Synthesize

    Synthesize[Synthesize Results] --> Present[Present to User]
```

---

## Context Management

Each skill operates with focused context:

| Skill | Context Needs | Size |
|-------|--------------|------|
| History Analysis | Query, geographic bounds | Low |
| Climb Planning | Target area, preferences, past climbs | Medium |
| Weather Planning | Route geometry, timing, duration | Medium |
| Food Stop Planning | Route corridor, distance markers | Medium |
| Water Stop Planning | Route corridor, weather, season | Low-Medium |
| Route Optimization | Waypoints, constraints, skill outputs | Medium |
| Narrative Research | Key locations on route | Low |
| Safety Assessment | Specific road segments | Low-Medium |

Skills return structured summaries, not raw data dumps. The orchestrator synthesizes skill outputs into a coherent route plan.
