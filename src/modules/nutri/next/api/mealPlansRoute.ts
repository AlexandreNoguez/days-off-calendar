import { NextResponse, type NextRequest } from "next/server";
import { writeAuditLog } from "@/src/lib/server/audit";
import { requireNutriUser, requestMeta } from "@/src/lib/server/auth";
import type { NutriMealPlanInput } from "../../contracts/mealPlans";
import type { NutriNutrients } from "../../domain/types";
import { findNutriFoodsByIds } from "../../infra/foodRepository";
import { createNutriMealPlan, listNutriMealPlans } from "../../infra/mealPlanRepository";
import { findNutriPatientById } from "../../infra/patientRepository";

export const runtime = "nodejs";

function optionalText(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed || undefined;
}

function optionalNumber(value: unknown): number | undefined {
  if (typeof value !== "number" || !Number.isFinite(value)) return undefined;
  return value >= 0 ? value : undefined;
}

function positiveNumber(value: unknown): number | undefined {
  if (typeof value !== "number" || !Number.isFinite(value)) return undefined;
  return value > 0 ? value : undefined;
}

function parseTarget(value: unknown): NutriNutrients {
  const source = (value ?? {}) as Record<string, unknown>;

  return {
    energyKcal: optionalNumber(source.energyKcal),
    carbohydrateG: optionalNumber(source.carbohydrateG),
    proteinG: optionalNumber(source.proteinG),
    fatG: optionalNumber(source.fatG),
    fiberG: optionalNumber(source.fiberG),
    sodiumMg: optionalNumber(source.sodiumMg),
  };
}

async function parseMealPlanInput(body: NutriMealPlanInput | null): Promise<{
  mealPlan?: {
    patientId: string;
    title: string;
    target: NutriNutrients;
    meals: Array<{
      name: string;
      time?: string;
      items: Array<{
        foodId: string;
        foodNameSnapshot: string;
        amountG: number;
        householdMeasure?: string;
        nutrientsPer100gSnapshot: NutriNutrients;
      }>;
    }>;
  };
  error?: string;
}> {
  const patientId = optionalText(body?.patientId);
  const title = optionalText(body?.title);
  const inputMeals = Array.isArray(body?.meals) ? body.meals : [];

  if (!patientId) return { error: "Selecione um paciente." };
  if (!title) return { error: "Informe um titulo para o plano." };
  if (inputMeals.length === 0) return { error: "Adicione pelo menos uma refeicao." };

  const foodIds = inputMeals.flatMap((meal) =>
    Array.isArray(meal.items)
      ? meal.items
          .map((item) => optionalText(item.foodId))
          .filter((id): id is string => Boolean(id))
      : [],
  );
  const foods = await findNutriFoodsByIds(foodIds);
  const foodsById = new Map(foods.map((food) => [food.id, food]));

  const meals = inputMeals
    .map((meal) => {
      const name = optionalText(meal.name);
      const items = (meal.items ?? [])
        .map((item) => {
          const foodId = optionalText(item.foodId);
          const food = foodId ? foodsById.get(foodId) : undefined;
          const amountG = positiveNumber(item.amountG);

          if (!food || !amountG) return null;

          return {
            foodId: food.id,
            foodNameSnapshot: food.name,
            amountG,
            householdMeasure: optionalText(item.householdMeasure),
            nutrientsPer100gSnapshot: food.nutrientsPer100g,
          };
        })
        .filter((item): item is NonNullable<typeof item> => Boolean(item));

      if (!name || items.length === 0) return null;

      return {
        name,
        time: optionalText(meal.time),
        items,
      };
    })
    .filter((meal): meal is NonNullable<typeof meal> => Boolean(meal));

  if (meals.length === 0) {
    return { error: "Adicione alimentos validos ao plano." };
  }

  const missingFood = foodIds.find((foodId) => !foodsById.has(foodId));
  if (missingFood) return { error: "Um alimento selecionado nao foi encontrado." };

  return {
    mealPlan: {
      patientId,
      title,
      target: parseTarget(body?.target),
      meals,
    },
  };
}

export async function GET(request: NextRequest) {
  const user = await requireNutriUser().catch(() => null);
  if (!user) return NextResponse.json({ error: "Acesso negado." }, { status: 403 });

  const patientId = request.nextUrl.searchParams.get("patientId")?.trim() || undefined;
  const mealPlans = await listNutriMealPlans({ patientId });
  return NextResponse.json({ mealPlans });
}

export async function POST(request: NextRequest) {
  const user = await requireNutriUser().catch(() => null);
  if (!user) return NextResponse.json({ error: "Acesso negado." }, { status: 403 });

  const body = (await request.json().catch(() => null)) as NutriMealPlanInput | null;
  const parsed = await parseMealPlanInput(body);

  if (!parsed.mealPlan) {
    return NextResponse.json(
      { error: parsed.error ?? "Dados invalidos." },
      { status: 400 },
    );
  }

  const patient = await findNutriPatientById(parsed.mealPlan.patientId);
  if (!patient) {
    return NextResponse.json({ error: "Paciente nao encontrado." }, { status: 404 });
  }

  const mealPlan = await createNutriMealPlan({
    mealPlan: parsed.mealPlan,
    userId: user.id,
  });

  await writeAuditLog({
    user,
    action: "nutri.meal_plan.created",
    entityType: "nutriMealPlan",
    entityId: mealPlan.id,
    metadata: {
      patientId: mealPlan.patientId,
      status: mealPlan.status,
      mealCount: mealPlan.meals.length,
    },
    ...requestMeta(request),
  });

  return NextResponse.json({ mealPlan }, { status: 201 });
}
