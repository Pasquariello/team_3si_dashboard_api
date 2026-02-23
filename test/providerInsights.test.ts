import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

import app from "../src/app.js";

const mockGetProviderDataInsights = vi.hoisted(() => vi.fn());
const mockUpdateProviderDataInsights = vi.hoisted(() => vi.fn());

vi.mock("../src/controllers/providerInsights.js", () => ({
  getProviderDataInsights: mockGetProviderDataInsights,
  updateProviderDataInsights: mockUpdateProviderDataInsights,
}));

vi.mock("../src/middlewares.js", () => ({
  authenticateJWT: vi.fn((req, res, next) => next()),
  notFound: vi.fn(),
  errorHandler: vi.fn()
}));

describe("Provider Insights Routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/v1/providerData/insights/:providerId", () => {
    it("should get provider insights successfully", async () => {
      const mockInsights = {
        providerId: "123",
        insights: "Test insights data",
        lastUpdated: "2024-01-01",
      };

      mockGetProviderDataInsights.mockImplementation((req, res) => {
        res.json(mockInsights);
      });

      const response = await request(app)
        .get("/api/v1/providerData/insights/123")
        .set("Authorization", "Bearer test-token")
        .expect(200);

      expect(response.body).toEqual(mockInsights);
      expect(mockGetProviderDataInsights).toHaveBeenCalledTimes(1);
    });

    it("should handle errors when getting provider insights", async () => {
      mockGetProviderDataInsights.mockImplementation((req, res) => {
        res.status(500).json({ error: "Failed to fetch insights" });
      });

      const response = await request(app)
        .get("/api/v1/providerData/insights/123")
        .set("Authorization", "Bearer test-token")
        .expect(500);

      expect(response.body).toEqual({ error: "Failed to fetch insights" });
    });
  });

  describe("PUT /api/v1/providerData/insights/:providerId", () => {
    it("should update provider insights successfully", async () => {
      const updateData = {
        insights: "Updated insights",
        reviewedBy: "John Doe",
      };

      mockUpdateProviderDataInsights.mockImplementation((req, res) => {
        res.json({ success: true, message: "Insights updated successfully" });
      });

      const response = await request(app)
        .put("/api/v1/providerData/insights/123")
        .set("Authorization", "Bearer test-token")
        .send(updateData)
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        message: "Insights updated successfully",
      });
      expect(mockUpdateProviderDataInsights).toHaveBeenCalledTimes(1);
    });

    it("should handle errors when updating provider insights", async () => {
      mockUpdateProviderDataInsights.mockImplementation((req, res) => {
        res.status(400).json({ error: "Invalid insights data" });
      });

      const response = await request(app)
        .put("/api/v1/providerData/insights/123")
        .set("Authorization", "Bearer test-token")
        .send({ insights: "" })
        .expect(400);

      expect(response.body).toEqual({ error: "Invalid insights data" });
    });
  });
});
