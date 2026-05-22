import { randomUUID } from "crypto";
import type { Collection, UpdateFilter } from "mongodb";
import { getDb } from "@/src/lib/server/mongodb";
import { calculateMealPlanTotals } from "../application/calculateMealPlanTotals";
import type {
  NutriMeal,
  NutriMealPlan,
  NutriMealPlanFoodItem,
  NutriMealPlanStatus,
  NutriNutrients,
} from "../domain/types";

type NutriMealPlanDocument = NutriMealPlan & { _id?: unknown };

type SaveMealPlanInput = {
  patientId: string;
  title: string;
  target: NutriNutrients;
  meals: Array<{
    name: string;
    time?: string;
    items: Array<Omit<NutriMealPlanFoodItem, "id">>;
  }>;
};

let indexesPromise: Promise<void> | undefined;

function nowISO(): string {
  return new Date().toISOString();
}

function createMealPlanId(): string {
  return `nutri_meal_plan_${randomUUID()}`;
}

function createMealId(): string {
  return `nutri_meal_${randomUUID()}`;
}

function createMealItemId(): string {
  return `nutri_meal_item_${randomUUID()}`;
}

function stripMongoId(document: NutriMealPlanDocument): NutriMealPlan {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { _id, ...mealPlan } = document;
  return mealPlan;
}

async function getMealPlansCollection(): Promise<Collection<NutriMealPlanDocument>> {
  const db = await getDb();
  return db.collection<NutriMealPlanDocument>("nutriMealPlans");
}

async function ensureNutriMealPlanIndexes(): Promise<void> {
  if (!indexesPromise) {
    indexesPromise = (async () => {
      const collection = await getMealPlansCollection();

      await collection.createIndexes([
        { key: { id: 1 }, name: "nutriMealPlans_id_unique", unique: true },
        { key: { patientId: 1, updatedAt: -1 }, name: "nutriMealPlans_patient_updatedAt" },
        { key: { status: 1, updatedAt: -1 }, name: "nutriMealPlans_status_updatedAt" },
      ]);
    })();
  }

  try {
    await indexesPromise;
  } catch (error) {
    indexesPromise = undefined;
    throw error;
  }
}

function withIds(meals: SaveMealPlanInput["meals"]): NutriMeal[] {
  return meals.map((meal) => ({
    id: createMealId(),
    name: meal.name,
    time: meal.time,
    items: meal.items.map((item) => ({
      ...item,
      id: createMealItemId(),
    })),
  }));
}

export async function listNutriMealPlans(input: {
  patientId?: string;
} = {}): Promise<NutriMealPlan[]> {
  await ensureNutriMealPlanIndexes();
  const collection = await getMealPlansCollection();

  const mealPlans = await collection
    .find(input.patientId ? { patientId: input.patientId } : {})
    .sort({ updatedAt: -1 })
    .toArray();

  return mealPlans.map(stripMongoId);
}

export async function createNutriMealPlan(input: {
  mealPlan: SaveMealPlanInput;
  userId: string;
}): Promise<NutriMealPlan> {
  await ensureNutriMealPlanIndexes();
  const collection = await getMealPlansCollection();
  const now = nowISO();
  const meals = withIds(input.mealPlan.meals);

  const mealPlan: NutriMealPlan = {
    id: createMealPlanId(),
    patientId: input.mealPlan.patientId,
    title: input.mealPlan.title,
    status: "DRAFT",
    target: input.mealPlan.target,
    meals,
    totals: calculateMealPlanTotals(meals),
    createdByUserId: input.userId,
    createdAt: now,
    updatedAt: now,
  };

  await collection.insertOne(mealPlan);
  return mealPlan;
}

export async function updateNutriMealPlanStatus(input: {
  id: string;
  status: NutriMealPlanStatus;
  userId: string;
}): Promise<NutriMealPlan | null> {
  await ensureNutriMealPlanIndexes();
  const collection = await getMealPlansCollection();
  const now = nowISO();
  const set: Partial<NutriMealPlan> = {
    status: input.status,
    updatedAt: now,
  };

  if (input.status === "APPROVED") {
    set.approvedAt = now;
    set.approvedByUserId = input.userId;
  }

  const update: UpdateFilter<NutriMealPlanDocument> = { $set: set };
  const result = await collection.findOneAndUpdate(
    { id: input.id },
    update,
    { returnDocument: "after" },
  );

  return result ? stripMongoId(result) : null;
}
