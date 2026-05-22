import { randomUUID } from "crypto";
import type { Collection, UpdateFilter } from "mongodb";
import { getDb } from "@/src/lib/server/mongodb";
import { calculateRecipeNutrition } from "../application/calculateRecipeNutrition";
import type { NutriRecipe, NutriRecipeIngredient } from "../domain/types";

type NutriRecipeDocument = NutriRecipe & { _id?: unknown };

type SaveRecipeInput = {
  name: string;
  category?: string;
  ingredients: Array<Omit<NutriRecipeIngredient, "id">>;
  yieldTotalG: number;
  servingSizeG: number;
  preparationMethod?: string;
  allergens?: string[];
  active?: boolean;
};

let indexesPromise: Promise<void> | undefined;

function nowISO(): string {
  return new Date().toISOString();
}

function createRecipeId(): string {
  return `nutri_recipe_${randomUUID()}`;
}

function createRecipeIngredientId(): string {
  return `nutri_recipe_ingredient_${randomUUID()}`;
}

function stripMongoId(document: NutriRecipeDocument): NutriRecipe {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { _id, ...recipe } = document;
  return recipe;
}

async function getRecipesCollection(): Promise<Collection<NutriRecipeDocument>> {
  const db = await getDb();
  return db.collection<NutriRecipeDocument>("nutriRecipes");
}

async function ensureNutriRecipeIndexes(): Promise<void> {
  if (!indexesPromise) {
    indexesPromise = (async () => {
      const collection = await getRecipesCollection();

      await collection.createIndexes([
        { key: { id: 1 }, name: "nutriRecipes_id_unique", unique: true },
        { key: { name: 1 }, name: "nutriRecipes_name" },
        { key: { active: 1, name: 1 }, name: "nutriRecipes_active_name" },
        { key: { category: 1, name: 1 }, name: "nutriRecipes_category_name" },
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

function withIngredientIds(
  ingredients: SaveRecipeInput["ingredients"],
): NutriRecipeIngredient[] {
  return ingredients.map((ingredient) => ({
    ...ingredient,
    id: createRecipeIngredientId(),
  }));
}

function buildRecipe(input: {
  id: string;
  recipe: SaveRecipeInput;
  userId: string;
  createdAt: string;
  updatedAt: string;
}): NutriRecipe {
  const ingredients = withIngredientIds(input.recipe.ingredients);
  const nutrition = calculateRecipeNutrition({
    ingredients,
    yieldTotalG: input.recipe.yieldTotalG,
    servingSizeG: input.recipe.servingSizeG,
  });
  const totalCostCents = ingredients.reduce((total, ingredient) => {
    const cost = ingredient.unitCostCents;
    return typeof cost === "number" ? total + cost : total;
  }, 0);

  return {
    id: input.id,
    name: input.recipe.name,
    category: input.recipe.category,
    ingredients,
    yieldTotalG: input.recipe.yieldTotalG,
    servingSizeG: input.recipe.servingSizeG,
    servings: nutrition.servings,
    preparationMethod: input.recipe.preparationMethod,
    allergens: input.recipe.allergens ?? [],
    totalCostCents: totalCostCents || undefined,
    costPerServingCents:
      totalCostCents > 0 && nutrition.servings > 0
        ? Math.round(totalCostCents / nutrition.servings)
        : undefined,
    totalNutrients: nutrition.totalNutrients,
    nutrientsPer100g: nutrition.nutrientsPer100g,
    nutrientsPerServing: nutrition.nutrientsPerServing,
    active: input.recipe.active ?? true,
    createdByUserId: input.userId,
    createdAt: input.createdAt,
    updatedAt: input.updatedAt,
  };
}

export async function listNutriRecipes(input: {
  query?: string;
} = {}): Promise<NutriRecipe[]> {
  await ensureNutriRecipeIndexes();
  const collection = await getRecipesCollection();
  const nameRegex = buildSearchRegex(input.query ?? "");

  const recipes = await collection
    .find(nameRegex ? { name: nameRegex } : {})
    .sort({ active: -1, name: 1 })
    .toArray();

  return recipes.map(stripMongoId);
}

export async function summarizeNutriRecipes(): Promise<{
  total: number;
  active: number;
  archived: number;
}> {
  await ensureNutriRecipeIndexes();
  const collection = await getRecipesCollection();

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

export async function createNutriRecipe(input: {
  recipe: SaveRecipeInput;
  userId: string;
}): Promise<NutriRecipe> {
  await ensureNutriRecipeIndexes();
  const collection = await getRecipesCollection();
  const now = nowISO();
  const recipe = buildRecipe({
    id: createRecipeId(),
    recipe: input.recipe,
    userId: input.userId,
    createdAt: now,
    updatedAt: now,
  });

  await collection.insertOne(recipe);
  return recipe;
}

export async function updateNutriRecipe(input: {
  id: string;
  patch: Partial<SaveRecipeInput>;
}): Promise<NutriRecipe | null> {
  await ensureNutriRecipeIndexes();
  const collection = await getRecipesCollection();
  const existing = await collection.findOne({ id: input.id });
  if (!existing) return null;

  const nextInput: SaveRecipeInput = {
    name: input.patch.name ?? existing.name,
    category: input.patch.category ?? existing.category,
    ingredients: input.patch.ingredients ?? existing.ingredients,
    yieldTotalG: input.patch.yieldTotalG ?? existing.yieldTotalG,
    servingSizeG: input.patch.servingSizeG ?? existing.servingSizeG,
    preparationMethod: input.patch.preparationMethod ?? existing.preparationMethod,
    allergens: input.patch.allergens ?? existing.allergens,
    active: input.patch.active ?? existing.active,
  };
  const next = buildRecipe({
    id: existing.id,
    recipe: nextInput,
    userId: existing.createdByUserId,
    createdAt: existing.createdAt,
    updatedAt: nowISO(),
  });
  const update: UpdateFilter<NutriRecipeDocument> = { $set: next };
  const result = await collection.findOneAndUpdate(
    { id: input.id },
    update,
    { returnDocument: "after" },
  );

  return result ? stripMongoId(result) : null;
}
