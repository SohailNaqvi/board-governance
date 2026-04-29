/**
 * E2E tests for ASRB Cases list and detail pages.
 */

import { test, expect } from "@playwright/test";
import { authenticateContext } from "./auth";

test.beforeEach(async ({ context, baseURL }) => {
  await authenticateContext(context, baseURL!);
});

test.describe("ASRB Cases", () => {
  test("authenticated user reaches /dss/asrb and sees cases list", async ({ page }) => {
    await page.goto("/dss/asrb");

    // Wait for page header
    await expect(page.locator("h1:has-text('ASRB Cases')")).toBeVisible({
      timeout: 10_000,
    });

    // Check for filter bar
    await expect(page.getByTestId("case-search")).toBeVisible();
    await expect(page.getByTestId("filter-status")).toBeVisible();
    await expect(page.getByTestId("filter-caseType")).toBeVisible();

    // Check for cases table or list
    await expect(page.getByTestId("cases-table")).toBeVisible({ timeout: 10_000 });
  });

  test("filter by status narrows results", async ({ page }) => {
    await page.goto("/dss/asrb");

    // Wait for table to load
    await expect(page.getByTestId("cases-table")).toBeVisible({ timeout: 10_000 });

    // Get initial count
    const initialCountText = await page
      .locator("text=/\\d+ cases? found/")
      .first()
      .textContent();
    const initialCount = parseInt(initialCountText?.match(/\d+/)?.[0] ?? "0");

    // Click a status filter
    const statusFilter = page.getByTestId("filter-status");
    await statusFilter.locator("button").first().click();

    // URL should update with status param
    await expect(page).toHaveURL(/status=/, { timeout: 10_000 });

    // Count should be less than or equal to initial
    const newCountText = await page
      .locator("text=/\\d+ cases? found/")
      .first()
      .textContent();
    const newCount = parseInt(newCountText?.match(/\d+/)?.[0] ?? "0");

    expect(newCount).toBeLessThanOrEqual(initialCount);
  });

  test("filter by case type narrows results", async ({ page }) => {
    await page.goto("/dss/asrb");

    await expect(page.getByTestId("cases-table")).toBeVisible({ timeout: 10_000 });

    // Click a case type filter
    const caseTypeFilter = page.getByTestId("filter-caseType");
    await caseTypeFilter.locator("button").first().click();

    // URL should update with caseType param
    await expect(page).toHaveURL(/caseType=/, { timeout: 10_000 });
  });

  test("search narrows results by receipt reference", async ({ page }) => {
    await page.goto("/dss/asrb");

    await expect(page.getByTestId("cases-table")).toBeVisible({ timeout: 10_000 });

    // Get first case receipt reference from table
    const firstReceiptCell = page
      .locator("table tbody tr")
      .first()
      .locator("td")
      .first();
    const receiptRef = await firstReceiptCell.textContent();

    if (receiptRef) {
      // Search for it
      const searchInput = page.getByTestId("case-search");
      await searchInput.fill(receiptRef);

      // Should filter to just that case or fewer
      await expect(page.locator("text=/\\d+ cases? found/")).toBeVisible({
        timeout: 10_000,
      });
    }
  });

  test("clicking a case navigates to detail page", async ({ page }) => {
    await page.goto("/dss/asrb");

    // Wait for table to load
    await expect(page.getByTestId("cases-table")).toBeVisible({ timeout: 10_000 });

    // Click first case link
    const firstCaseLink = page
      .locator("table tbody tr")
      .first()
      .locator("a")
      .first();
    const href = await firstCaseLink.getAttribute("href");

    if (href) {
      await firstCaseLink.click();

      // Should navigate to detail page
      await expect(page).toHaveURL(/\/dss\/asrb\/[a-z0-9]+/, {
        timeout: 10_000,
      });

      // Detail page should render
      await expect(page.getByTestId("case-detail")).toBeVisible();
    }
  });

  test("detail page renders case info", async ({ page }) => {
    await page.goto("/dss/asrb");

    await expect(page.getByTestId("cases-table")).toBeVisible({ timeout: 10_000 });

    // Click first case
    const firstCaseLink = page
      .locator("table tbody tr")
      .first()
      .locator("a")
      .first();
    await firstCaseLink.click();

    // Wait for detail page
    await expect(page.getByTestId("case-detail")).toBeVisible({ timeout: 10_000 });

    // Check for key sections
    await expect(page.locator("h1")).toBeVisible();
    await expect(page.locator("text=Case Overview")).toBeVisible();
    await expect(page.locator("text=Compliance Evaluations")).toBeVisible();
    await expect(page.locator("text=Audit Trail")).toBeVisible();
    await expect(page.locator("text=Attachments")).toBeVisible();
  });

  test("detail page has back link to list", async ({ page }) => {
    await page.goto("/dss/asrb");

    await expect(page.getByTestId("cases-table")).toBeVisible({ timeout: 10_000 });

    // Click first case
    const firstCaseLink = page
      .locator("table tbody tr")
      .first()
      .locator("a")
      .first();
    await firstCaseLink.click();

    // Wait for detail page
    await expect(page.getByTestId("case-detail")).toBeVisible({ timeout: 10_000 });

    // Click back link
    await page.locator("a:has-text('Back to ASRB Cases')").click();

    // Should return to list
    await expect(page).toHaveURL(/\/dss\/asrb$/, { timeout: 10_000 });
    await expect(page.getByTestId("cases-table")).toBeVisible();
  });

  test("/dss/asrb/nonexistent-id shows 404", async ({ page }) => {
    await page.goto("/dss/asrb/nonexistent-id-12345");

    // Wait for 404 message
    await expect(page.getByTestId("case-not-found")).toBeVisible({
      timeout: 10_000,
    });

    // Should have "Case Not Found" header
    await expect(page.locator("text=Case Not Found")).toBeVisible();

    // Should have back link
    await expect(page.locator("a:has-text('Back to ASRB Cases')")).toBeVisible();
  });

  test("filter state persists through page reload", async ({ page }) => {
    await page.goto("/dss/asrb?status=RECEIVED,COMPLIANCE_EVALUATED");

    await expect(page.getByTestId("cases-table")).toBeVisible({ timeout: 10_000 });

    // Reload
    await page.reload();

    await expect(page.getByTestId("cases-table")).toBeVisible({ timeout: 10_000 });

    // URL should still have the filter
    await expect(page).toHaveURL(/status=RECEIVED,COMPLIANCE_EVALUATED/);
  });

  test("unauthenticated /dss/asrb shows login-required", async ({ page }) => {
    // Create a new context without authentication
    const newContext = await page.context().browser()?.newContext();
    if (!newContext) throw new Error("Could not create new context");

    const newPage = await newContext.newPage();
    const response = await newPage.goto("/dss/asrb");

    // Middleware returns 401 with inline "Login required" HTML
    expect(response?.status()).toBe(401);
    await expect(newPage.locator("text=Login required")).toBeVisible();

    await newContext.close();
  });
});
