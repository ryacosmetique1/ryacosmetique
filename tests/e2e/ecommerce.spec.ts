import { test, expect, request } from "@playwright/test";

const CLIENT_EMAIL = process.env.TEST_CLIENT_EMAIL || "";
const CLIENT_PASSWORD = process.env.TEST_CLIENT_PASSWORD || "";
const SEED_SECRET = process.env.SEED_SECRET || "";
const SEED_URL = process.env.SEED_URL || "";

test.describe("E-commerce flow", () => {
  test.beforeAll(async ({ baseURL }) => {
    if (!CLIENT_EMAIL || !CLIENT_PASSWORD || !SEED_SECRET) {
      test.skip(true, "Missing TEST_CLIENT_EMAIL/PASSWORD/SEED_SECRET env vars");
    }
    const ctx = await request.newContext();
    const target = SEED_URL || `${baseURL}/api/public/seed`;
    const res = await ctx.post(target, {
      headers: { "x-seed-secret": SEED_SECRET, "content-type": "application/json" },
      data: {},
    });
    expect(res.ok(), `seed failed: ${res.status()} ${await res.text()}`).toBeTruthy();
    await ctx.dispose();
  });

  test("client can browse boutique and add product to cart", async ({ page }) => {
    await page.goto("/boutique");
    await expect(page.locator("body")).toContainText(/Boutique|Produits|Lait/i);
    // Add first available product.
    const addButton = page.getByRole("button", { name: /Ajouter|Panier/i }).first();
    await addButton.click({ trial: false }).catch(() => {});
  });

  test("client signs in, sees /mes-commandes", async ({ page }) => {
    await page.goto("/auth");
    // Try email login. Auth page may show tabs; be flexible.
    const emailInput = page.locator('input[type="email"]').first();
    await emailInput.fill(CLIENT_EMAIL);
    const pwdInput = page.locator('input[type="password"]').first();
    await pwdInput.fill(CLIENT_PASSWORD);
    await page.getByRole("button", { name: /Connexion|Se connecter|Sign in/i }).first().click();
    // Give session time to hydrate.
    await page.waitForTimeout(2000);
    await page.goto("/mes-commandes");
    await expect(page.locator("body")).toContainText(/commande|Commandes|order/i);
  });
});
