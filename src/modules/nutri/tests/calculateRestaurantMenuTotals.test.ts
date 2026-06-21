import { describe, expect, it } from "vitest";
import { calculateRestaurantMenuTotals } from "../application/calculateRestaurantMenuTotals";

describe("calculateRestaurantMenuTotals", () => {
  it("calculates menu nutrients, total cost and per capita cost", () => {
    const result = calculateRestaurantMenuTotals({
      expectedMeals: 10,
      items: [
        {
          id: "item_1",
          mealName: "Almoco",
          recipeId: "recipe_1",
          recipeNameSnapshot: "Arroz com feijao",
          recipeVersionSnapshot: 1,
          recipeServingsSnapshot: 5,
          servings: 10,
          servingSizeGSnapshot: 250,
          costPerServingCentsSnapshot: 450,
          nutrientsPerServingSnapshot: {
            energyKcal: 320,
            carbohydrateG: 48,
            proteinG: 12,
          },
          ingredientsSnapshot: [],
        },
        {
          id: "item_2",
          mealName: "Sobremesa",
          recipeId: "recipe_2",
          recipeNameSnapshot: "Fruta",
          recipeVersionSnapshot: 1,
          recipeServingsSnapshot: 10,
          servings: 10,
          servingSizeGSnapshot: 120,
          costPerServingCentsSnapshot: 180,
          nutrientsPerServingSnapshot: {
            energyKcal: 90,
            carbohydrateG: 22,
            proteinG: 1,
          },
          ingredientsSnapshot: [],
        },
      ],
    });

    expect(result.totals).toMatchObject({
      energyKcal: 4100,
      carbohydrateG: 700,
      proteinG: 130,
    });
    expect(result.totalCostCents).toBe(6300);
    expect(result.costPerCapitaCents).toBe(630);
  });

  it("uses stored recipe snapshots instead of any mutable recipe source", () => {
    const approvedRecipeSnapshot = {
      recipeId: "recipe_approved_v1",
      recipeNameSnapshot: "Sopa aprovada",
      recipeVersionSnapshot: 1,
      recipeServingsSnapshot: 4,
      servingSizeGSnapshot: 250,
      costPerServingCentsSnapshot: 320,
      nutrientsPerServingSnapshot: {
        energyKcal: 180,
        carbohydrateG: 22,
        proteinG: 9,
      },
      ingredientsSnapshot: [],
    };
    const editedRecipeAfterMenuCreation = {
      version: 2,
      costPerServingCents: 999,
      nutrientsPerServing: {
        energyKcal: 999,
        carbohydrateG: 999,
        proteinG: 999,
      },
    };

    const result = calculateRestaurantMenuTotals({
      expectedMeals: 8,
      items: [
        {
          id: "item_1",
          mealName: "Jantar",
          servings: 8,
          ...approvedRecipeSnapshot,
        },
      ],
    });

    expect(editedRecipeAfterMenuCreation.version).toBe(2);
    expect(result.totals).toMatchObject({
      energyKcal: 1440,
      carbohydrateG: 176,
      proteinG: 72,
    });
    expect(result.totalCostCents).toBe(2560);
    expect(result.costPerCapitaCents).toBe(320);
  });

  it("omits per capita cost when expected meals are not valid", () => {
    const result = calculateRestaurantMenuTotals({
      expectedMeals: 0,
      items: [
        {
          id: "item_1",
          mealName: "Almoco",
          recipeId: "recipe_1",
          recipeNameSnapshot: "Prato",
          recipeVersionSnapshot: 1,
          recipeServingsSnapshot: 2,
          servings: 2,
          servingSizeGSnapshot: 300,
          costPerServingCentsSnapshot: 500,
          nutrientsPerServingSnapshot: {
            energyKcal: 250,
          },
          ingredientsSnapshot: [],
        },
      ],
    });

    expect(result.totalCostCents).toBe(1000);
    expect(result.costPerCapitaCents).toBeUndefined();
  });
});
