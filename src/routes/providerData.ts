import type express from "express";

import { Router } from "express";

import { updateProviderDataInsights, getProviderAnnualData } from "../controllers/providerData";
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

router.route("/annual/:year")
  .get(getProviderAnnualData)

  

router.route("/insights/:row_id")
  .put(updateProviderDataInsights);

export default router;

