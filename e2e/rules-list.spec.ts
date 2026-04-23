/**
 * E2E tests for the Rule List page (/admin/compliance/rules).
 */

import { test, expect } from "@playwright/test";
import { authenticateContext } from "./auth";

test.beforeEach(async ({ context, baseURL }) => {
  await authenticateContext(context, baseURL!);
});

test.describe("Rule List Page", () => {
  test("loads and renders expected rule count", async ({ page }) => {
    await page.goto("/admin/compliance/rules");

    // Wait for data to load (skeleton disappears)
    await expect(page.getByTestId("rule-list-skeleton")).not.toBeVisible({
      timeout: 10_000,
    });

    // Should show 12 rules (10 HEC + 2 university from seed; 1 HEC rule may fail validation)
    await expect(page.locator("text=12 rules found")).toBeVisible();
  });

  test("filters by Source narrow results", async ({ page }) => {
    await page.goto("/admin/compliance/rules");
    await expect(page.getByTestId("rule-list-skeleton")).not.toBeVisible({
      timeout: 10_000,
    });

    // Click "University" source filter
    const sourceFilter = page.getByTestId("filter-source");
    await sourceFilter.getByText("University").click();

    // URL should update with source param
    await expect(page).toHaveURL(/source=UNIVERSITY/);

    // Should show only 2 university rules
    await expect(page.locator("text=2 rules found")).toBeVisible();
  });

  test("filters by Severity narrow results", async ({ page }) => {
    await page.goto("/admin/compliance/rules");
    await expect(page.getByTestId("rule-list-skeleton")).not.toBeVisible({
      timeout: 10_000,
    });

    // Click "Warning" severity filter
    const severityFilter = page.getByTestId("filter-severity");
    await severityFilter.getByText("Warning").click();

    await expect(page).toHaveURL(/severity=WARNING/);

    // HEC_PHD_MAX_ENROLLMENT_DURATION, HEC_REGISTRATION_FORMAT, UNI_SUPERVISOR_SAME_DEPARTMENT = 3
    await expect(page.locator("text=3 rules found")).toBeVisible();
  });

  test("filters by Status narrow results", async ({ page }) => {
    await page.goto("/admin/compliance/rules");
    await expect(page.getByTestId("rule-list-skeleton")).not.toBeVisible({
      timeout: 10_000,
    });

    // All seeded rules are EFFECTIVE (published in seed)
    const statusFilter = page.getByTestId("filter-status");
    await statusFilter.getByText("Effective").click();

    await expect(page).toHaveURL(/status=EFFECTIVE/);
    await expect(page.locator("text=12 rules found")).toBeVisible();

    // Draft filter should show 0
    await statusFilter.getByText("Effective").click(); // deselect
    await statusFilter.getByText("Draft").click();
    await expect(page.locator("text=0 rules found")).toBeVisible();
  });

  test("search narrows results by rule ID", async ({ page }) => {
    await page.goto("/admin/compliance/rules");
    await expect(page.getByTestId("rule-list-skeleton")).not.toBeVisible({
      timeout: 10_000,
    });

    const searchInput = page.getByTestId("rule-search");
    await searchInput.fill("PLAGIARISM");

    // Should find HEC_PLAGIARISM_THRESHOLD
    await expect(page.locator("text=1 rule found")).toBeVisible();
    await expect(page.locator("text=HEC_PLAGIARISM_THRESHOLD")).toBeVisible();
  });

  test("search narrows results by message template", async ({ page }) => {
    await page.goto("/admin/compliance/rules");
    await expect(page.getByTestId("rule-list-skeleton")).not.toBeVisible({
      timeout: 10_000,
    });

    const searchInput = page.getByTestId("rule-search");
    await searchInput.fill("doctoral degree");

    // Should find HEC_PHD_SUPERVISOR_QUALIFICATION
    await expect(page.locator("text=1 rule found")).toBeVisible();
  });

  test("row click navigates to detail page", async ({ page }) => {
    await page.goto("/admin/compliance/rules");
    await expect(page.getByTestId("rule-list-skeleton")).not.toBeVisible({
      timeout: 10_000,
    });

    // Click the first rule link
    const firstRuleLink = page
      .locator("table tbody tr")
      .first()
      .locator("a")
      .first();
    await firstRuleLink.click();

    // Should navigate to a detail page
    await expect(page).toHaveURL(/\/admin\/compliance\/rules\/.+/);
  });

  test("filter state persists through page reload", async ({ page }) => {
    await page.goto("/admin/compliance/rules?source=HEC&severity=BLOCKING");

    await expect(page.getByTestId("rule-list-skeleton")).not.toBeVisible({
      timeout: 10_000,
    });

    // Reload
    await page.reload();

    await expect(page.getByTestId("rule-list-skeleton")).not.toBeVisible({
      timeout: 10_000,
    });

    // URL should still have the filters
    await expect(page).toHaveURL(/source=HEC/);
    await expect(page).toHaveURL(/severity=BLOCKING/);
  });
});
