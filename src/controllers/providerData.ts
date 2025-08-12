import type express from "express";

import { queryData } from "../services/queryService.js";

// @desc    Update provider insight data - update comment or update flag status
// @route   put /api/v1/providerData/insights/:id
// @access  Private
export async function updateProviderDataInsights(req: express.Request, res: express.Response) {
  const row_id = req.params.row_id;
  // const body = req.body;
  const { provider_licensing_id, is_flagged, comment } = req?.body;

  //  id INT,
  //     row_id  STRING,
  //     provider_licensing_id INT,
  //     is_flagged BOOLEAN,
  //     comment STRING,
  //     created_at TIMESTAMP

  const sqlQuery = `
        MERGE INTO cusp_audit.demo.provider_data_insights target
        USING (
            SELECT
                ${row_id} AS id,
                ${provider_licensing_id} AS provider_licensing_id,
                ${is_flagged} AS is_flagged,
                '${comment}' AS comment
        ) source
        ON target.id = source.id
        WHEN MATCHED THEN
        UPDATE SET
            target.provider_licensing_id = source.provider_licensing_id,
            target.is_flagged = source.is_flagged,
            target.comment = source.comment
        WHEN NOT MATCHED THEN
        INSERT (id, provider_licensing_id, is_flagged, comment)
        VALUES (source.id, source.provider_licensing_id, source.is_flagged, source.comment)
    `;

  //   'select * from cusp_audit.demo limit 10'
  try {
    const data = await queryData(sqlQuery);
    // console.log("DATA", data);
    res.json(data);
  }
  catch (err: any) {
    // console.log("err =======", err);
    res.status(500).json({ error: err.message });
  }
}

export async function getProviderAnnualData(req: express.Request, res: express.Response) {
  console.log('HIT IT HERE')
  const yearNum = parseInt(req.params.year, 10);
  if (isNaN(yearNum) || yearNum < 1980 || yearNum > 2100) {
    return res.status(400).json({ error: "Invalid year parameter" });
  }

  const sqlQuery = `
    WITH combined AS (
      SELECT
        COALESCE(b.provider_licensing_id, p.provider_licensing_id, d.provider_licensing_id, s.provider_licensing_id) AS provider_licensing_id,
        COALESCE(b.total_billed_over_capacity, 0) AS total_billed_over_capacity,
        COALESCE(p.total_placed_over_capacity, 0) AS total_placed_over_capacity,
        COALESCE(d.total_distance_traveled, 0) AS total_distance_traveled,
        COALESCE(s.total_same_address, 0) AS total_same_address,

        COALESCE(b.total_billed_over_capacity, 0) +
        COALESCE(p.total_placed_over_capacity, 0) +
        COALESCE(d.total_distance_traveled, 0) +
        COALESCE(s.total_same_address, 0) AS overall_risk_score
      FROM (
        SELECT provider_licensing_id,
          SUM(CASE WHEN billed_over_capacity_flag THEN 1 ELSE 0 END) AS total_billed_over_capacity    
        FROM cusp_audit.demo.monthly_billed_over_capacity
        WHERE YEAR(CAST(StartOfMonth AS DATE)) = ${yearNum}
        GROUP BY provider_licensing_id
      ) b
      FULL OUTER JOIN (
        SELECT provider_licensing_id, 
          SUM(CASE WHEN placed_over_capacity_flag THEN 1 ELSE 0 END) AS total_placed_over_capacity    
        FROM cusp_audit.demo.monthly_placed_over_capacity
        WHERE YEAR(CAST(StartOfMonth AS DATE)) = ${yearNum}
        GROUP BY provider_licensing_id
      ) p
        ON b.provider_licensing_id = p.provider_licensing_id
      FULL OUTER JOIN (
        SELECT provider_licensing_id, 
          SUM(CASE WHEN distance_traveled_flag THEN 1 ELSE 0 END) AS total_distance_traveled   
        FROM cusp_audit.demo.monthly_distance_traveled
        WHERE YEAR(CAST(StartOfMonth AS DATE)) = ${yearNum}
        GROUP BY provider_licensing_id
      ) d
        ON COALESCE(b.provider_licensing_id, p.provider_licensing_id) = d.provider_licensing_id
      FULL OUTER JOIN (
        SELECT provider_licensing_id, 
          SUM(CASE WHEN same_address_flag THEN 1 ELSE 0 END) AS total_same_address      
        FROM cusp_audit.demo.monthly_providers_with_same_address
        WHERE YEAR(CAST(StartOfMonth AS DATE)) = ${yearNum}
        GROUP BY provider_licensing_id
      ) s
        ON COALESCE(b.provider_licensing_id, p.provider_licensing_id, d.provider_licensing_id) = s.provider_licensing_id
    )
    SELECT
      c.provider_licensing_id,
      pa.provider_name,
      c.total_billed_over_capacity,
      c.total_placed_over_capacity,
      c.total_distance_traveled,
      c.total_same_address,
      c.overall_risk_score
    FROM combined c
    LEFT JOIN cusp_audit.demo.provider_attributes pa
      ON c.provider_licensing_id = pa.provider_licensing_id
    ORDER BY c.provider_licensing_id;
  `;

  try {
    const data = await queryData(sqlQuery);
    res.json(data);
  }
  catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}


