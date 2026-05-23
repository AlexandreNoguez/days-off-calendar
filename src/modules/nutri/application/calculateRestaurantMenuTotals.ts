import type {
  NutriNutrients,
  NutriRestaurantMenuRecipeItem,
} from "../domain/types";

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

function addScaledNutrients(
  total: NutriNutrients,
  nutrients: NutriNutrients,
  factor: number,
): NutriNutrients {
  const output = { ...total };

  for (const key of NUTRIENT_KEYS) {
    const value = nutrients[key];
    if (typeof value !== "number") continue;
    output[key] = Math.round(((output[key] ?? 0) + value * factor) * 10) / 10;
  }

  return output;
}

export function calculateRestaurantMenuTotals(input: {
  items: NutriRestaurantMenuRecipeItem[];
  expectedMeals?: number;
}): {
  totals: NutriNutrients;
  totalCostCents?: number;
  costPerCapitaCents?: number;
} {
  const totals = input.items.reduce<NutriNutrients>((current, item) => {
    return addScaledNutrients(
      current,
      item.nutrientsPerServingSnapshot,
      item.servings,
    );
  }, {});
  const totalCostCents = input.items.reduce((current, item) => {
    const cost = item.costPerServingCentsSnapshot;
    return typeof cost === "number" ? current + cost * item.servings : current;
  }, 0);
  const expectedMeals =
    typeof input.expectedMeals === "number" && input.expectedMeals > 0
      ? input.expectedMeals
      : undefined;

  return {
    totals,
    totalCostCents: totalCostCents || undefined,
    costPerCapitaCents:
      totalCostCents > 0 && expectedMeals
        ? Math.round(totalCostCents / expectedMeals)
        : undefined,
  };
}
