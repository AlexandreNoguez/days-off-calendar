import type { NutriRecipeIngredient } from "../domain/types";

function roundFactor(value: number): number {
  return Math.round(value * 100) / 100;
}

function roundWeight(value: number): number {
  return Math.round(value * 10) / 10;
}

export function calculateRecipeTechnicalFactors(input: {
  ingredients: NutriRecipeIngredient[];
  yieldTotalG: number;
}): {
  ingredients: NutriRecipeIngredient[];
  totalNetWeightG: number;
  totalGrossWeightG?: number;
  correctionFactor?: number;
  cookingFactor?: number;
} {
  const ingredients = input.ingredients.map((ingredient) => ({
    ...ingredient,
    correctionFactor:
      typeof ingredient.grossWeightG === "number" && ingredient.netWeightG > 0
        ? roundFactor(ingredient.grossWeightG / ingredient.netWeightG)
        : ingredient.correctionFactor,
  }));
  const totalNetWeightG = ingredients.reduce(
    (total, ingredient) => total + ingredient.netWeightG,
    0,
  );
  const grossWeights = ingredients
    .map((ingredient) => ingredient.grossWeightG)
    .filter((value): value is number => typeof value === "number");
  const totalGrossWeightG =
    grossWeights.length > 0
      ? grossWeights.reduce((total, value) => total + value, 0)
      : undefined;

  return {
    ingredients,
    totalNetWeightG: roundWeight(totalNetWeightG),
    totalGrossWeightG:
      typeof totalGrossWeightG === "number"
        ? roundWeight(totalGrossWeightG)
        : undefined,
    correctionFactor:
      typeof totalGrossWeightG === "number" && totalNetWeightG > 0
        ? roundFactor(totalGrossWeightG / totalNetWeightG)
        : undefined,
    cookingFactor:
      input.yieldTotalG > 0 && totalNetWeightG > 0
        ? roundFactor(input.yieldTotalG / totalNetWeightG)
        : undefined,
  };
}
