import { NextResponse } from "next/server";
import type { Employee, Role } from "@/src/domain/types/employees";
import type { DateISO } from "@/src/domain/types/ids";
import type { AssignmentStatus } from "@/src/domain/types/schedule";
import {
  ensureDefaultAppData,
  scheduleDocumentId,
  schedulePeriodKey,
} from "@/src/lib/server/appData";
import { requireAdminUser } from "@/src/lib/server/auth";
import { getDb } from "@/src/lib/server/mongodb";
import type {
  ScheduleDocument,
  ScheduleHistoryDto,
  ScheduleHistoryEmployeeOption,
  ScheduleHistoryPeriod,
  ScheduleHistoryRow,
} from "@/src/lib/types";
import { getDaysOfMonth, WEEKDAY_LABELS_PT } from "@/src/shared/utils/dates";

export const runtime = "nodejs";

function stripMongoId<T extends object>(document: T & { _id?: unknown }): T {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { _id, ...rest } = document;
  return rest as T;
}

function parseNumberParam(
  url: URL,
  key: string,
  min: number,
  max: number,
): number | undefined {
  const raw = url.searchParams.get(key);
  if (!raw) return undefined;
  const value = Number(raw);
  if (!Number.isInteger(value) || value < min || value > max) return undefined;
  return value;
}

function parseBooleanParam(url: URL, key: string): boolean {
  return url.searchParams.get(key) === "true";
}

function statusOf(
  schedule: ScheduleDocument,
  employeeId: string,
  dateISO: DateISO,
): AssignmentStatus {
  return schedule.assignments[employeeId]?.[dateISO] ?? "WORK";
}

function countOffAssignments(schedule: ScheduleDocument): number {
  return Object.values(schedule.assignments).reduce((total, employeeDays) => {
    return total + Object.values(employeeDays).filter((status) => status === "OFF").length;
  }, 0);
}

function buildHistoryPeriods(schedules: ScheduleDocument[]): ScheduleHistoryPeriod[] {
  return schedules
    .filter((schedule) => Number.isInteger(schedule.year) && Number.isInteger(schedule.month))
    .map((schedule) => ({
      year: schedule.year,
      month: schedule.month,
      periodKey: schedule.periodKey ?? schedulePeriodKey(schedule.year, schedule.month),
      updatedAt: schedule.updatedAt,
      employeeCount: Object.keys(schedule.employeeSnapshots ?? schedule.assignments).length,
      offCount: countOffAssignments(schedule),
      changeCount: schedule.changeLog?.length ?? 0,
    }))
    .sort((a, b) => b.year - a.year || b.month - a.month);
}

function buildCurrentEmployeeOptions(
  employees: Employee[],
  roles: Role[],
): ScheduleHistoryEmployeeOption[] {
  const roleNames = new Map(roles.map((role) => [role.id, role.name]));

  return employees.map((employee) => ({
    id: employee.id,
    name: employee.name,
    roleId: employee.roleId,
    roleName: roleNames.get(employee.roleId) ?? "Sem cargo",
  }));
}

function buildEmployeeOptions(
  schedule: ScheduleDocument,
  currentOptions: ScheduleHistoryEmployeeOption[],
): ScheduleHistoryEmployeeOption[] {
  const options = new Map<string, ScheduleHistoryEmployeeOption>();

  for (const option of currentOptions) {
    options.set(option.id, option);
  }

  for (const snapshot of Object.values(schedule.employeeSnapshots ?? {})) {
    options.set(snapshot.id, {
      id: snapshot.id,
      name: snapshot.name,
      roleId: snapshot.roleId,
      roleName: snapshot.roleName,
    });
  }

  for (const employeeId of Object.keys(schedule.assignments)) {
    if (!options.has(employeeId)) {
      options.set(employeeId, {
        id: employeeId,
        name: employeeId,
        roleId: "",
        roleName: "Sem cargo",
      });
    }
  }

  return [...options.values()].sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
}

export async function GET(request: Request) {
  const admin = await requireAdminUser().catch(() => null);
  if (!admin) return NextResponse.json({ error: "Acesso negado." }, { status: 403 });

  await ensureDefaultAppData();

  const url = new URL(request.url);
  const requestedYear = parseNumberParam(url, "year", 2020, 2100);
  const requestedMonth = parseNumberParam(url, "month", 1, 12);
  const employeeId = url.searchParams.get("employeeId") ?? "";
  const roleId = url.searchParams.get("roleId") ?? "";
  const query = (url.searchParams.get("q") ?? "").trim().toLocaleLowerCase("pt-BR");
  const weekday = parseNumberParam(url, "weekday", 0, 6);
  const onlySundays = parseBooleanParam(url, "onlySundays");
  const onlyHolidays = parseBooleanParam(url, "onlyHolidays");
  const statusFilter = url.searchParams.get("status");
  const status =
    statusFilter === "OFF" || statusFilter === "WORK" ? statusFilter : undefined;

  const db = await getDb();
  const schedules = db.collection<ScheduleDocument>("schedules");
  const allSchedules = (await schedules.find({}).toArray()).map(stripMongoId);
  const periods = buildHistoryPeriods(allSchedules);
  const fallbackPeriod = periods[0];
  const now = new Date();
  const year = requestedYear ?? fallbackPeriod?.year ?? now.getFullYear();
  const month = requestedMonth ?? fallbackPeriod?.month ?? now.getMonth() + 1;
  const schedule = await schedules.findOne({ id: scheduleDocumentId(year, month) });

  if (!schedule) {
    const empty: ScheduleHistoryDto = {
      periods,
      days: [],
      employees: [],
      roles: [],
      rows: [],
      changeLog: [],
      summary: {
        employeeCount: 0,
        visibleEmployeeCount: 0,
        dayCount: 0,
        offCount: 0,
        workCount: 0,
      },
    };

    return NextResponse.json(empty);
  }

  const [employees, roles] = await Promise.all([
    db.collection<Employee>("employees").find({}).toArray(),
    db.collection<Role>("roles").find({}).toArray(),
  ]);
  const currentOptions = buildCurrentEmployeeOptions(
    employees.map(stripMongoId),
    roles.map(stripMongoId),
  );
  const employeeOptions = buildEmployeeOptions(stripMongoId(schedule), currentOptions);
  const roleOptions = [...new Map(employeeOptions.map((item) => [
    item.roleId,
    { id: item.roleId, name: item.roleName },
  ])).values()]
    .filter((role) => role.id)
    .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));

  const days = getDaysOfMonth(year, month)
    .map((day) => ({
      dateISO: day.dateISO,
      dayNumber: day.day,
      weekday: day.weekday,
      weekdayLabel: WEEKDAY_LABELS_PT[day.weekday],
      isHoliday: Boolean(schedule.holidaysSnapshot?.[day.dateISO]),
    }))
    .filter((day) => {
      if (onlySundays && day.weekday !== 0) return false;
      if (weekday !== undefined && day.weekday !== weekday) return false;
      if (onlyHolidays && !day.isHoliday) return false;
      return true;
    });

  let rows: ScheduleHistoryRow[] = employeeOptions
    .filter((employee) => !employeeId || employee.id === employeeId)
    .filter((employee) => !roleId || employee.roleId === roleId)
    .filter((employee) => !query || employee.name.toLocaleLowerCase("pt-BR").includes(query))
    .map((employee) => {
      const rowDays = days.map((day) => ({
        dateISO: day.dateISO,
        status: statusOf(schedule, employee.id, day.dateISO),
        isHoliday: day.isHoliday,
      }));
      const offCount = rowDays.filter((day) => day.status === "OFF").length;

      return {
        ...employee,
        offCount,
        workCount: rowDays.length - offCount,
        days: rowDays,
      };
    });

  if (status) {
    rows = rows.filter((row) => row.days.some((day) => day.status === status));
  }

  const summary = rows.reduce(
    (total, row) => ({
      offCount: total.offCount + row.offCount,
      workCount: total.workCount + row.workCount,
    }),
    { offCount: 0, workCount: 0 },
  );

  const response: ScheduleHistoryDto = {
    periods,
    selectedPeriod: {
      year,
      month,
      periodKey: schedule.periodKey ?? schedulePeriodKey(year, month),
      updatedAt: schedule.updatedAt,
    },
    days,
    employees: employeeOptions,
    roles: roleOptions,
    rows,
    changeLog: [...(schedule.changeLog ?? [])].reverse().slice(0, 50),
    summary: {
      employeeCount: employeeOptions.length,
      visibleEmployeeCount: rows.length,
      dayCount: days.length,
      offCount: summary.offCount,
      workCount: summary.workCount,
    },
  };

  return NextResponse.json(response);
}
