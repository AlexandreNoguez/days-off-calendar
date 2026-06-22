import { expect, test } from "@playwright/test";
import { loginAs, openNutri, selectNutriTab } from "./support/actions";
import { cleanupE2EData, e2eName, withDb } from "./support/db";

test.describe("Nutri RC workflow", () => {
  test.afterAll(async () => {
    await withDb(cleanupE2EData);
  });

  test("shows empty dependency states for a fresh Nutri database", async ({ page }) => {
    await withDb(cleanupE2EData);
    await loginAs(page, "nutri");
    await openNutri(page);

    await expect(page.getByText("Base clinica vazia.")).toBeVisible();

    await selectNutriTab(page, "Planos");
    await expect(page.getByText("Paciente necessario.")).toBeVisible();
    await expect(page.getByText("Base de alimentos necessaria.")).toBeVisible();

    await selectNutriTab(page, "Receitas");
    await expect(page.getByText("Ingredientes ainda indisponiveis.")).toBeVisible();

    await selectNutriTab(page, "Cardapios");
    await expect(page.getByText("Receita aprovada necessaria.")).toBeVisible();
  });

  test("creates core Nutri data, versions documents and validates printable HTML", async ({
    page,
  }) => {
    await withDb(cleanupE2EData);
    await loginAs(page, "nutri");
    await openNutri(page);

    const patientName = e2eName("Paciente");
    const foodName = e2eName("Alimento");
    const mealPlanTitle = e2eName("Plano");
    const recipeName = e2eName("Receita");
    const menuTitle = e2eName("Cardapio");

    const patientResponse = await page.request.post("/api/nutri/patients", {
      data: {
        fullName: patientName,
        birthDate: "1990-01-01",
        sex: "NOT_INFORMED",
        phone: "11999999999",
        email: "paciente.e2e@example.com",
        notes: "Paciente E2E",
        active: true,
      },
    });
    expect(patientResponse.ok()).toBe(true);
    const { patient } = (await patientResponse.json()) as { patient: { id: string } };

    const assessmentResponse = await page.request.post("/api/nutri/assessments", {
      data: {
        patientId: patient.id,
        date: "2026-06-21",
        objective: "Validacao E2E",
        weightKg: 70,
        heightCm: 170,
        allergies: ["Amendoim"],
        intolerances: [],
        dietaryRestrictions: [],
      },
    });
    expect(assessmentResponse.ok()).toBe(true);

    const foodResponse = await page.request.post("/api/nutri/foods", {
      data: {
        name: foodName,
        source: "MANUAL",
        sourceVersion: "E2E",
        servingDescription: "100 g",
        nutrientsPer100g: {
          energyKcal: 120,
          carbohydrateG: 20,
          proteinG: 8,
          fatG: 3,
          fiberG: 4,
          sodiumMg: 80,
        },
        allergens: [],
        active: true,
      },
    });
    expect(foodResponse.ok()).toBe(true);
    const { food } = (await foodResponse.json()) as { food: { id: string } };

    const mealPlanResponse = await page.request.post("/api/nutri/meal-plans", {
      data: {
        patientId: patient.id,
        title: mealPlanTitle,
        target: { energyKcal: 1800, proteinG: 90 },
        meals: [
          {
            name: "Almoco",
            items: [
              {
                foodId: food.id,
                amountG: 150,
                householdMeasure: "1 prato",
              },
            ],
          },
        ],
      },
    });
    expect(mealPlanResponse.ok()).toBe(true);
    const { mealPlan } = (await mealPlanResponse.json()) as {
      mealPlan: { id: string };
    };

    const approvedMealPlan = await page.request.patch(
      `/api/nutri/meal-plans/${mealPlan.id}`,
      { data: { status: "APPROVED" } },
    );
    expect(approvedMealPlan.ok()).toBe(true);

    const duplicatedMealPlan = await page.request.post(
      `/api/nutri/meal-plans/${mealPlan.id}/duplicate`,
    );
    expect(duplicatedMealPlan.status()).toBe(201);

    const mealPlanPrint = await page.request.get(
      `/api/nutri/meal-plans/${mealPlan.id}/print`,
    );
    expect(mealPlanPrint.ok()).toBe(true);
    const mealPlanHtml = await mealPlanPrint.text();
    expect(mealPlanHtml).toContain("Status: Aprovado");
    expect(mealPlanHtml).toContain("Responsavel tecnico: E2E Nutri");
    expect(mealPlanHtml).toContain("Documento de apoio tecnico");

    const recipeResponse = await page.request.post("/api/nutri/recipes", {
      data: {
        name: recipeName,
        category: "E2E",
        ingredients: [
          {
            foodId: food.id,
            netWeightG: 200,
            grossWeightG: 220,
            unitCostCents: 550,
          },
        ],
        yieldTotalG: 200,
        servingSizeG: 100,
        preparationMethod: "Preparar receita E2E.",
        allergens: [],
      },
    });
    expect(recipeResponse.ok()).toBe(true);
    const { recipe } = (await recipeResponse.json()) as { recipe: { id: string } };

    const approvedRecipe = await page.request.patch(`/api/nutri/recipes/${recipe.id}`, {
      data: { status: "APPROVED" },
    });
    expect(approvedRecipe.ok()).toBe(true);

    const duplicatedRecipe = await page.request.post(
      `/api/nutri/recipes/${recipe.id}/duplicate`,
    );
    expect(duplicatedRecipe.status()).toBe(201);

    const recipePrint = await page.request.get(`/api/nutri/recipes/${recipe.id}/print`);
    expect(recipePrint.ok()).toBe(true);
    const recipeHtml = await recipePrint.text();
    expect(recipeHtml).toContain("Status: Aprovado / Versao: 1");
    expect(recipeHtml).toContain("Responsavel tecnico: E2E Nutri");

    const menuResponse = await page.request.post("/api/nutri/restaurant-menus", {
      data: {
        title: menuTitle,
        date: "2026-06-21",
        expectedMeals: 10,
        items: [
          {
            mealName: "Almoco",
            recipeId: recipe.id,
            servings: 10,
          },
        ],
      },
    });
    expect(menuResponse.ok()).toBe(true);
    const { menu } = (await menuResponse.json()) as { menu: { id: string } };

    const approvedMenu = await page.request.patch(
      `/api/nutri/restaurant-menus/${menu.id}`,
      { data: { status: "APPROVED" } },
    );
    expect(approvedMenu.ok()).toBe(true);

    const menuPrint = await page.request.get(
      `/api/nutri/restaurant-menus/${menu.id}/print`,
    );
    expect(menuPrint.ok()).toBe(true);
    const menuHtml = await menuPrint.text();
    expect(menuHtml).toContain("Status: Aprovado");
    expect(menuHtml).toContain("Responsavel tecnico: E2E Nutri");

    await page.goto("/nutri");
    await expect(page.getByText(patientName)).toBeVisible();

    await selectNutriTab(page, "Alimentos");
    await expect(page.getByText(foodName)).toBeVisible();

    await selectNutriTab(page, "Planos");
    await expect(page.getByText(mealPlanTitle).first()).toBeVisible();
    await expect(page.getByRole("button", { name: "Imprimir" }).first()).toBeVisible();

    await selectNutriTab(page, "Receitas");
    await expect(page.getByText(recipeName).first()).toBeVisible();

    await selectNutriTab(page, "Cardapios");
    await expect(page.getByText(menuTitle).first()).toBeVisible();
  });
});
