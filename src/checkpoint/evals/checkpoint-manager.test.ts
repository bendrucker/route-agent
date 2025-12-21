/**
 * Tests for CheckpointManager.
 *
 * Validates checkpoint flow, message formatting, and response parsing.
 */

import { CheckpointManager } from "../manager.ts";
import type {
  ConfirmIntentData,
  PresentFindingsData,
  SelectRouteData,
  RefineRouteData,
  PresentFinalData,
} from "../types.ts";

/**
 * Mock AskUserQuestion function for testing.
 */
function createMockAskUserQuestion(
  responses: string[]
): (message: string) => Promise<string> {
  let callCount = 0;
  return async (message: string) => {
    const response = responses[callCount] || "";
    callCount++;
    return response;
  };
}

/**
 * Test: Confirm Intent checkpoint with affirmative response.
 */
async function testConfirmIntentYes() {
  const mockAsk = createMockAskUserQuestion(["yes"]);
  const manager = new CheckpointManager(mockAsk);

  const data: ConfirmIntentData = {
    query: {
      destinations: ["Tunitas Creek", "Pescadero"],
      distance: { min: 80, max: 100 },
    },
    skillsNeeded: {
      history: true,
      climb: true,
      route: true,
    },
  };

  const response = await manager.confirmIntent(data);

  console.assert(
    response.action === "confirm",
    `Expected action 'confirm', got '${response.action}'`
  );
  console.log("✓ testConfirmIntentYes passed");
}

/**
 * Test: Confirm Intent checkpoint with clarification.
 */
async function testConfirmIntentClarify() {
  const mockAsk = createMockAskUserQuestion([
    "Actually, I want to avoid Highway 1",
  ]);
  const manager = new CheckpointManager(mockAsk);

  const data: ConfirmIntentData = {
    query: {
      destinations: ["Santa Cruz"],
      distance: { max: 60 },
    },
    skillsNeeded: {
      route: true,
    },
  };

  const response = await manager.confirmIntent(data);

  console.assert(
    response.action === "clarify",
    `Expected action 'clarify', got '${response.action}'`
  );
  console.assert(
    response.details?.response !== undefined,
    "Expected details.response to be set"
  );
  console.log("✓ testConfirmIntentClarify passed");
}

/**
 * Test: Present Findings checkpoint with proceed response.
 */
async function testPresentFindingsProceed() {
  const mockAsk = createMockAskUserQuestion(["looks good, proceed"]);
  const manager = new CheckpointManager(mockAsk);

  const data: PresentFindingsData = {
    skillResults: [
      {
        skillName: "History Analysis",
        summary: "Found 12 past rides in the area",
        data: { count: 12 },
      },
      {
        skillName: "Climb Planning",
        summary: "Identified 3 major climbs",
        data: { climbs: [] },
      },
    ],
    insights: ["Strong headwinds typical in afternoon", "Popular cafe at mile 45"],
  };

  const response = await manager.presentFindings(data);

  console.assert(
    response.action === "confirm",
    `Expected action 'confirm', got '${response.action}'`
  );
  console.log("✓ testPresentFindingsProceed passed");
}

/**
 * Test: Present Findings checkpoint with request for more research.
 */
async function testPresentFindingsRequestMore() {
  const mockAsk = createMockAskUserQuestion([
    "Can you research more about water stops?",
  ]);
  const manager = new CheckpointManager(mockAsk);

  const data: PresentFindingsData = {
    skillResults: [
      {
        skillName: "Route Optimization",
        summary: "Basic route created",
        data: {},
      },
    ],
  };

  const response = await manager.presentFindings(data);

  console.assert(
    response.action === "requestMore",
    `Expected action 'requestMore', got '${response.action}'`
  );
  console.log("✓ testPresentFindingsRequestMore passed");
}

/**
 * Test: Select Route checkpoint with numeric selection.
 */
async function testSelectRouteNumeric() {
  const mockAsk = createMockAskUserQuestion(["2"]);
  const manager = new CheckpointManager(mockAsk);

  const data: SelectRouteData = {
    candidates: [
      {
        id: "route-1",
        name: "Coastal Loop",
        distance: 85,
        elevation: 4500,
        highlights: ["Ocean views", "Lighthouse"],
      },
      {
        id: "route-2",
        name: "Mountain Pass",
        distance: 92,
        elevation: 6200,
        highlights: ["Epic climbing", "Summit views"],
      },
    ],
  };

  const response = await manager.selectRoute(data);

  console.assert(
    response.action === "select",
    `Expected action 'select', got '${response.action}'`
  );
  console.assert(
    response.details?.routeId === "2",
    `Expected routeId '2', got '${response.details?.routeId}'`
  );
  console.log("✓ testSelectRouteNumeric passed");
}

/**
 * Test: Select Route checkpoint with text selection.
 */
async function testSelectRouteText() {
  const mockAsk = createMockAskUserQuestion(["I'd like route 1 please"]);
  const manager = new CheckpointManager(mockAsk);

  const data: SelectRouteData = {
    candidates: [
      {
        id: "route-1",
        name: "Easy Ride",
        distance: 50,
        elevation: 2000,
        highlights: ["Flat", "Scenic"],
      },
    ],
  };

  const response = await manager.selectRoute(data);

  console.assert(
    response.action === "select",
    `Expected action 'select', got '${response.action}'`
  );
  console.assert(
    response.details?.routeId === "1",
    `Expected routeId '1', got '${response.details?.routeId}'`
  );
  console.log("✓ testSelectRouteText passed");
}

/**
 * Test: Refine Route checkpoint with approval.
 */
async function testRefineRouteApprove() {
  const mockAsk = createMockAskUserQuestion(["looks good"]);
  const manager = new CheckpointManager(mockAsk);

  const data: RefineRouteData = {
    selected: {
      id: "route-1",
      name: "Final Route",
      distance: 88,
      elevation: 5000,
      highlights: ["Perfect mix"],
    },
    refinements: ["Added water stop at mile 30", "Adjusted for wind"],
  };

  const response = await manager.refineRoute(data);

  console.assert(
    response.action === "confirm",
    `Expected action 'confirm', got '${response.action}'`
  );
  console.log("✓ testRefineRouteApprove passed");
}

/**
 * Test: Refine Route checkpoint with changes.
 */
async function testRefineRouteChange() {
  const mockAsk = createMockAskUserQuestion([
    "Can you change the lunch stop to a different cafe?",
  ]);
  const manager = new CheckpointManager(mockAsk);

  const data: RefineRouteData = {
    selected: {
      id: "route-1",
      name: "Route",
      distance: 75,
      elevation: 3500,
      highlights: [],
    },
  };

  const response = await manager.refineRoute(data);

  console.assert(
    response.action === "refine",
    `Expected action 'refine', got '${response.action}'`
  );
  console.assert(
    response.details?.response !== undefined,
    "Expected details.response to be set"
  );
  console.log("✓ testRefineRouteChange passed");
}

/**
 * Test: Present Final checkpoint with approval.
 */
async function testPresentFinalApprove() {
  const mockAsk = createMockAskUserQuestion(["yes, generate the GPX"]);
  const manager = new CheckpointManager(mockAsk);

  const data: PresentFinalData = {
    route: {
      id: "final",
      name: "Perfect Route",
      distance: 90,
      elevation: 5500,
      highlights: ["Amazing climb", "Coastal views"],
      adjustments: ["Optimized for morning start", "Added nutrition plan"],
      stops: [
        { type: "cafe", name: "Cafe Borrone", location: "Menlo Park" },
        { type: "water", name: "Park fountain", location: "Woodside" },
      ],
      nutritionPlan: {
        calories: 3500,
        stops: [
          { time: "9:00 AM", intake: "Breakfast bar" },
          { time: "11:30 AM", intake: "Sandwich" },
        ],
      },
      clothingRecommendations: ["Arm warmers", "Light jacket"],
      warnings: ["Traffic on Highway 84"],
    },
  };

  const response = await manager.presentFinal(data);

  console.assert(
    response.action === "approve",
    `Expected action 'approve', got '${response.action}'`
  );
  console.log("✓ testPresentFinalApprove passed");
}

/**
 * Test: Present Final checkpoint with refinement request.
 */
async function testPresentFinalRefine() {
  const mockAsk = createMockAskUserQuestion([
    "Can you adjust the clothing recommendations?",
  ]);
  const manager = new CheckpointManager(mockAsk);

  const data: PresentFinalData = {
    route: {
      id: "final",
      name: "Route",
      distance: 80,
      elevation: 4000,
      highlights: [],
      adjustments: [],
    },
  };

  const response = await manager.presentFinal(data);

  console.assert(
    response.action === "refine",
    `Expected action 'refine', got '${response.action}'`
  );
  console.log("✓ testPresentFinalRefine passed");
}

/**
 * Run all tests.
 */
async function runTests() {
  console.log("Running CheckpointManager tests...\n");

  try {
    await testConfirmIntentYes();
    await testConfirmIntentClarify();
    await testPresentFindingsProceed();
    await testPresentFindingsRequestMore();
    await testSelectRouteNumeric();
    await testSelectRouteText();
    await testRefineRouteApprove();
    await testRefineRouteChange();
    await testPresentFinalApprove();
    await testPresentFinalRefine();

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
