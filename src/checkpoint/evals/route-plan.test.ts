/**
 * Tests for RoutePlan state manager.
 *
 * Validates state transitions, data updates, and workflow management.
 */

import { RoutePlan } from "../route-plan.ts";
import type {
  ParsedQuery,
  SkillsNeeded,
  SkillResult,
  RouteCandidate,
  RefinedRoute,
} from "../types.ts";

/**
 * Test: Initial state is correct.
 */
function testInitialState() {
  const plan = new RoutePlan();
  const state = plan.getState();

  console.assert(
    state.stage === "query_received",
    `Expected stage 'query_received', got '${state.stage}'`
  );
  console.assert(
    state.userFeedback?.length === 0,
    "Expected empty userFeedback array"
  );

  console.log("✓ testInitialState passed");
}

/**
 * Test: Setting query and skills.
 */
function testSetQueryAndSkills() {
  const plan = new RoutePlan();

  const query: ParsedQuery = {
    destinations: ["Tunitas Creek"],
    distance: { min: 80, max: 100 },
  };

  const skills: SkillsNeeded = {
    history: true,
    climb: true,
    route: true,
  };

  plan.setQuery(query);
  plan.setSkillsNeeded(skills);

  const state = plan.getState();

  console.assert(
    state.query?.destinations[0] === "Tunitas Creek",
    "Query not set correctly"
  );
  console.assert(
    state.skillsNeeded?.climb === true,
    "Skills not set correctly"
  );

  console.log("✓ testSetQueryAndSkills passed");
}

/**
 * Test: Confirming intent advances stage.
 */
function testConfirmIntent() {
  const plan = new RoutePlan();

  plan.confirmIntent();

  const state = plan.getState();

  console.assert(
    state.stage === "intent_confirmed",
    `Expected stage 'intent_confirmed', got '${state.stage}'`
  );

  console.log("✓ testConfirmIntent passed");
}

/**
 * Test: Cannot confirm intent from wrong stage.
 */
function testConfirmIntentWrongStage() {
  const plan = new RoutePlan();
  plan.confirmIntent();

  let errorThrown = false;
  try {
    plan.confirmIntent();
  } catch (error) {
    errorThrown = true;
  }

  console.assert(
    errorThrown,
    "Expected error when confirming intent from wrong stage"
  );

  console.log("✓ testConfirmIntentWrongStage passed");
}

/**
 * Test: Adding skill results.
 */
function testAddSkillResults() {
  const plan = new RoutePlan();

  const results: SkillResult[] = [
    {
      skillName: "History Analysis",
      summary: "Found 12 past rides",
      data: { count: 12 },
    },
    {
      skillName: "Climb Planning",
      summary: "3 major climbs identified",
      data: { climbs: [] },
    },
  ];

  plan.addSkillResults(results);

  const state = plan.getState();

  console.assert(
    state.skillResults?.length === 2,
    `Expected 2 skill results, got ${state.skillResults?.length}`
  );
  console.assert(
    state.skillResults?.[0].skillName === "History Analysis",
    "First skill result name incorrect"
  );

  console.log("✓ testAddSkillResults passed");
}

/**
 * Test: Adding insights.
 */
function testAddInsights() {
  const plan = new RoutePlan();

  plan.addInsights(["Headwinds typical in afternoon"]);
  plan.addInsights(["Popular cafe at mile 45"]);

  const state = plan.getState();

  console.assert(
    state.insights?.length === 2,
    `Expected 2 insights, got ${state.insights?.length}`
  );
  console.assert(
    state.insights?.[0] === "Headwinds typical in afternoon",
    "First insight incorrect"
  );

  console.log("✓ testAddInsights passed");
}

/**
 * Test: Present findings advances stage.
 */
function testPresentFindings() {
  const plan = new RoutePlan();
  plan.confirmIntent();
  plan.presentFindings();

  const state = plan.getState();

  console.assert(
    state.stage === "findings_presented",
    `Expected stage 'findings_presented', got '${state.stage}'`
  );

  console.log("✓ testPresentFindings passed");
}

/**
 * Test: Setting and selecting route candidates.
 */
function testSelectRoute() {
  const plan = new RoutePlan();

  const candidates: RouteCandidate[] = [
    {
      id: "route-1",
      name: "Coastal Loop",
      distance: 85,
      elevation: 4500,
      highlights: ["Ocean views"],
    },
    {
      id: "route-2",
      name: "Mountain Pass",
      distance: 92,
      elevation: 6200,
      highlights: ["Epic climbing"],
    },
  ];

  plan.setCandidates(candidates);
  plan.selectRoute("route-2");

  const state = plan.getState();

  console.assert(
    state.stage === "route_selected",
    `Expected stage 'route_selected', got '${state.stage}'`
  );
  console.assert(
    state.selectedRoute?.id === "route-2",
    `Expected selected route 'route-2', got '${state.selectedRoute?.id}'`
  );
  console.assert(
    state.selectedRoute?.name === "Mountain Pass",
    "Selected route name incorrect"
  );

  console.log("✓ testSelectRoute passed");
}

/**
 * Test: Selecting non-existent route throws error.
 */
function testSelectRouteNotFound() {
  const plan = new RoutePlan();

  const candidates: RouteCandidate[] = [
    {
      id: "route-1",
      name: "Route",
      distance: 80,
      elevation: 4000,
      highlights: [],
    },
  ];

  plan.setCandidates(candidates);

  let errorThrown = false;
  try {
    plan.selectRoute("route-999");
  } catch (error) {
    errorThrown = true;
  }

  console.assert(
    errorThrown,
    "Expected error when selecting non-existent route"
  );

  console.log("✓ testSelectRouteNotFound passed");
}

/**
 * Test: Setting refined route.
 */
function testSetRefinedRoute() {
  const plan = new RoutePlan();

  const refined: RefinedRoute = {
    id: "final",
    name: "Perfect Route",
    distance: 90,
    elevation: 5500,
    highlights: ["Amazing views"],
    adjustments: ["Added water stop", "Optimized for morning"],
  };

  plan.setRefinedRoute(refined);

  const state = plan.getState();

  console.assert(
    state.stage === "route_refined",
    `Expected stage 'route_refined', got '${state.stage}'`
  );
  console.assert(
    state.refinedRoute?.adjustments.length === 2,
    "Refined route adjustments incorrect"
  );

  console.log("✓ testSetRefinedRoute passed");
}

/**
 * Test: Approving final route.
 */
function testApproveFinal() {
  const plan = new RoutePlan();

  const refined: RefinedRoute = {
    id: "final",
    name: "Route",
    distance: 80,
    elevation: 4000,
    highlights: [],
    adjustments: [],
  };

  plan.setRefinedRoute(refined);
  plan.approveFinal();

  const state = plan.getState();

  console.assert(
    state.stage === "final_approved",
    `Expected stage 'final_approved', got '${state.stage}'`
  );

  console.log("✓ testApproveFinal passed");
}

/**
 * Test: Adding user feedback.
 */
function testAddUserFeedback() {
  const plan = new RoutePlan();

  plan.addUserFeedback("I want to avoid Highway 1");
  plan.confirmIntent();
  plan.addUserFeedback("Can you research water stops?");

  const state = plan.getState();

  console.assert(
    state.userFeedback?.length === 2,
    `Expected 2 feedback entries, got ${state.userFeedback?.length}`
  );
  console.assert(
    state.userFeedback?.[0].stage === "query_received",
    "First feedback stage incorrect"
  );
  console.assert(
    state.userFeedback?.[1].stage === "intent_confirmed",
    "Second feedback stage incorrect"
  );
  console.assert(
    state.userFeedback?.[1].feedback === "Can you research water stops?",
    "Second feedback content incorrect"
  );

  console.log("✓ testAddUserFeedback passed");
}

/**
 * Test: Resetting to previous stage.
 */
function testResetToStage() {
  const plan = new RoutePlan();
  plan.confirmIntent();
  plan.presentFindings();

  console.assert(
    plan.getStage() === "findings_presented",
    "Stage should be findings_presented"
  );

  plan.resetToStage("intent_confirmed");

  console.assert(
    plan.getStage() === "intent_confirmed",
    "Stage should be intent_confirmed after reset"
  );

  console.log("✓ testResetToStage passed");
}

/**
 * Test: Getting summary.
 */
function testGetSummary() {
  const plan = new RoutePlan();

  const query: ParsedQuery = {
    destinations: ["Tunitas Creek"],
    distance: { min: 80, max: 100 },
  };

  plan.setQuery(query);
  plan.addUserFeedback("Looks good");

  const summary = plan.getSummary();

  console.assert(
    summary.includes("query_received"),
    "Summary should include stage"
  );
  console.assert(
    summary.includes("Tunitas Creek"),
    "Summary should include destination"
  );
  console.assert(
    summary.includes("80-100 miles"),
    "Summary should include distance"
  );
  console.assert(
    summary.includes("User Feedback: 1"),
    "Summary should include feedback count"
  );

  console.log("✓ testGetSummary passed");
}

/**
 * Test: Complete workflow.
 */
function testCompleteWorkflow() {
  const plan = new RoutePlan();

  // Query received
  const query: ParsedQuery = {
    destinations: ["Santa Cruz"],
    distance: { max: 60 },
  };
  plan.setQuery(query);
  plan.setSkillsNeeded({ route: true, stops: true });

  // Intent confirmed
  plan.confirmIntent();
  console.assert(
    plan.getStage() === "intent_confirmed",
    "Should be at intent_confirmed"
  );

  // Findings presented
  plan.addSkillResults([
    {
      skillName: "Route",
      summary: "Found optimal route",
      data: {},
    },
  ]);
  plan.presentFindings();
  console.assert(
    plan.getStage() === "findings_presented",
    "Should be at findings_presented"
  );

  // Route selected
  plan.setCandidates([
    {
      id: "route-1",
      name: "Best Route",
      distance: 58,
      elevation: 3000,
      highlights: ["Scenic"],
    },
  ]);
  plan.selectRoute("route-1");
  console.assert(
    plan.getStage() === "route_selected",
    "Should be at route_selected"
  );

  // Route refined
  plan.setRefinedRoute({
    id: "route-1",
    name: "Best Route",
    distance: 58,
    elevation: 3000,
    highlights: ["Scenic"],
    adjustments: ["Added cafe stop"],
  });
  console.assert(
    plan.getStage() === "route_refined",
    "Should be at route_refined"
  );

  // Final approved
  plan.approveFinal();
  console.assert(
    plan.getStage() === "final_approved",
    "Should be at final_approved"
  );

  console.log("✓ testCompleteWorkflow passed");
}

/**
 * Run all tests.
 */
function runTests() {
  console.log("Running RoutePlan tests...\n");

  try {
    testInitialState();
    testSetQueryAndSkills();
    testConfirmIntent();
    testConfirmIntentWrongStage();
    testAddSkillResults();
    testAddInsights();
    testPresentFindings();
    testSelectRoute();
    testSelectRouteNotFound();
    testSetRefinedRoute();
    testApproveFinal();
    testAddUserFeedback();
    testResetToStage();
    testGetSummary();
    testCompleteWorkflow();

    console.log("\n✓ All tests passed!");
  } catch (error) {
    console.error("\n✗ Test failed:", error);
    throw error;
  }
}

// Run tests if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
  runTests();
}
