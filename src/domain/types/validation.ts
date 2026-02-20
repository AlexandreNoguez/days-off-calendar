import type { DateISO, EmployeeId, RuleId } from "./ids";
import type { RuleSeverity } from "./rules";

export type Conflict = {
  id: string;
  ruleId: RuleId;
  dateISO: DateISO;
  employeeIds: EmployeeId[];
  severity: RuleSeverity;
  message: string; // Human-readable explanation
};

export type ValidationStatsPerEmployee = {
  totalOff: number;
  sundayOff: number;
  holidayOff: number;
};

export type ValidationResult = {
  conflicts: Conflict[];
  isValid: boolean; // true if no HARD conflicts
  statsPerEmployee: Record<EmployeeId, ValidationStatsPerEmployee>;
};
