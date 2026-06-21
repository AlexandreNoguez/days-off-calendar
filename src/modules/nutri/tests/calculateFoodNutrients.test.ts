import { describe, expect, it } from "vitest";
import { calculateFoodNutrients } from "../application/calculateFoodNutrients";

describe("calculateFoodNutrients", () => {
  it("scales nutrients from 100g to the requested amount", () => {
    expect(
      calculateFoodNutrients({
        amountG: 50,
        nutrientsPer100g: {
          energyKcal: 120,
          carbohydrateG: 20,
          proteinG: 4,
          fatG: 2,
          sodiumMg: 80,
        },
      }),
    ).toEqual({
      energyKcal: 60,
      carbohydrateG: 10,
      proteinG: 2,
      fatG: 1,
      saturatedFatG: undefined,
      fiberG: undefined,
      sodiumMg: 40,
      addedSugarG: undefined,
    });
  });

  it("returns zero for known nutrients when amount is invalid", () => {
    expect(
      calculateFoodNutrients({
        amountG: -10,
        nutrientsPer100g: {
          energyKcal: 100,
          proteinG: 5,
        },
      }),
    ).toMatchObject({
      energyKcal: 0,
      proteinG: 0,
    });
  });

  it("rounds scaled nutrients to one decimal place and preserves missing values", () => {
    expect(
      calculateFoodNutrients({
        amountG: 33.3,
        nutrientsPer100g: {
          energyKcal: 101,
          carbohydrateG: 12.34,
          fatG: undefined,
        },
      }),
    ).toMatchObject({
      energyKcal: 33.6,
      carbohydrateG: 4.1,
      fatG: undefined,
    });
  });
});
