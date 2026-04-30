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

    // List page wrapper visible
    await expect(page.getByTestId("decision-register-list")).toBeVisible({
      timeout: 10_000,
    });

    // Subtitle visible (unique text, not ambiguous)
    await expect(
      page.locator("text=Formal decisions across all governance bodies")
    ).toBeVisible({ timeout: 10_000 });
  });

  test("filter by source body narrows results", async ({
    context,
    baseURL,
  }) => {
    await authenticateContext(context, baseURL!);
    const page = await context.newPage();

    await page.goto("/dss/decision-register");
    await expect(page.getByTestId("decision-register-list")).toBeVisible({
      timeout: 10_000,
    });

    // Click BoG filter
    await page.locator("button:has-text('BoG')").click();
    await expect(page).toHaveURL(/sourceBody=BOARD_OF_GOVERNORS/, {
      timeout: 5_000,
    });
  });

  test("click a decision navigates to detail page", async ({
    context,
    baseURL,
  }) => {
    await authenticateContext(context, baseURL!);
    const page = await context.newPage();

    await page.goto("/dss/decision-register");
    await expect(page.getByTestId("decision-register-list")).toBeVisible({
      timeout: 10_000,
    });

    // Click first decision link in the table
    const firstLink = page.locator("table tbody tr a").first();
    await firstLink.click();

    await expect(page).toHaveURL(/\/dss\/decision-register\/DEC-/, {
      timeout: 10_000,
    });
  });

  test("detail page renders decision info", async ({
    context,
    baseURL,
  }) => {
    await authenticateContext(context, baseURL!);
    const page = await context.newPage();

    await page.goto("/dss/decision-register/DEC-2025-001");

    await expect(page.getByTestId("decision-detail")).toBeVisible({
      timeout: 10_000,
    });

    // Check key sections
    await expect(page.getByText("Decision Overview", { exact: true })).toBeVisible();
    await expect(page.getByText("Source Body Context", { exact: true })).toBeVisible();
  });

  test("/dss/decision-register/DEC-FAKE-999 shows 404", async ({
    context,
    baseURL,
  }) => {
    await authenticateContext(context, baseURL!);
    const page = await context.newPage();

    await page.goto("/dss/decision-register/DEC-FAKE-999");

    await expect(page.getByTestId("decision-not-found")).toBeVisible({
      timeout: 10_000,
    });
  });

  test("unauthenticated /dss/decision-register shows login-required", async ({
    page,
  }) => {
    const response = await page.goto("/dss/decision-register");
    expect(response?.status()).toBe(401);
    await expect(page.locator("text=Login required")).toBeVisible();
  });

  test("search filters decisions", async ({
    context,
    baseURL,
  }) => {
    await authenticateContext(context, baseURL!);
    const page = await context.newPage();

    await page.goto("/dss/decision-register");
    await expect(page.getByTestId("decision-register-list")).toBeVisible({
      timeout: 10_000,
    });

    await page.getByTestId("decision-search").fill("DEC-2025");
    await expect(page).toHaveURL(/q=DEC-2025/, { timeout: 5_000 });
  });
});
