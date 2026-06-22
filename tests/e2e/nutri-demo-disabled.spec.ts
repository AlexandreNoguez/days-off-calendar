import { expect, test } from "@playwright/test";
import { loginAs, openNutri } from "./support/actions";

test.describe("Nutri demo tools disabled", () => {
  test.skip(
    process.env.NUTRI_DEMO_TOOLS_ENABLED === "true",
    "Run this spec with demo tools disabled.",
  );

  test("hides seed buttons and blocks direct seed routes by default", async ({ page }) => {
    await loginAs(page, "nutri");
    await openNutri(page);

    await expect(page.getByRole("button", { name: /Seed 5/ })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Limpar demos" })).toHaveCount(0);

    const response = await page.request.post("/api/nutri/dev/seed/foods");
    expect(response.status()).toBe(403);
    await expect(response.json()).resolves.toMatchObject({
      error: "Seeds de demo estao desabilitados.",
    });
  });
});
