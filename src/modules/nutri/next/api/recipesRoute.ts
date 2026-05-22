import { NextResponse, type NextRequest } from "next/server";
import { writeAuditLog } from "@/src/lib/server/audit";
import { requireNutriUser, requestMeta } from "@/src/lib/server/auth";
import type { NutriRecipeInput } from "../../contracts/recipes";
import type { NutriNutrients } from "../../domain/types";
import { findNutriFoodsByIds } from "../../infra/foodRepository";
import {
  createNutriRecipe,
  listNutriRecipes,
  summarizeNutriRecipes,
} from "../../infra/recipeRepository";

export const runtime = "nodejs";

function optionalText(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed || undefined;
}

function positiveNumber(value: unknown): number | undefined {
  if (typeof value !== "number" || !Number.isFinite(value)) return undefined;
  return value > 0 ? value : undefined;
}

function nonNegativeNumber(value: unknown): number | undefined {
  if (typeof value !== "number" || !Number.isFinite(value)) return undefined;
  return value >= 0 ? value : undefined;
}

function stringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);
}

async function parseRecipeInput(body: NutriRecipeInput | null): Promise<{
  recipe?: {
    name: string;
    category?: string;
    ingredients: Array<{
      foodId: string;
      foodNameSnapshot: string;
      netWeightG: number;
      grossWeightG?: number;
      correctionFactor?: number;
      cookingFactor?: number;
      unitCostCents?: number;
      nutrientsPer100gSnapshot: NutriNutrients;
    }>;
    yieldTotalG: number;
    servingSizeG: number;
    preparationMethod?: string;
    allergens: string[];
  };
  error?: string;
}> {
  const name = optionalText(body?.name);
  const yieldTotalG = positiveNumber(body?.yieldTotalG);
  const servingSizeG = positiveNumber(body?.servingSizeG);
  const inputIngredients = Array.isArray(body?.ingredients) ? body.ingredients : [];

  if (!name) return { error: "Informe o nome da receita." };
  if (!yieldTotalG) return { error: "Informe o rendimento total em gramas." };
  if (!servingSizeG) return { error: "Informe o tamanho da porcao em gramas." };
  if (inputIngredients.length === 0) return { error: "Adicione ingredientes." };

  const foodIds = inputIngredients
    .map((ingredient) => optionalText(ingredient.foodId))
    .filter((id): id is string => Boolean(id));
  const foods = await findNutriFoodsByIds(foodIds);
  const foodsById = new Map(foods.map((food) => [food.id, food]));

  const ingredients = inputIngredients
    .map((ingredient) => {
      const foodId = optionalText(ingredient.foodId);
      const food = foodId ? foodsById.get(foodId) : undefined;
      const netWeightG = positiveNumber(ingredient.netWeightG);

      if (!food || !netWeightG) return null;

      return {
        foodId: food.id,
        foodNameSnapshot: food.name,
        netWeightG,
        grossWeightG: positiveNumber(ingredient.grossWeightG),
        correctionFactor: positiveNumber(ingredient.correctionFactor),
        cookingFactor: positiveNumber(ingredient.cookingFactor),
        unitCostCents: nonNegativeNumber(ingredient.unitCostCents),
        nutrientsPer100gSnapshot: food.nutrientsPer100g,
      };
    })
    .filter((ingredient): ingredient is NonNullable<typeof ingredient> =>
      Boolean(ingredient),
    );

  if (ingredients.length === 0) return { error: "Adicione ingredientes validos." };

  const missingFood = foodIds.find((foodId) => !foodsById.has(foodId));
  if (missingFood) return { error: "Um alimento selecionado nao foi encontrado." };

  return {
    recipe: {
      name,
      category: optionalText(body?.category),
      ingredients,
      yieldTotalG,
      servingSizeG,
      preparationMethod: optionalText(body?.preparationMethod),
      allergens: stringArray(body?.allergens),
    },
  };
}

export async function GET(request: NextRequest) {
  const user = await requireNutriUser().catch(() => null);
  if (!user) return NextResponse.json({ error: "Acesso negado." }, { status: 403 });

  const query = request.nextUrl.searchParams.get("q") ?? "";
  const [recipes, summary] = await Promise.all([
    listNutriRecipes({ query }),
    summarizeNutriRecipes(),
  ]);

  return NextResponse.json({ recipes, summary });
}

export async function POST(request: NextRequest) {
  const user = await requireNutriUser().catch(() => null);
  if (!user) return NextResponse.json({ error: "Acesso negado." }, { status: 403 });

  const body = (await request.json().catch(() => null)) as NutriRecipeInput | null;
  const parsed = await parseRecipeInput(body);

  if (!parsed.recipe) {
    return NextResponse.json(
      { error: parsed.error ?? "Dados invalidos." },
      { status: 400 },
    );
  }

  const recipe = await createNutriRecipe({
    recipe: parsed.recipe,
    userId: user.id,
  });

  await writeAuditLog({
    user,
    action: "nutri.recipe.created",
    entityType: "nutriRecipe",
    entityId: recipe.id,
    metadata: {
      ingredientCount: recipe.ingredients.length,
      status: recipe.status,
      servings: recipe.servings,
      version: recipe.version,
    },
    ...requestMeta(request),
  });

  return NextResponse.json({ recipe }, { status: 201 });
}
