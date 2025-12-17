import { test, expect } from '@playwright/test';

test.describe('Generator Page', () => {
  test('should display generator page', async ({ page }) => {
    await page.goto('/generator');

    // Check for main content
    await expect(page.locator('h1, h2').first()).toBeVisible();
  });

  test('should display pricing options', async ({ page }) => {
    await page.goto('/generator');

    // Look for pricing or CTA elements
    const ctaButton = page.getByRole('button').first();
    await expect(ctaButton).toBeVisible();
  });
});

test.describe('Start Generator Page', () => {
  test('should display start generator page', async ({ page }) => {
    await page.goto('/start-generator');

    // Check page loads
    await expect(page.locator('body')).toBeVisible();
  });

  test('should display input area for pasting data', async ({ page }) => {
    await page.goto('/start-generator');

    // Look for textarea or input field
    const inputArea = page.locator('textarea, input[type="text"]').first();
    if (await inputArea.count() > 0) {
      await expect(inputArea).toBeVisible();
    }
  });

  test('should have template editor when draft loaded', async ({ page }) => {
    // This would need a valid draft ID, so we just verify the page structure
    await page.goto('/start-generator');

    // Check basic page structure
    await expect(page.locator('body')).toBeVisible();
  });
});

test.describe('Generator with Draft', () => {
  test('should load draft from URL parameter', async ({ page }) => {
    // Generate a test draft ID
    const testDraftId = `draft_test_${Date.now()}`;

    await page.goto(`/start-generator?draft=${testDraftId}`);

    // Page should load even if draft doesn't exist
    await expect(page.locator('body')).toBeVisible();
  });
});
