import { test, expect, request } from "@playwright/test";

const ADMIN_EMAIL = process.env.TEST_ADMIN_EMAIL || "";
const ADMIN_PASSWORD = process.env.TEST_ADMIN_PASSWORD || "";
const ADMIN_RESET_SECRET = process.env.ADMIN_RESET_SECRET || "";
const RESET_URL = process.env.ADMIN_RESET_URL || ""; // optional absolute URL for prod reset

test.describe("Admin auth flow", () => {
  test.beforeAll(async ({ baseURL }) => {
    if (!ADMIN_EMAIL || !ADMIN_PASSWORD || !ADMIN_RESET_SECRET) {
      test.skip(true, "Missing TEST_ADMIN_EMAIL/PASSWORD/ADMIN_RESET_SECRET env vars");
    }
    const ctx = await request.newContext();
    const target = RESET_URL || `${baseURL}/api/public/admin-reset`;
    const res = await ctx.post(target, {
      headers: { "x-admin-reset-secret": ADMIN_RESET_SECRET, "content-type": "application/json" },
      data: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
    });
    expect(res.ok(), `admin-reset failed: ${res.status()} ${await res.text()}`).toBeTruthy();
    await ctx.dispose();
  });

  test("/admin-login renders the sign-in form", async ({ page }) => {
    await page.goto("/admin-login");
    await expect(page.getByRole("heading", { name: /Espace administrateur/i })).toBeVisible();
    await expect(page.getByPlaceholder(/Email/i)).toBeVisible();
  });

  test("/admin is protected when signed out", async ({ page }) => {
    await page.goto("/admin");
    await page.waitForURL(/\/auth|\/admin-login/, { timeout: 15_000 });
    expect(page.url()).toMatch(/\/auth|\/admin-login/);
  });

  test("admin can sign in and reach the dashboard", async ({ page }) => {
    await page.goto("/admin-login");
    await page.getByPlaceholder(/Email/i).fill(ADMIN_EMAIL);
    await page.getByPlaceholder(/Mot de passe/i).fill(ADMIN_PASSWORD);
    await page.getByRole("button", { name: /Se connecter/i }).click();
    await page.waitForURL(/\/admin$/, { timeout: 20_000 });
    await expect(page.locator("body")).toContainText(/Administration|Dashboard|Tableau/i);
  });
});
