import { expect, test } from "@playwright/test";
import { loginAs, openNutri } from "./support/actions";

test.describe("Nutri permissions", () => {
  test("redirects anonymous users to login before opening Nutri", async ({ page }) => {
    await page.goto("/nutri");

    await expect(page).toHaveURL(/\/login\?next=%2Fnutri|\/login\?next=\/nutri/);
    await expect(page.getByRole("button", { name: "Entrar" })).toBeVisible();
  });

  test("keeps ADMIN and USER out of the Nutri module", async ({ page }) => {
    await loginAs(page, "admin");
    await page.goto("/nutri");
    await expect(page).toHaveURL(/\/schedule/);
    await expect(page.getByRole("heading", { name: "Modulo Nutri" })).toHaveCount(0);

    await page.request.post("/api/auth/logout");

    await loginAs(page, "user");
    await page.goto("/nutri");
    await expect(page).toHaveURL(/\/schedule/);
    await expect(page.getByRole("heading", { name: "Modulo Nutri" })).toHaveCount(0);
  });

  test("allows NUTRI into Nutri and blocks operational app routes", async ({ page }) => {
    await loginAs(page, "nutri");
    await openNutri(page);

    await page.goto("/admin");
    await expect(page).not.toHaveURL(/\/admin$/);

    const appState = await page.request.get("/api/app-state");
    expect(appState.status()).toBe(403);

    const patients = await page.request.get("/api/nutri/patients");
    expect(patients.ok()).toBe(true);
  });
});
