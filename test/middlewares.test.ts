import request from "supertest";
import { expect, it } from "vitest";

import app from "../src/app.js";

it("should return a 404 error for not found routes", async () => {
  const res = await request(app)
    .get("/nonexistent-route")
    .set("Accept", "application/json")
    .expect("Content-Type", /json/)
    .expect(404);

  expect(res.body.message).toBe('🔍 - Not Found - /nonexistent-route');
});


