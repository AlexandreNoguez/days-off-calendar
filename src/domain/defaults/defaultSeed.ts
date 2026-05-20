import type { RuleConfig } from "../types/rules";
import type { Employee, Role } from "../types/employees";
import { createDefaultRoles } from "./defaultRoles";
import { createDefaultEmployees } from "./defaultEmployees";
import { createDefaultRules } from "./defaultRules";

const DEFAULT_TIMESTAMP = "1970-01-01T00:00:00.000Z";

export type DefaultSeed = {
  roles: Role[];
  employees: Employee[];
  rules: RuleConfig[];
};

export function createDefaultSeed(
  year: number,
  timestamp = DEFAULT_TIMESTAMP,
): DefaultSeed {
  return {
    roles: createDefaultRoles(timestamp),
    employees: createDefaultEmployees(year, timestamp),
    rules: createDefaultRules(timestamp),
  };
}
