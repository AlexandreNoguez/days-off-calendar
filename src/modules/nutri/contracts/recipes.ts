import type { NutriRecipe } from "../domain/types";

export type NutriRecipeInputIngredient = {
  foodId?: string;
  netWeightG?: number;
  grossWeightG?: number;
  correctionFactor?: number;
  cookingFactor?: number;
  unitCostCents?: number;
};

export type NutriRecipeInput = {
  name?: string;
  category?: string;
  ingredients?: NutriRecipeInputIngredient[];
  yieldTotalG?: number;
  servingSizeG?: number;
  preparationMethod?: string;
  allergens?: string[];
  active?: boolean;
};

export type NutriRecipesResponse = {
  recipes: NutriRecipe[];
  summary: {
    total: number;
    active: number;
    archived: number;
  };
};

export type NutriRecipeResponse = {
  recipe: NutriRecipe;
};
