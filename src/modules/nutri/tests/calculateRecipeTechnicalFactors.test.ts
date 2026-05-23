import { describe, expect, it } from "vitest";
import { calculateRecipeTechnicalFactors } from "../application/calculateRecipeTechnicalFactors";

describe("calculateRecipeTechnicalFactors", () => {
  it("calculates correction and cooking factors from recipe weights", () => {
    const result = calculateRecipeTechnicalFactors({
      yieldTotalG: 450,
      ingredients: [
        {
          id: "ingredient_1",
          foodId: "food_1",
          foodNameSnapshot: "Frango",
          netWeightG: 300,
          grossWeightG: 360,
          nutrientsPer100gSnapshot: {},
        },
        {
          id: "ingredient_2",
          foodId: "food_2",
          foodNameSnapshot: "Legumes",
          netWeightG: 200,
          grossWeightG: 240,
          nutrientsPer100gSnapshot: {},
        },
      ],
    });

    expect(result.totalNetWeightG).toBe(500);
    expect(result.totalGrossWeightG).toBe(600);
    expect(result.correctionFactor).toBe(1.2);
    expect(result.cookingFactor).toBe(0.9);
    expect(result.ingredients).toMatchObject([
      { correctionFactor: 1.2 },
      { correctionFactor: 1.2 },
    ]);
  });
});
