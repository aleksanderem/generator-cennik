import { test, expect } from '@playwright/test';

test.describe('Footer Component', () => {
  test('should display footer on landing page', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

    const footer = page.locator('footer');
    await expect(footer).toBeVisible();
  });

  test('should display footer on generator page', async ({ page }) => {
    await page.goto('/generator');
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

    const footer = page.locator('footer');
    await expect(footer).toBeVisible();
  });

  test('should display footer on campaigns-meta page', async ({ page }) => {
    await page.goto('/campaigns-meta');
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

    const footer = page.locator('footer');
    await expect(footer).toBeVisible();

    // Should have only ONE footer (not duplicates)
    const footerCount = await page.locator('footer').count();
    expect(footerCount).toBe(1);
  });

  test('should display footer on campaigns-google page', async ({ page }) => {
    await page.goto('/campaigns-google');
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

    const footer = page.locator('footer');
    await expect(footer).toBeVisible();

    // Should have only ONE footer (not duplicates)
    const footerCount = await page.locator('footer').count();
    expect(footerCount).toBe(1);
  });

  test('should contain product links', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

    // Check for product column
    await expect(page.locator('footer').getByText('Produkty')).toBeVisible();
    await expect(page.locator('footer').getByRole('link', { name: 'Generator cennika' })).toBeVisible();
  });

  test('should contain legal links', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

    // Check for legal column
    await expect(page.locator('footer').getByText('Prawne')).toBeVisible();
    await expect(page.locator('footer').getByRole('link', { name: 'Regulamin' })).toBeVisible();
  });

  test('should contain campaigns links with icons', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

    // Check for campaigns column
    await expect(page.locator('footer').getByText('Kampanie reklamowe')).toBeVisible();
    await expect(page.locator('footer').getByRole('link', { name: 'Meta Ads' })).toBeVisible();
    await expect(page.locator('footer').getByRole('link', { name: 'Google Ads' })).toBeVisible();
  });

  test('should contain account links', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

    // Check for account column
    await expect(page.locator('footer').getByText('Konto')).toBeVisible();
    await expect(page.locator('footer').getByRole('link', { name: 'Zaloguj się' })).toBeVisible();
  });

  test('should display Kolabo attribution', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

    // Check for Kolabo link
    await expect(page.locator('footer').getByRole('link', { name: 'Kolabo' })).toBeVisible();
  });

  test('should display copyright', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

    // Check for copyright text
    const currentYear = new Date().getFullYear();
    await expect(page.locator('footer').getByText(`${currentYear}`)).toBeVisible();
    await expect(page.locator('footer').getByText('BooksyAudit.pl')).toBeVisible();
  });

  test('footer links should navigate correctly', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

    // Click on Generator cennika link
    await page.locator('footer').getByRole('link', { name: 'Generator cennika' }).click();
    await expect(page).toHaveURL('/start-generator');
  });
});
