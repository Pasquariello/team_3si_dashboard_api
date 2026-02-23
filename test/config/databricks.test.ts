import { DBSQLClient } from "@databricks/sql";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { getDatabricksClient, resetClient } from "../../src/config/databricks.js";
import { env } from "../../src/env.js";

vi.mock("@databricks/sql");

describe("getDatabricksClient", () => {
  let clientInstanceMock: { connect: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    clientInstanceMock = { connect: vi.fn().mockResolvedValue(undefined) };
    vi.mocked(DBSQLClient).mockImplementation(() => clientInstanceMock as any);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    resetClient();
  });

  it("should create and connect a new DBSQLClient instance if one does not exist", async () => {
    await getDatabricksClient();

    expect(DBSQLClient).toHaveBeenCalledOnce();
    expect(clientInstanceMock.connect).toHaveBeenCalledWith({
      host: env.DATABRICKS_HOST,
      path: env.DATABRICKS_HTTP_PATH,
      token: env.PAT_TOKEN,
    });
  });

  it("should return the existing DBSQLClient instance if one already exists", async () => {
    const firstClient = await getDatabricksClient();
    const secondClient = await getDatabricksClient();

    expect(firstClient).toBe(secondClient);
    expect(DBSQLClient).toHaveBeenCalledOnce();
    expect(clientInstanceMock.connect).toHaveBeenCalledOnce();
  });
});
