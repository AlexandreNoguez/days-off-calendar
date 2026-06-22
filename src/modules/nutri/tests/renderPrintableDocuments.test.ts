import { describe, expect, it } from "vitest";
import { renderMealPlanHtml } from "../application/renderMealPlanHtml";
import { renderRecipeHtml } from "../application/renderRecipeHtml";
import { renderRestaurantMenuHtml } from "../application/renderRestaurantMenuHtml";
import type {
  NutriMealPlan,
  NutriPatient,
  NutriRecipe,
  NutriRestaurantMenu,
} from "../domain/types";

const EXPORTED_AT = "2026-06-21T12:00:00.000Z";
const RESPONSIBLE_NAME = "Nutri <Responsavel>";

function patient(overrides: Partial<NutriPatient> = {}): NutriPatient {
  return {
    id: "patient_1",
    fullName: "Paciente <Teste>",
    sex: "NOT_INFORMED",
    active: true,
    createdByUserId: "nutri_1",
    createdAt: "2026-06-21T00:00:00.000Z",
    updatedAt: "2026-06-21T00:00:00.000Z",
    ...overrides,
  };
}

function mealPlan(overrides: Partial<NutriMealPlan> = {}): NutriMealPlan {
  return {
    id: "meal_plan_1",
    patientId: "patient_1",
    title: "Plano <Especial>",
    status: "APPROVED",
    target: { energyKcal: 1800, proteinG: 90 },
    meals: [
      {
        id: "meal_1",
        name: "Cafe & manha",
        items: [
          {
            id: "item_1",
            foodId: "food_1",
            foodNameSnapshot: "Aveia <fina>",
            amountG: 40,
            householdMeasure: "4 colheres",
            nutrientsPer100gSnapshot: { energyKcal: 380, proteinG: 13 },
          },
        ],
      },
    ],
    totals: { energyKcal: 152, proteinG: 5.2 },
    approvedAt: "2026-06-21T01:00:00.000Z",
    approvedByUserId: "nutri_1",
    createdByUserId: "nutri_1",
    createdAt: "2026-06-21T00:00:00.000Z",
    updatedAt: "2026-06-21T00:00:00.000Z",
    ...overrides,
  };
}

function recipe(overrides: Partial<NutriRecipe> = {}): NutriRecipe {
  return {
    id: "recipe_1",
    name: "Sopa <Caseira>",
    category: "Jantar",
    status: "DRAFT",
    version: 2,
    ingredients: [
      {
        id: "ingredient_1",
        foodId: "food_1",
        foodNameSnapshot: "Cenoura <cubos>",
        netWeightG: 100,
        grossWeightG: 120,
        correctionFactor: 1.2,
        unitCostCents: 350,
        nutrientsPer100gSnapshot: { energyKcal: 41 },
      },
    ],
    yieldTotalG: 300,
    totalNetWeightG: 100,
    totalGrossWeightG: 120,
    correctionFactor: 1.2,
    servingSizeG: 150,
    servings: 2,
    preparationMethod: "Cozinhar <bem> antes de servir.",
    allergens: ["Sem gluten"],
    totalCostCents: 350,
    costPerServingCents: 175,
    totalNutrients: { energyKcal: 41 },
    nutrientsPer100g: { energyKcal: 13.7 },
    nutrientsPerServing: { energyKcal: 20.5 },
    active: true,
    createdByUserId: "nutri_1",
    createdAt: "2026-06-21T00:00:00.000Z",
    updatedAt: "2026-06-21T00:00:00.000Z",
    ...overrides,
  };
}

function restaurantMenu(
  overrides: Partial<NutriRestaurantMenu> = {},
): NutriRestaurantMenu {
  return {
    id: "menu_1",
    title: "Cardapio <Operacional>",
    date: "2026-06-21",
    status: "ARCHIVED",
    expectedMeals: 10,
    items: [
      {
        id: "menu_item_1",
        mealName: "Almoco",
        recipeId: "recipe_1",
        recipeNameSnapshot: "Sopa <Caseira>",
        recipeVersionSnapshot: 2,
        recipeServingsSnapshot: 2,
        servings: 10,
        servingSizeGSnapshot: 150,
        costPerServingCentsSnapshot: 175,
        nutrientsPerServingSnapshot: { energyKcal: 20.5 },
        preparationMethodSnapshot: "Aquecer <antes> do servico.",
        ingredientsSnapshot: [],
      },
    ],
    totalCostCents: 1750,
    costPerCapitaCents: 175,
    totals: { energyKcal: 205 },
    shoppingList: [
      {
        foodId: "food_1",
        foodNameSnapshot: "Cenoura <cubos>",
        totalNetWeightG: 500,
        totalGrossWeightG: 600,
        recipeNames: ["Sopa <Caseira>"],
      },
    ],
    createdByUserId: "nutri_1",
    createdAt: "2026-06-21T00:00:00.000Z",
    updatedAt: "2026-06-21T00:00:00.000Z",
    ...overrides,
  };
}

describe("printable nutri documents", () => {
  it("renders a meal plan with export metadata, status and escaped content", () => {
    const html = renderMealPlanHtml({
      mealPlan: mealPlan(),
      patient: patient(),
      exportedAt: EXPORTED_AT,
      responsibleName: RESPONSIBLE_NAME,
    });

    expect(html).toContain("Plano &lt;Especial&gt;");
    expect(html).toContain("Paciente: Paciente &lt;Teste&gt;");
    expect(html).toContain("Status: Aprovado");
    expect(html).toContain("Responsavel tecnico: Nutri &lt;Responsavel&gt;");
    expect(html).toContain("Exportado em:");
    expect(html).toContain("Documento de apoio tecnico");
    expect(html).not.toContain("Plano <Especial>");
  });

  it("renders a recipe with version, professional review notice and escaped content", () => {
    const html = renderRecipeHtml({
      recipe: recipe(),
      exportedAt: EXPORTED_AT,
      responsibleName: RESPONSIBLE_NAME,
    });

    expect(html).toContain("Sopa &lt;Caseira&gt;");
    expect(html).toContain("Status: Rascunho / Versao: 2");
    expect(html).toContain("Responsavel tecnico: Nutri &lt;Responsavel&gt;");
    expect(html).toContain("Cozinhar &lt;bem&gt; antes de servir.");
    expect(html).toContain("revisao profissional");
    expect(html).not.toContain("Sopa <Caseira>");
  });

  it("renders a restaurant menu with date, status and escaped operational rows", () => {
    const html = renderRestaurantMenuHtml({
      menu: restaurantMenu(),
      exportedAt: EXPORTED_AT,
      responsibleName: RESPONSIBLE_NAME,
    });

    expect(html).toContain("Cardapio &lt;Operacional&gt;");
    expect(html).toContain("Data: 21/06/2026");
    expect(html).toContain("Status: Arquivado");
    expect(html).toContain("Responsavel tecnico: Nutri &lt;Responsavel&gt;");
    expect(html).toContain("Cenoura &lt;cubos&gt;");
    expect(html).toContain("Documento de apoio tecnico");
    expect(html).not.toContain("Cardapio <Operacional>");
  });
});
