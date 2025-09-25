import type express from "express";

import SQL from "sql-template-strings";

import { buildProviderMonthlyQuery, checkedFilter } from "../queryBuilders/providerMonthly.js";
import { queryData } from "../services/queryService.js";

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

export type UiAnnualProviderData = {
    provider_licensing_id: string;
    provider_name: string;
    total_billed_over_capacity: number;
    total_placed_over_capacity: number;
    total_distance_traveled: number;
    total_same_address: number;
    overall_risk_score: number;
}

//  TODO - clean up
// @desc    Get provider overview data - overview data that will be displayed in FE dashboard cards
// @route   put /api/v1/providerData/overview
// @access  Private
export async function getProviderCount(req: express.Request, res: express.Response) {
  console.log('HIT getProviderOverviewData')

  const sqlQuery = `
    SELECT COUNT(DISTINCT provider_uid) AS unique_provider_count
    FROM cusp_audit.demo.risk_providers ;
  `;

   try {
    const data = await queryData(sqlQuery);
    console.log('data', data)
    res.json(data[0]);
  }
  catch (err: any) {
    // console.log("err =======", err);
    res.status(500).json({ error: err.message });
  }

}

//  TODO - clean up
// @desc    Get provider overview data - overview data that will be displayed in FE dashboard cards
// @route   put /api/v1/providerData/overview
// @access  Private
export async function getFlaggedCount(req: express.Request, res: express.Response) {
  console.log('HIT getFlaggedCount')

  const sqlQuery = `
    SELECT COUNT(DISTINCT provider_uid) AS unique_provider_count
    FROM cusp_audit.demo.risk_providers ;
  `;

   try {
    const data = await queryData(sqlQuery);
    console.log('data', data)
    res.json(data[0]);
  }
  catch (err: any) {
    // console.log("err =======", err);
    res.status(500).json({ error: err.message });
  }

}



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
    VALUES (source.provider_licensing_id, source.is_flagged, source.comment);`;

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

export async function getProviderAnnualData(req: express.Request, res: express.Response) {
  console.log("HIT IT HERE");
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
       const rawData = await queryData(sqlQuery);
      const result: UiAnnualProviderData[] = rawData.map((item) => {

      return {
        provider_licensing_id: item.provider_licensing_id,
        provider_name: item.provider_name ? item.provider_name : "--",
        total_billed_over_capacity: item.total_billed_over_capacity || 0,
        total_placed_over_capacity: item.total_placed_over_capacity || 0,
        total_distance_traveled: item.total_distance_traveled || 0,
        total_same_address: item.total_same_address || 0,
        overall_risk_score: item.overall_risk_score || 0
        // flagged: item?.is_flagged || false,
        // comment: item?.comment || "",
        // postalAddress: item.postal_address || "--",
        // city: item.city || "--",
        // zip: item.zip || "--",
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
    iLikeCity: `%${req.query.cityName || ""}%`,
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

  try {
    const rawData = await queryData(sql.text, namedParameters);
    res.json(rawData.sort(({ city: cityA }, { city: cityB }) => cityA.localeCompare(cityB)).reduce((acc, curr) => {
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
    const rawData: MonthlyProviderData[] = await queryData(text, namedParameters);
    // add overall risk score
    const riskScoreKeys = ["billed_over_capacity_flag", "placed_over_capacity_flag", "same_address_flag", "distance_traveled_flag"] as const;
    const result: UiMonthlyProviderData[] = rawData.map((item) => {
      const overallRiskScore = riskScoreKeys.reduce((sum, key) => sum + (item[key] ? 1 : 0), 0);

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
