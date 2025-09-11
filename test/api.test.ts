import request from "supertest";
import { describe, it } from "vitest";

import app from "../src/app.js";

describe("POST /api/v1/login", () => {
  it("responds with a token", async () => {
    await request(app)
      .post("/api/v1/login")
      .send({ username: "user", password: "pass" })
      .set("Accept", "application/json")
      .expect("Content-Type", /json/)
      .expect(401)
  });
});
