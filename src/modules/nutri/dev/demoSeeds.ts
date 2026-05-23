import {
  createNutriFood,
  listNutriFoods,
} from "../infra/foodRepository";
import {
  createNutriMealPlan,
} from "../infra/mealPlanRepository";
import {
  createNutriPatient,
  listNutriPatients,
} from "../infra/patientRepository";
import {
  createNutriRecipe,
  listNutriRecipes,
} from "../infra/recipeRepository";
import {
  createNutriRestaurantMenu,
} from "../infra/restaurantMenuRepository";
import type {
  NutriFood,
  NutriMealPlanFoodItem,
  NutriPatient,
  NutriRecipe,
} from "../domain/types";
import {
  DEMO_FOODS,
  DEMO_PATIENTS,
  activePatients,
  createBatchId,
  demoName,
  menuItemFromRecipe,
  recipeIngredientFromFood,
  selectRoundRobin,
  type NutriDemoSeedResponse,
} from "./demoSeedData";

function mealPlanItemFromFood(input: {
  food: NutriFood;
  amountG: number;
  householdMeasure?: string;
}): Omit<NutriMealPlanFoodItem, "id"> {
  return {
    foodId: input.food.id,
    foodNameSnapshot: input.food.name,
    amountG: input.amountG,
    householdMeasure: input.householdMeasure,
    nutrientsPer100gSnapshot: input.food.nutrientsPer100g,
  };
}

async function ensureDemoFoods(input: {
  userId: string;
  minCount: number;
}): Promise<{ foods: NutriFood[]; dependenciesCreated: number }> {
  const existing = (await listNutriFoods()).filter((food) => food.active);
  if (existing.length >= input.minCount) {
    return { foods: existing, dependenciesCreated: 0 };
  }

  const result = await seedDemoFoods({ userId: input.userId });
  const foods = (await listNutriFoods()).filter((food) => food.active);
  return { foods, dependenciesCreated: result.created };
}

async function ensureDemoPatients(input: {
  userId: string;
  minCount: number;
}): Promise<{ patients: NutriPatient[]; dependenciesCreated: number }> {
  const existing = activePatients(await listNutriPatients());
  if (existing.length >= input.minCount) {
    return { patients: existing, dependenciesCreated: 0 };
  }

  const result = await seedDemoPatients({ userId: input.userId });
  const patients = activePatients(await listNutriPatients());
  return { patients, dependenciesCreated: result.created };
}

async function ensureApprovedRecipes(input: {
  userId: string;
  minCount: number;
}): Promise<{ recipes: NutriRecipe[]; dependenciesCreated: number }> {
  const existing = (await listNutriRecipes()).filter(
    (recipe) => recipe.status === "APPROVED",
  );
  if (existing.length >= input.minCount) {
    return { recipes: existing, dependenciesCreated: 0 };
  }

  const result = await seedDemoRecipes({ userId: input.userId });
  const recipes = (await listNutriRecipes()).filter(
    (recipe) => recipe.status === "APPROVED",
  );
  return {
    recipes,
    dependenciesCreated: result.created + result.dependenciesCreated,
  };
}

export async function seedDemoPatients(input: {
  userId: string;
}): Promise<NutriDemoSeedResponse> {
  const batchId = createBatchId();

  await Promise.all(
    DEMO_PATIENTS.map((patient) =>
      createNutriPatient({
        patient: {
          ...patient,
          fullName: demoName(patient.fullName, batchId),
          active: true,
        },
        userId: input.userId,
      }),
    ),
  );

  return {
    created: DEMO_PATIENTS.length,
    reused: 0,
    dependenciesCreated: 0,
    entityType: "patients",
  };
}

export async function seedDemoFoods(input: {
  userId: string;
}): Promise<NutriDemoSeedResponse> {
  const batchId = createBatchId();

  await Promise.all(
    DEMO_FOODS.map((food) =>
      createNutriFood({
        food: {
          ...food,
          name: demoName(food.name, batchId),
          sourceVersion: "demo",
          active: true,
        },
        userId: input.userId,
      }),
    ),
  );

  return {
    created: DEMO_FOODS.length,
    reused: 0,
    dependenciesCreated: 0,
    entityType: "foods",
  };
}

export async function seedDemoMealPlans(input: {
  userId: string;
}): Promise<NutriDemoSeedResponse> {
  const batchId = createBatchId();
  const patientResult = await ensureDemoPatients({
    userId: input.userId,
    minCount: 5,
  });
  const foodResult = await ensureDemoFoods({ userId: input.userId, minCount: 5 });
  const foods = foodResult.foods;

  await Promise.all(
    patientResult.patients.slice(0, 5).map((patient, index) => {
      const rice = selectRoundRobin(foods, index);
      const beans = selectRoundRobin(foods, index + 1);
      const protein = selectRoundRobin(foods, index + 2);

      return createNutriMealPlan({
        mealPlan: {
          patientId: patient.id,
          title: demoName(`Plano alimentar ${index + 1}`, batchId),
          target: {
            energyKcal: 1800 + index * 100,
            carbohydrateG: 220,
            proteinG: 110,
            fatG: 55,
            fiberG: 28,
            sodiumMg: 2000,
          },
          meals: [
            {
              name: "Almoco",
              items: [
                mealPlanItemFromFood({
                  food: rice,
                  amountG: 120,
                  householdMeasure: "4 colheres de sopa",
                }),
                mealPlanItemFromFood({
                  food: beans,
                  amountG: 100,
                  householdMeasure: "1 concha media",
                }),
                mealPlanItemFromFood({
                  food: protein,
                  amountG: 130,
                  householdMeasure: "1 porcao media",
                }),
              ],
            },
          ],
        },
        userId: input.userId,
      });
    }),
  );

  return {
    created: 5,
    reused: patientResult.patients.length + foodResult.foods.length,
    dependenciesCreated:
      patientResult.dependenciesCreated + foodResult.dependenciesCreated,
    entityType: "mealPlans",
  };
}

export async function seedDemoRecipes(input: {
  userId: string;
}): Promise<NutriDemoSeedResponse> {
  const batchId = createBatchId();
  const foodResult = await ensureDemoFoods({ userId: input.userId, minCount: 5 });
  const foods = foodResult.foods;
  const now = new Date().toISOString();
  const recipes = [
    {
      name: "Arroz e feijao",
      category: "Base",
      ingredients: [
        recipeIngredientFromFood({
          food: selectRoundRobin(foods, 0),
          netWeightG: 300,
          grossWeightG: 310,
          unitCostCents: 420,
        }),
        recipeIngredientFromFood({
          food: selectRoundRobin(foods, 1),
          netWeightG: 250,
          grossWeightG: 260,
          unitCostCents: 520,
        }),
      ],
      yieldTotalG: 550,
      servingSizeG: 180,
      preparationMethod: "Preparacao demo para acompanhamento.",
    },
    {
      name: "Frango com legumes",
      category: "Proteina",
      ingredients: [
        recipeIngredientFromFood({
          food: selectRoundRobin(foods, 2),
          netWeightG: 500,
          grossWeightG: 560,
          unitCostCents: 1800,
        }),
        recipeIngredientFromFood({
          food: selectRoundRobin(foods, 4),
          netWeightG: 20,
          unitCostCents: 120,
        }),
      ],
      yieldTotalG: 480,
      servingSizeG: 160,
      preparationMethod: "Grelhar e finalizar com azeite.",
    },
    {
      name: "Salada completa",
      category: "Guarnicao",
      ingredients: [
        recipeIngredientFromFood({
          food: selectRoundRobin(foods, 4),
          netWeightG: 15,
          unitCostCents: 90,
        }),
        recipeIngredientFromFood({
          food: selectRoundRobin(foods, 3),
          netWeightG: 250,
          grossWeightG: 280,
          unitCostCents: 350,
        }),
      ],
      yieldTotalG: 260,
      servingSizeG: 90,
      preparationMethod: "Misturar ingredientes e servir frio.",
    },
    {
      name: "Vitamina de banana",
      category: "Lanche",
      ingredients: [
        recipeIngredientFromFood({
          food: selectRoundRobin(foods, 3),
          netWeightG: 300,
          grossWeightG: 360,
          unitCostCents: 480,
        }),
      ],
      yieldTotalG: 600,
      servingSizeG: 200,
      preparationMethod: "Bater e servir em porcoes individuais.",
    },
    {
      name: "Bowl proteico",
      category: "Prato principal",
      ingredients: [
        recipeIngredientFromFood({
          food: selectRoundRobin(foods, 0),
          netWeightG: 250,
          unitCostCents: 360,
        }),
        recipeIngredientFromFood({
          food: selectRoundRobin(foods, 2),
          netWeightG: 350,
          grossWeightG: 390,
          unitCostCents: 1250,
        }),
      ],
      yieldTotalG: 580,
      servingSizeG: 190,
      preparationMethod: "Montar bowl com base e proteina.",
    },
  ];

  await Promise.all(
    recipes.map((recipe) =>
      createNutriRecipe({
        recipe: {
          ...recipe,
          name: demoName(recipe.name, batchId),
          allergens: [],
          status: "APPROVED",
          approvedAt: now,
          approvedByUserId: input.userId,
          active: true,
        },
        userId: input.userId,
      }),
    ),
  );

  return {
    created: recipes.length,
    reused: foodResult.foods.length,
    dependenciesCreated: foodResult.dependenciesCreated,
    entityType: "recipes",
  };
}

export async function seedDemoRestaurantMenus(input: {
  userId: string;
}): Promise<NutriDemoSeedResponse> {
  const batchId = createBatchId();
  const recipeResult = await ensureApprovedRecipes({
    userId: input.userId,
    minCount: 5,
  });
  const recipes = recipeResult.recipes;

  await Promise.all(
    Array.from({ length: 5 }, (_, index) => {
      const firstRecipe = selectRoundRobin(recipes, index);
      const secondRecipe = selectRoundRobin(recipes, index + 1);
      const date = new Date();
      date.setDate(date.getDate() + index);

      return createNutriRestaurantMenu({
        menu: {
          title: demoName(`Cardapio restaurante ${index + 1}`, batchId),
          date: date.toISOString().slice(0, 10),
          expectedMeals: 80 + index * 10,
          items: [
            menuItemFromRecipe({
              recipe: firstRecipe,
              mealName: "Almoco",
              servings: 80 + index * 10,
            }),
            menuItemFromRecipe({
              recipe: secondRecipe,
              mealName: "Jantar",
              servings: 50 + index * 8,
            }),
          ],
        },
        userId: input.userId,
      });
    }),
  );

  return {
    created: 5,
    reused: recipeResult.recipes.length,
    dependenciesCreated: recipeResult.dependenciesCreated,
    entityType: "restaurantMenus",
  };
}
