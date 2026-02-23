import { describe, expect, it } from "vitest";

import { buildScenarioSameAddressQuery } from "../../../src/queryBuilders/scenarioQueries/sameAddress.js";
import { normalizeSQL } from "../../../src/utils.js";

describe("buildScenarioSameAddressQuery", () => {
  it("should return a valid SQL query with named parameters", () => {
    const provider_licensing_id = "991002938c70bb63c79d37ab971c73c6";
    const result = buildScenarioSameAddressQuery({ provider_licensing_id });

    expect(result).toHaveProperty("text");
    expect(normalizeSQL(result.text)).toContain("SELECT * FROM (");
    expect(normalizeSQL(result.text)).toContain(`AND m.provider_licensing_id = :plid`);
    expect(result.namedParameters).toEqual({ plid: "991002938c70bb63c79d37ab971c73c6" });
  });
});
