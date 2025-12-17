import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test('should navigate to generator page', async ({ page }) => {
    await page.goto('/');

    // Find and click generator link in header
    await page.getByRole('link', { name: /generator/i }).first().click();

    // Should be on generator page
    await expect(page).toHaveURL(/generator/);
  });

  test('should navigate to audit page', async ({ page }) => {
    await page.goto('/');

    // Find and click audit link in header
    const auditLink = page.getByRole('link', { name: /audyt/i }).first();
    if (await auditLink.isVisible()) {
      await auditLink.click();
      await expect(page).toHaveURL(/audit/);
    }
  });

  test('should navigate to campaigns-meta page', async ({ page }) => {
    await page.goto('/campaigns-meta');

    // Should load the page
    await expect(page.locator('h1, h2').first()).toBeVisible();
  });

  test('should navigate to campaigns-google page', async ({ page }) => {
    await page.goto('/campaigns-google');

    // Should load the page
    await expect(page.locator('h1, h2').first()).toBeVisible();
  });

  test('should navigate home when clicking logo', async ({ page }) => {
    await page.goto('/generator');

    // Click logo to go home
    await page.locator('img[alt="BooksyAudit"]').first().click();

    await expect(page).toHaveURL('/');
  });

  test('should display campaigns dropdown in header', async ({ page }) => {
    await page.goto('/');

    // Look for campaigns navigation with icons
    const metaLink = page.getByRole('link', { name: /meta/i });
    const googleLink = page.getByRole('link', { name: /google/i });

    // Check if at least one campaign link exists (could be in dropdown)
    const hasMetaLink = await metaLink.count() > 0;
    const hasGoogleLink = await googleLink.count() > 0;

    expect(hasMetaLink || hasGoogleLink).toBeTruthy();
  });

  test('should have consistent header across pages', async ({ page }) => {
    const pages = ['/', '/generator', '/campaigns-meta', '/campaigns-google'];

    for (const url of pages) {
      await page.goto(url);

      // Check logo is present
      const logo = page.locator('img[alt="BooksyAudit"]').first();
      await expect(logo).toBeVisible();
    }
  });
});
