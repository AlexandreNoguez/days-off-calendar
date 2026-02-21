import type { DefaultRuleKey } from "../../domain/types/rules";

export type RegistrySource = "employees" | "roles";

export type RuleFieldSpec =
  | {
      type: "select";
      key: string;
      label: string;
      source: RegistrySource;
      required?: boolean;
    }
  | {
      type: "multiselect";
      key: string;
      label: string;
      source: RegistrySource;
      required?: boolean;
      minItems?: number;
      maxItems?: number;
    }
  | {
      type: "number";
      key: string;
      label: string;
      min?: number;
      max?: number;
      step?: number;
      required?: boolean;
    }
  | {
      type: "boolean";
      key: string;
      label: string;
    };

export type RuleFormSchema = {
  fields: RuleFieldSpec[];
  defaults: Record<string, unknown>;
  parser: (input: Record<string, unknown>) => Record<string, unknown>;
  serializer: (input: Record<string, unknown>) => Record<string, unknown>;
};

function passthrough(input: Record<string, unknown>): Record<string, unknown> {
  return input;
}

export const ruleFormRegistry: Partial<Record<DefaultRuleKey, RuleFormSchema>> = {
  fixed_off_sunday_tales: {
    fields: [
      {
        type: "select",
        key: "employeeId",
        label: "Employee with fixed Sunday off",
        source: "employees",
        required: true,
      },
    ],
    defaults: { employeeId: "" },
    parser: passthrough,
    serializer: passthrough,
  },

  cook_rotation_one_off_each_sunday: {
    fields: [
      {
        type: "select",
        key: "cookRoleId",
        label: "Cook role",
        source: "roles",
        required: true,
      },
      {
        type: "number",
        key: "exactlyOffCount",
        label: "Cooks off each Sunday",
        min: 1,
        max: 7,
        step: 1,
        required: true,
      },
    ],
    defaults: { cookRoleId: "", exactlyOffCount: 1 },
    parser: passthrough,
    serializer: passthrough,
  },

  cook_if_sunday_work_requires_week_off: {
    fields: [
      {
        type: "select",
        key: "cookRoleId",
        label: "Cook role",
        source: "roles",
        required: true,
      },
      {
        type: "number",
        key: "requiredWeekdayOffCount",
        label: "Required weekday offs",
        min: 1,
        max: 6,
        step: 1,
        required: true,
      },
    ],
    defaults: { cookRoleId: "", requiredWeekdayOffCount: 1 },
    parser: passthrough,
    serializer: passthrough,
  },

  assistant_if_sunday_off_no_week_off: {
    fields: [
      {
        type: "select",
        key: "assistantRoleId",
        label: "Auxiliary role",
        source: "roles",
        required: true,
      },
    ],
    defaults: { assistantRoleId: "" },
    parser: passthrough,
    serializer: passthrough,
  },

  assistant_if_sunday_work_requires_week_off: {
    fields: [
      {
        type: "select",
        key: "assistantRoleId",
        label: "Auxiliary role",
        source: "roles",
        required: true,
      },
      {
        type: "number",
        key: "requiredWeekdayOffCount",
        label: "Required weekday offs",
        min: 1,
        max: 6,
        step: 1,
        required: true,
      },
    ],
    defaults: { assistantRoleId: "", requiredWeekdayOffCount: 1 },
    parser: passthrough,
    serializer: passthrough,
  },

  assistant_no_monday_off_after_sunday_off: {
    fields: [
      {
        type: "select",
        key: "assistantRoleId",
        label: "Auxiliary role",
        source: "roles",
        required: true,
      },
    ],
    defaults: { assistantRoleId: "" },
    parser: passthrough,
    serializer: passthrough,
  },

  assistant_weekday_off_must_be_fixed: {
    fields: [
      {
        type: "select",
        key: "assistantRoleId",
        label: "Auxiliary role",
        source: "roles",
        required: true,
      },
    ],
    defaults: { assistantRoleId: "" },
    parser: passthrough,
    serializer: passthrough,
  },

  laundry_one_sunday_off_per_month: {
    fields: [
      {
        type: "select",
        key: "employeeId",
        label: "Laundry employee",
        source: "employees",
        required: true,
      },
      {
        type: "number",
        key: "exactlyOffCount",
        label: "Sunday offs per month",
        min: 0,
        max: 5,
        step: 1,
        required: true,
      },
    ],
    defaults: { employeeId: "", exactlyOffCount: 1 },
    parser: passthrough,
    serializer: passthrough,
  },

  pot_washer_one_sunday_off_per_month: {
    fields: [
      {
        type: "select",
        key: "employeeId",
        label: "Pot washer employee",
        source: "employees",
        required: true,
      },
      {
        type: "number",
        key: "exactlyOffCount",
        label: "Sunday offs per month",
        min: 0,
        max: 5,
        step: 1,
        required: true,
      },
    ],
    defaults: { employeeId: "", exactlyOffCount: 1 },
    parser: passthrough,
    serializer: passthrough,
  },

  elaine_not_same_day_josana: {
    fields: [
      {
        type: "select",
        key: "a",
        label: "Employee A",
        source: "employees",
        required: true,
      },
      {
        type: "select",
        key: "b",
        label: "Employee B",
        source: "employees",
        required: true,
      },
    ],
    defaults: { a: "", b: "" },
    parser: passthrough,
    serializer: passthrough,
  },

  if_josana_or_luis_off_then_elaine_must_work: {
    fields: [
      {
        type: "select",
        key: "substituteId",
        label: "Replacement employee",
        source: "employees",
        required: true,
      },
      {
        type: "multiselect",
        key: "substitutedIds",
        label: "Employees that require replacement",
        source: "employees",
        minItems: 1,
        required: true,
      },
    ],
    defaults: { substituteId: "", substitutedIds: [] },
    parser: passthrough,
    serializer: passthrough,
  },

  annual_holiday_credit_one_per_person: {
    fields: [
      {
        type: "number",
        key: "creditPerYear",
        label: "Holiday credits per year",
        min: 0,
        max: 10,
        step: 1,
        required: true,
      },
    ],
    defaults: { creditPerYear: 1 },
    parser: passthrough,
    serializer: passthrough,
  },
};
