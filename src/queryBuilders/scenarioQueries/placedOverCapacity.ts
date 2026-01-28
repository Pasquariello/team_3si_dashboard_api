import SQL from "sql-template-strings";

type BuildPlacedOverCapacityQueryParams = {
  provider_licensing_id: string;
};

export function buildPlacedOverCapacityQuery({ provider_licensing_id }: BuildPlacedOverCapacityQueryParams) {
  const plid = String(provider_licensing_id)
  const query= SQL`
    SELECT
      m.StartOfMonth,
      m.provider_capacity,
      m.perc_deviation,
      m.placed_over_capacity_flag,
      m.before_and_after_school,
      m.part_time,
      m.variable_schedule,
      m.full_time,
      collect_list(
        named_struct(
          'child_placements', p.child_placements,
          'StartOfMonth', p.placement_week,
          'full_time', p.full_time,
          'before_and_after_school', p.before_and_after_school,
          'part_time', p.part_time,
          'variable_schedule', p.variable_schedule,
          'provider_capacity', p.provider_capacity,
          'hours_open', p.hours_open,
          'hours_close', p.hours_close,
          'placed_over_capacity_flag', p.placed_over_capacity_flag,
          'perc_deviation', p.perc_deviation
        )
      ) AS subRows
    FROM cusp_audit.demo.monthly_placed_over_capacity m
    JOIN cusp_audit.demo.placed_over_capacity p
      ON m.provider_licensing_id = p.provider_licensing_id
    AND date_trunc('month', m.StartOfMonth) = date_trunc('month', p.placement_week)
    WHERE m.provider_licensing_id = :plid
    GROUP BY
      m.StartOfMonth,
      m.provider_capacity,
      m.perc_deviation,
      m.placed_over_capacity_flag,
      m.before_and_after_school,
      m.part_time,
      m.variable_schedule,
      m.full_time
    ORDER BY
      m.StartOfMonth;
  `;

  const namedParameters = {
    plid,
  };

  return { text: query.text, namedParameters };
}
