import { calculateFoodNutrients } from "./calculateFoodNutrients";
import type { NutriNutrients, NutriRecipeIngredient } from "../domain/types";

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

function scaleNutrients(input: NutriNutrients, factor: number): NutriNutrients {
  return Object.fromEntries(
    NUTRIENT_KEYS.map((key) => {
      const value = input[key];
      return [
        key,
        typeof value === "number" ? Math.round(value * factor * 10) / 10 : undefined,
      ];
    }).filter(([, value]) => typeof value === "number"),
  ) as NutriNutrients;
}

export function calculateRecipeNutrition(input: {
  ingredients: NutriRecipeIngredient[];
  yieldTotalG: number;
  servingSizeG: number;
}): {
  totalNutrients: NutriNutrients;
  nutrientsPer100g: NutriNutrients;
  nutrientsPerServing: NutriNutrients;
  servings: number;
} {
  const totalNutrients = input.ingredients.reduce<NutriNutrients>((total, ingredient) => {
    return addNutrients(
      total,
      calculateFoodNutrients({
        amountG: ingredient.netWeightG,
        nutrientsPer100g: ingredient.nutrientsPer100gSnapshot,
      }),
    );
  }, {});

  const yieldTotalG = input.yieldTotalG > 0 ? input.yieldTotalG : 0;
  const servingSizeG = input.servingSizeG > 0 ? input.servingSizeG : 0;
  const servings =
    yieldTotalG > 0 && servingSizeG > 0
      ? Math.round((yieldTotalG / servingSizeG) * 10) / 10
      : 0;

  return {
    totalNutrients,
    nutrientsPer100g:
      yieldTotalG > 0 ? scaleNutrients(totalNutrients, 100 / yieldTotalG) : {},
    nutrientsPerServing:
      yieldTotalG > 0 && servingSizeG > 0
        ? scaleNutrients(totalNutrients, servingSizeG / yieldTotalG)
        : {},
    servings,
  };
}
