import { beforeEach, describe, expect, it, vi } from "vitest";
import { cleanupDemoData } from "../dev/demoSeeds";

const mongodbMocks = vi.hoisted(() => ({
  getDb: vi.fn(),
}));

vi.mock("@/src/lib/server/mongodb", () => mongodbMocks);

describe("cleanupDemoData", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deletes only records identified by the demo prefix", async () => {
    const deleteManyByCollection = {
      nutriRestaurantMenus: vi.fn().mockResolvedValue({ deletedCount: 1 }),
      nutriRecipes: vi.fn().mockResolvedValue({ deletedCount: 2 }),
      nutriMealPlans: vi.fn().mockResolvedValue({ deletedCount: 3 }),
      nutriFoods: vi.fn().mockResolvedValue({ deletedCount: 4 }),
      nutriPatients: vi.fn().mockResolvedValue({ deletedCount: 5 }),
    };
    const collection = vi.fn(
      (name: keyof typeof deleteManyByCollection) => ({
        deleteMany: deleteManyByCollection[name],
      }),
    );

    mongodbMocks.getDb.mockResolvedValue({ collection });

    const result = await cleanupDemoData();
    const demoNameFilter = { $regex: "^\\[Demo]" };

    expect(deleteManyByCollection.nutriRestaurantMenus).toHaveBeenCalledWith({
      title: demoNameFilter,
    });
    expect(deleteManyByCollection.nutriRecipes).toHaveBeenCalledWith({
      name: demoNameFilter,
    });
    expect(deleteManyByCollection.nutriMealPlans).toHaveBeenCalledWith({
      title: demoNameFilter,
    });
    expect(deleteManyByCollection.nutriFoods).toHaveBeenCalledWith({
      name: demoNameFilter,
    });
    expect(deleteManyByCollection.nutriPatients).toHaveBeenCalledWith({
      fullName: demoNameFilter,
    });
    expect(result.deleted).toEqual({
      patients: 5,
      foods: 4,
      mealPlans: 3,
      recipes: 2,
      restaurantMenus: 1,
    });
    expect(result.totalDeleted).toBe(15);
  });
});
