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

  it("keeps recipe totals but avoids per-weight calculations with invalid yield", () => {
    const result = calculateRecipeNutrition({
      yieldTotalG: 0,
      servingSizeG: 100,
      ingredients: [
        {
          id: "ingredient_1",
          foodId: "food_1",
          foodNameSnapshot: "Aveia",
          netWeightG: 40,
          nutrientsPer100gSnapshot: {
            energyKcal: 380,
            carbohydrateG: 67,
            proteinG: 13,
          },
        },
      ],
    });

    expect(result.servings).toBe(0);
    expect(result.totalNutrients).toMatchObject({
      energyKcal: 152,
      carbohydrateG: 26.8,
      proteinG: 5.2,
    });
    expect(result.nutrientsPer100g).toEqual({});
    expect(result.nutrientsPerServing).toEqual({});
  });
});
