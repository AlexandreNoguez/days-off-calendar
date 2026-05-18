import type { Employee, Role } from "../domain/types/employees";
import type { DateISO } from "../domain/types/ids";
import type { RuleConfig } from "../domain/types/rules";
import type {
  AssignmentStatus,
  ScheduleAssignments,
  ScheduleChangeLogEntry,
} from "../domain/types/schedule";

export type UserRole = "ADMIN" | "USER";

export type PublicUser = {
  id: string;
  username: string;
  displayName: string;
  role: UserRole;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
};

export type UserDocument = PublicUser & {
  passwordHash: string;
  createdByUserId?: string;
};

export type AuditLog = {
  id: string;
  userId?: string;
  usernameSnapshot?: string;
  action: string;
  entityType?: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
  ip?: string;
  userAgent?: string;
  createdAt: string;
};

export type AppSettings = {
  id: "main";
  year: number;
  month: number;
  holidays: Record<DateISO, true>;
  updatedAt: string;
};

export type ScheduleDocument = {
  id: string;
  periodKey: string;
  year: number;
  month: number;
  assignments: ScheduleAssignments;
  changeLog: ScheduleChangeLogEntry[];
  employeeSnapshots?: Record<
    string,
    {
      id: string;
      name: string;
      roleId: string;
      roleName: string;
      alwaysOffSunday: boolean;
      notes?: string;
    }
  >;
  holidaysSnapshot?: Record<DateISO, true>;
  createdAt?: string;
  updatedAt: string;
};

export type ScheduleHistoryPeriod = {
  year: number;
  month: number;
  periodKey: string;
  updatedAt: string;
  employeeCount: number;
  offCount: number;
  changeCount: number;
};

export type ScheduleHistoryDay = {
  dateISO: DateISO;
  dayNumber: number;
  weekday: number;
  weekdayLabel: string;
  isHoliday: boolean;
};

export type ScheduleHistoryEmployeeOption = {
  id: string;
  name: string;
  roleId: string;
  roleName: string;
};

export type ScheduleHistoryRow = ScheduleHistoryEmployeeOption & {
  offCount: number;
  workCount: number;
  days: Array<{
    dateISO: DateISO;
    status: AssignmentStatus;
    isHoliday: boolean;
  }>;
};

export type ScheduleHistoryDto = {
  periods: ScheduleHistoryPeriod[];
  selectedPeriod?: {
    year: number;
    month: number;
    periodKey: string;
    updatedAt: string;
  };
  days: ScheduleHistoryDay[];
  employees: ScheduleHistoryEmployeeOption[];
  roles: Array<{ id: string; name: string }>;
  rows: ScheduleHistoryRow[];
  changeLog: ScheduleChangeLogEntry[];
  summary: {
    employeeCount: number;
    visibleEmployeeCount: number;
    dayCount: number;
    offCount: number;
    workCount: number;
  };
};

export type AppStateDto = {
  user: PublicUser;
  plan: {
    year: number;
    month: number;
  };
  holidays: Record<DateISO, true>;
  roles: Role[];
  employees: Employee[];
  rules: RuleConfig[];
  schedule: {
    assignments: ScheduleAssignments;
    changeLog: ScheduleChangeLogEntry[];
  };
};

export type AppStatePatch = Partial<{
  plan: {
    year: number;
    month: number;
  };
  holidays: Record<DateISO, true>;
  roles: Role[];
  employees: Employee[];
  rules: RuleConfig[];
  schedule: {
    assignments: ScheduleAssignments;
    changeLog: ScheduleChangeLogEntry[];
  };
  audit: {
    action: string;
    entityType?: string;
    entityId?: string;
    metadata?: Record<string, unknown>;
  };
}>;
