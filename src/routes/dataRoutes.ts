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


import { Router, Request, Response } from 'express';
import { queryData } from '../services/queryService';

const router = Router();

router.get<object, any>("/", async (req, res) => {
  try {
    const data = await queryData('select * from cusp_audit.demo limit 10');
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/monthly', async (req: Request, res: Response) => {
  // get from req the values for the month

  const monthly = `SELECT rp.provider_licensing_id,
rp.provider_name,
dates.StartOfMonth,
boc.billed_over_capacity_flag,
poc.placed_over_capacity_flag,
sa.same_address_flag,
dt.distance_traveled_flag
FROM (
    SELECT provider_licensing_id, StartOfMonth from cusp_audit.demo.monthly_billed_over_capacity WHERE StartOfMonth = to_timestamp('2024-01-01', 'yyyy-MM-dd')
    UNION
    SELECT provider_licensing_id, StartOfMonth from cusp_audit.demo.monthly_placed_over_capacity WHERE StartOfMonth = to_timestamp('2024-01-01', 'yyyy-MM-dd')
    UNION
    SELECT provider_licensing_id, StartOfMonth from cusp_audit.demo.monthly_providers_with_same_address WHERE StartOfMonth = to_timestamp('2024-01-01', 'yyyy-MM-dd')
    UNION
    SELECT provider_licensing_id, StartOfMonth from cusp_audit.demo.monthly_distance_traveled WHERE StartOfMonth = to_timestamp('2024-01-01', 'yyyy-MM-dd')
) AS dates
JOIN cusp_audit.demo.risk_providers rp ON rp.provider_licensing_id = dates.provider_licensing_id
LEFT JOIN cusp_audit.demo.monthly_billed_over_capacity boc ON boc.provider_licensing_id = dates.provider_licensing_id AND boc.StartOfMonth = dates.StartOfMonth
LEFT JOIN cusp_audit.demo.monthly_placed_over_capacity poc ON poc.provider_licensing_id = dates.provider_licensing_id AND  poc.StartOfMonth = dates.StartOfMonth
LEFT JOIN cusp_audit.demo.monthly_providers_with_same_address sa ON sa.provider_licensing_id = dates.provider_licensing_id AND sa.StartOfMonth = dates.StartOfMonth
LEFT JOIN cusp_audit.demo.monthly_distance_traveled dt ON dt.provider_licensing_id = dates.provider_licensing_id AND dt.StartOfMonth = dates.StartOfMonth
ORDER BY dates.StartOfMonth DESC
limit 1000`

  try {
    const data = await queryData(monthly);
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
})

export default router

