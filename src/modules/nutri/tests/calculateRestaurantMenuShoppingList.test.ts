import { describe, expect, it } from "vitest";
import { calculateRestaurantMenuShoppingList } from "../application/calculateRestaurantMenuShoppingList";

describe("calculateRestaurantMenuShoppingList", () => {
  it("aggregates ingredient weights across recipes and servings", () => {
    const result = calculateRestaurantMenuShoppingList([
      {
        id: "item_1",
        mealName: "Almoco",
        recipeId: "recipe_1",
        recipeNameSnapshot: "Arroz",
        recipeVersionSnapshot: 1,
        recipeServingsSnapshot: 5,
        servings: 10,
        servingSizeGSnapshot: 100,
        nutrientsPerServingSnapshot: {},
        ingredientsSnapshot: [
          {
            foodId: "food_rice",
            foodNameSnapshot: "Arroz cru",
            netWeightGSnapshot: 250,
            grossWeightGSnapshot: 260,
          },
        ],
      },
      {
        id: "item_2",
        mealName: "Almoco",
        recipeId: "recipe_2",
        recipeNameSnapshot: "Bowl",
        recipeVersionSnapshot: 1,
        recipeServingsSnapshot: 2,
        servings: 4,
        servingSizeGSnapshot: 180,
        nutrientsPerServingSnapshot: {},
        ingredientsSnapshot: [
          {
            foodId: "food_rice",
            foodNameSnapshot: "Arroz cru",
            netWeightGSnapshot: 100,
          },
          {
            foodId: "food_beans",
            foodNameSnapshot: "Feijao",
            netWeightGSnapshot: 120,
          },
        ],
      },
    ]);

    expect(result).toEqual([
      {
        foodId: "food_rice",
        foodNameSnapshot: "Arroz cru",
        totalNetWeightG: 700,
        totalGrossWeightG: 520,
        recipeNames: ["Arroz", "Bowl"],
      },
      {
        foodId: "food_beans",
        foodNameSnapshot: "Feijao",
        totalNetWeightG: 240,
        totalGrossWeightG: undefined,
        recipeNames: ["Bowl"],
      },
    ]);
  });
});
