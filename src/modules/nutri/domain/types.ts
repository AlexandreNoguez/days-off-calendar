export type NutriPatientSex = "FEMALE" | "MALE" | "OTHER" | "NOT_INFORMED";

export type NutriPatient = {
  id: string;
  fullName: string;
  birthDate?: string;
  sex: NutriPatientSex;
  phone?: string;
  email?: string;
  notes?: string;
  active: boolean;
  createdByUserId: string;
  createdAt: string;
  updatedAt: string;
};

export type NutriImcClassification =
  | "UNDERWEIGHT"
  | "NORMAL"
  | "OVERWEIGHT"
  | "OBESITY_I"
  | "OBESITY_II"
  | "OBESITY_III";

export type NutriImcResult = {
  value: number;
  classification: NutriImcClassification;
};

export type NutriAssessment = {
  id: string;
  patientId: string;
  date: string;
  objective?: string;
  weightKg?: number;
  heightCm?: number;
  imc?: NutriImcResult;
  waistCm?: number;
  hipCm?: number;
  activityLevel?: string;
  allergies: string[];
  intolerances: string[];
  dietaryRestrictions: string[];
  medications?: string;
  supplements?: string;
  foodRoutineNotes?: string;
  clinicalNotes?: string;
  createdByUserId: string;
  createdAt: string;
  updatedAt: string;
};

export type NutriFoodSource = "TACO" | "IBGE" | "LABEL" | "MANUAL";

export type NutriNutrients = {
  energyKcal?: number;
  carbohydrateG?: number;
  proteinG?: number;
  fatG?: number;
  saturatedFatG?: number;
  fiberG?: number;
  sodiumMg?: number;
  addedSugarG?: number;
};

export type NutriFood = {
  id: string;
  name: string;
  source: NutriFoodSource;
  sourceVersion?: string;
  servingDescription?: string;
  nutrientsPer100g: NutriNutrients;
  allergens: string[];
  active: boolean;
  createdByUserId: string;
  createdAt: string;
  updatedAt: string;
};

export type NutriMealPlanStatus = "DRAFT" | "APPROVED" | "ARCHIVED";

export type NutriMealPlanFoodItem = {
  id: string;
  foodId: string;
  foodNameSnapshot: string;
  amountG: number;
  householdMeasure?: string;
  nutrientsPer100gSnapshot: NutriNutrients;
};

export type NutriMeal = {
  id: string;
  name: string;
  time?: string;
  items: NutriMealPlanFoodItem[];
};

export type NutriMealPlan = {
  id: string;
  patientId: string;
  title: string;
  status: NutriMealPlanStatus;
  target: NutriNutrients;
  meals: NutriMeal[];
  totals: NutriNutrients;
  approvedAt?: string;
  approvedByUserId?: string;
  createdByUserId: string;
  createdAt: string;
  updatedAt: string;
};

export type NutriRecipeStatus = "DRAFT" | "APPROVED" | "ARCHIVED";

export type NutriRecipeIngredient = {
  id: string;
  foodId: string;
  foodNameSnapshot: string;
  netWeightG: number;
  grossWeightG?: number;
  correctionFactor?: number;
  cookingFactor?: number;
  unitCostCents?: number;
  nutrientsPer100gSnapshot: NutriNutrients;
};

export type NutriRecipe = {
  id: string;
  name: string;
  category?: string;
  status: NutriRecipeStatus;
  version: number;
  sourceRecipeId?: string;
  ingredients: NutriRecipeIngredient[];
  yieldTotalG: number;
  servingSizeG: number;
  servings: number;
  preparationMethod?: string;
  allergens: string[];
  totalCostCents?: number;
  costPerServingCents?: number;
  totalNutrients: NutriNutrients;
  nutrientsPer100g: NutriNutrients;
  nutrientsPerServing: NutriNutrients;
  active: boolean;
  approvedAt?: string;
  approvedByUserId?: string;
  createdByUserId: string;
  createdAt: string;
  updatedAt: string;
};

export type NutriRestaurantMenuStatus = "DRAFT" | "APPROVED" | "ARCHIVED";

export type NutriRestaurantMenuIngredientSnapshot = {
  foodId: string;
  foodNameSnapshot: string;
  netWeightGSnapshot: number;
  grossWeightGSnapshot?: number;
  unitCostCentsSnapshot?: number;
};

export type NutriRestaurantMenuRecipeItem = {
  id: string;
  mealName: string;
  recipeId: string;
  recipeNameSnapshot: string;
  recipeVersionSnapshot: number;
  recipeServingsSnapshot: number;
  servings: number;
  servingSizeGSnapshot: number;
  costPerServingCentsSnapshot?: number;
  nutrientsPerServingSnapshot: NutriNutrients;
  preparationMethodSnapshot?: string;
  ingredientsSnapshot: NutriRestaurantMenuIngredientSnapshot[];
};

export type NutriRestaurantMenuShoppingListItem = {
  foodId: string;
  foodNameSnapshot: string;
  totalNetWeightG: number;
  totalGrossWeightG?: number;
  recipeNames: string[];
};

export type NutriRestaurantMenu = {
  id: string;
  title: string;
  date: string;
  status: NutriRestaurantMenuStatus;
  expectedMeals?: number;
  items: NutriRestaurantMenuRecipeItem[];
  totalCostCents?: number;
  costPerCapitaCents?: number;
  totals: NutriNutrients;
  shoppingList: NutriRestaurantMenuShoppingListItem[];
  approvedAt?: string;
  approvedByUserId?: string;
  createdByUserId: string;
  createdAt: string;
  updatedAt: string;
};
