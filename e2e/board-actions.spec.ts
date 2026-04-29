import { test, expect } from "@playwright/test";
import { authenticateContext } from "./auth";

test.describe("Board Action Tracker", () => {
  test("authenticated user sees action tracker list with data", async ({
    context,
    baseURL,
  }) => {
    await authenticateContext(context, baseURL!);
    const page = await context.newPage();

    await page.goto("/dss/action-tracker");

    // Page title
    await expect(
      page.getByText("Board Action Tracker", { exact: true })
    ).toBeVisible({ timeout: 10_000 });

    // List wrapper
    await expect(page.getByTestId("action-tracker-list")).toBeVisible({
      timeout: 10_000,
    });

    // KPI strip should be visible
    await expect(page.getByTestId("action-kpi-strip")).toBeVisible();

    // Should have table with actions
    await expect(page.locator("table")).toBeVisible();

    // Should have at least one test action row
    await expect(
      page.locator("text=E2E-TEST-BAI-001")
    ).toBeVisible();
  });

  test("filter by status narrows results", async ({ context, baseURL }) => {
    await authenticateContext(context, baseURL!);
    const page = await context.newPage();

    await page.goto("/dss/action-tracker");

    // Wait for initial load
    await expect(page.getByTestId("action-tracker-list")).toBeVisible({
      timeout: 10_000,
    });

    // Click OPEN filter
    await page.locator("button:has-text('OPEN')").click();

    // Wait for filter to apply (check for URL change and content update)
    await expect(page).toHaveURL(/statuses=OPEN/, { timeout: 5_000 });

    // Should show OPEN action (BAI-001)
    await expect(
      page.locator("text=E2E-TEST-BAI-001")
    ).toBeVisible();
  });

  test("click an action navigates to detail page", async ({
    context,
    baseURL,
  }) => {
    await authenticateContext(context, baseURL!);
    const page = await context.newPage();

    await page.goto("/dss/action-tracker");

    // Wait for list
    await expect(page.getByTestId("action-tracker-list")).toBeVisible({
      timeout: 10_000,
    });

    // Click first action link
    await page.locator("a:has-text('E2E-TEST-BAI-001')").first().click();

    // Should navigate to detail page
    await expect(page).toHaveURL(/action-tracker\/E2E-TEST-BAI-001/, {
      timeout: 10_000,
    });

    // Detail page should have the action-detail test ID
    await expect(page.getByTestId("action-detail")).toBeVisible({
      timeout: 10_000,
    });
  });

  test("detail page shows action info", async ({ context, baseURL }) => {
    await authenticateContext(context, baseURL!);
    const page = await context.newPage();

    await page.goto("/dss/action-tracker/E2E-TEST-BAI-001");

    // Should show action detail
    await expect(page.getByTestId("action-detail")).toBeVisible({
      timeout: 10_000,
    });

    // Should show action ref as title
    await expect(
      page.getByText("E2E-TEST-BAI-001", { exact: true })
    ).toBeVisible();

    // Should show description
    await expect(
      page.getByText("Test action item 1 for E2E")
    ).toBeVisible();

    // Should show overview card
    await expect(page.locator("text=Action Overview")).toBeVisible();
  });

  test("404 for unknown actionRef", async ({ context, baseURL }) => {
    await authenticateContext(context, baseURL!);
    const page = await context.newPage();

    await page.goto("/dss/action-tracker/UNKNOWN-ACTION-9999");

    // Should show not found message
    await expect(page.getByTestId("action-not-found")).toBeVisible({
      timeout: 10_000,
    });

    // Should have back link
    await expect(
      page.locator("a:has-text('← Back to Action Tracker')")
    ).toBeVisible();
  });

  test("unauthenticated access shows login-required", async ({ page }) => {
    const response = await page.goto("/dss/action-tracker");
    // Middleware returns 401 with inline "Login required" HTML
    expect(response?.status()).toBe(401);
    await expect(page.locator("text=Login required")).toBeVisible();
  });

  test("back link returns to list", async ({ context, baseURL }) => {
    await authenticateContext(context, baseURL!);
    const page = await context.newPage();

    await page.goto("/dss/action-tracker/E2E-TEST-BAI-001");

    // Click back link
    await page.locator("a:has-text('← Back to Action Tracker')").click();

    // Should return to list
    await expect(page).toHaveURL("/dss/action-tracker", { timeout: 5_000 });

    // Should show list
    await expect(page.getByTestId("action-tracker-list")).toBeVisible({
      timeout: 10_000,
    });
  });
});
