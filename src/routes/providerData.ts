import type express from "express";

import { Router } from "express";

import { exportProviderDataMonthly, exportProviderDataYearly, getFlaggedCount, getHighestRiskScore, getProviderAnnualData, getProviderCities, getProviderCount, getProviderDetails, getProviderMonthData, getProvidersWithHighRiskCount } from "../controllers/providerData.js";
import { getProviderDataInsights, updateProviderDataInsights } from "../controllers/providerInsights.js";
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

router.route("/cities").get(authenticateJWT, getProviderCities);

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

router.route("/insights/:providerId")
  .put(authenticateJWT,updateProviderDataInsights)
  .get(authenticateJWT, getProviderDataInsights);

router.route("/month/:month")
  .get(
    authenticateJWT,
    getProviderMonthData,
  );
// must be last!!
router.route("/:providerId")
  .get(
    authenticateJWT,
    getProviderDetails,
  );


export default router;
