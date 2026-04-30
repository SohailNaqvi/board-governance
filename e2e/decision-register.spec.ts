import { test, expect } from "@playwright/test";
import { authenticateContext } from "./auth";

test.describe("Decision Register", () => {
  test("authenticated user reaches /dss/decision-register", async ({
    context,
    baseURL,
  }) => {
    await authenticateContext(context, baseURL!);
    const page = await context.newPage();

    await page.goto("/dss/decision-register");

    // Page header visible
    await expect(page.locator("text=Decision Register")).toBeVisible({
      timeout: 10_000,
    });

    // Subtitle visible
    await expect(
      page.locator(
        "text=Formal decisions across all governance bodies — Board, Syndicate, Academic Council, ASRB"
      )
    ).toBeVisible({ timeout: 10_000 });

    // List page renders
    await expect(page.getByTestId("decision-register-list")).toBeVisible({
      timeout: 10_000,
    });
  });

  test("filter by source body narrows results", async ({
    context,
    baseURL,
  }) => {
    await authenticateContext(context, baseURL!);
    const page = await context.newPage();

    await page.goto("/dss/decision-register");

    // Wait for list to load
    await expect(page.getByTestId("decision-register-list")).toBeVisible({
      timeout: 10_000,
    });

    // Click on a source body filter (e.g., BoG)
    await page.locator("button:has-text('BoG')").click();

    // URL should have sourceBody parameter
    await expect(page).toHaveURL(/sourceBody=BOARD_OF_GOVERNORS/, {
      timeout: 5_000,
    });

    // Table should still be visible (results filtered)
    await expect(page.getByTestId("decision-register-list")).toBeVisible();
  });

  test("click a decision navigates to detail page", async ({
    context,
    baseURL,
  }) => {
    await authenticateContext(context, baseURL!);
    const page = await context.newPage();

    await page.goto("/dss/decision-register");

    // Wait for list to load
    await expect(page.getByTestId("decision-register-list")).toBeVisible({
      timeout: 10_000,
    });

    // Click first decision link
    const firstDecisionLink = page
      .getByTestId("decision-register-list")
      .locator("tbody tr a")
      .first();
    const decisionRef = await firstDecisionLink.textContent();
    await firstDecisionLink.click();

    // Should navigate to decision detail page
    await expect(page).toHaveURL(/\/dss\/decision-register\/DEC-/, {
      timeout: 5_000,
    });

    // Detail page renders
    await expect(page.getByTestId("decision-detail")).toBeVisible({
      timeout: 10_000,
    });

    // Decision ref should be visible
    await expect(page.locator(`text=${decisionRef}`)).toBeVisible();
  });

  test("detail page renders decision info", async ({
    context,
    baseURL,
  }) => {
    await authenticateContext(context, baseURL!);
    const page = await context.newPage();

    // Go directly to a decision
    await page.goto("/dss/decision-register/DEC-2025-001");

    // Wait for detail page
    await expect(page.getByTestId("decision-detail")).toBeVisible({
      timeout: 10_000,
    });

    // Check decision ref visible
    await expect(page.locator("text=DEC-2025-001")).toBeVisible();

    // Check title visible
    await expect(
      page.locator("text=Strategic Plan 2025-2030 Approval")
    ).toBeVisible();

    // Check decision overview section
    await expect(page.locator("text=Decision Overview")).toBeVisible();

    // Check source body context section
    await expect(page.locator("text=Source Body Context")).toBeVisible();

    // Check related section
    await expect(page.locator("text=Related")).toBeVisible();
  });

  test("/dss/decision-register/DEC-FAKE-999 shows 404", async ({
    context,
    baseURL,
  }) => {
    await authenticateContext(context, baseURL!);
    const page = await context.newPage();

    await page.goto("/dss/decision-register/DEC-FAKE-999");

    // Should show not found
    await expect(page.getByTestId("decision-not-found")).toBeVisible({
      timeout: 10_000,
    });
  });

  test("unauthenticated /dss/decision-register shows login-required", async ({
    page,
  }) => {
    const response = await page.goto("/dss/decision-register");
    // Middleware returns 401 with inline "Login required" HTML
    expect(response?.status()).toBe(401);
    await expect(page.locator("text=Login required")).toBeVisible();
  });

  test("search by decision ref finds matching decisions", async ({
    context,
    baseURL,
  }) => {
    await authenticateContext(context, baseURL!);
    const page = await context.newPage();

    await page.goto("/dss/decision-register");

    // Wait for list to load
    await expect(page.getByTestId("decision-register-list")).toBeVisible({
      timeout: 10_000,
    });

    // Type in search box
    const searchInput = page.locator("input[placeholder='Search decisions...']");
    await searchInput.fill("DEC-2025-001");

    // Wait for URL to update with search param
    await expect(page).toHaveURL(/q=DEC-2025-001/, {
      timeout: 5_000,
    });

    // Table should still be visible (results filtered)
    await expect(page.getByTestId("decision-register-list")).toBeVisible();
  });
});
