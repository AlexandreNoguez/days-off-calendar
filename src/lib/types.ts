import type { Employee, Role } from "../domain/types/employees";
import type { DateISO } from "../domain/types/ids";
import type { RuleConfig } from "../domain/types/rules";
import type {
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
  id: "main";
  assignments: ScheduleAssignments;
  changeLog: ScheduleChangeLogEntry[];
  updatedAt: string;
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
