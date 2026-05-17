import { randomUUID } from "crypto";
import type { Collection, OptionalUnlessRequiredId } from "mongodb";
import { createDefaultSeed } from "../../domain/defaults/defaultSeed";
import type { Employee, Role } from "../../domain/types/employees";
import type { RuleConfig } from "../../domain/types/rules";
import type { AppSettings, AppStateDto, AppStatePatch, PublicUser, ScheduleDocument } from "../types";
import { writeAuditLog } from "./audit";
import { getDb } from "./mongodb";

function nowISO(): string {
  return new Date().toISOString();
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

  await schedules.updateOne(
    { id: "main" },
    {
      $setOnInsert: {
        id: "main",
        assignments: {},
        changeLog: [],
        updatedAt,
      },
    },
    { upsert: true },
  );
}

export async function getAppState(user: PublicUser): Promise<AppStateDto> {
  await ensureDefaultAppData();

  const db = await getDb();
  const settings = await db.collection<AppSettings>("settings").findOne({ id: "main" });
  const schedule = await db
    .collection<ScheduleDocument>("schedules")
    .findOne({ id: "main" });

  const roles = await db.collection<Role>("roles").find({}).toArray();
  const employees = await db.collection<Employee>("employees").find({}).toArray();
  const rules = await db.collection<RuleConfig>("rules").find({}).toArray();

  return {
    user,
    plan: {
      year: settings?.year ?? new Date().getFullYear(),
      month: settings?.month ?? new Date().getMonth() + 1,
    },
    holidays: settings?.holidays ?? {},
    roles: roles.map(stripMongoId),
    employees: employees.map(stripMongoId),
    rules: rules.map(stripMongoId),
    schedule: {
      assignments: schedule?.assignments ?? {},
      changeLog: schedule?.changeLog ?? [],
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
    await db.collection<ScheduleDocument>("schedules").updateOne(
      { id: "main" },
      {
        $set: {
          id: "main",
          assignments: patch.schedule.assignments,
          changeLog: patch.schedule.changeLog,
          updatedAt,
        },
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
