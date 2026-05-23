import { NextResponse, type NextRequest } from "next/server";
import { writeAuditLog } from "@/src/lib/server/audit";
import { requireNutriUser, requestMeta } from "@/src/lib/server/auth";
import type { NutriRestaurantMenuInput } from "../../contracts/restaurantMenus";
import type { NutriNutrients } from "../../domain/types";
import {
  createNutriRestaurantMenu,
  listNutriRestaurantMenus,
  summarizeNutriRestaurantMenus,
} from "../../infra/restaurantMenuRepository";
import { findNutriRecipesByIds } from "../../infra/recipeRepository";

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

async function parseRestaurantMenuInput(
  body: NutriRestaurantMenuInput | null,
): Promise<{
  menu?: {
    title: string;
    date: string;
    expectedMeals?: number;
    items: Array<{
      mealName: string;
      recipeId: string;
      recipeNameSnapshot: string;
      recipeVersionSnapshot: number;
      recipeServingsSnapshot: number;
      servings: number;
      servingSizeGSnapshot: number;
      costPerServingCentsSnapshot?: number;
      nutrientsPerServingSnapshot: NutriNutrients;
      ingredientsSnapshot: Array<{
        foodId: string;
        foodNameSnapshot: string;
        netWeightGSnapshot: number;
        grossWeightGSnapshot?: number;
        unitCostCentsSnapshot?: number;
      }>;
    }>;
  };
  error?: string;
}> {
  const title = optionalText(body?.title);
  const date = optionalText(body?.date);
  const inputItems = Array.isArray(body?.items) ? body.items : [];

  if (!title) return { error: "Informe um titulo para o cardapio." };
  if (!date) return { error: "Informe a data do cardapio." };
  if (inputItems.length === 0) return { error: "Adicione receitas ao cardapio." };

  const recipeIds = inputItems
    .map((item) => optionalText(item.recipeId))
    .filter((id): id is string => Boolean(id));
  const recipes = await findNutriRecipesByIds(recipeIds);
  const recipesById = new Map(recipes.map((recipe) => [recipe.id, recipe]));

  const missingRecipe = recipeIds.find((recipeId) => !recipesById.has(recipeId));
  if (missingRecipe) return { error: "Uma receita selecionada nao foi encontrada." };

  const items = inputItems
    .map((item) => {
      const recipeId = optionalText(item.recipeId);
      const recipe = recipeId ? recipesById.get(recipeId) : undefined;
      const mealName = optionalText(item.mealName);
      const servings = positiveNumber(item.servings);

      if (!recipe || !mealName || !servings) return null;
      if (recipe.status !== "APPROVED") return null;

      return {
        mealName,
        recipeId: recipe.id,
        recipeNameSnapshot: recipe.name,
        recipeVersionSnapshot: recipe.version,
        recipeServingsSnapshot: recipe.servings,
        servings,
        servingSizeGSnapshot: recipe.servingSizeG,
        costPerServingCentsSnapshot: recipe.costPerServingCents,
        nutrientsPerServingSnapshot: recipe.nutrientsPerServing,
        ingredientsSnapshot: recipe.ingredients.map((ingredient) => ({
          foodId: ingredient.foodId,
          foodNameSnapshot: ingredient.foodNameSnapshot,
          netWeightGSnapshot: ingredient.netWeightG,
          grossWeightGSnapshot: ingredient.grossWeightG,
          unitCostCentsSnapshot: ingredient.unitCostCents,
        })),
      };
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item));

  if (items.length === 0) {
    return { error: "Adicione receitas aprovadas e validas ao cardapio." };
  }

  return {
    menu: {
      title,
      date,
      expectedMeals: positiveNumber(body?.expectedMeals),
      items,
    },
  };
}

export async function GET(request: NextRequest) {
  const user = await requireNutriUser().catch(() => null);
  if (!user) return NextResponse.json({ error: "Acesso negado." }, { status: 403 });

  const query = request.nextUrl.searchParams.get("q") ?? "";
  const [menus, summary] = await Promise.all([
    listNutriRestaurantMenus({ query }),
    summarizeNutriRestaurantMenus(),
  ]);

  return NextResponse.json({ menus, summary });
}

export async function POST(request: NextRequest) {
  const user = await requireNutriUser().catch(() => null);
  if (!user) return NextResponse.json({ error: "Acesso negado." }, { status: 403 });

  const body = (await request.json().catch(() => null)) as
    | NutriRestaurantMenuInput
    | null;
  const parsed = await parseRestaurantMenuInput(body);

  if (!parsed.menu) {
    return NextResponse.json(
      { error: parsed.error ?? "Dados invalidos." },
      { status: 400 },
    );
  }

  const menu = await createNutriRestaurantMenu({
    menu: parsed.menu,
    userId: user.id,
  });

  await writeAuditLog({
    user,
    action: "nutri.restaurant_menu.created",
    entityType: "nutriRestaurantMenu",
    entityId: menu.id,
    metadata: {
      date: menu.date,
      itemCount: menu.items.length,
      status: menu.status,
    },
    ...requestMeta(request),
  });

  return NextResponse.json({ menu }, { status: 201 });
}
