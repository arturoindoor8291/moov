import { test, expect } from "@playwright/test";
import { SignJWT } from "jose";

// Humo de /portafolio (v2): firma un JWT de viewer con el mismo secreto que usa proxy.ts.
test.beforeEach(async ({ context, baseURL }) => {
  const secret = new TextEncoder().encode(process.env.PORTFOLIO_JWT_SECRET ?? "moov-portfolio-dev-secret-change-in-production");
  const token = await new SignJWT({ username: "smoke", role: "viewer" }).setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime("1h").sign(secret);
  await context.addCookies([{ name: "portfolio_token", value: token, url: baseURL! }]);
});

test.describe("/portafolio v2", () => {
  test("Startups: las 10 filas con los mismos campos y sin desborde horizontal de la página", async ({ page }) => {
    await page.goto("/portafolio");
    await expect(page.getByRole("heading", { name: "Startups", exact: true })).toBeVisible();
    await expect(page.locator("tbody tr")).toHaveCount(10);
    await expect(page.getByText("No reportado").first()).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(1);
  });

  test("Fondo: KPIs y selector de lente", async ({ page }) => {
    await page.goto("/portafolio/overview");
    await expect(page.getByText("Lectura del comité").first()).toBeVisible();
    await expect(page.getByText("MOIC bruto").first()).toBeVisible();
    await page.getByRole("link", { name: /A costo/ }).click();
    await expect(page).toHaveURL(/lente=costo/);
    await expect(page.getByText(/Lente A costo/)).toBeVisible();
  });

  test("Ficha: Drivana muestra posición y discrepancias", async ({ page }) => {
    await page.goto("/portafolio/startups/drivana");
    await expect(page.getByRole("heading", { name: "Drivana" })).toBeVisible();
    await expect(page.getByText("Tu posición")).toBeVisible();
    await expect(page.getByText("D-09")).toBeVisible();
  });

  test("Ficha inexistente responde 404", async ({ page }) => {
    const r = await page.goto("/portafolio/startups/no-existe");
    expect(r?.status()).toBe(404);
  });

  test("Pendientes: huecos, discrepancias y cumplimiento", async ({ page }) => {
    await page.goto("/portafolio/pendientes");
    await expect(page.getByText("Huecos por startup")).toBeVisible();
    await expect(page.getByText(/Discrepancias abiertas/)).toBeVisible();
  });
});
