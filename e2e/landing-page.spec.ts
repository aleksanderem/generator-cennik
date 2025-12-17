import { test, expect } from '@playwright/test';

test.describe('Landing Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display the main heading', async ({ page }) => {
    // Check for main heading text (h1 or h2)
    const heading = page.locator('h1, h2').first();
    await expect(heading).toBeVisible();
  });

  test('should display the navigation header', async ({ page }) => {
    // Check for logo
    await expect(page.locator('img[alt="BooksyAudit"]').first()).toBeVisible();
  });

  test('should display sticky banner', async ({ page }) => {
    // Check for sticky banner with Booksy.pl mention
    const banner = page.locator('text=Booksy.pl');
    await expect(banner.first()).toBeVisible();
  });

  test('should have working navigation links', async ({ page }) => {
    // Check navigation links exist
    await expect(page.getByRole('link', { name: /generator/i }).first()).toBeVisible();
  });

  test('should display footer', async ({ page }) => {
    // Scroll to footer
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

    // Check footer is visible
    const footer = page.locator('footer');
    await expect(footer).toBeVisible();

    // Check copyright
    await expect(page.locator('text=BooksyAudit.pl')).toBeVisible();
  });

  test('should display pricing section', async ({ page }) => {
    // Check for pricing section
    const pricingSection = page.locator('#pricing, [id*="pricing"]');
    if (await pricingSection.count() > 0) {
      await expect(pricingSection.first()).toBeVisible();
    }
  });
});
