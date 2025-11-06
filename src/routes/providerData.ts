import type express from "express";

import { Router } from "express";

import { exportProviderDataMonthly, exportProviderDataYearly, getFlaggedCount, getHighestRiskScore, getProviderAnnualData, getProviderCities, getProviderCount, getProviderMonthData, getProvidersWithHighRiskCount, updateProviderDataInsights } from "../controllers/providerData.js";
import { authenticateJWT } from "../middlewares.js";
import { queryData } from "../services/queryService.js";

const router = Router();

router.get("/", async (req: express.Request, res: express.Response) => {
  try {
    const data = await queryData("select * from cusp_audit.demo limit 10");
    res.json(data);
  }
  catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.route("/export/year/:year")
  .get(authenticateJWT, exportProviderDataYearly);

router.route("/export/month/:month")
  .get(authenticateJWT, exportProviderDataMonthly);

router.route("/providerCount/:year")
  .get(authenticateJWT, getProviderCount);

router.route("/flaggedCount/:year")
  .get(authenticateJWT, getFlaggedCount);

router.route("/highRiskScore/:year")
  .get(authenticateJWT, getHighestRiskScore);

router.route("/highRiskScoreCount/:year")
  .get(authenticateJWT, getProvidersWithHighRiskCount);

router.route("/annual/:year")
  .get(authenticateJWT, getProviderAnnualData);

router.route("/insights/:row_id")
  .put(updateProviderDataInsights);

router.route("/month/:month")
  .get(
    authenticateJWT,
    getProviderMonthData,
  );

router.route("/cities").get(authenticateJWT, getProviderCities);

export default router;
