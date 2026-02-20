import type { EmployeeId, RuleId } from "./ids";

export type RuleSeverity = "HARD" | "SOFT";

export type DefaultRuleKey =
  | "fixed_off_sunday_tales"
  | "cook_rotation_one_off_each_sunday"
  | "cook_if_sunday_off_no_week_off"
  | "cook_if_sunday_work_requires_week_off"
  | "cook_no_monday_off_after_sunday_off"
  | "no_coincidence_clarice_ingrid_elaine"
  | "elaine_not_same_day_josana"
  | "elaine_not_same_day_luis"
  | "if_josana_or_luis_off_then_elaine_must_work"
  | "if_maria_off_then_lidriel_must_work"
  | "ingrid_and_fernando_cannot_both_off"
  | "annual_holiday_credit_one_per_person"
  | "avoid_same_weekday_off";

export type RuleConfigBase = {
  id: RuleId;
  key: DefaultRuleKey;
  enabled: boolean;
  severity: RuleSeverity;
  title: string;
  description?: string;
};

// Keep params flexible for MVP; we can strongly type later.
export type RuleConfig = RuleConfigBase & {
  params: Record<string, unknown>;
};

// Useful helper types for pair-based rules
export type EmployeePair = {
  a: EmployeeId;
  b: EmployeeId;
};
