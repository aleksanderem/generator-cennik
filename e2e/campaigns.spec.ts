import { test, expect } from '@playwright/test';

test.describe('Meta Ads Campaign Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/campaigns-meta');
  });

  test('should display the page heading', async ({ page }) => {
    // Should have a main heading
    await expect(page.locator('h1, h2').first()).toBeVisible();
  });

  test('should display Meta/Facebook related content', async ({ page }) => {
    // Look for Meta or Facebook mentions
    const metaContent = page.locator('text=/meta|facebook/i').first();
    await expect(metaContent).toBeVisible();
  });

  test('should have CTA button', async ({ page }) => {
    // Look for call to action button
    const ctaButton = page.getByRole('button').first();
    await expect(ctaButton).toBeVisible();
  });

  test('should have only one footer', async ({ page }) => {
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

    const footerCount = await page.locator('footer').count();
    expect(footerCount).toBe(1);
  });

  test('should display header navigation', async ({ page }) => {
    // Check header is present
    const logo = page.locator('img[alt="BooksyAudit"]').first();
    await expect(logo).toBeVisible();
  });
});

test.describe('Google Ads Campaign Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/campaigns-google');
  });

  test('should display the page heading', async ({ page }) => {
    // Should have a main heading
    await expect(page.locator('h1, h2').first()).toBeVisible();
  });

  test('should display Google related content', async ({ page }) => {
    // Look for Google mentions
    const googleContent = page.locator('text=/google/i').first();
    await expect(googleContent).toBeVisible();
  });

  test('should have CTA button', async ({ page }) => {
    // Look for call to action button
    const ctaButton = page.getByRole('button').first();
    await expect(ctaButton).toBeVisible();
  });

  test('should have only one footer', async ({ page }) => {
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

    const footerCount = await page.locator('footer').count();
    expect(footerCount).toBe(1);
  });

  test('should display header navigation', async ({ page }) => {
    // Check header is present
    const logo = page.locator('img[alt="BooksyAudit"]').first();
    await expect(logo).toBeVisible();
  });
});

test.describe('Campaign Pages Consistency', () => {
  test('both campaign pages should have consistent structure', async ({ page }) => {
    // Check Meta page
    await page.goto('/campaigns-meta');
    const metaFooterCount = await page.locator('footer').count();

    // Check Google page
    await page.goto('/campaigns-google');
    const googleFooterCount = await page.locator('footer').count();

    // Both should have exactly 1 footer
    expect(metaFooterCount).toBe(1);
    expect(googleFooterCount).toBe(1);
  });

  test('footer links should work on campaign pages', async ({ page }) => {
    await page.goto('/campaigns-meta');
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

    // Check footer has proper links
    const homeLink = page.locator('footer').getByRole('link', { name: /generator cennika/i });
    await expect(homeLink).toBeVisible();
  });
});
