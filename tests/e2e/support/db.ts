import { randomUUID } from "crypto";
import { MongoClient, type Db } from "mongodb";
import { hashPassword } from "../../../src/lib/server/passwords";
import type { UserDocument, UserRole } from "../../../src/lib/types";
import { loadDotEnv } from "./env";

export const E2E_PREFIX = "[E2E]";
export const E2E_PASSWORD = "e2e123456";

export const E2E_USERS = {
  admin: { username: "e2e_admin", displayName: "E2E Admin", role: "ADMIN" },
  user: { username: "e2e_user", displayName: "E2E User", role: "USER" },
  nutri: { username: "e2e_nutri", displayName: "E2E Nutri", role: "NUTRI" },
} satisfies Record<string, { username: string; displayName: string; role: UserRole }>;

export async function withDb<T>(run: (db: Db) => Promise<T>): Promise<T> {
  loadDotEnv();

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI is required to run Playwright E2E tests.");
  }

  const client = new MongoClient(uri);
  try {
    await client.connect();
    return await run(client.db(process.env.MONGODB_DB_NAME || "escala_folga"));
  } finally {
    await client.close();
  }
}

export async function cleanupE2EData(db: Db) {
  const isDedicatedE2EDatabase = db.databaseName.endsWith("_e2e");
  const restaurantMenuFilter = isDedicatedE2EDatabase ? {} : { title: e2eRegex() };
  const recipeFilter = isDedicatedE2EDatabase ? {} : { name: e2eRegex() };
  const mealPlanFilter = isDedicatedE2EDatabase ? {} : { title: e2eRegex() };
  const foodFilter = isDedicatedE2EDatabase ? {} : { name: e2eRegex() };
  const patientFilter = isDedicatedE2EDatabase ? {} : { fullName: e2eRegex() };

  await Promise.all([
    db.collection("nutriRestaurantMenus").deleteMany(restaurantMenuFilter),
    db.collection("nutriRecipes").deleteMany(recipeFilter),
    db.collection("nutriMealPlans").deleteMany(mealPlanFilter),
    db.collection("nutriFoods").deleteMany(foodFilter),
    db.collection("nutriPatients").deleteMany(patientFilter),
    db.collection("auditLogs").deleteMany({
      $or: [
        { usernameSnapshot: { $in: Object.values(E2E_USERS).map((user) => user.username) } },
        { "metadata.e2e": true },
      ],
    }),
  ]);
}

export async function ensureE2EUsers(db: Db) {
  const now = new Date().toISOString();
  const passwordHash = await hashPassword(E2E_PASSWORD);
  const users = db.collection<UserDocument>("users");

  await Promise.all(
    Object.values(E2E_USERS).map((user) =>
      users.updateOne(
        { username: user.username },
        {
          $set: {
            displayName: user.displayName,
            role: user.role,
            active: true,
            passwordHash,
            updatedAt: now,
          },
          $setOnInsert: {
            id: `e2e_user_${randomUUID()}`,
            username: user.username,
            createdAt: now,
          },
        },
        { upsert: true },
      ),
    ),
  );
}

export function e2eName(name: string) {
  return `${E2E_PREFIX} ${name} ${Date.now()}`;
}

function e2eRegex() {
  return { $regex: "^\\[E2E\\]" };
}
