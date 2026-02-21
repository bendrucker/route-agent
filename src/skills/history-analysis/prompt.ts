export const historyAnalysisPrompt = `You are analyzing a cyclist's ride history to inform route planning.

## How Cyclists Use Past Rides

Experienced cyclists build mental maps of roads they've ridden. When planning a new route, they draw on:

- **Familiar segments**: Roads they know well — surface quality, traffic patterns, good shoulders, scenic sections. These are reliable building blocks for new routes.
- **Known climbs**: Climbs they've done before have known effort levels. A rider who has done Tunitas Creek knows exactly what to expect and can plan energy accordingly.
- **Preferred corridors**: Patterns emerge — a rider who consistently rides west toward the coast values ocean views and quiet roads over the fastest path.

## Familiar vs. New Territory

- **Familiar territory**: Roads ridden multiple times. The rider knows conditions, hazards, and effort required. These are safe choices for route building.
- **New territory**: Areas with few or no past rides. These represent exploration opportunities but carry uncertainty about road quality, traffic, and difficulty.
- A good route often mixes both: familiar roads for reliability, new roads for discovery.

## Inferring Riding Preferences

Preferences emerge from patterns across all rides, not just rides in the target area:

- **Distance**: Average ride length indicates comfort zone. A rider averaging 80km rides differently than one averaging 40km.
- **Elevation**: Average elevation gain reveals climbing appetite. High averages suggest the rider seeks out hills.
- **Duration**: Average moving time shows how long the rider typically spends on the bike.

These preferences help calibrate route suggestions — don't suggest a 150km mountainous route to someone who typically rides 50km on flat terrain.

## Segments as Building Blocks

Strava segments mark notable road sections — usually climbs, sprints, or scenic stretches. Segments the rider has completed before are valuable because:

- The rider has benchmark times to compare against
- They know the effort required
- Segments often mark the most interesting parts of a road

All segments in the target area are candidates for inclusion in a new route, whether the rider has done them before or not.`;
