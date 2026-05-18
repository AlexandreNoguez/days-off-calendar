import { randomUUID } from "crypto";
import type { Collection, OptionalUnlessRequiredId } from "mongodb";
import { createDefaultSeed } from "../../domain/defaults/defaultSeed";
import type { Employee, Role } from "../../domain/types/employees";
import type { RuleConfig } from "../../domain/types/rules";
import type {
  AppSettings,
  AppStateDto,
  AppStatePatch,
  PublicUser,
  ScheduleDocument,
  SchedulePublication,
} from "../types";
import { writeAuditLog } from "./audit";
import { getDb } from "./mongodb";

function nowISO(): string {
  return new Date().toISOString();
}

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

function defaultSchedulePublication(): SchedulePublication {
  return { status: "DRAFT" };
}

export function schedulePeriodKey(year: number, month: number): string {
  return `${year}-${pad2(month)}`;
}

export function scheduleDocumentId(year: number, month: number): string {
  return `schedule_${year}_${pad2(month)}`;
}

function stripMongoId<T extends object>(document: T & { _id?: unknown }): T {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { _id, ...rest } = document;
  return rest as T;
}

async function replaceCollection<T extends { id: string }>(
  collection: Collection<T>,
  documents: T[],
): Promise<void> {
  await collection.deleteMany({});
  if (documents.length > 0) {
    await collection.insertMany(documents as OptionalUnlessRequiredId<T>[]);
  }
}

function buildEmployeeSnapshots(
  employees: Employee[],
  roles: Role[],
): NonNullable<ScheduleDocument["employeeSnapshots"]> {
  const roleNames = new Map(roles.map((role) => [role.id, role.name]));

  return Object.fromEntries(
    employees.map((employee) => [
      employee.id,
      {
        id: employee.id,
        name: employee.name,
        roleId: employee.roleId,
        roleName: roleNames.get(employee.roleId) ?? "Sem cargo",
        alwaysOffSunday: employee.alwaysOffSunday,
        notes: employee.notes,
      },
    ]),
  );
}

async function migrateLegacyMainSchedule(input: {
  schedules: Collection<ScheduleDocument>;
  year: number;
  month: number;
  employees: Employee[];
  roles: Role[];
  holidays: AppSettings["holidays"];
  updatedAt: string;
}): Promise<void> {
  const legacy = await input.schedules.findOne({ id: "main" });
  if (!legacy) return;

  const periodScheduleCount = await input.schedules.countDocuments({
    id: { $ne: "main" },
    periodKey: { $exists: true },
  });
  if (periodScheduleCount > 0) return;

  const id = scheduleDocumentId(input.year, input.month);
  const existingPeriod = await input.schedules.findOne({ id });
  if (existingPeriod) return;

  await input.schedules.insertOne({
    id,
    year: input.year,
    month: input.month,
    periodKey: schedulePeriodKey(input.year, input.month),
    assignments: legacy.assignments ?? {},
    changeLog: legacy.changeLog ?? [],
    employeeSnapshots: buildEmployeeSnapshots(input.employees, input.roles),
    holidaysSnapshot: input.holidays,
    publication: legacy.publication ?? defaultSchedulePublication(),
    createdAt: legacy.createdAt ?? input.updatedAt,
    updatedAt: legacy.updatedAt ?? input.updatedAt,
  });
}

async function ensureScheduleForPeriod(input: {
  schedules: Collection<ScheduleDocument>;
  year: number;
  month: number;
  employees: Employee[];
  roles: Role[];
  holidays: AppSettings["holidays"];
  updatedAt: string;
}): Promise<ScheduleDocument> {
  const id = scheduleDocumentId(input.year, input.month);
  const existing = await input.schedules.findOne({ id });
  if (existing) return existing;

  const schedule: ScheduleDocument = {
    id,
    year: input.year,
    month: input.month,
    periodKey: schedulePeriodKey(input.year, input.month),
    assignments: {},
    changeLog: [],
    employeeSnapshots: buildEmployeeSnapshots(input.employees, input.roles),
    holidaysSnapshot: input.holidays,
    publication: defaultSchedulePublication(),
    createdAt: input.updatedAt,
    updatedAt: input.updatedAt,
  };

  await input.schedules.insertOne(schedule);
  return schedule;
}

export async function ensureDefaultAppData(): Promise<void> {
  const db = await getDb();
  const current = new Date();
  const year = current.getFullYear();
  const month = current.getMonth() + 1;
  const seed = createDefaultSeed(year);
  const updatedAt = nowISO();

  const settings = db.collection<AppSettings>("settings");
  const roles = db.collection<Role>("roles");
  const employees = db.collection<Employee>("employees");
  const rules = db.collection<RuleConfig>("rules");
  const schedules = db.collection<ScheduleDocument>("schedules");

  await settings.updateOne(
    { id: "main" },
    {
      $setOnInsert: {
        id: "main",
        year,
        month,
        holidays: {},
        updatedAt,
      },
    },
    { upsert: true },
  );

  if ((await roles.countDocuments()) === 0) {
    await roles.insertMany(seed.roles);
  }

  if ((await employees.countDocuments()) === 0) {
    await employees.insertMany(seed.employees);
  }

  if ((await rules.countDocuments()) === 0) {
    await rules.insertMany(seed.rules);
  }

  const settingsDocument = await settings.findOne({ id: "main" });
  const activeYear = settingsDocument?.year ?? year;
  const activeMonth = settingsDocument?.month ?? month;
  const activeHolidays = settingsDocument?.holidays ?? {};
  const currentRoles = (await roles.find({}).toArray()).map(stripMongoId);
  const currentEmployees = (await employees.find({}).toArray()).map(stripMongoId);

  await migrateLegacyMainSchedule({
    schedules,
    year: activeYear,
    month: activeMonth,
    employees: currentEmployees,
    roles: currentRoles,
    holidays: activeHolidays,
    updatedAt,
  });

  await ensureScheduleForPeriod({
    schedules,
    year: activeYear,
    month: activeMonth,
    employees: currentEmployees,
    roles: currentRoles,
    holidays: activeHolidays,
    updatedAt,
  });
}

export async function getAppState(user: PublicUser): Promise<AppStateDto> {
  await ensureDefaultAppData();

  const db = await getDb();
  const settings = await db.collection<AppSettings>("settings").findOne({ id: "main" });
  const roles = await db.collection<Role>("roles").find({}).toArray();
  const employees = await db.collection<Employee>("employees").find({}).toArray();
  const rules = await db.collection<RuleConfig>("rules").find({}).toArray();
  const cleanRoles = roles.map(stripMongoId);
  const cleanEmployees = employees.map(stripMongoId);
  const plan = {
    year: settings?.year ?? new Date().getFullYear(),
    month: settings?.month ?? new Date().getMonth() + 1,
  };
  const schedule = await ensureScheduleForPeriod({
    schedules: db.collection<ScheduleDocument>("schedules"),
    year: plan.year,
    month: plan.month,
    employees: cleanEmployees,
    roles: cleanRoles,
    holidays: settings?.holidays ?? {},
    updatedAt: nowISO(),
  });

  return {
    user,
    plan,
    holidays: settings?.holidays ?? {},
    roles: cleanRoles,
    employees: cleanEmployees,
    rules: rules.map(stripMongoId),
    schedule: {
      assignments: schedule?.assignments ?? {},
      changeLog: schedule?.changeLog ?? [],
      publication: schedule?.publication ?? defaultSchedulePublication(),
    },
  };
}

export async function saveAppStatePatch(
  user: PublicUser,
  patch: AppStatePatch,
): Promise<AppStateDto> {
  await ensureDefaultAppData();

  const db = await getDb();
  const updatedAt = nowISO();

  if (patch.plan || patch.holidays) {
    const set: Partial<AppSettings> = { updatedAt };
    if (patch.plan) {
      set.year = patch.plan.year;
      set.month = patch.plan.month;
    }
    if (patch.holidays) set.holidays = patch.holidays;
    await db.collection<AppSettings>("settings").updateOne(
      { id: "main" },
      { $set: set },
      { upsert: true },
    );
  }

  if (patch.roles) {
    await replaceCollection(db.collection<Role>("roles"), patch.roles);
  }

  if (patch.employees) {
    await replaceCollection(db.collection<Employee>("employees"), patch.employees);
  }

  if (patch.rules) {
    await replaceCollection(db.collection<RuleConfig>("rules"), patch.rules);
  }

  if (patch.schedule) {
    const settings = await db.collection<AppSettings>("settings").findOne({ id: "main" });
    const roles = (await db.collection<Role>("roles").find({}).toArray()).map(stripMongoId);
    const employees = (await db.collection<Employee>("employees").find({}).toArray()).map(stripMongoId);
    const year = settings?.year ?? new Date().getFullYear();
    const month = settings?.month ?? new Date().getMonth() + 1;
    const id = scheduleDocumentId(year, month);
    const set: Partial<ScheduleDocument> = {
      id,
      year,
      month,
      periodKey: schedulePeriodKey(year, month),
      updatedAt,
    };

    if (patch.schedule.assignments) {
      set.assignments = patch.schedule.assignments;
      set.employeeSnapshots = buildEmployeeSnapshots(employees, roles);
      set.holidaysSnapshot = settings?.holidays ?? {};
    }

    if (patch.schedule.changeLog) set.changeLog = patch.schedule.changeLog;
    if (patch.schedule.publication) set.publication = patch.schedule.publication;

    const setOnInsert: Partial<ScheduleDocument> = { createdAt: updatedAt };
    if (!set.assignments) setOnInsert.assignments = {};
    if (!set.changeLog) setOnInsert.changeLog = [];
    if (!set.employeeSnapshots) setOnInsert.employeeSnapshots = buildEmployeeSnapshots(employees, roles);
    if (!set.holidaysSnapshot) setOnInsert.holidaysSnapshot = settings?.holidays ?? {};
    if (!set.publication) setOnInsert.publication = defaultSchedulePublication();

    await db.collection<ScheduleDocument>("schedules").updateOne(
      { id },
      {
        $set: set,
        $setOnInsert: setOnInsert,
      },
      { upsert: true },
    );
  }

  if (patch.audit?.action) {
    await writeAuditLog({
      user,
      action: patch.audit.action,
      entityType: patch.audit.entityType,
      entityId: patch.audit.entityId,
      metadata: patch.audit.metadata,
    });
  }

  return getAppState(user);
}

export function createId(prefix: string): string {
  return `${prefix}_${randomUUID()}`;
}
