import { describe, expect, it } from "vitest";
import { calculateRecipeNutrition } from "../application/calculateRecipeNutrition";

describe("calculateRecipeNutrition", () => {
  it("calculates recipe total, per 100g and per serving nutrients", () => {
    const result = calculateRecipeNutrition({
      yieldTotalG: 300,
      servingSizeG: 100,
      ingredients: [
        {
          id: "ingredient_1",
          foodId: "food_1",
          foodNameSnapshot: "Arroz",
          netWeightG: 200,
          nutrientsPer100gSnapshot: {
            energyKcal: 130,
            carbohydrateG: 28,
            proteinG: 2,
          },
        },
        {
          id: "ingredient_2",
          foodId: "food_2",
          foodNameSnapshot: "Feijao",
          netWeightG: 100,
          nutrientsPer100gSnapshot: {
            energyKcal: 80,
            carbohydrateG: 14,
            proteinG: 5,
          },
        },
      ],
    });

    expect(result.servings).toBe(3);
    expect(result.totalNutrients).toMatchObject({
      energyKcal: 340,
      carbohydrateG: 70,
      proteinG: 9,
    });
    expect(result.nutrientsPer100g).toMatchObject({
      energyKcal: 113.3,
      carbohydrateG: 23.3,
      proteinG: 3,
    });
    expect(result.nutrientsPerServing).toEqual(result.nutrientsPer100g);
  });
});
