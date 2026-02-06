import type express from "express";

import { Router } from "express";

import { billedOverCapacityById, distanceTraveledById, overallScoreById, placedOverCapacityById, sameAddressById } from "../controllers/providerScenario.js";
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

router.route("/overall/:providerId").get(authenticateJWT, overallScoreById);

router.route("/placed/:providerId").get(authenticateJWT, placedOverCapacityById);

router.route("/billed/:providerId").get(authenticateJWT, billedOverCapacityById);

router.route("/address/:providerId").get(authenticateJWT, sameAddressById);

router.route("/distance/:providerId").get(authenticateJWT,distanceTraveledById );

export default router;
