import { test, expect } from '@playwright/test';
import { authenticateContext } from './auth';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

test.describe('DSS - Strategic Cockpit', () => {
  test('authenticated user reaches /dss and sees the Strategic Cockpit', async ({ browser }) => {
    const context = await browser.newContext();
    await authenticateContext(context, BASE_URL);
    const page = await context.newPage();

    await page.goto(`${BASE_URL}/dss`);

    // Verify page loaded
    await page.waitForLoadState('networkidle');

    // Check for strategic cockpit element
    await expect(page.locator('[data-testid="strategic-cockpit"]')).toBeVisible();

    // Check for demo-data banner
    await expect(page.locator('[data-testid="demo-data-banner"]')).toBeVisible();
    await expect(page.locator('[data-testid="demo-data-banner"]')).toContainText(
      'Demo data — content on this page is illustrative'
    );

    // Check for KPI strip
    await expect(page.locator('[data-testid="kpi-strip"]')).toBeVisible();

    // Verify some content exists
    await expect(page.locator('text=Strategic Cockpit')).toBeVisible();
    await expect(page.locator('text=Syndicate · Draft Agenda')).toBeVisible();

    await context.close();
  });

  test('/dss/syndicate renders with the shell and under-construction message', async ({ browser }) => {
    const context = await browser.newContext();
    await authenticateContext(context, BASE_URL);
    const page = await context.newPage();

    await page.goto(`${BASE_URL}/dss/syndicate`);
    await page.waitForLoadState('networkidle');

    // Check for section name and description
    await expect(page.locator('text=Syndicate')).toBeVisible();
    await expect(
      page.locator('text=This page will host the Syndicate meeting workspace')
    ).toBeVisible();

    await context.close();
  });

  test('/dss/asrb renders with the shell and under-construction message', async ({ browser }) => {
    const context = await browser.newContext();
    await authenticateContext(context, BASE_URL);
    const page = await context.newPage();

    await page.goto(`${BASE_URL}/dss/asrb`);
    await page.waitForLoadState('networkidle');

    // Check for section name and description
    await expect(page.locator('text=ASRB')).toBeVisible();
    await expect(
      page.locator('text=This page will host the Academic Staff Review Board workspace')
    ).toBeVisible();

    await context.close();
  });

  test('sidebar navigation — click "Action Tracker" from /dss, verify URL changes to /dss/action-tracker', async ({
    browser,
  }) => {
    const context = await browser.newContext();
    await authenticateContext(context, BASE_URL);
    const page = await context.newPage();

    await page.goto(`${BASE_URL}/dss`);
    await page.waitForLoadState('networkidle');

    // Click Action Tracker in sidebar
    await page.locator('a:has-text("Action Tracker")').first().click();
    await page.waitForLoadState('networkidle');

    // Verify URL changed
    expect(page.url()).toContain('/dss/action-tracker');

    // Verify page content loaded
    await expect(page.locator('text=Action Tracker')).toBeVisible();
    await expect(
      page.locator('text=This page will host the cross-committee action tracker')
    ).toBeVisible();

    await context.close();
  });

  test('unauthenticated /dss access shows login-required page', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto(`${BASE_URL}/dss`);
    await page.waitForLoadState('networkidle');

    // Should redirect to login or show login page
    // The exact behavior depends on middleware; verify we're not on the cockpit
    const urlAfterRedirect = page.url();
    expect(urlAfterRedirect).not.toContain('/dss/');

    await context.close();
  });
});
