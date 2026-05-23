import type {
  NutriRestaurantMenuRecipeItem,
  NutriRestaurantMenuShoppingListItem,
} from "../domain/types";

function roundWeight(value: number): number {
  return Math.round(value * 10) / 10;
}

export function calculateRestaurantMenuShoppingList(
  items: NutriRestaurantMenuRecipeItem[],
): NutriRestaurantMenuShoppingListItem[] {
  const byFoodId = new Map<
    string,
    {
      foodId: string;
      foodNameSnapshot: string;
      totalNetWeightG: number;
      totalGrossWeightG: number;
      hasGrossWeight: boolean;
      recipeNames: Set<string>;
    }
  >();

  for (const item of items) {
    const recipeServings =
      item.recipeServingsSnapshot > 0 ? item.recipeServingsSnapshot : 1;
    const factor = item.servings / recipeServings;

    for (const ingredient of item.ingredientsSnapshot) {
      const current =
        byFoodId.get(ingredient.foodId) ??
        {
          foodId: ingredient.foodId,
          foodNameSnapshot: ingredient.foodNameSnapshot,
          totalNetWeightG: 0,
          totalGrossWeightG: 0,
          hasGrossWeight: false,
          recipeNames: new Set<string>(),
        };

      current.totalNetWeightG += ingredient.netWeightGSnapshot * factor;
      current.recipeNames.add(item.recipeNameSnapshot);

      if (typeof ingredient.grossWeightGSnapshot === "number") {
        current.totalGrossWeightG += ingredient.grossWeightGSnapshot * factor;
        current.hasGrossWeight = true;
      }

      byFoodId.set(ingredient.foodId, current);
    }
  }

  return [...byFoodId.values()]
    .map((item) => ({
      foodId: item.foodId,
      foodNameSnapshot: item.foodNameSnapshot,
      totalNetWeightG: roundWeight(item.totalNetWeightG),
      totalGrossWeightG: item.hasGrossWeight
        ? roundWeight(item.totalGrossWeightG)
        : undefined,
      recipeNames: [...item.recipeNames].sort((a, b) => a.localeCompare(b)),
    }))
    .sort((a, b) => a.foodNameSnapshot.localeCompare(b.foodNameSnapshot));
}
