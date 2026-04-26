import { test, expect } from "@playwright/test";
import {
  seedTestUser,
  seedBootstrapAdmin,
  authenticateContext,
  TEST_USER,
} from "./auth";

test.describe("Authentication", () => {
  test("unauthenticated access to /admin/* shows login-required page", async ({ page }) => {
    const response = await page.goto("/admin/compliance/rules");
    // Middleware returns 401 with inline "Login required" HTML
    expect(response?.status()).toBe(401);
    await expect(page.locator("text=Login required")).toBeVisible();
    await expect(page.locator("text=Go to login")).toBeVisible();
  });

  test("login with valid credentials succeeds and redirects", async ({ page }) => {
    await seedTestUser();

    await page.goto("/login");
    await page.fill('[data-testid="login-email"]', TEST_USER.email);
    await page.fill('[data-testid="login-password"]', TEST_USER.password);
    await page.click('[data-testid="login-submit"]');

    // Wait for redirect to admin route
    await expect(page).toHaveURL(/\/admin\/compliance\/rules/, { timeout: 10_000 });
  });

  test("login with invalid email shows error", async ({ page }) => {
    await page.goto("/login");
    await page.fill('[data-testid="login-email"]', "nonexistent@university.edu");
    await page.fill('[data-testid="login-password"]', "SomePassword123");
    await page.click('[data-testid="login-submit"]');

    await expect(page.getByTestId("login-error")).toContainText(
      "Invalid email or password",
      { timeout: 10_000 }
    );
    expect(page.url()).toContain("/login");
  });

  test("login with invalid password shows error", async ({ page }) => {
    await seedTestUser();

    await page.goto("/login");
    await page.fill('[data-testid="login-email"]', TEST_USER.email);
    await page.fill('[data-testid="login-password"]', "WrongPassword123");
    await page.click('[data-testid="login-submit"]');

    await expect(page.getByTestId("login-error")).toContainText(
      "Invalid email or password",
      { timeout: 10_000 }
    );
    expect(page.url()).toContain("/login");
  });

  test("bootstrap admin first login redirects to change-password", async ({ page }) => {
    const { email, password } = await seedBootstrapAdmin();

    await page.goto("/login");
    await page.fill('[data-testid="login-email"]', email);
    await page.fill('[data-testid="login-password"]', password);
    await page.click('[data-testid="login-submit"]');

    await expect(page).toHaveURL(/\/change-password/, { timeout: 10_000 });
  });

  test("change password flow completes and grants access", async ({ page }) => {
    const { email, password } = await seedBootstrapAdmin("OldPassword123!");

    // Log in
    await page.goto("/login");
    await page.fill('[data-testid="login-email"]', email);
    await page.fill('[data-testid="login-password"]', password);
    await page.click('[data-testid="login-submit"]');

    await expect(page).toHaveURL(/\/change-password/, { timeout: 10_000 });

    // Fill change-password form
    await page.fill('input[id="current-password"]', password);
    await page.fill('input[id="new-password"]', "NewSecurePass123!");
    await page.fill('input[id="confirm-password"]', "NewSecurePass123!");

    await page.click('button[type="submit"]');

    // Should redirect to admin area
    await expect(page).toHaveURL(/\/admin/, { timeout: 10_000 });
  });

  test("logout clears session and returns to login-required", async ({ page }) => {
    await seedTestUser();

    // Log in
    await page.goto("/login");
    await page.fill('[data-testid="login-email"]', TEST_USER.email);
    await page.fill('[data-testid="login-password"]', TEST_USER.password);
    await page.click('[data-testid="login-submit"]');

    await expect(page).toHaveURL(/\/admin\/compliance\/rules/, { timeout: 10_000 });

    // Click logout
    await page.click('button:has-text("Log out")');

    // Should return to login page
    await expect(page).toHaveURL(/\/login/, { timeout: 10_000 });

    // Visiting admin again shows login-required
    const response = await page.goto("/admin/compliance/rules");
    expect(response?.status()).toBe(401);
    await expect(page.locator("text=Login required")).toBeVisible();
  });

  test("404 for unknown rule still works after auth", async ({ page, context, baseURL }) => {
    // Use cookie injection to avoid rate-limit interaction with other tests
    await seedTestUser();
    await authenticateContext(context, baseURL!);

    await page.goto("/admin/compliance/rules/nonexistent-rule-id");
    await expect(page.getByTestId("rule-not-found")).toBeVisible({ timeout: 10_000 });
  });

  // Rate-limit test MUST be last — it makes 6 failed attempts from the same
  // IP as all other tests, which would lock out subsequent login-via-form tests.
  test("rate limiting prevents brute force attacks", async ({ page }) => {
    await seedTestUser();

    // Attempt 6 logins with wrong password (limit is 5)
    for (let i = 0; i < 6; i++) {
      await page.goto("/login");
      await page.fill('[data-testid="login-email"]', TEST_USER.email);
      await page.fill('[data-testid="login-password"]', "WrongPassword123");
      await page.click('[data-testid="login-submit"]');
      // Wait for the error response before next attempt
      await expect(page.getByTestId("login-error")).toBeVisible({ timeout: 10_000 });
    }

    // The 6th attempt should show rate-limit error
    await expect(page.getByTestId("login-error")).toContainText(
      /too many|rate limit/i,
      { timeout: 10_000 }
    );
  });
});
