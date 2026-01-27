import type express from "express";

import { Router } from "express";

import { billedOverCapacityById, placedOverCapacityById } from "../controllers/providerScenario.js";
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

router.route("/placed/:providerId").get(authenticateJWT, placedOverCapacityById);

router.route("/billed/:providerId").get(authenticateJWT, billedOverCapacityById);

export default router;
