import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { NextRequest } from "next/server";
import {
  cleanupDemoDataDELETE,
  GET as getDemoSeedStatus,
  seedFoodsPOST,
} from "../next/api/devSeedRoutes";

const authMocks = vi.hoisted(() => ({
  requireNutriUser: vi.fn(),
  requestMeta: vi.fn(() => ({ ip: "127.0.0.1" })),
}));

const auditMocks = vi.hoisted(() => ({
  writeAuditLog: vi.fn(),
}));

const seedMocks = vi.hoisted(() => ({
  cleanupDemoData: vi.fn(),
  seedDemoFoods: vi.fn(),
  seedDemoMealPlans: vi.fn(),
  seedDemoPatients: vi.fn(),
  seedDemoRecipes: vi.fn(),
  seedDemoRestaurantMenus: vi.fn(),
}));

vi.mock("@/src/lib/server/auth", () => authMocks);
vi.mock("@/src/lib/server/audit", () => auditMocks);
vi.mock("../dev/demoSeeds", () => seedMocks);

function request(): NextRequest {
  return new Request("http://localhost/api/nutri/dev/seed") as unknown as NextRequest;
}

function enableDemoTools() {
  vi.stubEnv("NODE_ENV", "development");
  vi.stubEnv("NUTRI_DEMO_TOOLS_ENABLED", "true");
  vi.stubEnv("NUTRI_DEMO_TOOLS_ALLOW_PRODUCTION", "");
}

function disableDemoTools() {
  vi.stubEnv("NODE_ENV", "development");
  vi.stubEnv("NUTRI_DEMO_TOOLS_ENABLED", "");
  vi.stubEnv("NUTRI_DEMO_TOOLS_ALLOW_PRODUCTION", "");
}

describe("nutri demo seed routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authMocks.requireNutriUser.mockResolvedValue({
      id: "nutri_1",
      username: "nutri",
      displayName: "Nutri",
      role: "NUTRI",
      active: true,
      createdAt: "2026-06-21T00:00:00.000Z",
      updatedAt: "2026-06-21T00:00:00.000Z",
    });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("reports demo tools disabled by default", async () => {
    disableDemoTools();

    const response = await getDemoSeedStatus();
    const body = (await response.json()) as { enabled: boolean };

    expect(response.status).toBe(200);
    expect(body.enabled).toBe(false);
  });

  it("blocks direct seed execution when demo tools are disabled", async () => {
    disableDemoTools();

    const response = await seedFoodsPOST(request());
    const body = (await response.json()) as { error: string };

    expect(response.status).toBe(403);
    expect(body.error).toBe("Seeds de demo estao desabilitados.");
    expect(seedMocks.seedDemoFoods).not.toHaveBeenCalled();
    expect(auditMocks.writeAuditLog).not.toHaveBeenCalled();
  });

  it("executes and audits seed routes only when demo tools are enabled", async () => {
    enableDemoTools();
    seedMocks.seedDemoFoods.mockResolvedValue({
      created: 5,
      reused: 0,
      dependenciesCreated: 0,
      entityType: "foods",
    });

    const response = await seedFoodsPOST(request());
    const body = (await response.json()) as { created: number };

    expect(response.status).toBe(201);
    expect(body.created).toBe(5);
    expect(seedMocks.seedDemoFoods).toHaveBeenCalledWith({ userId: "nutri_1" });
    expect(auditMocks.writeAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "nutri.demo_seed.foods",
        entityType: "nutriDemoSeed",
        entityId: "foods",
        metadata: expect.objectContaining({ created: 5, entityType: "foods" }),
      }),
    );
  });

  it("blocks cleanup when demo tools are disabled", async () => {
    disableDemoTools();

    const response = await cleanupDemoDataDELETE(request());

    expect(response.status).toBe(403);
    expect(seedMocks.cleanupDemoData).not.toHaveBeenCalled();
    expect(auditMocks.writeAuditLog).not.toHaveBeenCalled();
  });
});
