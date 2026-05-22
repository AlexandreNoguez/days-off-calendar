import { calculateFoodNutrients } from "./calculateFoodNutrients";
import type { NutriMeal, NutriNutrients } from "../domain/types";

const NUTRIENT_KEYS = [
  "energyKcal",
  "carbohydrateG",
  "proteinG",
  "fatG",
  "saturatedFatG",
  "fiberG",
  "sodiumMg",
  "addedSugarG",
] as const;

function addNutrients(total: NutriNutrients, next: NutriNutrients): NutriNutrients {
  const output = { ...total };

  for (const key of NUTRIENT_KEYS) {
    const value = next[key];
    if (typeof value !== "number") continue;
    output[key] = Math.round(((output[key] ?? 0) + value) * 10) / 10;
  }

  return output;
}

export function calculateMealPlanTotals(meals: NutriMeal[]): NutriNutrients {
  return meals.reduce<NutriNutrients>((total, meal) => {
    return meal.items.reduce<NutriNutrients>((mealTotal, item) => {
      return addNutrients(
        mealTotal,
        calculateFoodNutrients({
          amountG: item.amountG,
          nutrientsPer100g: item.nutrientsPer100gSnapshot,
        }),
      );
    }, total);
  }, {});
}
