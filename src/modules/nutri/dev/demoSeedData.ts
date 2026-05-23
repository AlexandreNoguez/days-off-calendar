import type {
  NutriFood,
  NutriFoodSource,
  NutriNutrients,
  NutriPatient,
  NutriPatientSex,
  NutriRecipe,
  NutriRecipeIngredient,
  NutriRestaurantMenuRecipeItem,
} from "../domain/types";

export type NutriDemoSeedEntityType =
  | "patients"
  | "foods"
  | "mealPlans"
  | "recipes"
  | "restaurantMenus";

export type NutriDemoSeedResponse = {
  created: number;
  reused: number;
  dependenciesCreated: number;
  entityType: NutriDemoSeedEntityType;
};

export const DEMO_PREFIX = "[Demo]";

export const DEMO_PATIENTS: Array<{
  fullName: string;
  birthDate: string;
  sex: NutriPatientSex;
  phone: string;
  email: string;
  notes: string;
}> = [
  {
    fullName: "Ana Martins",
    birthDate: "1988-04-12",
    sex: "FEMALE",
    phone: "(11) 90000-1001",
    email: "ana.demo@example.com",
    notes: "Paciente demo para plano de rotina.",
  },
  {
    fullName: "Bruno Almeida",
    birthDate: "1992-09-23",
    sex: "MALE",
    phone: "(11) 90000-1002",
    email: "bruno.demo@example.com",
    notes: "Paciente demo com objetivo de recomposicao corporal.",
  },
  {
    fullName: "Carla Nunes",
    birthDate: "1979-01-30",
    sex: "FEMALE",
    phone: "(11) 90000-1003",
    email: "carla.demo@example.com",
    notes: "Paciente demo para acompanhamento clinico.",
  },
  {
    fullName: "Diego Torres",
    birthDate: "1985-06-08",
    sex: "MALE",
    phone: "(11) 90000-1004",
    email: "diego.demo@example.com",
    notes: "Paciente demo fisicamente ativo.",
  },
  {
    fullName: "Elisa Rocha",
    birthDate: "1997-11-17",
    sex: "FEMALE",
    phone: "(11) 90000-1005",
    email: "elisa.demo@example.com",
    notes: "Paciente demo para rotina vegetariana flexivel.",
  },
];

export const DEMO_FOODS: Array<{
  name: string;
  source: NutriFoodSource;
  servingDescription: string;
  nutrientsPer100g: NutriNutrients;
  allergens: string[];
}> = [
  {
    name: "Arroz cozido",
    source: "MANUAL",
    servingDescription: "Valores por 100 g",
    nutrientsPer100g: {
      energyKcal: 128,
      carbohydrateG: 28,
      proteinG: 2.5,
      fatG: 0.2,
      fiberG: 1.6,
      sodiumMg: 1,
    },
    allergens: [],
  },
  {
    name: "Feijao cozido",
    source: "MANUAL",
    servingDescription: "Valores por 100 g",
    nutrientsPer100g: {
      energyKcal: 76,
      carbohydrateG: 13.6,
      proteinG: 4.8,
      fatG: 0.5,
      fiberG: 8.5,
      sodiumMg: 2,
    },
    allergens: [],
  },
  {
    name: "Frango grelhado",
    source: "MANUAL",
    servingDescription: "Valores por 100 g",
    nutrientsPer100g: {
      energyKcal: 165,
      carbohydrateG: 0,
      proteinG: 31,
      fatG: 3.6,
      saturatedFatG: 1,
      sodiumMg: 74,
    },
    allergens: [],
  },
  {
    name: "Banana prata",
    source: "MANUAL",
    servingDescription: "Valores por 100 g",
    nutrientsPer100g: {
      energyKcal: 98,
      carbohydrateG: 26,
      proteinG: 1.3,
      fatG: 0.1,
      fiberG: 2,
      sodiumMg: 1,
    },
    allergens: [],
  },
  {
    name: "Azeite de oliva",
    source: "MANUAL",
    servingDescription: "Valores por 100 g",
    nutrientsPer100g: {
      energyKcal: 884,
      carbohydrateG: 0,
      proteinG: 0,
      fatG: 100,
      saturatedFatG: 14,
      sodiumMg: 0,
    },
    allergens: [],
  },
];

export function demoName(name: string, batchId: string): string {
  return `${DEMO_PREFIX} ${name} ${batchId}`;
}

export function createBatchId(): string {
  return new Date()
    .toISOString()
    .replaceAll("-", "")
    .replaceAll(":", "")
    .replace(/\.\d{3}Z$/, "");
}

export function recipeIngredientFromFood(input: {
  food: NutriFood;
  netWeightG: number;
  grossWeightG?: number;
  unitCostCents?: number;
}): Omit<NutriRecipeIngredient, "id"> {
  return {
    foodId: input.food.id,
    foodNameSnapshot: input.food.name,
    netWeightG: input.netWeightG,
    grossWeightG: input.grossWeightG,
    unitCostCents: input.unitCostCents,
    nutrientsPer100gSnapshot: input.food.nutrientsPer100g,
  };
}

export function menuItemFromRecipe(input: {
  recipe: NutriRecipe;
  mealName: string;
  servings: number;
}): Omit<NutriRestaurantMenuRecipeItem, "id"> {
  return {
    mealName: input.mealName,
    recipeId: input.recipe.id,
    recipeNameSnapshot: input.recipe.name,
    recipeVersionSnapshot: input.recipe.version,
    recipeServingsSnapshot: input.recipe.servings,
    servings: input.servings,
    servingSizeGSnapshot: input.recipe.servingSizeG,
    costPerServingCentsSnapshot: input.recipe.costPerServingCents,
    nutrientsPerServingSnapshot: input.recipe.nutrientsPerServing,
    preparationMethodSnapshot: input.recipe.preparationMethod,
    ingredientsSnapshot: input.recipe.ingredients.map((ingredient) => ({
      foodId: ingredient.foodId,
      foodNameSnapshot: ingredient.foodNameSnapshot,
      netWeightGSnapshot: ingredient.netWeightG,
      grossWeightGSnapshot: ingredient.grossWeightG,
      unitCostCentsSnapshot: ingredient.unitCostCents,
    })),
  };
}

export function selectRoundRobin<T>(items: T[], index: number): T {
  return items[index % items.length];
}

export function activePatients(patients: NutriPatient[]): NutriPatient[] {
  return patients.filter((patient) => patient.active);
}
