import type express from "express";

import { queryData } from "../services/queryService.js";

// @desc    Update provider insight data - update comment or update flag status
// @route   put /api/v1/providerData/insights/:id
// @access  Private
export async function updateProviderDataInsights(req: express.Request, res: express.Response) {
  // const body = req.body;
  const { provider_licensing_id, is_flagged, comment } = req?.body;

  //  id INT,
  //     row_id  STRING,
  //     provider_licensing_id INT,
  //     is_flagged BOOLEAN,
  //     comment STRING,
  //     created_at TIMESTAMP

  const sqlQuery = `
    MERGE INTO cusp_audit.demo.provider_insights target
    USING (
      SELECT '${provider_licensing_id}' AS provider_licensing_id,
      '${is_flagged}' AS is_flagged,
      '${comment}' AS comment
    ) source
    ON target.provider_licensing_id = source.provider_licensing_id
    WHEN MATCHED THEN
    UPDATE SET 
        target.provider_licensing_id = source.provider_licensing_id,
        target.is_flagged = source.is_flagged,
        target.comment = source.comment
    WHEN NOT MATCHED THEN
    INSERT (provider_licensing_id, is_flagged, comment)
    VALUES (source.provider_licensing_id, source.is_flagged, source.comment);`  

  //   'select * from cusp_audit.demo limit 10'
  try {
    const data = await queryData(sqlQuery);
    res.json(data);
  }
  catch (err: any) {
    // console.log("err =======", err);
    res.status(500).json({ error: err.message });
  }
}
