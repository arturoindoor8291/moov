import { test, expect, Page } from "@playwright/test";

const VALID_FORM = {
  founderName: "Ana García",
  email: "ana@startup.com",
  linkedinUrl: "https://linkedin.com/in/anagarcia",
  startupName: "FleetOS",
  website: "https://fleetos.io",
  country: "Mexico",
  yearOfFoundation: "2023",
  vertical: "Fleet management",
  salesModel: "B2B",
  companyDescription:
    "FleetOS is a fleet management platform for last-mile delivery companies in Mexico and Colombia. We help operators reduce fuel costs by 30% through real-time route optimization.",
  productStage: "5 — Product with sales",
  numberOfCoFounders: "2",
  teamSize: "8",
  netRevenueLTM: "120000",
  lastMonthNetRevenue: "15000",
  totalCapitalRaised: "200000",
  roundStage: "Seed",
  instrument: "SAFE",
  roundSize: "500000",
  preMoneyValuationCap: "3000000",
  discountRate: "20",
  interestRate: "5",
  pitchDeckLink: "https://drive.google.com/file/d/example",
  howDidYouFindUs: "LinkedIn",
};

async function fillValidForm(page: Page) {
  await page.fill('[name="founderName"]', VALID_FORM.founderName);
  await page.fill('[name="email"]', VALID_FORM.email);
  await page.fill('[name="linkedinUrl"]', VALID_FORM.linkedinUrl);
  await page.fill('[name="startupName"]', VALID_FORM.startupName);
  await page.fill('[name="website"]', VALID_FORM.website);
  await page.fill('[name="country"]', VALID_FORM.country);
  await page.fill('[name="yearOfFoundation"]', VALID_FORM.yearOfFoundation);
  await page.selectOption('[name="vertical"]', VALID_FORM.vertical);
  await page.selectOption('[name="salesModel"]', VALID_FORM.salesModel);
  await page.fill('[name="companyDescription"]', VALID_FORM.companyDescription);
  await page.selectOption('[name="productStage"]', VALID_FORM.productStage);
  await page.fill('[name="numberOfCoFounders"]', VALID_FORM.numberOfCoFounders);
  await page.fill('[name="teamSize"]', VALID_FORM.teamSize);
  await page.fill('[name="netRevenueLTM"]', VALID_FORM.netRevenueLTM);
  await page.fill('[name="lastMonthNetRevenue"]', VALID_FORM.lastMonthNetRevenue);
  await page.fill('[name="totalCapitalRaised"]', VALID_FORM.totalCapitalRaised);
  await page.selectOption('[name="roundStage"]', VALID_FORM.roundStage);
  await page.selectOption('[name="instrument"]', VALID_FORM.instrument);
  await page.fill('[name="roundSize"]', VALID_FORM.roundSize);
  await page.fill('[name="preMoneyValuationCap"]', VALID_FORM.preMoneyValuationCap);
  // Discount and interest rate should appear after selecting SAFE
  await page.fill('[name="discountRate"]', VALID_FORM.discountRate);
  await page.fill('[name="interestRate"]', VALID_FORM.interestRate);
  await page.fill('[name="pitchDeckLink"]', VALID_FORM.pitchDeckLink);
  await page.selectOption('[name="howDidYouFindUs"]', VALID_FORM.howDidYouFindUs);
  await page.check('[name="privacyConsent"]');
}

test.describe("MOOV Apply — /apply page", () => {
  test("renders the page with correct h1", async ({ page }) => {
    await page.goto("/apply");
    await expect(page.locator("h1")).toContainText("Tell us about your startup");
  });

  test("shows the MOOV logo in the nav", async ({ page }) => {
    await page.goto("/apply");
    await expect(page.locator("nav")).toBeVisible();
  });

  test("shows 5 form sections", async ({ page }) => {
    await page.goto("/apply");
    for (const section of ["01 — ABOUT YOU", "02 — ABOUT YOUR COMPANY", "03 — TRACTION", "04 — INVESTMENT ROUND", "05 — PITCH"]) {
      await expect(page.getByText(section, { exact: false })).toBeVisible();
    }
  });
});

test.describe("MOOV Apply — Validation", () => {
  test("shows errors when submitting empty form", async ({ page }) => {
    await page.goto("/apply");
    await page.click('button[type="submit"]');
    await expect(page.getByRole("alert").first()).toBeVisible();
  });

  test("shows error for invalid email", async ({ page }) => {
    await page.goto("/apply");
    await page.fill('[name="email"]', "notanemail");
    await page.click('button[type="submit"]');
    await expect(page.getByText("valid email", { exact: false })).toBeVisible();
  });

  test("blocks submit without privacy consent", async ({ page }) => {
    await page.goto("/apply");
    await fillValidForm(page);
    await page.uncheck('[name="privacyConsent"]');
    await page.click('button[type="submit"]');
    await expect(page.getByText("privacy policy", { exact: false })).toBeVisible();
  });
});

test.describe("MOOV Apply — Conditional fields", () => {
  test("does NOT show Discount Rate / Interest Rate for Equity", async ({ page }) => {
    await page.goto("/apply");
    await page.selectOption('[name="instrument"]', "Equity");
    await expect(page.locator('[name="discountRate"]')).not.toBeVisible();
    await expect(page.locator('[name="interestRate"]')).not.toBeVisible();
  });

  test("shows Discount Rate and Interest Rate for SAFE", async ({ page }) => {
    await page.goto("/apply");
    await page.selectOption('[name="instrument"]', "SAFE");
    await expect(page.locator('[name="discountRate"]')).toBeVisible();
    await expect(page.locator('[name="interestRate"]')).toBeVisible();
  });

  test("shows Discount Rate and Interest Rate for Convertible Note", async ({ page }) => {
    await page.goto("/apply");
    await page.selectOption('[name="instrument"]', "Convertible Note");
    await expect(page.locator('[name="discountRate"]')).toBeVisible();
    await expect(page.locator('[name="interestRate"]')).toBeVisible();
  });

  test("hides conditional fields when switching back to Equity", async ({ page }) => {
    await page.goto("/apply");
    await page.selectOption('[name="instrument"]', "SAFE");
    await expect(page.locator('[name="discountRate"]')).toBeVisible();
    await page.selectOption('[name="instrument"]', "Equity");
    await expect(page.locator('[name="discountRate"]')).not.toBeVisible();
  });
});

test.describe("MOOV Apply — /apply/success protection", () => {
  test("redirects to /apply when accessing /apply/success without cookie", async ({ page }) => {
    await page.context().clearCookies();
    await page.goto("/apply/success");
    await expect(page).toHaveURL(/\/apply$/);
  });
});

test.describe("MOOV Apply — SEO", () => {
  test("has correct title on /apply", async ({ page }) => {
    await page.goto("/apply");
    await expect(page).toHaveTitle(/MOOV.*VC Fund/i);
  });

  test("/apply/success is not accessible without cookie (redirects)", async ({ page }) => {
    await page.goto("/apply/success");
    await expect(page).not.toHaveURL("/apply/success");
  });
});
