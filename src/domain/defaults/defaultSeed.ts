import type { RuleConfig } from "../types/rules";
import type { Employee, Role } from "../types/employees";
import { createDefaultRoles } from "./defaultRoles";
import { createDefaultEmployees } from "./defaultEmployees";
import { createDefaultRules } from "./defaultRules";

export type DefaultSeed = {
  roles: Role[];
  employees: Employee[];
  rules: RuleConfig[];
};

export function createDefaultSeed(year: number): DefaultSeed {
  return {
    roles: createDefaultRoles(),
    employees: createDefaultEmployees(year),
    rules: createDefaultRules(),
  };
}
