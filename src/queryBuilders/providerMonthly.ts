import SQL from "sql-template-strings";

type BuildProviderMonthlyQueryParams = {
  isFlagged: boolean | null;
  month: string;
  offset: string;
  cities: string[];
};

export function checkedFilter(filterOptions: { flagged: boolean, unflagged: boolean }): boolean | null {
  if (filterOptions.flagged && !filterOptions.unflagged)
    return true;
  if (!filterOptions.flagged && filterOptions.unflagged)
    return false;
  return null;
}

export function parseMonthParam(monthParam: string) {
  // Expect format YYYY-MM
  const regex = /^\d{4}-(?:0[1-9]|1[0-2])$/;
  if (!regex.test(monthParam)) {
    throw new Error("Invalid month format, expected YYYY-MM");
  }
  return `${monthParam}-01`;
}

export function parseOffsetParam(offsetParam: string): number {
  if (typeof offsetParam === "string") {
    const parsed = Number.parseInt(offsetParam, 10);
    return Number.isNaN(parsed) || parsed < 0 ? 0 : parsed;
  }
  return 0;
}

export function buildProviderMonthlyQuery({ month, offset, isFlagged, cities }: BuildProviderMonthlyQueryParams) {
  const query = SQL`
  SELECT rp.provider_licensing_id,
  rp.provider_name,
  dates.StartOfMonth,
  boc.billed_over_capacity_flag,
  poc.placed_over_capacity_flag,
  sa.same_address_flag,
  dt.distance_traveled_flag,
  pi.is_flagged,
  pi.comment,
  a.postal_address,
  a.city,
  a.zip
  FROM (
      SELECT provider_licensing_id, StartOfMonth from cusp_audit.demo.monthly_billed_over_capacity WHERE StartOfMonth = :month
      UNION
      SELECT provider_licensing_id, StartOfMonth from cusp_audit.demo.monthly_placed_over_capacity WHERE StartOfMonth = :month
      UNION
      SELECT provider_licensing_id, StartOfMonth from cusp_audit.demo.monthly_providers_with_same_address WHERE StartOfMonth = :month
      UNION
      SELECT provider_licensing_id, StartOfMonth from cusp_audit.demo.monthly_distance_traveled WHERE StartOfMonth = :month
  ) AS dates
  JOIN cusp_audit.demo.risk_providers rp ON rp.provider_licensing_id = dates.provider_licensing_id
  LEFT JOIN cusp_audit.demo.monthly_billed_over_capacity boc ON boc.provider_licensing_id = dates.provider_licensing_id AND boc.StartOfMonth = dates.StartOfMonth
  LEFT JOIN cusp_audit.demo.monthly_placed_over_capacity poc ON poc.provider_licensing_id = dates.provider_licensing_id AND  poc.StartOfMonth = dates.StartOfMonth
  LEFT JOIN cusp_audit.demo.monthly_providers_with_same_address sa ON sa.provider_licensing_id = dates.provider_licensing_id AND sa.StartOfMonth = dates.StartOfMonth
  LEFT JOIN cusp_audit.demo.monthly_distance_traveled dt ON dt.provider_licensing_id = dates.provider_licensing_id AND dt.StartOfMonth = dates.StartOfMonth
  LEFT JOIN cusp_audit.demo.provider_insights pi ON rp.provider_licensing_id = pi.provider_licensing_id
  LEFT JOIN cusp_audit.fake_data.addresses a ON rp.provider_address_uid = a.provider_address_uid
  WHERE 1=1`;

  if (isFlagged !== null && isFlagged !== false) {
    query.append(SQL` AND pi.is_flagged = :isFlagged`);
  }
  // get records that have not been flagged prior, then unflagged
  if (isFlagged === false) {
    query.append(SQL` AND (pi.is_flagged IS NULL OR pi.is_flagged = :isFlagged)`);
  }

  if (cities.length > 0) {
    query.append(SQL` AND ARRAY_CONTAINS(TRANSFORM(SPLIT(:cities, ','), s -> TRIM(s)), a.city)`)
  }

  // ---- append filter to the query above this line ----
  query.append(SQL` ORDER BY dates.StartOfMonth DESC`);
  // offset is set to change by 200 each time from FE
  query.append(SQL` limit 200 offset :offset`);

  const namedParameters = {
    month: parseMonthParam(month),
    offset: parseOffsetParam(offset),
    ...(isFlagged !== null ? { isFlagged } : {}),
    ...(cities.length > 0 ? { cities: cities.join(",") } : {})
  };

  return { text: query.text, namedParameters };
}
