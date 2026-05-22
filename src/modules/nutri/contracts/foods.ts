import type { NutriFood, NutriFoodSource, NutriNutrients } from "../domain/types";

export type NutriFoodInput = {
  name?: string;
  source?: NutriFoodSource;
  sourceVersion?: string;
  servingDescription?: string;
  nutrientsPer100g?: NutriNutrients;
  allergens?: string[];
  active?: boolean;
};

export type NutriFoodsResponse = {
  foods: NutriFood[];
  summary: {
    total: number;
    active: number;
    archived: number;
  };
};

export type NutriFoodResponse = {
  food: NutriFood;
};
