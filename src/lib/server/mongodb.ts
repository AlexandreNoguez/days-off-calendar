import { MongoClient, type Db } from "mongodb";
import { getOptionalEnv, getRequiredEnv } from "./env";

declare global {
  var escalaFolgaMongoClientPromise: Promise<MongoClient> | undefined;
  var escalaFolgaMongoIndexesPromise: Promise<void> | undefined;
}

function getClientPromise(): Promise<MongoClient> {
  if (!globalThis.escalaFolgaMongoClientPromise) {
    const uri = getRequiredEnv("MONGODB_URI");
    const client = new MongoClient(uri);
    globalThis.escalaFolgaMongoClientPromise = client.connect();
  }

  return globalThis.escalaFolgaMongoClientPromise;
}

export async function getDb(): Promise<Db> {
  const client = await getClientPromise();
  return client.db(getOptionalEnv("MONGODB_DB_NAME", "escala_folga"));
}

export async function ensureDatabaseIndexes(): Promise<void> {
  if (!globalThis.escalaFolgaMongoIndexesPromise) {
    globalThis.escalaFolgaMongoIndexesPromise = (async () => {
      const db = await getDb();

      await Promise.all([
        db.collection("settings").createIndexes([
          { key: { id: 1 }, name: "settings_id_unique", unique: true },
        ]),
        db.collection("users").createIndexes([
          { key: { id: 1 }, name: "users_id_unique", unique: true },
          { key: { username: 1 }, name: "users_username_unique", unique: true },
          { key: { role: 1, active: 1 }, name: "users_role_active" },
        ]),
        db.collection("auditLogs").createIndexes([
          { key: { createdAt: -1 }, name: "auditLogs_createdAt_desc" },
          {
            key: { usernameSnapshot: 1, createdAt: -1 },
            name: "auditLogs_username_createdAt",
          },
          { key: { action: 1, createdAt: -1 }, name: "auditLogs_action_createdAt" },
          { key: { userId: 1, createdAt: -1 }, name: "auditLogs_userId_createdAt" },
          {
            key: { entityType: 1, entityId: 1, createdAt: -1 },
            name: "auditLogs_entity_createdAt",
          },
        ]),
        db.collection("roles").createIndexes([
          { key: { id: 1 }, name: "roles_id_unique", unique: true },
          { key: { name: 1 }, name: "roles_name" },
        ]),
        db.collection("employees").createIndexes([
          { key: { id: 1 }, name: "employees_id_unique", unique: true },
          { key: { roleId: 1 }, name: "employees_roleId" },
          { key: { name: 1 }, name: "employees_name" },
        ]),
        db.collection("rules").createIndexes([
          { key: { id: 1 }, name: "rules_id_unique", unique: true },
          { key: { key: 1, enabled: 1 }, name: "rules_key_enabled" },
        ]),
        db.collection("schedules").createIndexes([
          { key: { id: 1 }, name: "schedules_id_unique", unique: true },
          {
            key: { periodKey: 1 },
            name: "schedules_periodKey_unique",
            unique: true,
            partialFilterExpression: { periodKey: { $type: "string" } },
          },
          { key: { year: -1, month: -1 }, name: "schedules_year_month_desc" },
          {
            key: { "publication.status": 1, year: -1, month: -1 },
            name: "schedules_publication_status_period",
          },
        ]),
      ]);
    })();
  }

  try {
    await globalThis.escalaFolgaMongoIndexesPromise;
  } catch (error) {
    globalThis.escalaFolgaMongoIndexesPromise = undefined;
    throw error;
  }
}
