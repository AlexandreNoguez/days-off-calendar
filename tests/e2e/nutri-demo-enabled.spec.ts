import { expect, test } from "@playwright/test";
import { loginAs, openNutri, selectNutriTab } from "./support/actions";

test.describe("Nutri demo tools enabled", () => {
  test.skip(
    process.env.NUTRI_DEMO_TOOLS_ENABLED !== "true",
    "Run with NUTRI_DEMO_TOOLS_ENABLED=true or npm run test:e2e:demo.",
  );

  test("shows seed controls, creates demo data and cleans it up", async ({ page }) => {
    await loginAs(page, "nutri");
    await openNutri(page);

    await expect(page.getByRole("button", { name: "Seed 5 pacientes" })).toBeVisible();
    await page.getByRole("button", { name: "Seed 5 pacientes" }).click();
    await expect(page.getByText("[Demo]").first()).toBeVisible();

    await selectNutriTab(page, "Alimentos");
    await expect(page.getByRole("button", { name: "Seed 5 alimentos" })).toBeVisible();

    await page.getByRole("button", { name: "Limpar demos" }).first().click();
    await expect(page.getByText("[Demo]").first()).toHaveCount(0);
  });
});
