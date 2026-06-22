import { expect, type APIRequestContext, type Page } from "@playwright/test";
import { E2E_PASSWORD, E2E_USERS } from "./db";

export async function loginAs(page: Page, role: keyof typeof E2E_USERS) {
  const user = E2E_USERS[role];

  await page.goto("/login");
  await page.getByLabel("Usuario").fill(user.username);
  await page.getByLabel("Senha").fill(E2E_PASSWORD);
  await Promise.all([
    page.waitForURL(user.role === "NUTRI" ? /\/nutri/ : /\/schedule/),
    page.getByRole("button", { name: "Entrar" }).click(),
  ]);
}

export async function loginByApi(request: APIRequestContext, role: keyof typeof E2E_USERS) {
  const user = E2E_USERS[role];
  const response = await request.post("/api/auth/login", {
    data: {
      username: user.username,
      password: E2E_PASSWORD,
    },
  });

  expect(response.ok()).toBe(true);
}

export async function openNutri(page: Page) {
  await page.goto("/nutri");
  await expect(page.getByRole("heading", { name: "Modulo Nutri" })).toBeVisible();
}

export async function selectNutriTab(page: Page, name: string) {
  await page.getByRole("tab", { name }).click();
}
