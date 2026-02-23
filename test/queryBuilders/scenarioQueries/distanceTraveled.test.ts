import { describe, expect, it } from "vitest";

import { buildScenarioDistancTraveledQuery } from "../../../src/queryBuilders/scenarioQueries/distanceTraveled.js";

describe("buildScenarioDistancTraveledQuery", () => {
  it("should return a valid SQL query with named parameters", () => {
    const result = buildScenarioDistancTraveledQuery({ provider_licensing_id: "0414fd5112995709909a1a414948c912" });
    expect(result.text).toContain("SELECT");
    expect(result.namedParameters).toEqual({ plid: "0414fd5112995709909a1a414948c912" });
  });
});
