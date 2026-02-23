import { SQL } from "sql-template-strings";

import { parseOffsetParam } from "./providerMonthly.js";

export type BuildProviderYearlyQueryParams = {
  isFlagged: boolean | null;
  year: string;
  offset: string;
  cities: string[];
};

export function buildProviderYearlyQuery({ year, offset, isFlagged, cities }: BuildProviderYearlyQueryParams) {
  const sqlQuery = SQL`
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
        WHERE YEAR(CAST(StartOfMonth AS DATE)) = :year
        GROUP BY provider_licensing_id
      ) b
      FULL OUTER JOIN (
        SELECT provider_licensing_id, 
          SUM(CASE WHEN placed_over_capacity_flag THEN 1 ELSE 0 END) AS total_placed_over_capacity    
        FROM cusp_audit.demo.monthly_placed_over_capacity
        WHERE YEAR(CAST(StartOfMonth AS DATE)) = :year
        GROUP BY provider_licensing_id
      ) p
        ON b.provider_licensing_id = p.provider_licensing_id
      FULL OUTER JOIN (
        SELECT provider_licensing_id, 
          SUM(CASE WHEN distance_traveled_flag THEN 1 ELSE 0 END) AS total_distance_traveled   
        FROM cusp_audit.demo.monthly_distance_traveled
        WHERE YEAR(CAST(StartOfMonth AS DATE)) = :year
        GROUP BY provider_licensing_id
      ) d
        ON COALESCE(b.provider_licensing_id, p.provider_licensing_id) = d.provider_licensing_id
      FULL OUTER JOIN (
        SELECT provider_licensing_id, 
          SUM(CASE WHEN same_address_flag THEN 1 ELSE 0 END) AS total_same_address      
        FROM cusp_audit.demo.monthly_providers_with_same_address
        WHERE YEAR(CAST(StartOfMonth AS DATE)) = :year
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
      c.overall_risk_score,
      pi.is_flagged,
      pi.comment,
      a.postal_address,
      a.city,
      a.zip
    FROM combined c
    JOIN cusp_audit.demo.risk_providers rp ON c.provider_licensing_id = rp.provider_licensing_id
    LEFT JOIN cusp_audit.demo.provider_attributes pa
      ON c.provider_licensing_id = pa.provider_licensing_id
    LEFT JOIN cusp_audit.demo.provider_insights pi ON c.provider_licensing_id = pi.provider_licensing_id
    LEFT JOIN cusp_audit.fake_data.addresses a ON rp.provider_address_uid = a.provider_address_uid
    WHERE 1=1`;

  if (isFlagged !== null && isFlagged !== false) {
    sqlQuery.append(SQL` AND pi.is_flagged = :isFlagged`);
  }
  // get records that have not been flagged prior, then unflagged
  if (isFlagged === false) {
    sqlQuery.append(SQL` AND (pi.is_flagged IS NULL OR pi.is_flagged = :isFlagged)`);
  }

  if (cities.length > 0) {
    sqlQuery.append(SQL` AND ARRAY_CONTAINS(TRANSFORM(SPLIT(:cities, ','), s -> TRIM(s)), a.city)`);
  }

  // ---- append filter to the sqlQuery above this line ----
  sqlQuery.append(SQL` ORDER BY c.overall_risk_score DESC, c.provider_licensing_id`);
  // offset is set to change by 200 each time from FE
  sqlQuery.append(SQL` limit 200 offset :offset`);

  const namedParameters = {
    year,
    offset: parseOffsetParam(offset),
    ...(isFlagged !== null ? { isFlagged } : {}),
    ...(cities.length > 0 ? { cities: cities.join(",") } : {}),
  };
  
  return { text: sqlQuery.text, namedParameters };
}



