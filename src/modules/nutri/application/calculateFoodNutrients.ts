import type { NutriNutrients } from "../domain/types";

function scaleNutrient(value: number | undefined, factor: number): number | undefined {
  if (typeof value !== "number" || !Number.isFinite(value)) return undefined;
  return Math.round(value * factor * 10) / 10;
}

export function calculateFoodNutrients(input: {
  nutrientsPer100g: NutriNutrients;
  amountG: number;
}): NutriNutrients {
  const factor = input.amountG > 0 ? input.amountG / 100 : 0;

  return {
    energyKcal: scaleNutrient(input.nutrientsPer100g.energyKcal, factor),
    carbohydrateG: scaleNutrient(input.nutrientsPer100g.carbohydrateG, factor),
    proteinG: scaleNutrient(input.nutrientsPer100g.proteinG, factor),
    fatG: scaleNutrient(input.nutrientsPer100g.fatG, factor),
    saturatedFatG: scaleNutrient(input.nutrientsPer100g.saturatedFatG, factor),
    fiberG: scaleNutrient(input.nutrientsPer100g.fiberG, factor),
    sodiumMg: scaleNutrient(input.nutrientsPer100g.sodiumMg, factor),
    addedSugarG: scaleNutrient(input.nutrientsPer100g.addedSugarG, factor),
  };
}
