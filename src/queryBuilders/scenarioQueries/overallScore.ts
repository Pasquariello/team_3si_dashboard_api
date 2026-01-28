  import SQL from "sql-template-strings";
  
  type BuildOverallScoreParams = {
    provider_licensing_id: string;
  };
  
  export function buildOverallScoreQuery({ provider_licensing_id }: BuildOverallScoreParams) {
    const plid = String(provider_licensing_id)
    const query= SQL`
      SELECT
        dates.startOfMonth,
        dates.over_billed_capacity,
        dates.over_placement_capacity,
        dates.same_address_flag,
        dates.distance_traveled_flag,
        (
            coalesce(dates.over_billed_capacity::int, 0) +
            coalesce(dates.over_placement_capacity::int, 0) +
            coalesce(dates.same_address_flag::int, 0) +
            coalesce(dates.distance_traveled_flag::int, 0)
        ) as total
      FROM (
          SELECT 
            StartOfMonth,
            over_billed_capacity,
            over_placement_capacity,
            same_address_flag,
            distance_traveled_flag,
            provider_licensing_id
          FROM cusp_audit.demo.risk_scores
          WHERE provider_licensing_id = :plid
      ) as dates
      JOIN cusp_audit.demo.risk_providers rp ON rp.provider_licensing_id = dates.provider_licensing_id
      LEFT JOIN cusp_audit.demo.provider_insights pi ON rp.provider_licensing_id = pi.provider_licensing_id
      LEFT JOIN cusp_audit.fake_data.addresses a ON rp.provider_address_uid = a.provider_address_uid
      ORDER BY startOfMonth;
    `;
  
    const namedParameters = {
      plid,
    };
  
    return { text: query.text, namedParameters };
  }
  
  
  
  
  
  
  
  