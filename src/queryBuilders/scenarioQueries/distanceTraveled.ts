import SQL from "sql-template-strings";

type BuildScenarioDistanceTraveledQuery = {
  provider_licensing_id: string;
};

export function buildScenarioDistancTraveledQuery({ provider_licensing_id }: BuildScenarioDistanceTraveledQuery) {
  const plid = String(provider_licensing_id);
  const query = SQL`
    SELECT
      m.StartOfMonth,
      m.family_count,
      m.average_distance_miles,
      m.distance_traveled_flag,
      collect_list(
        named_struct(
          'StartOfMonth', d.placement_week,
          'family_count', d.family_count,
          'average_distance_miles', d.average_distance_miles,
          'distance_traveled_flag', d.distance_traveled_flag
        )
      ) AS subRows
    FROM cusp_audit.demo.monthly_distance_traveled m
    JOIN cusp_audit.demo.distance_traveled d
      ON m.provider_licensing_id = d.provider_licensing_id
    AND date_trunc('month', m.StartOfMonth) = date_trunc('month', d.placement_week)
    WHERE m.provider_licensing_id = :plid
    GROUP BY
      m.StartOfMonth,
      m.family_count,
      m.average_distance_miles,
      m.distance_traveled_flag
    ORDER BY to_timestamp(m.StartOfMonth) DESC;
  `;

  // '0414fd5112995709909a1a414948c912'

  const namedParameters = {
    plid
  };

  return { text: query.text, namedParameters }
}