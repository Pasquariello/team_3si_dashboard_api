// const express = require('express');
// const router = express.Router();
// const { queryData } = require('../services/queryService');

// router.get('/', async (req, res) => {
//   try {
//     const data = await queryData('select * from cusp_audit.demo.risk_scores limit 10');
//     res.json(data);
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// module.exports = router;

import type { Request, Response } from "express";

import { Router } from "express";
import jwt from "jsonwebtoken";

import { env } from "../env.js";
import { authenticateJWT } from "../middlewares.js";
import { queryData } from "../services/queryService.js";

export type MonthlyProviderData = {
  provider_licensing_id: string;
  provider_name: string;
  StartOfMonth: string; // ISO DateString
  billed_over_capacity_flag: boolean;
  placed_over_capacity_flag: boolean;
  same_address_flag: boolean;
  distance_traveled_flag: boolean;
};

const router = Router();

router.get<object, any>("/", async (req, res) => {
  try {
    const data = await queryData("select * from cusp_audit.demo limit 10");
    res.json(data);
  }
  catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post<object, any>("/login", async (req, res) => {
  const { email, password } = req.body;

  // hardcoded user check (replace with DB lookup)
  if (email !== "team3si" || password !== "reallysecurepassword") {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const payload = { email, password };
  const token = jwt.sign(payload, env.JWT_SECRET, { expiresIn: "1h" });

  res.status(200).json({ token });
});
// /month:yyyy-MM-dd
router.post("/month/:month", authenticateJWT, async (req: Request, res: Response) => {
  // TODO: verify this here
  const body = req.body
  // eslint-disable-next-line no-console
  console.log(body) 
  const month = `${req.params.month}-01`;
  const offset = req.query.offset || "0";
  const monthly = `SELECT rp.provider_licensing_id,
rp.provider_name,
dates.StartOfMonth,
boc.billed_over_capacity_flag,
poc.placed_over_capacity_flag,
sa.same_address_flag,
dt.distance_traveled_flag
FROM (
    SELECT provider_licensing_id, StartOfMonth from cusp_audit.demo.monthly_billed_over_capacity WHERE StartOfMonth = to_timestamp('${month}', 'yyyy-MM-dd')
    UNION
    SELECT provider_licensing_id, StartOfMonth from cusp_audit.demo.monthly_placed_over_capacity WHERE StartOfMonth = to_timestamp('${month}', 'yyyy-MM-dd')
    UNION
    SELECT provider_licensing_id, StartOfMonth from cusp_audit.demo.monthly_providers_with_same_address WHERE StartOfMonth = to_timestamp('${month}', 'yyyy-MM-dd')
    UNION
    SELECT provider_licensing_id, StartOfMonth from cusp_audit.demo.monthly_distance_traveled WHERE StartOfMonth = to_timestamp('${month}', 'yyyy-MM-dd')
) AS dates
JOIN cusp_audit.demo.risk_providers rp ON rp.provider_licensing_id = dates.provider_licensing_id
LEFT JOIN cusp_audit.demo.monthly_billed_over_capacity boc ON boc.provider_licensing_id = dates.provider_licensing_id AND boc.StartOfMonth = dates.StartOfMonth
LEFT JOIN cusp_audit.demo.monthly_placed_over_capacity poc ON poc.provider_licensing_id = dates.provider_licensing_id AND  poc.StartOfMonth = dates.StartOfMonth
LEFT JOIN cusp_audit.demo.monthly_providers_with_same_address sa ON sa.provider_licensing_id = dates.provider_licensing_id AND sa.StartOfMonth = dates.StartOfMonth
LEFT JOIN cusp_audit.demo.monthly_distance_traveled dt ON dt.provider_licensing_id = dates.provider_licensing_id AND dt.StartOfMonth = dates.StartOfMonth
ORDER BY dates.StartOfMonth DESC
limit 200 offset ${offset}`;

  try {
    const rawData: MonthlyProviderData[] = await queryData(monthly);

    // add overall risk score
    const booleanKeys = ["billed_over_capacity_flag", "placed_over_capacity_flag", "same_address_flag", "distance_traveled_flag"] as const;
    const result = rawData.map((item) => {
      const overallRiskScore = booleanKeys.reduce((sum, key) => sum + (item[key] ? 1 : 0), 0);
      return {
        id: item.provider_licensing_id,
        startOfMonth: item.StartOfMonth,
        providerName: item.provider_name,
        childrenBilledOverCapacity: item.billed_over_capacity_flag ? "Yes" : "--",
        childrenPlacedOverCapacity: item.placed_over_capacity_flag ? "Yes" : "--",
        distanceTraveled: item.distance_traveled_flag ? "Yes" : "--",
        providersWithSameAddress: item.same_address_flag ? "Yes" : "--",
        overallRiskScore,
      };
    });
    // console.log(month, offset);
    // console.log("Success");
    res.json(result);
  }
  catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
