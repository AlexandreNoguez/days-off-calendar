import { readdirSync, readFileSync, statSync } from "fs";
import { join } from "path";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { NextRequest } from "next/server";
import {
  GET as getAssessments,
  POST as postAssessments,
} from "../next/api/assessmentsRoute";
import {
  cleanupDemoDataDELETE,
  GET as getDemoSeedStatus,
  seedFoodsPOST,
} from "../next/api/devSeedRoutes";
import { PATCH as patchFood } from "../next/api/foodByIdRoute";
import { GET as getFoods, POST as postFoods } from "../next/api/foodsRoute";
import { PATCH as patchMealPlan } from "../next/api/mealPlanByIdRoute";
import { POST as duplicateMealPlan } from "../next/api/mealPlanDuplicateRoute";
import { GET as printMealPlan } from "../next/api/mealPlanPrintRoute";
import { GET as getMealPlans, POST as postMealPlans } from "../next/api/mealPlansRoute";
import { PATCH as patchPatient } from "../next/api/patientByIdRoute";
import { GET as getPatients, POST as postPatients } from "../next/api/patientsRoute";
import { PATCH as patchRecipe } from "../next/api/recipeByIdRoute";
import { POST as duplicateRecipe } from "../next/api/recipeDuplicateRoute";
import { GET as printRecipe } from "../next/api/recipePrintRoute";
import { GET as getRecipes, POST as postRecipes } from "../next/api/recipesRoute";
import { PATCH as patchRestaurantMenu } from "../next/api/restaurantMenuByIdRoute";
import { GET as printRestaurantMenu } from "../next/api/restaurantMenuPrintRoute";
import {
  GET as getRestaurantMenus,
  POST as postRestaurantMenus,
} from "../next/api/restaurantMenusRoute";

const authMocks = vi.hoisted(() => ({
  requireNutriUser: vi.fn(),
  requestMeta: vi.fn(() => ({})),
}));

const auditMocks = vi.hoisted(() => ({
  writeAuditLog: vi.fn(),
}));

vi.mock("@/src/lib/server/auth", () => authMocks);
vi.mock("@/src/lib/server/audit", () => auditMocks);

function request(url = "http://localhost/api/nutri/test"): NextRequest {
  return new Request(url) as unknown as NextRequest;
}

function context(id = "nutri_entity_1") {
  return { params: Promise.resolve({ id }) };
}

async function expectForbidden(response: Response) {
  expect(response.status).toBe(403);
  await expect(response.json()).resolves.toMatchObject({ error: "Acesso negado." });
}

function listFilesRecursive(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? listFilesRecursive(path) : [path];
  });
}

describe("nutri api access controls", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authMocks.requireNutriUser.mockRejectedValue(new Error("Forbidden"));
  });

  it("keeps every nutri api handler guarded by requireNutriUser", () => {
    const apiDir = join(process.cwd(), "src/modules/nutri/next/api");
    const routeFiles = listFilesRecursive(apiDir).filter((path) => path.endsWith(".ts"));

    expect(routeFiles.length).toBeGreaterThan(0);

    for (const file of routeFiles) {
      const source = readFileSync(file, "utf8");
      expect(source, file).toContain("requireNutriUser");
    }
  });

  it.each([
    ["assessments GET", () => getAssessments(request())],
    ["assessments POST", () => postAssessments(request())],
    ["demo seed status GET", () => getDemoSeedStatus()],
    ["demo seed foods POST", () => seedFoodsPOST(request())],
    ["demo cleanup DELETE", () => cleanupDemoDataDELETE(request())],
    ["foods GET", () => getFoods(request())],
    ["foods POST", () => postFoods(request())],
    ["food PATCH", () => patchFood(request(), context())],
    ["meal plans GET", () => getMealPlans(request())],
    ["meal plans POST", () => postMealPlans(request())],
    ["meal plan PATCH", () => patchMealPlan(request(), context())],
    ["meal plan duplicate POST", () => duplicateMealPlan(request(), context())],
    ["meal plan print GET", () => printMealPlan(request(), context())],
    ["patients GET", () => getPatients(request())],
    ["patients POST", () => postPatients(request())],
    ["patient PATCH", () => patchPatient(request(), context())],
    ["recipes GET", () => getRecipes(request())],
    ["recipes POST", () => postRecipes(request())],
    ["recipe PATCH", () => patchRecipe(request(), context())],
    ["recipe duplicate POST", () => duplicateRecipe(request(), context())],
    ["recipe print GET", () => printRecipe(request(), context())],
    ["restaurant menus GET", () => getRestaurantMenus(request())],
    ["restaurant menus POST", () => postRestaurantMenus(request())],
    ["restaurant menu PATCH", () => patchRestaurantMenu(request(), context())],
    ["restaurant menu print GET", () => printRestaurantMenu(request(), context())],
  ])("returns 403 before executing %s when the user is not NUTRI", async (_, run) => {
    await expectForbidden(await run());
    expect(authMocks.requireNutriUser).toHaveBeenCalledTimes(1);
    expect(authMocks.requestMeta).not.toHaveBeenCalled();
    expect(auditMocks.writeAuditLog).not.toHaveBeenCalled();
  });
});
