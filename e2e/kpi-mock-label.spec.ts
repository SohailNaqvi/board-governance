/**
 * Tests for KpiTile (mock) label visibility.
 *
 * - /dss (Cockpit): mock data → (mock) labels PRESENT
 * - /dss/action-tracker: real data → (mock) labels ABSENT
 */

import { test, expect } from "@playwright/test";
import { authenticateContext } from "./auth";

test.describe("KpiTile mock label", () => {
  test("(mock) label is PRESENT on /dss Strategic Cockpit", async ({
    context,
    baseURL,
  }) => {
    await authenticateContext(context, baseURL!);
    const page = await context.newPage();

    await page.goto("/dss");
    await expect(page.getByTestId("strategic-cockpit")).toBeVisible({
      timeout: 10_000,
    });

    // Cockpit KPIs are mock — the (mock) label should be visible
    const mockLabels = page.getByTestId("kpi-mock-label");
    const count = await mockLabels.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test("(mock) label is ABSENT on /dss/action-tracker", async ({
    context,
    baseURL,
  }) => {
    await authenticateContext(context, baseURL!);
    const page = await context.newPage();

    await page.goto("/dss/action-tracker");
    await expect(page.getByTestId("action-tracker-list")).toBeVisible({
      timeout: 10_000,
    });

    // Action tracker KPIs are real data — no (mock) label
    const mockLabels = page.getByTestId("kpi-mock-label");
    await expect(mockLabels).toHaveCount(0);
  });
});
