import { NextResponse, type NextRequest } from "next/server";
import { writeAuditLog } from "@/src/lib/server/audit";
import { requireNutriUser, requestMeta } from "@/src/lib/server/auth";
import type {
  NutriDemoSeedEntityType,
  NutriDemoSeedResponse,
} from "../../dev/demoSeedData";
import { isNutriDemoToolsEnabled } from "../../dev/demoSeedGuards";
import {
  seedDemoFoods,
  seedDemoMealPlans,
  seedDemoPatients,
  seedDemoRecipes,
  seedDemoRestaurantMenus,
} from "../../dev/demoSeeds";

type SeedRunner = (input: { userId: string }) => Promise<NutriDemoSeedResponse>;

async function runSeed(
  request: NextRequest,
  input: {
    action: string;
    entityType: NutriDemoSeedEntityType;
    runner: SeedRunner;
  },
) {
  const user = await requireNutriUser().catch(() => null);
  if (!user) return NextResponse.json({ error: "Acesso negado." }, { status: 403 });

  if (!isNutriDemoToolsEnabled()) {
    return NextResponse.json(
      { error: "Seeds de demo estao desabilitados." },
      { status: 403 },
    );
  }

  const result = await input.runner({ userId: user.id });

  await writeAuditLog({
    user,
    action: input.action,
    entityType: "nutriDemoSeed",
    entityId: input.entityType,
    metadata: result,
    ...requestMeta(request),
  });

  return NextResponse.json(result, { status: 201 });
}

export async function GET() {
  const user = await requireNutriUser().catch(() => null);
  if (!user) return NextResponse.json({ error: "Acesso negado." }, { status: 403 });

  return NextResponse.json({ enabled: isNutriDemoToolsEnabled() });
}

export async function seedPatientsPOST(request: NextRequest) {
  return runSeed(request, {
    action: "nutri.demo_seed.patients",
    entityType: "patients",
    runner: seedDemoPatients,
  });
}

export async function seedFoodsPOST(request: NextRequest) {
  return runSeed(request, {
    action: "nutri.demo_seed.foods",
    entityType: "foods",
    runner: seedDemoFoods,
  });
}

export async function seedMealPlansPOST(request: NextRequest) {
  return runSeed(request, {
    action: "nutri.demo_seed.meal_plans",
    entityType: "mealPlans",
    runner: seedDemoMealPlans,
  });
}

export async function seedRecipesPOST(request: NextRequest) {
  return runSeed(request, {
    action: "nutri.demo_seed.recipes",
    entityType: "recipes",
    runner: seedDemoRecipes,
  });
}

export async function seedRestaurantMenusPOST(request: NextRequest) {
  return runSeed(request, {
    action: "nutri.demo_seed.restaurant_menus",
    entityType: "restaurantMenus",
    runner: seedDemoRestaurantMenus,
  });
}
