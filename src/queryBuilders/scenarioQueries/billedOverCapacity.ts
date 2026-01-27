import SQL from "sql-template-strings";

type BuildBilledOverCapacityQueryParams = {
  provider_licensing_id: string;
};

export function buildBilledOverCapacityQuery({ provider_licensing_id }: BuildBilledOverCapacityQueryParams) {
  const plid = String(provider_licensing_id)
  const query= SQL`
    SELECT
      m.StartOfMonth,
      m.provider_capacity,
      m.billed_child_placements,
      m.perc_deviation,
      m.billed_over_capacity_flag,
      m.before_and_after_school,
      m.part_time,
      m.variable_schedule,
      m.full_time,
      collect_list(
        named_struct(
          'billed_child_placements', b.billed_child_placements,
          'placement_week', b.service_week,
          'full_time', b.full_time,
          'before_and_after_school', b.before_and_after_school,
          'part_time', b.part_time,
          'variable_schedule', b.variable_schedule,
          'provider_capacity', b.provider_capacity,
          'hours_open', b.hours_open,
          'hours_close', b.hours_close,
          'risk_flag', b.billed_over_capacity_flag,
          'perc_deviation', b.perc_deviation
        )
      ) AS subRows
    FROM cusp_audit.demo.monthly_billed_over_capacity m
    JOIN cusp_audit.demo.billed_over_capacity b
      ON m.provider_licensing_id = b.provider_licensing_id
    AND date_trunc('month', m.StartOfMonth) = date_trunc('month', b.service_week)
    WHERE m.provider_licensing_id = :plid
    GROUP BY
      m.StartOfMonth,
      m.provider_capacity,
      m.billed_child_placements,
      m.perc_deviation,
      m.billed_over_capacity_flag,
      m.before_and_after_school,
      m.part_time,
      m.variable_schedule,
      m.full_time;
  `;

  const namedParameters = {
    plid,
  };

  return { text: query.text, namedParameters };
}







