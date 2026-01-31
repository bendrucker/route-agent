/**
 * Tests for the simplified checkpoint tool.
 */

import { expect, test } from "bun:test";
import { type PresentRoutePlanInput, presentRoutePlan } from "../tool";

test("presentRoutePlan - confirm_intent stage", async () => {
  const input: PresentRoutePlanInput = {
    presentation: {
      stage: "confirm_intent",
      query: {
        destinations: ["Mount Hamilton"],
        distance: { min: 50, max: 70 },
      },
      skillsNeeded: {
        history: true,
        climb: true,
        weather: true,
      },
    },
    prompt: "Does this match what you're looking for?",
  };

  const output = await presentRoutePlan(input);

  // Tool returns a response
  expect(typeof output.response).toBe("object");
  expect(typeof output.response.approved).toBe("boolean");
});

test("presentRoutePlan - present_findings stage", async () => {
  const input: PresentRoutePlanInput = {
    presentation: {
      stage: "present_findings",
      skillResults: [
        {
          skillName: "history",
          summary: "Found 15 similar rides",
          data: {},
        },
        {
          skillName: "climb",
          summary: "Mount Hamilton: 3,500 ft elevation gain",
          data: {},
        },
      ],
      insights: ["You usually ride this route on weekends", "Weather is best in morning hours"],
    },
    prompt: "Would you like me to generate route options?",
  };

  const output = await presentRoutePlan(input);

  expect(typeof output.response).toBe("object");
  expect(typeof output.response.approved).toBe("boolean");
});

test("presentRoutePlan - select_route stage", async () => {
  const input: PresentRoutePlanInput = {
    presentation: {
      stage: "select_route",
      candidates: [
        {
          id: "route-1",
          name: "Classic Mount Hamilton Loop",
          distance: 65,
          elevation: 3500,
          highlights: ["Lick Observatory", "Summit views"],
          stops: [
            {
              type: "cafe",
              name: "Summit Cafe",
              location: "At the top",
            },
          ],
        },
        {
          id: "route-2",
          name: "Shorter Hamilton Climb",
          distance: 52,
          elevation: 3500,
          highlights: ["Same climb, shorter return"],
          warnings: ["Busy highway on descent"],
        },
      ],
    },
    prompt: "Which route would you like to select?",
  };

  const output = await presentRoutePlan(input);

  expect(typeof output.response).toBe("object");
  expect(typeof output.response.approved).toBe("boolean");
});

test("presentRoutePlan - refine_route stage", async () => {
  const input: PresentRoutePlanInput = {
    presentation: {
      stage: "refine_route",
      selectedRoute: {
        id: "route-1",
        name: "Classic Mount Hamilton Loop",
        distance: 65,
        elevation: 3500,
        highlights: ["Lick Observatory"],
      },
      proposedRefinements: [
        "Added water stop at Grant Ranch",
        "Included nutrition plan for 4-hour ride",
        "Suggested early start time (7am) for cooler temps",
      ],
    },
    prompt: "Do these refinements look good?",
  };

  const output = await presentRoutePlan(input);

  expect(typeof output.response).toBe("object");
  expect(typeof output.response.approved).toBe("boolean");
});

test("presentRoutePlan - present_final stage", async () => {
  const input: PresentRoutePlanInput = {
    presentation: {
      stage: "present_final",
      finalRoute: {
        id: "route-1",
        name: "Classic Mount Hamilton Loop",
        distance: 65,
        elevation: 3500,
        highlights: ["Lick Observatory", "Summit views"],
        stops: [
          {
            type: "water",
            name: "Grant Ranch",
            location: "Mile 15",
          },
          {
            type: "cafe",
            name: "Summit Cafe",
            location: "Mile 30",
          },
        ],
        adjustments: ["Added Grant Ranch water stop", "Included 4-hour nutrition plan"],
        nutritionPlan: {
          calories: 2400,
          stops: [
            { time: "Mile 15", intake: "Gel + water" },
            { time: "Mile 30", intake: "Sandwich + sports drink" },
          ],
        },
        clothingRecommendations: ["Arm warmers for descent", "Light jacket recommended"],
        warnings: ["Early morning fog possible"],
      },
    },
    prompt: "Ready to generate the GPX file?",
  };

  const output = await presentRoutePlan(input);

  expect(typeof output.response).toBe("object");
  expect(typeof output.response.approved).toBe("boolean");
});
