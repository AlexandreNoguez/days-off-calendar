import { randomUUID } from "crypto";
import type { Collection, UpdateFilter } from "mongodb";
import { getDb } from "@/src/lib/server/mongodb";
import type { NutriFood, NutriFoodSource, NutriNutrients } from "../domain/types";

type NutriFoodDocument = NutriFood & { _id?: unknown };

type SaveFoodInput = {
  name: string;
  source: NutriFoodSource;
  sourceVersion?: string;
  servingDescription?: string;
  nutrientsPer100g: NutriNutrients;
  allergens?: string[];
  active?: boolean;
};

let indexesPromise: Promise<void> | undefined;

function nowISO(): string {
  return new Date().toISOString();
}

function createFoodId(): string {
  return `nutri_food_${randomUUID()}`;
}

function stripMongoId(document: NutriFoodDocument): NutriFood {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { _id, ...food } = document;
  return food;
}

async function getFoodsCollection(): Promise<Collection<NutriFoodDocument>> {
  const db = await getDb();
  return db.collection<NutriFoodDocument>("nutriFoods");
}

async function ensureNutriFoodIndexes(): Promise<void> {
  if (!indexesPromise) {
    indexesPromise = (async () => {
      const collection = await getFoodsCollection();

      await collection.createIndexes([
        { key: { id: 1 }, name: "nutriFoods_id_unique", unique: true },
        { key: { name: 1 }, name: "nutriFoods_name" },
        { key: { active: 1, name: 1 }, name: "nutriFoods_active_name" },
        { key: { source: 1, name: 1 }, name: "nutriFoods_source_name" },
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

function buildSearchRegex(query: string): RegExp | undefined {
  const trimmed = query.trim();
  if (!trimmed) return undefined;
  return new RegExp(trimmed.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
}

function cleanNutrients(nutrients: NutriNutrients): NutriNutrients {
  return Object.fromEntries(
    Object.entries(nutrients).filter(
      ([, value]) => typeof value === "number" && Number.isFinite(value),
    ),
  ) as NutriNutrients;
}

export async function listNutriFoods(input: {
  query?: string;
} = {}): Promise<NutriFood[]> {
  await ensureNutriFoodIndexes();
  const collection = await getFoodsCollection();
  const nameRegex = buildSearchRegex(input.query ?? "");

  const foods = await collection
    .find(nameRegex ? { name: nameRegex } : {})
    .sort({ active: -1, name: 1 })
    .toArray();

  return foods.map(stripMongoId);
}

export async function summarizeNutriFoods(): Promise<{
  total: number;
  active: number;
  archived: number;
}> {
  await ensureNutriFoodIndexes();
  const collection = await getFoodsCollection();

  const [total, active] = await Promise.all([
    collection.countDocuments(),
    collection.countDocuments({ active: true }),
  ]);

  return {
    total,
    active,
    archived: total - active,
  };
}

export async function createNutriFood(input: {
  food: SaveFoodInput;
  userId: string;
}): Promise<NutriFood> {
  await ensureNutriFoodIndexes();
  const collection = await getFoodsCollection();
  const now = nowISO();

  const food: NutriFood = {
    id: createFoodId(),
    name: input.food.name,
    source: input.food.source,
    sourceVersion: input.food.sourceVersion,
    servingDescription: input.food.servingDescription,
    nutrientsPer100g: cleanNutrients(input.food.nutrientsPer100g),
    allergens: input.food.allergens ?? [],
    active: input.food.active ?? true,
    createdByUserId: input.userId,
    createdAt: now,
    updatedAt: now,
  };

  await collection.insertOne(food);
  return food;
}

export async function updateNutriFood(input: {
  id: string;
  patch: Partial<SaveFoodInput>;
}): Promise<NutriFood | null> {
  await ensureNutriFoodIndexes();
  const collection = await getFoodsCollection();

  const patch = {
    ...input.patch,
    nutrientsPer100g: input.patch.nutrientsPer100g
      ? cleanNutrients(input.patch.nutrientsPer100g)
      : undefined,
  };
  const set: Partial<NutriFood> = { updatedAt: nowISO() };
  const unset: Record<string, ""> = {};

  for (const [key, value] of Object.entries(patch)) {
    if (typeof value === "undefined") {
      unset[key] = "";
    } else {
      set[key as keyof NutriFood] = value as never;
    }
  }

  const update: UpdateFilter<NutriFoodDocument> = { $set: set };
  if (Object.keys(unset).length > 0) update.$unset = unset;

  const result = await collection.findOneAndUpdate(
    { id: input.id },
    update,
    { returnDocument: "after" },
  );

  return result ? stripMongoId(result) : null;
}
