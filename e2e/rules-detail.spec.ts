/**
 * E2E tests for the Rule Detail page (/admin/compliance/rules/[id]).
 */

import { test, expect } from "@playwright/test";
import { authenticateContext } from "./auth";

test.beforeEach(async ({ context, baseURL }) => {
  await authenticateContext(context, baseURL!);
});

test.describe("Rule Detail Page", () => {
  test("loads and renders all header fields for a known rule", async ({
    page,
  }) => {
    // Navigate to list first to get a real rule ID
    await page.goto("/admin/compliance/rules");
    await expect(page.getByTestId("rule-list-skeleton")).not.toBeVisible({
      timeout: 10_000,
    });

    // Click the HEC_PLAGIARISM_THRESHOLD rule link
    await page.locator("text=HEC_PLAGIARISM_THRESHOLD").first().click();
    await expect(page).toHaveURL(/\/admin\/compliance\/rules\/.+/);

    // Wait for detail to load
    await expect(page.getByTestId("rule-detail-skeleton")).not.toBeVisible({
      timeout: 10_000,
    });

    // Header fields
    await expect(page.getByTestId("rule-title")).toContainText(
      "HEC_PLAGIARISM_THRESHOLD"
    );

    const metadata = page.getByTestId("rule-metadata");
    await expect(metadata).toBeVisible();

    // Check key metadata fields are present
    await expect(metadata.getByText("Source", { exact: true })).toBeVisible();
    await expect(metadata.getByText("HEC", { exact: true })).toBeVisible();
    await expect(metadata.getByText("Version", { exact: true })).toBeVisible();
    await expect(metadata.getByText("RESULT_APPROVAL")).toBeVisible();
  });

  test("predicate pseudocode is present", async ({ page }) => {
    await page.goto("/admin/compliance/rules");
    await expect(page.getByTestId("rule-list-skeleton")).not.toBeVisible({
      timeout: 10_000,
    });

    // Navigate to HEC_PHD_SUPERVISOR_QUALIFICATION (has a simple eq predicate)
    await page
      .locator("text=HEC_PHD_SUPERVISOR_QUALIFICATION")
      .first()
      .click();
    await expect(page.getByTestId("rule-detail-skeleton")).not.toBeVisible({
      timeout: 10_000,
    });

    // Pseudocode should be rendered
    const pseudocode = page.getByTestId("predicate-pseudocode");
    await expect(pseudocode).toBeVisible();

    // Should contain recognizable parts of the predicate
    await expect(pseudocode).toContainText("supervisor.highestQualification.level");
    await expect(pseudocode).toContainText("=");
  });

  test("raw JSON toggle works", async ({ page }) => {
    await page.goto("/admin/compliance/rules");
    await expect(page.getByTestId("rule-list-skeleton")).not.toBeVisible({
      timeout: 10_000,
    });

    await page
      .locator("text=HEC_PHD_SUPERVISOR_QUALIFICATION")
      .first()
      .click();
    await expect(page.getByTestId("rule-detail-skeleton")).not.toBeVisible({
      timeout: 10_000,
    });

    // Initially shows pseudocode, not raw JSON
    await expect(page.getByTestId("predicate-pseudocode")).toBeVisible();
    await expect(page.getByTestId("predicate-raw-json")).not.toBeVisible();

    // Toggle to raw JSON
    await page.getByTestId("toggle-raw-json").click();
    await expect(page.getByTestId("predicate-raw-json")).toBeVisible();
    await expect(page.getByTestId("predicate-pseudocode")).not.toBeVisible();

    // Raw JSON should contain the predicate structure
    const rawJson = page.getByTestId("predicate-raw-json");
    await expect(rawJson).toContainText('"eq"');

    // Toggle back
    await page.getByTestId("toggle-raw-json").click();
    await expect(page.getByTestId("predicate-pseudocode")).toBeVisible();
    await expect(page.getByTestId("predicate-raw-json")).not.toBeVisible();
  });

  test("version history lists prior versions", async ({ page }) => {
    await page.goto("/admin/compliance/rules");
    await expect(page.getByTestId("rule-list-skeleton")).not.toBeVisible({
      timeout: 10_000,
    });

    await page
      .locator("text=HEC_PHD_SUPERVISOR_QUALIFICATION")
      .first()
      .click();
    await expect(page.getByTestId("rule-detail-skeleton")).not.toBeVisible({
      timeout: 10_000,
    });

    // Version history section should exist
    const versionHistory = page.getByTestId("version-history");
    await expect(versionHistory).toBeVisible();

    // Should have at least one version row
    const rows = versionHistory.locator("tbody tr");
    await expect(rows).not.toHaveCount(0);

    // Current version should be marked
    await expect(versionHistory.locator("text=(current)")).toBeVisible();
  });

  test("404s gracefully for an unknown rule ID", async ({ page }) => {
    await page.goto("/admin/compliance/rules/nonexistent-rule-id-12345");

    // Should show not-found state
    await expect(page.getByTestId("rule-not-found")).toBeVisible({
      timeout: 10_000,
    });
    await expect(
      page.locator("text=Rule not found")
    ).toBeVisible();

    // Should have a link back to the list
    await expect(page.getByText("Back to rules")).toBeVisible();
  });
});
