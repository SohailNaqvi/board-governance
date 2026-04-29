/**
 * Smoke tests for the /dss-prototype route.
 *
 * The prototype is a frozen artefact — these tests confirm it loads
 * and that auth is enforced, not that every interactive element works.
 */

import { test, expect } from "@playwright/test";
import { authenticateContext } from "./auth";

test.describe("DSS Prototype", () => {
  test("authenticated user can reach /dss-prototype", async ({
    context,
    baseURL,
  }) => {
    await authenticateContext(context, baseURL!);
    const page = await context.newPage();

    await page.goto("/dss-prototype");

    // The prototype renders — check for its distinctive content
    // (it's a large React app with its own layout, not the DSS shell)
    await page.waitForLoadState("networkidle");
    // Page should not show "Login required" or be empty
    const bodyText = await page.textContent("body");
    expect(bodyText).toBeTruthy();
    expect(bodyText).not.toContain("Login required");
  });

  test("unauthenticated /dss-prototype shows login-required", async ({
    page,
  }) => {
    const response = await page.goto("/dss-prototype");
    expect(response?.status()).toBe(401);
    await expect(page.locator("text=Login required")).toBeVisible();
  });
});
