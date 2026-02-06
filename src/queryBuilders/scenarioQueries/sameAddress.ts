import SQL from "sql-template-strings";

type BuildScenarioSameAddressQuery = {
  provider_licensing_id: string;
};
// Note some items in sub row rename properties to the "_match" variant, this is to align the view in the UI
export function buildScenarioSameAddressQuery({ provider_licensing_id }: BuildScenarioSameAddressQuery) {
  const plid = String(provider_licensing_id)
  const query= SQL`
    SELECT
      m.StartOfMonth,
      m.same_address_flag,
      m.provider_licensing_id_match,
      m.provider_name_match,
      p.open_date,
      p.close_date,
      p.postal_address,
      collect_list(
        named_struct(
          'StartOfMonth', p.placement_week,
          'postal_address', p.postal_address,
          'same_address_flag', p.same_address_flag,
          'provider_licensing_id_match', p.provider_licensing_id,
          'provider_name_match', p.provider_name,
          'open_date', p.open_date,
          'close_date', p.close_date
        )
      ) AS subRows
    FROM cusp_audit.demo.monthly_providers_with_same_address m
    JOIN cusp_audit.demo.providers_with_same_address p
      ON m.provider_licensing_id_match = p.provider_licensing_id
    
      AND date_trunc('month', m.StartOfMonth) = date_trunc('month', p.placement_week)
    
    WHERE m.provider_licensing_id = :plid
    AND  m.provider_licensing_id_match <> m.provider_licensing_id
    GROUP BY
      m.StartOfMonth,
      m.same_address_flag,
      m.provider_licensing_id_match,
      m.provider_name_match,
      p.postal_address,
      p.open_date,
      p.close_date
    ORDER BY M.startOfMonth
  `;
  // '991002938c70bb63c79d37ab971c73c6'

  const namedParameters = {
    plid,
  };

  return { text: query.text, namedParameters };
}







