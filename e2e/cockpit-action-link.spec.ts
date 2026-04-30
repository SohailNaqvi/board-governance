/**
 * Test: Action Follow-Up card on /dss links to /dss/action-tracker.
 */

import { test, expect } from "@playwright/test";
import { authenticateContext } from "./auth";

test.describe("Cockpit Action Follow-Up click-through", () => {
  test("clicking 'View all' navigates to /dss/action-tracker", async ({
    context,
    baseURL,
  }) => {
    await authenticateContext(context, baseURL!);
    const page = await context.newPage();

    await page.goto("/dss");
    await expect(page.getByTestId("strategic-cockpit")).toBeVisible({
      timeout: 10_000,
    });

    // Click the "View all →" link on the Action Follow-Up card
    await page.getByTestId("action-followup-link").click();

    await expect(page).toHaveURL(/\/dss\/action-tracker/, {
      timeout: 10_000,
    });
  });
});
