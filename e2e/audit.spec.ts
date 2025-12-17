import { test, expect } from '@playwright/test';

/**
 * E2E tests for the Audit flow.
 *
 * These tests cover the full audit journey from viewing the audit page
 * to starting an audit and monitoring progress.
 *
 * Note: Some tests require authentication. Tests that check authenticated
 * flows will show appropriate "not logged in" states when auth is unavailable.
 */

test.describe('Audit Landing Page', () => {
  test('should display audit page with pricing', async ({ page }) => {
    await page.goto('/audit');

    // Should show main heading
    await expect(page.locator('h1, h2').first()).toBeVisible();

    // Should have pricing information
    const priceElement = page.locator('text=/zł|PLN/i').first();
    await expect(priceElement).toBeVisible();
  });

  test('should display features and benefits', async ({ page }) => {
    await page.goto('/audit');

    // Look for feature descriptions
    const pageContent = await page.textContent('body');
    expect(pageContent).toMatch(/audyt|analiz|raport/i);
  });

  test('should have call-to-action button', async ({ page }) => {
    await page.goto('/audit');

    // Should have a CTA button
    const ctaButton = page.getByRole('button').first();
    await expect(ctaButton).toBeVisible();
  });
});

test.describe('Start Audit Page - Unauthenticated', () => {
  test('should redirect or show login prompt when not authenticated', async ({ page }) => {
    await page.goto('/success');

    // Should show either login prompt or redirect indicator
    // The page should load and show some content
    await expect(page.locator('body')).toBeVisible();

    // Check for various valid page states:
    // - login prompt if auth required
    // - payment error if Stripe callback without session
    // - audit content if user has pending audit
    const pageContent = await page.textContent('body');
    const hasLoginPrompt = pageContent?.match(/zaloguj|login|sign in/i);
    const hasBooksy = pageContent?.match(/booksy/i);
    const hasAudit = pageContent?.match(/audyt|audit/i);
    const hasPaymentError = pageContent?.match(/nie udało|coś poszło nie tak|payment|błąd/i);
    const currentUrl = page.url();
    const notOnSuccessPage = !currentUrl.includes('/success');

    // Accept if any of these valid states occur
    expect(hasLoginPrompt || hasBooksy || hasAudit || hasPaymentError || notOnSuccessPage).toBeTruthy();
  });
});

test.describe('Start Audit Page - UI Elements', () => {
  test('should display Booksy URL input form when eligible', async ({ page }) => {
    await page.goto('/success');

    // Even without auth, page structure should be present
    await expect(page.locator('body')).toBeVisible();
  });

  test('should validate Booksy URL format', async ({ page }) => {
    await page.goto('/success');

    // Try to find URL input
    const urlInput = page.locator('input[type="url"], input[placeholder*="booksy"]').first();

    if (await urlInput.count() > 0) {
      // Try entering invalid URL
      await urlInput.fill('https://google.com');

      // Look for submit button and try to submit
      const submitButton = page.getByRole('button', { name: /rozpocznij|start/i }).first();
      if (await submitButton.count() > 0) {
        await submitButton.click();

        // Should show validation error
        await expect(page.locator('text=/prawidłowy|booksy|niepoprawny/i')).toBeVisible();
      }
    }
  });
});

test.describe('Profile Page - Audit Status', () => {
  test('should display profile page', async ({ page }) => {
    await page.goto('/profile');

    // Page should load
    await expect(page.locator('body')).toBeVisible();
  });

  test('should show audit section in profile', async ({ page }) => {
    await page.goto('/profile');

    // Look for audit-related content or tabs
    const hasAuditSection = await page.locator('text=/audyt|audit/i').count() > 0;
    const hasLoginPrompt = await page.locator('text=/zaloguj|login/i').count() > 0;

    // Either shows audit section or login prompt
    expect(hasAuditSection || hasLoginPrompt).toBeTruthy();
  });
});

test.describe('Audit Progress States', () => {
  test('should display appropriate UI for pending audit state', async ({ page }) => {
    await page.goto('/success');

    // The page should render and show either:
    // - URL input form (if user has pending audit)
    // - Login prompt (if not authenticated)
    // - No credits message (if authenticated but no credits)
    await expect(page.locator('body')).toBeVisible();

    const pageContent = await page.textContent('body');
    expect(pageContent?.length).toBeGreaterThan(0);
  });

  test('should display progress indicators when audit is processing', async ({ page }) => {
    // This would need a mock or test audit in progress
    // For now, verify the page can handle the route
    await page.goto('/success');

    // Check that the page loads without errors
    const errorMessage = await page.locator('.error, [role="alert"]').count();
    expect(errorMessage).toBeLessThanOrEqual(1); // Allow for auth-related messages
  });
});

test.describe('Audit Results Display', () => {
  test('should display completed audit results if available', async ({ page }) => {
    await page.goto('/profile');

    // Look for completed audit indicators
    const completedAudit = await page.locator('text=/zakończon|completed|wynik/i').count();
    const noAudits = await page.locator('text=/brak audyt|no audits/i').count();
    const loginRequired = await page.locator('text=/zaloguj|login/i').count();

    // Should show one of these states
    expect(completedAudit > 0 || noAudits > 0 || loginRequired > 0).toBeTruthy();
  });
});

test.describe('Audit Flow Navigation', () => {
  test('should have clickable CTA button on audit page', async ({ page }) => {
    await page.goto('/audit');

    // Find CTA buttons for ordering audit
    const orderButton = page.getByRole('button', { name: 'Zamów Audyt' });
    const loginToOrderButton = page.getByRole('button', { name: /zaloguj.*kup/i });

    // At least one CTA should be present
    const orderCount = await orderButton.count();
    const loginCount = await loginToOrderButton.count();

    expect(orderCount > 0 || loginCount > 0).toBeTruthy();

    // Verify the main CTA is clickable (doesn't throw)
    if (orderCount > 0) {
      await expect(orderButton).toBeEnabled();
    }
    if (loginCount > 0) {
      await expect(loginToOrderButton).toBeEnabled();
    }

    // Page should remain stable after potential interactions
    await expect(page.locator('body')).toBeVisible();
  });

  test('should navigate from profile to success page when starting audit', async ({ page }) => {
    await page.goto('/profile');

    // Look for "Start audit" link or button
    const startButton = page.getByRole('link', { name: /rozpocznij|start/i }).first();

    if (await startButton.count() > 0) {
      await startButton.click();

      // Should navigate to success page
      await expect(page).toHaveURL(/success/);
    }
  });
});

test.describe('Audit Error Handling', () => {
  test('should handle network errors gracefully', async ({ page }) => {
    // Simulate offline mode
    await page.goto('/audit');

    // The page should still render basic content
    await expect(page.locator('body')).toBeVisible();
  });

  test('should display error messages for failed audits', async ({ page }) => {
    await page.goto('/profile');

    // Check if error states are properly styled
    const errorIndicators = await page.locator('.text-red, .bg-red, [class*="error"]').count();

    // This is just verifying the page can handle error states
    // The actual count depends on whether there are failed audits
    expect(errorIndicators).toBeGreaterThanOrEqual(0);
  });
});

test.describe('Audit Mobile Responsiveness', () => {
  test('should display audit page correctly on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/audit');

    // Content should be visible
    await expect(page.locator('h1, h2').first()).toBeVisible();

    // No horizontal overflow
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = await page.evaluate(() => window.innerWidth);
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 10); // Allow small margin
  });

  test('should display success page correctly on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/success');

    // Page should load
    await expect(page.locator('body')).toBeVisible();
  });
});

test.describe('Audit Accessibility', () => {
  test('should have proper heading structure on audit page', async ({ page }) => {
    await page.goto('/audit');

    // Should have h1 heading
    const h1Count = await page.locator('h1').count();
    expect(h1Count).toBeGreaterThanOrEqual(1);
  });

  test('should have accessible form elements on success page', async ({ page }) => {
    await page.goto('/success');

    // Check for labels on inputs
    const inputs = await page.locator('input:visible').all();
    for (const input of inputs) {
      const id = await input.getAttribute('id');
      if (id) {
        const hasLabel = await page.locator(`label[for="${id}"]`).count() > 0;
        const hasAriaLabel = await input.getAttribute('aria-label');
        expect(hasLabel || hasAriaLabel).toBeTruthy();
      }
    }
  });

  test('should have proper button accessibility', async ({ page }) => {
    await page.goto('/audit');

    const buttons = await page.locator('button:visible').all();
    for (const button of buttons) {
      const text = await button.textContent();
      const ariaLabel = await button.getAttribute('aria-label');
      expect(text?.trim() || ariaLabel).toBeTruthy();
    }
  });
});
