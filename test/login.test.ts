import jwt from "jsonwebtoken";
import request from "supertest";
import { describe, expect, it, vi } from "vitest";

import app from "../src/app.js";

vi.mock("jsonwebtoken", () => ({
  default: {
    sign: vi.fn().mockReturnValue("mocked-token"),
  },
}));

describe("POST /api/v1/login", () => {
  it("returns 401 for invalid email", () =>
    request(app)
      .post("/api/v1/login")
      .send({ email: "wrong@email.com", password: "Team3siRocks" })
      .expect("Content-Type", /json/)
      .expect(401)
      .then((response) => {
        expect(response.body).toEqual({ error: "Invalid credentials" });
      }));

  it("returns 401 for invalid password", () =>
    request(app)
      .post("/api/v1/login")
      .send({ email: "team3si", password: "wrongpassword" })
      .expect("Content-Type", /json/)
      .expect(401)
      .then((response) => {
        expect(response.body).toEqual({ error: "Invalid credentials" });
      }));

  it("returns 401 for missing credentials", () =>
    request(app)
      .post("/api/v1/login")
      .send({})
      .expect("Content-Type", /json/)
      .expect(401)
      .then((response) => {
        expect(response.body).toEqual({ error: "Invalid credentials" });
      }));

  it("returns 200 with token for valid credentials", () =>
    request(app)
      .post("/api/v1/login")
      .send({ email: "team3si", password: "Team3siRocks" })
      .expect("Content-Type", /json/)
      .expect(200)
      .then((response) => {
        expect(response.body).toHaveProperty("token");
        expect(response.body.token).toBe("mocked-token");
        expect(jwt.sign).toHaveBeenCalledWith(
          { email: "team3si", password: "Team3siRocks" },
          expect.any(String),
          { expiresIn: "1h" },
        );
      }));
});
