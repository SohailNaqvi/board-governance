import { test, expect } from "@playwright/test";
import {
  seedTestUser,
  seedBootstrapAdmin,
  TEST_USER,
  authenticateContext,
} from "./auth";
import { PrismaClient } from "@prisma/client";

test.describe("Authentication", () => {
  let prisma: PrismaClient;

  test.beforeAll(() => {
    prisma = new PrismaClient();
  });

  test.afterAll(async () => {
    await prisma.$disconnect();
  });

  test("unauthenticated access to /admin/* redirects to login", async ({ page }) => {
    await page.goto("/admin/compliance/rules");
    expect(page.url()).toContain("/login");
  });

  test("login with valid credentials succeeds and redirects", async ({ page }) => {
    // Seed test user
    await seedTestUser();

    await page.goto("/login");

    // Fill in credentials
    await page.fill('input[id="email"]', TEST_USER.email);
    await page.fill('input[id="password"]', TEST_USER.password);

    // Submit form
    await page.click('button[type="submit"]');

    // Should redirect to default admin route (not mustChangePassword)
    expect(page.url()).toContain("/admin/compliance/rules");
  });

  test("login with invalid email shows error", async ({ page }) => {
    await page.goto("/login");

    await page.fill('input[id="email"]', "nonexistent@university.edu");
    await page.fill('input[id="password"]', "SomePassword123");

    await page.click('button[type="submit"]');

    // Error message should be shown
    const errorText = await page.locator("text=Invalid email or password").textContent();
    expect(errorText).toContain("Invalid email or password");

    // Should still be on login page
    expect(page.url()).toContain("/login");
  });

  test("login with invalid password shows error", async ({ page }) => {
    // Seed test user
    await seedTestUser();

    await page.goto("/login");

    await page.fill('input[id="email"]', TEST_USER.email);
    await page.fill('input[id="password"]', "WrongPassword123");

    await page.click('button[type="submit"]');

    // Error message should be shown
    const errorText = await page.locator("text=Invalid email or password").textContent();
    expect(errorText).toContain("Invalid email or password");

    // Should still be on login page
    expect(page.url()).toContain("/login");
  });

  test("bootstrap admin on first login redirects to change-password", async ({ page }) => {
    // Seed bootstrap admin with mustChangePassword=true
    const { email, password } = await seedBootstrapAdmin();

    await page.goto("/login");

    await page.fill('input[id="email"]', email);
    await page.fill('input[id="password"]', password);

    await page.click('button[type="submit"]');

    // Should redirect to change-password
    expect(page.url()).toContain("/change-password");
  });

  test("change password updates mustChangePassword flag", async ({ page, context }) => {
    // Seed bootstrap admin
    const { email, password } = await seedBootstrapAdmin("OldPassword123");

    await page.goto("/login");

    await page.fill('input[id="email"]', email);
    await page.fill('input[id="password"]', password);

    await page.click('button[type="submit"]');

    // On change-password page
    expect(page.url()).toContain("/change-password");

    // Enter current password
    await page.fill('input[id="current-password"]', password);

    // Enter new password (must meet requirements)
    await page.fill('input[id="new-password"]', "NewPassword123");

    // Confirm new password
    await page.fill('input[id="confirm-password"]', "NewPassword123");

    // Submit form
    await page.click('button[type="submit"]');

    // Should redirect to admin rules page
    expect(page.url()).toContain("/admin/compliance/rules");
  });

  test("protected admin routes block unauthenticated access", async ({ page }) => {
    await page.goto("/admin/compliance/rules");
    // Should redirect to login
    expect(page.url()).toContain("/login");
  });

  test("logout clears session and redirects to login", async ({ page, context }) => {
    // Seed test user
    await seedTestUser();

    await page.goto("/login");

    // Log in
    await page.fill('input[id="email"]', TEST_USER.email);
    await page.fill('input[id="password"]', TEST_USER.password);
    await page.click('button[type="submit"]');

    // Wait for redirect to admin
    expect(page.url()).toContain("/admin/compliance/rules");

    // Click logout button
    await page.click('button:has-text("Log out")');

    // Should redirect to login
    expect(page.url()).toContain("/login");
  });

  test("rate limiting prevents brute force attacks", async ({ page }) => {
    // Attempt to login 6 times with wrong password (exceeds limit of 5)
    await seedTestUser();

    for (let i = 0; i < 6; i++) {
      await page.goto("/login");

      await page.fill('input[id="email"]', TEST_USER.email);
      await page.fill('input[id="password"]', "WrongPassword123");

      await page.click('button[type="submit"]');
    }

    // On the 6th attempt, should see rate limit error
    const errorText = await page.locator("text=Too many login attempts").textContent();
    expect(errorText).toBeDefined();
  });

  test("change password with weak password is rejected", async ({ page }) => {
    // Seed bootstrap admin
    await seedBootstrapAdmin("OldPassword123");

    await page.goto("/login");

    await page.fill('input[id="email"]', "admin@university-dss.local");
    await page.fill('input[id="password"]', "OldPassword123");

    await page.click('button[type="submit"]');

    // On change-password page
    expect(page.url()).toContain("/change-password");

    // Try to set a weak password (less than 12 chars)
    await page.fill('input[id="current-password"]', "OldPassword123");
    await page.fill('input[id="new-password"]', "weak");
    await page.fill('input[id="confirm-password"]', "weak");

    // Submit button should be disabled
    const submitButton = page.locator('button[type="submit"]');
    expect(await submitButton.isDisabled()).toBeTruthy();
  });

  test("users redirected to change-password stay on that page", async ({ page }) => {
    // Seed bootstrap admin
    const { email, password } = await seedBootstrapAdmin();

    // Log in
    await page.goto("/login");

    await page.fill('input[id="email"]', email);
    await page.fill('input[id="password"]', password);

    await page.click('button[type="submit"]');

    // Redirected to change-password
    expect(page.url()).toContain("/change-password");

    // Try to navigate directly to admin route
    await page.goto("/admin/compliance/rules");

    // Should redirect back to change-password
    expect(page.url()).toContain("/change-password");
  });
});
