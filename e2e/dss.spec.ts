import { test, expect } from "@playwright/test";
import { authenticateContext } from "./auth";

test.describe("DSS Pages", () => {
  test("authenticated user reaches /dss and sees Strategic Cockpit", async ({
    context,
    baseURL,
  }) => {
    await authenticateContext(context, baseURL!);
    const page = await context.newPage();

    await page.goto("/dss");

    // Page wrapper with test ID
    await expect(page.getByTestId("strategic-cockpit")).toBeVisible({
      timeout: 10_000,
    });

    // Demo-data banner
    await expect(page.getByTestId("demo-data-banner")).toBeVisible();
    await expect(page.getByTestId("demo-data-banner")).toContainText(
      "Demo data"
    );

    // KPI strip
    await expect(page.getByTestId("kpi-strip")).toBeVisible();
  });

  test("/dss/syndicate renders placeholder with shell", async ({
    context,
    baseURL,
  }) => {
    await authenticateContext(context, baseURL!);
    const page = await context.newPage();

    await page.goto("/dss/syndicate");

    // Check for the unique description text (not just "Syndicate" which appears in sidebar)
    await expect(
      page.locator("text=This page will host the Syndicate meeting workspace")
    ).toBeVisible({ timeout: 10_000 });
  });

  test("/dss/asrb renders cases list (no longer placeholder)", async ({
    context,
    baseURL,
  }) => {
    await authenticateContext(context, baseURL!);
    const page = await context.newPage();

    await page.goto("/dss/asrb");

    // ASRB is now a real cases list, not a placeholder
    await expect(
      page.getByText("ASRB Cases", { exact: true })
    ).toBeVisible({ timeout: 10_000 });
  });

  test("sidebar navigation to /dss/action-tracker", async ({
    context,
    baseURL,
  }) => {
    await authenticateContext(context, baseURL!);
    const page = await context.newPage();

    await page.goto("/dss");
    await expect(page.getByTestId("strategic-cockpit")).toBeVisible({
      timeout: 10_000,
    });

    // Click Action Tracker in sidebar
    await page.locator("a:has-text('Action Tracker')").first().click();

    await expect(page).toHaveURL(/\/dss\/action-tracker/, {
      timeout: 10_000,
    });

    // Page is now a real list page, not a placeholder
    await expect(page.getByTestId("action-tracker-list")).toBeVisible({
      timeout: 10_000,
    });
  });

  test("sidebar navigation to /dss/decision-register", async ({
    context,
    baseURL,
  }) => {
    await authenticateContext(context, baseURL!);
    const page = await context.newPage();

    await page.goto("/dss");
    await expect(page.getByTestId("strategic-cockpit")).toBeVisible({
      timeout: 10_000,
    });

    // Click Decision Register in sidebar
    await page.locator("a:has-text('Decision Register')").first().click();

    await expect(page).toHaveURL(/\/dss\/decision-register/, {
      timeout: 10_000,
    });

    // Page is now a real list page
    await expect(page.getByTestId("decision-register-list")).toBeVisible({
      timeout: 10_000,
    });
  });

  test("unauthenticated /dss shows login-required", async ({ page }) => {
    const response = await page.goto("/dss");
    // Middleware returns 401 with inline "Login required" HTML
    expect(response?.status()).toBe(401);
    await expect(page.locator("text=Login required")).toBeVisible();
  });
});
