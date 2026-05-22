import { describe, expect, it } from "vitest";
import { calculateMealPlanTotals } from "../application/calculateMealPlanTotals";
import type { NutriMeal } from "../domain/types";

describe("calculateMealPlanTotals", () => {
  it("sums nutrients from all meals and items", () => {
    const meals: NutriMeal[] = [
      {
        id: "meal_1",
        name: "Cafe da manha",
        items: [
          {
            id: "item_1",
            foodId: "food_1",
            foodNameSnapshot: "Banana",
            amountG: 100,
            nutrientsPer100gSnapshot: {
              energyKcal: 90,
              carbohydrateG: 22,
              proteinG: 1,
            },
          },
        ],
      },
      {
        id: "meal_2",
        name: "Almoco",
        items: [
          {
            id: "item_2",
            foodId: "food_2",
            foodNameSnapshot: "Arroz",
            amountG: 50,
            nutrientsPer100gSnapshot: {
              energyKcal: 130,
              carbohydrateG: 28,
              proteinG: 2.5,
            },
          },
        ],
      },
    ];

    expect(calculateMealPlanTotals(meals)).toMatchObject({
      energyKcal: 155,
      carbohydrateG: 36,
      proteinG: 2.3,
    });
  });
});
