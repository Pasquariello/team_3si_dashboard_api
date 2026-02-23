import { describe, expect, it } from "vitest";

import { buildOverallScoreQuery } from "../../../src/queryBuilders/scenarioQueries/overallScore.js";
import { normalizeSQL } from "../../../src/utils.js";

describe("buildOverallScoreQuery", () => {
  it("returns the correct query and named parameters", () => {
    const provider_licensing_id = "12345";
    const result = buildOverallScoreQuery({ provider_licensing_id });

    expect(normalizeSQL(result.text)).toContain(`SELECT dates.startOfMonth,`)
    expect(result.namedParameters).toEqual({ plid: "12345" });
  });
});
