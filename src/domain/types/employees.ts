import type { EmployeeId, RoleId } from "./ids";

export type Role = {
  id: RoleId;
  name: string;
};

export type Employee = {
  id: EmployeeId;
  name: string;
  roleId: RoleId;

  // When true, this person always has OFF on Sundays (e.g., Tales)
  alwaysOffSunday: boolean;

  // Holiday credit tracking (1 per year)
  holidayCreditYear: number; // e.g., 2026
  holidayOffUsed: boolean;

  notes?: string;
};
