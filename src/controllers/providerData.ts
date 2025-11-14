import type express from "express";

import SQL from "sql-template-strings";

import { buildProviderDetailsQuery } from "../queryBuilders/providerDetails.js";
import { buildProviderMonthlyQuery, checkedFilter } from "../queryBuilders/providerMonthly.js";
import { buildProviderYearlyQuery } from "../queryBuilders/providerYearly.js";
import { queryData } from "../services/queryService.js";

export type MonthlyProviderData = {
  provider_licensing_id: string;
  provider_name: string;
  StartOfMonth: string; // ISO DateString
  over_billed_capacity: boolean;
  over_placement_capacity: number;
  same_address_flag: number;
  distance_traveled_flag: number;
  total: number;
  is_flagged: boolean;
  comment: string;
  postal_address: string;
  city: string;
  zip: string;
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
  postalAddress: string;
  city: string;
  zip: string;
};

export type AnnualProviderData = {
  provider_licensing_id: string;
  provider_name: string;
  StartOfMonth: string; // ISO DateString
  total_billed_over_capacity: number;
  total_placed_over_capacity: number;
  total_same_address: number;
  total_distance_traveled: number;
  overall_risk_score: number;
  is_flagged: boolean;
  comment: string;
  postal_address: string;
  city: string;
  zip: string;
};

export type UiAnnualProviderData = {
  providerLicensingId: string;
  providerName: string;
  childrenBilledOverCapacity: number;
  childrenPlacedOverCapacity: number;
  distanceTraveled: number;
  overallRiskScore: number;
  providersWithSameAddress: number;
  flagged: boolean;
  comment: string;
  postalAddress: string;
  city: string;
  zip: string;
};

export type ProviderDetailsData = {
  provider_licensing_id: string;
  provider_name: string;
  postal_address: string;
  city: string;
  zip: string;
  provider_status: string;
  provider_type: string;
  provider_email: string;
  provider_phone: string
}

export type UiProviderDetailsData = {
  providerLicensingId: string;
  providerName: string;
  postalAddress: string;
  city: string;
  zip: string;
  providerStatus: string;
  providerType: string;
  providerEmail: string;
  providerPhone: string
}

export async function exportProviderDataMonthly(req: express.Request, res: express.Response) {
  const month = req.params.month;
  const offset = req.query.offset || "0";
  const isFlagged = req.query.flagStatus === "true";
  const isUnflagged = req.query.flagStatus === "false";

  const cities: string[] = Array.isArray(req.query.cities)
    ? req.query.cities.map(String)
    : req.query.cities
      ? [String(req.query.cities)]
      : [];

  // we need to extract the values for city from the req.query then pass them to the build function
  // update the build function to include the multi value where clause
  const flagged = checkedFilter({ flagged: isFlagged, unflagged: isUnflagged });
  // TODO: 
  const { text, namedParameters } = buildProviderMonthlyQuery({ offset: String(offset), month, isFlagged: flagged, cities });

  try {
    // const rawData: MonthlyProviderData[] = await queryData(text, namedParameters);
    const rawData = await queryData(text, namedParameters);
    const result = rawData.map((item: any) => {
      return {
        // TODO - fix data types
        provider_licensing_id: item.provider_licensing_id,
        provider_name: item.provider_name,
        total_billed_over_capacity: item.over_billed_capacity ? "Yes" : "--",
        total_placed_over_capacity: item.over_placement_capacity ? "Yes" : "--",
        total_distance_traveled: item.distance_traveled_flag ? "Yes" : "--",
        total_same_address: item.same_address_flag ? "Yes" : "--",
        overall_risk_score: item.total || 0,
        // flagged: item?.is_flagged || false,
        // comment: item?.comment || "",
        // postalAddress: item.postal_address || "--",
        // city: item.city || "--",
        // zip: item.zip || "--",
      };
    });
     const headers = [
      "provider_licensing_id",
      "provider_name",
      "total_billed_over_capacity",
      "total_placed_over_capacity",
      "total_distance_traveled",
      "total_same_address",
      "overall_risk_score",
    ];

    const escape = (val: any) => {
      if (val === null || val === undefined)
        return "";
      const str = String(val);
      return /[",\n]/.test(str) ? `"${str.replace(/"/g, "\"\"")}"` : str;
    };

    const csvRows = [
      headers.join(","), // header row
      ...result.map(row =>
        headers.map(h => escape((row as any)[h])).join(","),
      ),
    ];

    const csv = csvRows.join("\n");

    // Set headers for download
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="providers_${month}.csv"`);

    res.send(csv);
  }
  catch (err: any) {
    res.status(500).json({ error: err.message });
  }


}
//  TODO - clean up
// @desc    Get provider overview data - overview data that will be displayed in FE dashboard cards
// @route   put /api/v1/providerData/overview
// @access  Private
export async function exportProviderDataYearly(req: express.Request, res: express.Response) {
  const yearNum = Number.parseInt(req.params.year, 10);
  if (Number.isNaN(yearNum) || yearNum < 1980 || yearNum > 2100) {
    return res.status(400).json({ error: "Invalid year parameter" });
  }

  const offset = req.query.offset || "0";
  const isFlagged = req.query.flagStatus === "true";
  const isUnflagged = req.query.flagStatus === "false";
  const flagged = checkedFilter({ flagged: isFlagged, unflagged: isUnflagged });

  const cities: string[] = Array.isArray(req.query.cities)
    ? req.query.cities.map(String)
    : req.query.cities
      ? [String(req.query.cities)]
      : [];

  const { text, namedParameters } = buildProviderYearlyQuery({ offset: String(offset), year: String(yearNum), isFlagged: flagged, cities });

  
  try {
    const rawData = await queryData(text, namedParameters);
    const result: Partial<AnnualProviderData>[] = rawData.map((item: any) => {
      // TODO - fix data types
      return {
        provider_licensing_id: item.provider_licensing_id,
        provider_name: item.provider_name ? item.provider_name : "--",
        total_billed_over_capacity: item.total_billed_over_capacity || 0,
        total_placed_over_capacity: item.total_placed_over_capacity || 0,
        total_distance_traveled: item.total_distance_traveled || 0,
        total_same_address: item.total_same_address || 0,
        overall_risk_score: item.overall_risk_score || 0,
        // flagged: item?.is_flagged || false,
        // comment: item?.comment || "",
        // postalAddress: item.postal_address || "--",
        // city: item.city || "--",
        // zip: item.zip || "--",
      };
    });

    // console.log("REESULT", result)
    // res.json(result);

    // Build CSV manually
    const headers = [
      "provider_licensing_id",
      "provider_name",
      "total_billed_over_capacity",
      "total_placed_over_capacity",
      "total_distance_traveled",
      "total_same_address",
      "overall_risk_score",
    ];

    const escape = (val: any) => {
      if (val === null || val === undefined)
        return "";
      const str = String(val);
      return /[",\n]/.test(str) ? `"${str.replace(/"/g, "\"\"")}"` : str;
    };

    const csvRows = [
      headers.join(","), // header row
      ...result.map(row =>
        headers.map(h => escape((row as any)[h])).join(","),
      ),
    ];

    const csv = csvRows.join("\n");

    // Set headers for download
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="providers_${yearNum}.csv"`);

    res.send(csv);
  }
  catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

//  TODO - clean up
// @desc    Get provider overview data - overview data that will be displayed in FE dashboard cards
// @route   put /api/v1/providerData/overview
// @access  Private
export async function getProviderCount(req: express.Request, res: express.Response) {
  const yearNum = Number.parseInt(req.params.year, 10);

  const sqlQuery = `
    SELECT COUNT(DISTINCT provider_licensing_id) AS unique_provider_count
    FROM cusp_audit.demo.risk_scores
    WHERE YEAR(CAST(StartOfMonth AS DATE)) = ${yearNum}
  `;

  try {
    const data = await queryData(sqlQuery);
    res.json(data[0]);
  }
  catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

//  TODO - clean up
// @desc    Get provider overview data - overview data that will be displayed in FE dashboard cards
// @route   put /api/v1/providerData/overview
// @access  Private
export async function getHighestRiskScore(req: express.Request, res: express.Response) {
  const year1 = Number.parseInt(req.params.year, 10);
  const year2 = year1 - 1;
  // const sqlQuery = `
  //   WITH combined AS (
  //     SELECT
  //       COALESCE(b.provider_licensing_id, p.provider_licensing_id, d.provider_licensing_id, s.provider_licensing_id) AS provider_licensing_id,
  //       COALESCE(b.total_billed_over_capacity, 0) AS total_billed_over_capacity,
  //       COALESCE(p.total_placed_over_capacity, 0) AS total_placed_over_capacity,
  //       COALESCE(d.total_distance_traveled, 0) AS total_distance_traveled,
  //       COALESCE(s.total_same_address, 0) AS total_same_address
  //     FROM (
  //       SELECT provider_licensing_id,
  //         SUM(CASE WHEN billed_over_capacity_flag THEN 1 ELSE 0 END) AS total_billed_over_capacity    
  //       FROM cusp_audit.demo.monthly_billed_over_capacity
  //       WHERE YEAR(CAST(StartOfMonth AS DATE)) = ${yearNum}
  //       GROUP BY provider_licensing_id
  //     ) b
  //     FULL OUTER JOIN (
  //       SELECT provider_licensing_id, 
  //         SUM(CASE WHEN placed_over_capacity_flag THEN 1 ELSE 0 END) AS total_placed_over_capacity    
  //       FROM cusp_audit.demo.monthly_placed_over_capacity
  //       WHERE YEAR(CAST(StartOfMonth AS DATE)) = ${yearNum}
  //       GROUP BY provider_licensing_id
  //     ) p
  //       ON b.provider_licensing_id = p.provider_licensing_id
  //     FULL OUTER JOIN (
  //       SELECT provider_licensing_id, 
  //         SUM(CASE WHEN distance_traveled_flag THEN 1 ELSE 0 END) AS total_distance_traveled   
  //       FROM cusp_audit.demo.monthly_distance_traveled
  //       WHERE YEAR(CAST(StartOfMonth AS DATE)) = ${yearNum}
  //       GROUP BY provider_licensing_id
  //     ) d
  //       ON COALESCE(b.provider_licensing_id, p.provider_licensing_id) = d.provider_licensing_id
  //     FULL OUTER JOIN (
  //       SELECT provider_licensing_id, 
  //         SUM(CASE WHEN same_address_flag THEN 1 ELSE 0 END) AS total_same_address      
  //       FROM cusp_audit.demo.monthly_providers_with_same_address
  //       WHERE YEAR(CAST(StartOfMonth AS DATE)) = ${yearNum}
  //       GROUP BY provider_licensing_id
  //     ) s
  //       ON COALESCE(b.provider_licensing_id, p.provider_licensing_id, d.provider_licensing_id) = s.provider_licensing_id
  //   ),
  //   unpivoted AS (
  //     SELECT 'total_billed_over_capacity' AS metric, SUM(total_billed_over_capacity) AS total_value FROM combined
  //     UNION ALL
  //     SELECT 'total_placed_over_capacity', SUM(total_placed_over_capacity) FROM combined
  //     UNION ALL
  //     SELECT 'total_distance_traveled', SUM(total_distance_traveled) FROM combined
  //     UNION ALL
  //     SELECT 'total_same_address', SUM(total_same_address) FROM combined
  //   )
  //   SELECT metric, total_value
  //   FROM unpivoted
  //   ORDER BY total_value DESC
  //   LIMIT 1;
  // `;

const sqlQuery = `
  WITH combined AS (
    -- Year 1
    SELECT
      COALESCE(b.provider_licensing_id, p.provider_licensing_id, d.provider_licensing_id, s.provider_licensing_id) AS provider_licensing_id,
      COALESCE(b.total_billed_over_capacity, 0) AS total_billed_over_capacity,
      COALESCE(p.total_placed_over_capacity, 0) AS total_placed_over_capacity,
      COALESCE(d.total_distance_traveled, 0) AS total_distance_traveled,
      COALESCE(s.total_same_address, 0) AS total_same_address,
      ${year1} AS year
    FROM (
      SELECT provider_licensing_id,
        SUM(CASE WHEN billed_over_capacity_flag THEN 1 ELSE 0 END) AS total_billed_over_capacity    
      FROM cusp_audit.demo.monthly_billed_over_capacity
      WHERE YEAR(CAST(StartOfMonth AS DATE)) = ${year1}
      GROUP BY provider_licensing_id
    ) b
    FULL OUTER JOIN (
      SELECT provider_licensing_id, 
        SUM(CASE WHEN placed_over_capacity_flag THEN 1 ELSE 0 END) AS total_placed_over_capacity    
      FROM cusp_audit.demo.monthly_placed_over_capacity
      WHERE YEAR(CAST(StartOfMonth AS DATE)) = ${year1}
      GROUP BY provider_licensing_id
    ) p
      ON b.provider_licensing_id = p.provider_licensing_id
    FULL OUTER JOIN (
      SELECT provider_licensing_id, 
        SUM(CASE WHEN distance_traveled_flag THEN 1 ELSE 0 END) AS total_distance_traveled   
      FROM cusp_audit.demo.monthly_distance_traveled
      WHERE YEAR(CAST(StartOfMonth AS DATE)) = ${year1}
      GROUP BY provider_licensing_id
    ) d
      ON COALESCE(b.provider_licensing_id, p.provider_licensing_id) = d.provider_licensing_id
    FULL OUTER JOIN (
      SELECT provider_licensing_id, 
        SUM(CASE WHEN same_address_flag THEN 1 ELSE 0 END) AS total_same_address      
      FROM cusp_audit.demo.monthly_providers_with_same_address
      WHERE YEAR(CAST(StartOfMonth AS DATE)) = ${year1}
      GROUP BY provider_licensing_id
    ) s
      ON COALESCE(b.provider_licensing_id, p.provider_licensing_id, d.provider_licensing_id) = s.provider_licensing_id

    UNION ALL

    -- Year 2
    SELECT
      COALESCE(b.provider_licensing_id, p.provider_licensing_id, d.provider_licensing_id, s.provider_licensing_id) AS provider_licensing_id,
      COALESCE(b.total_billed_over_capacity, 0) AS total_billed_over_capacity,
      COALESCE(p.total_placed_over_capacity, 0) AS total_placed_over_capacity,
      COALESCE(d.total_distance_traveled, 0) AS total_distance_traveled,
      COALESCE(s.total_same_address, 0) AS total_same_address,
      ${year2} AS year
    FROM (
      SELECT provider_licensing_id,
        SUM(CASE WHEN billed_over_capacity_flag THEN 1 ELSE 0 END) AS total_billed_over_capacity    
      FROM cusp_audit.demo.monthly_billed_over_capacity
      WHERE YEAR(CAST(StartOfMonth AS DATE)) = ${year2}
      GROUP BY provider_licensing_id
    ) b
    FULL OUTER JOIN (
      SELECT provider_licensing_id, 
        SUM(CASE WHEN placed_over_capacity_flag THEN 1 ELSE 0 END) AS total_placed_over_capacity    
      FROM cusp_audit.demo.monthly_placed_over_capacity
      WHERE YEAR(CAST(StartOfMonth AS DATE)) = ${year2}
      GROUP BY provider_licensing_id
    ) p
      ON b.provider_licensing_id = p.provider_licensing_id
    FULL OUTER JOIN (
      SELECT provider_licensing_id, 
        SUM(CASE WHEN distance_traveled_flag THEN 1 ELSE 0 END) AS total_distance_traveled   
      FROM cusp_audit.demo.monthly_distance_traveled
      WHERE YEAR(CAST(StartOfMonth AS DATE)) = ${year2}
      GROUP BY provider_licensing_id
    ) d
      ON COALESCE(b.provider_licensing_id, p.provider_licensing_id) = d.provider_licensing_id
    FULL OUTER JOIN (
      SELECT provider_licensing_id, 
        SUM(CASE WHEN same_address_flag THEN 1 ELSE 0 END) AS total_same_address      
      FROM cusp_audit.demo.monthly_providers_with_same_address
      WHERE YEAR(CAST(StartOfMonth AS DATE)) = ${year2}
      GROUP BY provider_licensing_id
    ) s
      ON COALESCE(b.provider_licensing_id, p.provider_licensing_id, d.provider_licensing_id) = s.provider_licensing_id
  ),

  -- Aggregate each metric per year
  unpivoted AS (
    SELECT year, 'total_billed_over_capacity' AS metric, SUM(total_billed_over_capacity) AS total_value FROM combined GROUP BY year
    UNION ALL
    SELECT year, 'total_placed_over_capacity', SUM(total_placed_over_capacity) FROM combined GROUP BY year
    UNION ALL
    SELECT year, 'total_distance_traveled', SUM(total_distance_traveled) FROM combined GROUP BY year
    UNION ALL
    SELECT year, 'total_same_address', SUM(total_same_address) FROM combined GROUP BY year
  )

  -- Rank the metrics and return all top ties
  SELECT year, metric, total_value
  FROM (
    SELECT
      year,
      metric,
      total_value,
      RANK() OVER (PARTITION BY year ORDER BY total_value DESC) AS rnk
    FROM unpivoted
  ) ranked
  WHERE rnk = 1
  ORDER BY year, metric;
`;



  try {

    const data = await queryData(sqlQuery);
    // console.log("highRiskScore data ====", data);
    res.json(data);
  }
  catch (err: any) {
    console.log("err =======", err);
    res.status(500).json({ error: err.message });
  }
}

//  TODO - clean up
// @desc    Get provider overview data - overview data that will be displayed in FE dashboard cards
// @route   put /api/v1/providerData/overview
// @access  Private
export async function getProvidersWithHighRiskCount(req: express.Request, res: express.Response) {
  const yearNum = Number.parseInt(req.params.year, 10);
  if (Number.isNaN(yearNum) || yearNum < 1980 || yearNum > 2100) {
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
    SELECT COUNT(*) AS count_over_44
    FROM combined
    WHERE overall_risk_score > 44;
  `;

  try {
    const data = await queryData(sqlQuery);
    console.log("providers count with high riskscore DATA----", data)
    res.json(data[0]);
  }
  catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

//  TODO - clean up
// @desc    Get provider overview data - overview data that will be displayed in FE dashboard cards
// @route   put /api/v1/providerData/overview
// @access  Private
export async function getFlaggedCount(req: express.Request, res: express.Response) {
  // const yearNum = Number.parseInt(req.params.year, 10);

  const sqlQuery = `
    SELECT COUNT(DISTINCT provider_uid) AS flagged_provider_count
    FROM cusp_audit.demo.risk_providers a WHERE EXISTS (
      SELECT 1 FROM cusp_audit.demo.provider_insights b WHERE b.provider_licensing_id = a.provider_licensing_id AND b.is_flagged = 'true'
    )
  `;

  try {
    const data = await queryData(sqlQuery);
    res.json(data[0]);
  }
  catch (err: any) {
    // console.log("err =======", err);
    res.status(500).json({ error: err.message });
  }
}


export async function getProviderAnnualData(req: express.Request, res: express.Response) {
  const yearNum = Number.parseInt(req.params.year, 10);

  const offset = req.query.offset || "0";
  const isFlagged = req.query.flagStatus === "true";
  const isUnflagged = req.query.flagStatus === "false";
  const flagged = checkedFilter({ flagged: isFlagged, unflagged: isUnflagged });

  const cities: string[] = Array.isArray(req.query.cities)
    ? req.query.cities.map(String)
    : req.query.cities
      ? [String(req.query.cities)]
      : [];

  const { text, namedParameters } = buildProviderYearlyQuery({ offset: String(offset), year: String(yearNum), isFlagged: flagged, cities });

  if (Number.isNaN(yearNum) || yearNum < 1980 || yearNum > 2100) {
    return res.status(400).json({ error: "Invalid year parameter" });
  }

  try {
    const rawData = await queryData(text, namedParameters) as AnnualProviderData[];
    const result: UiAnnualProviderData[] = rawData.map((item) => {
      return {
        providerLicensingId: item?.provider_licensing_id,
        providerName: item?.provider_name ? item.provider_name : "--",
        childrenBilledOverCapacity: item?.total_billed_over_capacity || 0,
        childrenPlacedOverCapacity: item?.total_placed_over_capacity || 0,
        distanceTraveled: item?.total_distance_traveled || 0,
        providersWithSameAddress: item?.total_same_address || 0,
        overallRiskScore: item?.overall_risk_score || 0,
        flagged: item?.is_flagged || false,
        comment: item?.comment || "",
        postalAddress: item?.postal_address || "--",
        city: item?.city || "--",
        zip: item?.zip || "--",
      };
    });

    res.json(result);
  }
  catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}
// TODO: add Index on city then add SORT BY then remove JS sort here
export async function getProviderCities(req: express.Request, res: express.Response) {
  const namedParameters = {
    iLikeCity: `%${req.params.cityName || ""}%`,
  };

  const sql = SQL`SELECT DISTINCT city
  FROM
  cusp_audit.fake_data.addresses
  WHERE 1=1
  `;
  if (req.query.cityName) {
    sql.append(SQL` AND city ILIKE :iLikeCity`);
  }

  sql.append(SQL` LIMIT 100`);

// TODO - I think this can be simplified into this 
// try {
//   interface CityRecord {
//     city: string;
//     [key: string]: unknown;
//   }

//   const rawData = await queryData<CityRecord[]>(sql.text, namedParameters);

//   const sortedCities = rawData
//     .filter((item): item is CityRecord => typeof item.city === 'string')
//     .sort((a, b) => a.city.localeCompare(b.city))
//     .map(item => item.city);

//   res.json(sortedCities);
// } catch (err) {
//   console.error(err);
//   res.status(500).json({ error: 'Failed to fetch data' });
// }
  try {
    // const rawData = await queryData(sql.text, namedParameters);
    const rawData = (await queryData(sql.text, namedParameters)) as { city: string }[];
    res.json(rawData.sort(({ city: cityA }, { city: cityB }) => cityA.localeCompare(cityB)).reduce<string[]>((acc, curr) => {
      acc.push(curr.city);
      return acc;
    }, []));
  }
  catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

export async function getProviderMonthData(req: express.Request, res: express.Response) {
  // TODO: verify this here
  const month = req.params.month;
  const offset = req.query.offset || "0";
  const isFlagged = req.query.flagStatus === "true";
  const isUnflagged = req.query.flagStatus === "false";

  const cities: string[] = Array.isArray(req.query.cities)
    ? req.query.cities.map(String)
    : req.query.cities
      ? [String(req.query.cities)]
      : [];

  // we need to extract the values for city from the req.query then pass them to the build function
  // update the build function to include the multi value where clause
  const flagged = checkedFilter({ flagged: isFlagged, unflagged: isUnflagged });

  const { text, namedParameters } = buildProviderMonthlyQuery({ offset: String(offset), month, isFlagged: flagged, cities });

  try {
    const rawData = await queryData(text, namedParameters) as MonthlyProviderData[];
    const result: UiMonthlyProviderData[] = rawData.map((item) => {
      // TODO Taylor / Justin - update types
      return {
        providerLicensingId: item.provider_licensing_id,
        startOfMonth: item.StartOfMonth,
        providerName: item.provider_name,
        childrenBilledOverCapacity: item.over_billed_capacity ? "Yes" : "--",
        childrenPlacedOverCapacity: item.over_placement_capacity ? "Yes" : "--",
        distanceTraveled: item.distance_traveled_flag ? "Yes" : "--",
        providersWithSameAddress: item.same_address_flag ? "Yes" : "--",
        overallRiskScore: item.total || 0,
        flagged: item?.is_flagged || false,
        comment: item?.comment || "",
        postalAddress: item.postal_address || "--",
        city: item.city || "--",
        zip: item.zip || "--",
      };
    });
    res.json(result);
  }
  catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

export async function getProviderDetails(req: express.Request, res: express.Response) {
  const provider_licensing_id = req.params.providerId;
  const { text, namedParameters } = buildProviderDetailsQuery({ provider_licensing_id });

  try {
    const rawData = await queryData(text, namedParameters) as ProviderDetailsData[]
    const result: UiProviderDetailsData[] = rawData.map((item) => {
      return {
        providerLicensingId: item.provider_licensing_id,
        providerName: item.provider_name,
        postalAddress: item.postal_address || "--",
        city: item.city || "--",
        zip: item.zip || "--",
        providerPhone: item.provider_phone || "--",
        providerEmail: item.provider_email || "--",
        providerStatus: item.provider_status || "--",
        providerType: item.provider_type || "--"
      };
    });
    res.json(result[0]);
  }
  catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

// async function getProviderAnnualDataUtility(yearNum: number) {
//   if (Number.isNaN(yearNum) || yearNum < 1980 || yearNum > 2100) {
//     // return res.status(400).json({ error: "Invalid year parameter" });
//   }

//   const sqlQuery = `
//     WITH combined AS (
//       SELECT
//         COALESCE(b.provider_licensing_id, p.provider_licensing_id, d.provider_licensing_id, s.provider_licensing_id) AS provider_licensing_id,
//         COALESCE(b.total_billed_over_capacity, 0) AS total_billed_over_capacity,
//         COALESCE(p.total_placed_over_capacity, 0) AS total_placed_over_capacity,
//         COALESCE(d.total_distance_traveled, 0) AS total_distance_traveled,
//         COALESCE(s.total_same_address, 0) AS total_same_address,

//         COALESCE(b.total_billed_over_capacity, 0) +
//         COALESCE(p.total_placed_over_capacity, 0) +
//         COALESCE(d.total_distance_traveled, 0) +
//         COALESCE(s.total_same_address, 0) AS overall_risk_score
//       FROM (
//         SELECT provider_licensing_id,
//           SUM(CASE WHEN billed_over_capacity_flag THEN 1 ELSE 0 END) AS total_billed_over_capacity
//         FROM cusp_audit.demo.monthly_billed_over_capacity
//         WHERE YEAR(CAST(StartOfMonth AS DATE)) = ${yearNum}
//         GROUP BY provider_licensing_id
//       ) b
//       FULL OUTER JOIN (
//         SELECT provider_licensing_id,
//           SUM(CASE WHEN placed_over_capacity_flag THEN 1 ELSE 0 END) AS total_placed_over_capacity
//         FROM cusp_audit.demo.monthly_placed_over_capacity
//         WHERE YEAR(CAST(StartOfMonth AS DATE)) = ${yearNum}
//         GROUP BY provider_licensing_id
//       ) p
//         ON b.provider_licensing_id = p.provider_licensing_id
//       FULL OUTER JOIN (
//         SELECT provider_licensing_id,
//           SUM(CASE WHEN distance_traveled_flag THEN 1 ELSE 0 END) AS total_distance_traveled
//         FROM cusp_audit.demo.monthly_distance_traveled
//         WHERE YEAR(CAST(StartOfMonth AS DATE)) = ${yearNum}
//         GROUP BY provider_licensing_id
//       ) d
//         ON COALESCE(b.provider_licensing_id, p.provider_licensing_id) = d.provider_licensing_id
//       FULL OUTER JOIN (
//         SELECT provider_licensing_id,
//           SUM(CASE WHEN same_address_flag THEN 1 ELSE 0 END) AS total_same_address
//         FROM cusp_audit.demo.monthly_providers_with_same_address
//         WHERE YEAR(CAST(StartOfMonth AS DATE)) = ${yearNum}
//         GROUP BY provider_licensing_id
//       ) s
//         ON COALESCE(b.provider_licensing_id, p.provider_licensing_id, d.provider_licensing_id) = s.provider_licensing_id
//     )
//     SELECT
//       c.provider_licensing_id,
//       pa.provider_name,
//       c.total_billed_over_capacity,
//       c.total_placed_over_capacity,
//       c.total_distance_traveled,
//       c.total_same_address,
//       c.overall_risk_score
//     FROM combined c
//     LEFT JOIN cusp_audit.demo.provider_attributes pa
//       ON c.provider_licensing_id = pa.provider_licensing_id
//     ORDER BY c.provider_licensing_id;
//   `;

//   try {
//     const rawData = await queryData(sqlQuery);
//     const result: UiAnnualProviderData[] = rawData.map((item) => {
//       return {
//         provider_licensing_id: item.provider_licensing_id,
//         provider_name: item.provider_name ? item.provider_name : "--",
//         total_billed_over_capacity: item.total_billed_over_capacity || 0,
//         total_placed_over_capacity: item.total_placed_over_capacity || 0,
//         total_distance_traveled: item.total_distance_traveled || 0,
//         total_same_address: item.total_same_address || 0,
//         overall_risk_score: item.overall_risk_score || 0,
//       };
//     });
//   }
//   catch (err: any) {
//     // res.status(500).json({ error: err.message });
//   }
// }