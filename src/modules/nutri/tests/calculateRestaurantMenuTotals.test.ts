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
          servings: 10,
          servingSizeGSnapshot: 250,
          costPerServingCentsSnapshot: 450,
          nutrientsPerServingSnapshot: {
            energyKcal: 320,
            carbohydrateG: 48,
            proteinG: 12,
          },
        },
        {
          id: "item_2",
          mealName: "Sobremesa",
          recipeId: "recipe_2",
          recipeNameSnapshot: "Fruta",
          recipeVersionSnapshot: 1,
          servings: 10,
          servingSizeGSnapshot: 120,
          costPerServingCentsSnapshot: 180,
          nutrientsPerServingSnapshot: {
            energyKcal: 90,
            carbohydrateG: 22,
            proteinG: 1,
          },
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
});
