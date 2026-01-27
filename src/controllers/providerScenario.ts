import type express from "express";

import { buildBilledOverCapacityQuery } from "../queryBuilders/scenarioQueries/billedOverCapacity.js";
import { buildPlacedOverCapacityQuery } from "../queryBuilders/scenarioQueries/placedOverCapacity.js";
import { queryData } from "../services/queryService.js";

type ScenarioPlacedOverData = {
  StartOfMonth: string; // ISO DateString
  provider_capacity: number;
  perc_deviation: number;
  placed_over_capacity_flag: boolean;
  before_and_after_school: number;
  part_time: number;
  variable_schedule: number;
  full_time: number;
  subRows: PlacedOverWeek[];
};

type PlacedOverWeek = {
  hours_open: string;
  hours_close: string;
  child_placements: number;
} & Omit<ScenarioPlacedOverData, "subRows">;

type UiScenarioPlacedOverData = {
  serviceMonth: string; // ISO DateString
  riskFlag: boolean;
  providerCapacity: number;
  aveWklyPlacements: number; // determine the average from weeks
  percDeviation: number;
  beforeAfterSchool: number;
  partTime: number;
  variableSchedule: number;
  fullTime: number;
  fullTimeOverCap: boolean;
  openTime: string;
  closeTime: string;
  subRows: UiPlacedOverWeek[];
};

type UiPlacedOverWeek = Omit<UiScenarioPlacedOverData, "subRows">;

type ScenarioBilledOverData = {
  StartOfMonth: string; // ISO DateString
  provider_capacity: number;
  billed_child_placements: number;
  perc_deviation: number;
  billed_over_capacity_flag: boolean;
  before_and_after_school: number;
  part_time: number;
  variable_schedule: number;
  full_time: number;
  subRows: BilledOverWeek[];
};

type BilledOverWeek = {
  hours_open: string;
  hours_close: string;
  billed_child_placements: number;
} & Omit<ScenarioBilledOverData, "subRows">;

type UiScenarioBilledOverData = {
  serviceMonth: string; // ISO DateString
  riskFlag: boolean;
  providerCapacity: number;
  aveWklyPlacements: number; // determine the average from weeks
  percDeviation: number;
  beforeAfterSchool: number;
  partTime: number;
  variableSchedule: number;
  fullTime: number;
  fullTimeOverCap: boolean;
  openTime: string;
  closeTime: string;
  subRows: UiBilledOverWeek[];
};

type UiBilledOverWeek = Omit<UiScenarioBilledOverData, "subRows">;

function reducePlacedOverWeeks(weeks: PlacedOverWeek[]): Pick<UiScenarioPlacedOverData, "aveWklyPlacements" | 'closeTime' | 'openTime'> {
  const averageWeeklyPlacements = (weeks.reduce((total, current) => (total += current.child_placements), 0)) / weeks.length;
  return {
    aveWklyPlacements: averageWeeklyPlacements,
    openTime: weeks[0].hours_open,
    closeTime: weeks[0].hours_close,
  };
}

function parsePlacedOverWeeks(weeks: PlacedOverWeek[]): UiPlacedOverWeek[] {
  const parsed: UiPlacedOverWeek[] = weeks.map(item => {
    return {
      serviceMonth: item.StartOfMonth,
      riskFlag: item.placed_over_capacity_flag,
      providerCapacity: item.provider_capacity,
      fullTimeOverCap: item.provider_capacity < item.full_time,
      percDeviation: item.perc_deviation,
      beforeAfterSchool: item.before_and_after_school,
      partTime: item.part_time,
      variableSchedule: item.variable_schedule,
      fullTime: item.variable_schedule,
      aveWklyPlacements: item.child_placements,
      openTime: item.hours_open,
      closeTime: item.hours_close,
    }
  })
  return parsed
}

export async function placedOverCapacityById(req: express.Request, res: express.Response) {
  const provider_licensing_id = String(req.params.providerId);
  const { text, namedParameters } = buildPlacedOverCapacityQuery({ provider_licensing_id });

  try {
    const rawData = await queryData(text, namedParameters) as ScenarioPlacedOverData[];
    // we should parse, top level needs open/close times

    const result: UiScenarioPlacedOverData[] = rawData.map((item) => {
      // combine data from weeks within month for month rows, lift open and close time from week
      const weekly = reducePlacedOverWeeks(item.subRows);
      // handle convert from domain model to ui model
      const subRows = parsePlacedOverWeeks(item.subRows);
      return {
        serviceMonth: item.StartOfMonth,
        riskFlag: item.placed_over_capacity_flag,
        providerCapacity: item.provider_capacity,
        fullTimeOverCap: item.provider_capacity < item.full_time,
        percDeviation: item.perc_deviation,
        beforeAfterSchool: item.before_and_after_school,
        partTime: item.part_time,
        variableSchedule: item.variable_schedule,
        fullTime: item.full_time,
        subRows,
        ...weekly,
      };
    });

    res.json(result);
  }
  catch (err: any) {
    // console.log("err =======", err);
    res.status(500).json({ error: err.message });
  }
}

function reduceBilledOverWeeks(weeks: BilledOverWeek[]): Pick<UiScenarioBilledOverData, "aveWklyPlacements" | 'closeTime' | 'openTime'> {
  const averageWeeklyPlacements = (weeks.reduce((total, current) => (total += current.billed_child_placements), 0)) / weeks.length;
  return {
    aveWklyPlacements: averageWeeklyPlacements,
    openTime: weeks[0].hours_open,
    closeTime: weeks[0].hours_close,
  };
}

function parseBilledOverWeeks(weeks: BilledOverWeek[]): UiBilledOverWeek[] {
  const parsed: UiBilledOverWeek[] = weeks.map(item => {
    return {
      serviceMonth: item.StartOfMonth,
      riskFlag: item.billed_over_capacity_flag,
      providerCapacity: item.provider_capacity,
      fullTimeOverCap: item.provider_capacity < item.full_time,
      percDeviation: item.perc_deviation,
      beforeAfterSchool: item.before_and_after_school,
      partTime: item.part_time,
      variableSchedule: item.variable_schedule,
      fullTime: item.variable_schedule,
      aveWklyPlacements: item.billed_child_placements,
      openTime: item.hours_open,
      closeTime: item.hours_close,
    }
  })
  return parsed
}

export async function billedOverCapacityById(req: express.Request, res: express.Response) {
  const provider_licensing_id = String(req.params.providerId);
  const { text, namedParameters } = buildBilledOverCapacityQuery({ provider_licensing_id });

  try {
    const rawData = await queryData(text, namedParameters) as ScenarioBilledOverData[];
    // we should parse, top level needs open/close times

    const result: UiScenarioBilledOverData[] = rawData.map((item) => {
      // combine data from weeks within month for month rows, lift open and close time from week
      const weekly = reduceBilledOverWeeks(item.subRows);
      // handle convert from domain model to ui model
      const subRows = parseBilledOverWeeks(item.subRows);
      return {
        serviceMonth: item.StartOfMonth,
        riskFlag: item.billed_over_capacity_flag,
        providerCapacity: item.provider_capacity,
        fullTimeOverCap: item.provider_capacity < item.full_time,
        percDeviation: item.perc_deviation,
        beforeAfterSchool: item.before_and_after_school,
        partTime: item.part_time,
        variableSchedule: item.variable_schedule,
        fullTime: item.full_time,
        subRows,
        ...weekly,
      };
    });

    res.json(result);
  }
  catch (err: any) {
    // console.log("err =======", err);
    res.status(500).json({ error: err.message });
  }
}
