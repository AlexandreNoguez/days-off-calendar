import type { NutriMealPlan, NutriMealPlanStatus, NutriNutrients } from "../domain/types";

export type NutriMealPlanInputItem = {
  foodId?: string;
  amountG?: number;
  householdMeasure?: string;
};

export type NutriMealPlanInputMeal = {
  name?: string;
  time?: string;
  items?: NutriMealPlanInputItem[];
};

export type NutriMealPlanInput = {
  patientId?: string;
  title?: string;
  target?: NutriNutrients;
  meals?: NutriMealPlanInputMeal[];
  status?: NutriMealPlanStatus;
};

export type NutriMealPlansResponse = {
  mealPlans: NutriMealPlan[];
};

export type NutriMealPlanResponse = {
  mealPlan: NutriMealPlan;
};
