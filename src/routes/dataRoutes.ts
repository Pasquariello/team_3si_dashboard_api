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
import { buildProviderMonthlyQuery, checkedFilter, parseMonthParam, parseOffsetParam } from "../queryBuilders/providerMonthly.js";

export type MonthlyProviderData = {
  provider_licensing_id: string;
  provider_name: string;
  StartOfMonth: string; // ISO DateString
  billed_over_capacity_flag: boolean;
  placed_over_capacity_flag: boolean;
  same_address_flag: boolean;
  distance_traveled_flag: boolean;
  is_flagged: boolean;
  comment: string;
};

export type UiMonthlyProviderData = {
  providerLicensingId: string;
  providerName: string;
  overallRiskScore: number;
  childrenBilledOverCapacity: string;
  childrenPlacedOverCapacity: string;
  distanceTraveled: string;
  providersWithSameAddress: string;
  flagged?: boolean;
  comment?: string;
  startOfMonth?: string;
};


type MonthlyQuery = {
  month: string;
  offset: string
}

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

router.post("/month/:month", authenticateJWT, async (req: Request<{ month: string }, any, any, MonthlyQuery>, res: Response) => {
  // TODO: verify this here
  const body = req.body;
  const flagged = checkedFilter(body);

  const month = req.params.month;
  const offset = req.query.offset;

  const {text, namedParameters} = buildProviderMonthlyQuery({offset, month, isFlagged: flagged});

  try {
    const rawData: MonthlyProviderData[] = await queryData(text, namedParameters);
    // add overall risk score
    const booleanKeys = ["billed_over_capacity_flag", "placed_over_capacity_flag", "same_address_flag", "distance_traveled_flag"] as const;
    const result: UiMonthlyProviderData[] = rawData.map((item) => {
      const overallRiskScore = booleanKeys.reduce((sum, key) => sum + (item[key] ? 1 : 0), 0);
      return {
        providerLicensingId: item.provider_licensing_id,
        startOfMonth: item.StartOfMonth,
        providerName: item.provider_name,
        childrenBilledOverCapacity: item.billed_over_capacity_flag ? "Yes" : "--",
        childrenPlacedOverCapacity: item.placed_over_capacity_flag ? "Yes" : "--",
        distanceTraveled: item.distance_traveled_flag ? "Yes" : "--",
        providersWithSameAddress: item.same_address_flag ? "Yes" : "--",
        overallRiskScore,
        flagged: item?.is_flagged || false,
        comment: item?.comment || "",
      };
    });
    res.json(result);
  }
  catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
