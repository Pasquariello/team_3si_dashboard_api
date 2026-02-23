import { describe, expect, it } from "vitest";

import { buildBilledOverCapacityQuery } from "../../../src/queryBuilders/scenarioQueries/billedOverCapacity.js";
import { normalizeSQL } from "../../../src/utils.js";

describe("buildBilledOverCapacityQuery", () => {
  it("returns the correct SQL query and named parameters", () => {
    const params = { provider_licensing_id: "12345" };
    const result = buildBilledOverCapacityQuery(params);

    expect(normalizeSQL(result.text)).toContain(`SELECT m.StartOfMonth,`);

    expect(result.namedParameters).toEqual({ plid: "12345" });
  });
});
