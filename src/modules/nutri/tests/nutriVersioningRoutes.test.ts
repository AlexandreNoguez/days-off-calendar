import { beforeEach, describe, expect, it, vi } from "vitest";
import type { NextRequest } from "next/server";
import { POST as duplicateMealPlan } from "../next/api/mealPlanDuplicateRoute";
import { POST as duplicateRecipe } from "../next/api/recipeDuplicateRoute";
import type { NutriMealPlan, NutriRecipe } from "../domain/types";

const authMocks = vi.hoisted(() => ({
  requireNutriUser: vi.fn(),
  requestMeta: vi.fn(() => ({ ip: "127.0.0.1" })),
}));

const auditMocks = vi.hoisted(() => ({
  writeAuditLog: vi.fn(),
}));

const mealPlanRepositoryMocks = vi.hoisted(() => ({
  duplicateNutriMealPlan: vi.fn(),
}));

const recipeRepositoryMocks = vi.hoisted(() => ({
  duplicateNutriRecipe: vi.fn(),
}));

vi.mock("@/src/lib/server/auth", () => authMocks);
vi.mock("@/src/lib/server/audit", () => auditMocks);
vi.mock("../infra/mealPlanRepository", () => mealPlanRepositoryMocks);
vi.mock("../infra/recipeRepository", () => recipeRepositoryMocks);

function request(): NextRequest {
  return new Request("http://localhost/api/nutri/versioning") as unknown as NextRequest;
}

function context(id: string) {
  return { params: Promise.resolve({ id }) };
}

function mealPlan(overrides: Partial<NutriMealPlan> = {}): NutriMealPlan {
  return {
    id: "meal_plan_new",
    patientId: "patient_1",
    title: "Plano aprovado - nova versao",
    status: "DRAFT",
    target: { energyKcal: 1800 },
    meals: [
      {
        id: "meal_new",
        name: "Cafe da manha",
        items: [
          {
            id: "item_new",
            foodId: "food_1",
            foodNameSnapshot: "Banana",
            amountG: 100,
            nutrientsPer100gSnapshot: { energyKcal: 90 },
          },
        ],
      },
    ],
    totals: { energyKcal: 90 },
    createdByUserId: "nutri_1",
    createdAt: "2026-06-21T00:00:00.000Z",
    updatedAt: "2026-06-21T00:00:00.000Z",
    ...overrides,
  };
}

function recipe(overrides: Partial<NutriRecipe> = {}): NutriRecipe {
  return {
    id: "recipe_new",
    name: "Receita aprovada - nova versao",
    status: "DRAFT",
    version: 2,
    sourceRecipeId: "recipe_source",
    ingredients: [
      {
        id: "ingredient_new",
        foodId: "food_1",
        foodNameSnapshot: "Arroz",
        netWeightG: 100,
        nutrientsPer100gSnapshot: { energyKcal: 130 },
      },
    ],
    yieldTotalG: 100,
    totalNetWeightG: 100,
    servingSizeG: 100,
    servings: 1,
    allergens: [],
    totalNutrients: { energyKcal: 130 },
    nutrientsPer100g: { energyKcal: 130 },
    nutrientsPerServing: { energyKcal: 130 },
    active: true,
    createdByUserId: "nutri_1",
    createdAt: "2026-06-21T00:00:00.000Z",
    updatedAt: "2026-06-21T00:00:00.000Z",
    ...overrides,
  };
}

describe("nutri versioning routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authMocks.requireNutriUser.mockResolvedValue({
      id: "nutri_1",
      username: "nutri",
      displayName: "Nutri",
      role: "NUTRI",
      active: true,
      createdAt: "2026-06-21T00:00:00.000Z",
      updatedAt: "2026-06-21T00:00:00.000Z",
    });
  });

  it("duplicates an approved meal plan into a draft without mutating the source id", async () => {
    mealPlanRepositoryMocks.duplicateNutriMealPlan.mockResolvedValue(mealPlan());

    const response = await duplicateMealPlan(request(), context("meal_plan_source"));
    const body = (await response.json()) as { mealPlan: NutriMealPlan };

    expect(response.status).toBe(201);
    expect(mealPlanRepositoryMocks.duplicateNutriMealPlan).toHaveBeenCalledWith({
      id: "meal_plan_source",
      userId: "nutri_1",
    });
    expect(body.mealPlan).toMatchObject({
      id: "meal_plan_new",
      status: "DRAFT",
      patientId: "patient_1",
    });
    expect(body.mealPlan.id).not.toBe("meal_plan_source");
    expect(auditMocks.writeAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "nutri.meal_plan.duplicated",
        entityId: "meal_plan_new",
        metadata: expect.objectContaining({
          sourceMealPlanId: "meal_plan_source",
          status: "DRAFT",
        }),
      }),
    );
  });

  it("duplicates an approved recipe into a new draft version linked to the source", async () => {
    recipeRepositoryMocks.duplicateNutriRecipe.mockResolvedValue(recipe());

    const response = await duplicateRecipe(request(), context("recipe_source"));
    const body = (await response.json()) as { recipe: NutriRecipe };

    expect(response.status).toBe(201);
    expect(recipeRepositoryMocks.duplicateNutriRecipe).toHaveBeenCalledWith({
      id: "recipe_source",
      userId: "nutri_1",
    });
    expect(body.recipe).toMatchObject({
      id: "recipe_new",
      status: "DRAFT",
      version: 2,
      sourceRecipeId: "recipe_source",
    });
    expect(body.recipe.id).not.toBe("recipe_source");
    expect(auditMocks.writeAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "nutri.recipe.duplicated",
        entityId: "recipe_new",
        metadata: expect.objectContaining({
          sourceRecipeId: "recipe_source",
          status: "DRAFT",
          version: 2,
        }),
      }),
    );
  });
});
