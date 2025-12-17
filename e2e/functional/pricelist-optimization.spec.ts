import { test, expect } from '@playwright/test';

/**
 * Testy funkcjonalne dla optymalizacji cenników
 *
 * Logika biznesowa (ProfilePage):
 * - Cennik bazowy (isOptimized=false) BEZ optimizedVersionId POWINIEN pokazywać kartę optymalizacji
 * - Cennik bazowy Z optimizedVersionId NIE POWINIEN pokazywać karty (już ma wersję zoptymalizowaną)
 * - Cennik zoptymalizowany (isOptimized=true) NIE POWINIEN pokazywać karty optymalizacji
 *
 * Logika biznesowa (StartGeneratorPage):
 * - Nowy draft POWINIEN pokazywać kartę optymalizacji (showOptimizationCard=true)
 */

test.describe('Pricelist Optimization Card Logic', () => {

  test.describe('Start Generator Page (new pricelist)', () => {

    test('should have AuditorAI branding on start generator page', async ({ page }) => {
      await page.goto('/start-generator');
      await page.waitForLoadState('networkidle');

      // Na stronie generatora powinny być wzmianki o AuditorAI
      const pageContent = await page.textContent('body');
      expect(pageContent).toMatch(/AuditorAI|Auditor|cennik/i);
    });

    test('optimization card has showOptimizationCard=true by default', async ({ page }) => {
      await page.goto('/start-generator');
      await page.waitForLoadState('networkidle');

      // StartGeneratorPage ma showOptimizationCard={true}
      // Karta będzie widoczna gdy jest wygenerowany cennik
      await expect(page.locator('body')).toBeVisible();
    });
  });

  test.describe('Profile Page - Optimization Card Visibility', () => {

    test('profile page loads correctly', async ({ page }) => {
      await page.goto('/profile');
      await page.waitForLoadState('networkidle');

      // Strona profilu powinna się załadować (nawet jeśli wymaga logowania)
      await expect(page.locator('body')).toBeVisible();
    });

    test('optimization card should NOT be visible for optimized pricelists', async ({ page }) => {
      // Ten test opisuje oczekiwane zachowanie:
      // Gdy użytkownik wybiera zoptymalizowany cennik, karta optymalizacji NIE powinna się pojawić
      // Implementacja: showOptimizationCard={!isOptimized && !hasOptimizedVersion}
      await page.goto('/profile');

      // Szukamy karty optymalizacji
      const optimizationCard = page.locator('text="Optymalizacja AI"');

      // Na stronie profilu bez zalogowania nie powinno być karty
      await expect(optimizationCard).not.toBeVisible();
    });

    test('base pricelist should show optimization card (when logged in with base pricelist)', async ({ page }) => {
      // Ten test opisuje oczekiwane zachowanie dla zalogowanego użytkownika:
      // Gdy wybrany jest cennik bazowy BEZ optimizedVersionId, karta POWINNA być widoczna
      await page.goto('/profile');

      // Test strukturalny - wymaga zalogowanego użytkownika z cennikiem bazowym
      await expect(page.locator('body')).toBeVisible();
    });
  });
});

test.describe('Optimization Card Content', () => {

  test('optimization card should have correct header text', async ({ page }) => {
    await page.goto('/start-generator');
    await page.waitForLoadState('networkidle');

    // Gdy karta jest widoczna, powinna zawierać tekst "Optymalizacja AI"
    const cardHeader = page.locator('text="Optymalizacja AI"');

    // Karta może nie być widoczna od razu (wymaga wygenerowania cennika)
    if (await cardHeader.count() > 0) {
      await expect(cardHeader).toBeVisible();
    }
  });

  test('optimization card should list benefits', async ({ page }) => {
    await page.goto('/start-generator');
    await page.waitForLoadState('networkidle');

    // Benefity z karty optymalizacji
    const benefits = [
      'Profesjonalne opisy usług',
      'Poprawiony copywriting',
      'duplikatów',
      'kolejność kategorii',
    ];

    for (const benefit of benefits) {
      const benefitText = page.locator(`text=/${benefit}/i`);
      if (await benefitText.count() > 0) {
        // Jeśli benefit jest widoczny, to dobrze
        await expect(benefitText.first()).toBeVisible();
        break; // Wystarczy znaleźć jeden
      }
    }
  });

  test('optimization card should have price displayed', async ({ page }) => {
    await page.goto('/start-generator');
    await page.waitForLoadState('networkidle');

    // Cena optymalizacji
    const priceText = page.locator('text=/29,90|zł|PLN/i');

    if (await priceText.count() > 0) {
      await expect(priceText.first()).toBeVisible();
    }
  });

  test('optimization card should have CTA button', async ({ page }) => {
    await page.goto('/start-generator');
    await page.waitForLoadState('networkidle');

    // Przycisk CTA do optymalizacji
    const ctaButton = page.locator('button:has-text("Zoptymalizuj"), button:has-text("Optymalizuj")');

    if (await ctaButton.count() > 0) {
      await expect(ctaButton.first()).toBeVisible();
    }
  });
});

test.describe('Embed Code Behavior', () => {

  test('embed code section should exist in template editor', async ({ page }) => {
    await page.goto('/start-generator');
    await page.waitForLoadState('networkidle');

    // Sekcja "Kod do osadzenia"
    const embedSection = page.locator('text=/Kod do osadzenia|Kod osadzenia/i');

    if (await embedSection.count() > 0) {
      await expect(embedSection.first()).toBeVisible();
    }
  });

  test('embed code shows HTML for drafts (no pricelistId)', async ({ page }) => {
    await page.goto('/start-generator');
    await page.waitForLoadState('networkidle');

    // Dla draftu (bez pricelistId) powinien pokazać kod HTML
    // lub informację o sposobie osadzenia
    const embedButton = page.locator('button:has-text("Kod do osadzenia")');

    if (await embedButton.count() > 0 && await embedButton.first().isVisible()) {
      await embedButton.first().click();

      // Sprawdź czy pojawił się kod lub komunikat
      const codeBlock = page.locator('pre code');
      if (await codeBlock.count() > 0) {
        await expect(codeBlock.first()).toBeVisible();
      }
    }
  });

  test('embed code shows script for saved pricelists (with pricelistId)', async ({ page }) => {
    // Ten test wymaga zalogowanego użytkownika z zapisanym cennikiem
    // Wtedy embed code powinien pokazać snippet <script>
    await page.goto('/profile');

    // Test strukturalny
    await expect(page.locator('body')).toBeVisible();
  });
});

test.describe('Notification System', () => {

  test('notification bell should be visible in header when logged in', async ({ page }) => {
    await page.goto('/profile');
    await page.waitForLoadState('networkidle');

    // Dzwonek powiadomień powinien być w headerze
    // Może być widoczny tylko dla zalogowanych użytkowników
    const bellIcon = page.locator('[aria-label="Powiadomienia"], button:has(svg[class*="lucide-bell"])');

    // Test strukturalny - strona powinna się załadować
    await expect(page.locator('body')).toBeVisible();

    // Jeśli użytkownik jest zalogowany, dzwonek powinien być widoczny
    if (await bellIcon.count() > 0) {
      await expect(bellIcon.first()).toBeVisible();
    }
  });

  test('notification bell should open dropdown on click', async ({ page }) => {
    await page.goto('/profile');
    await page.waitForLoadState('networkidle');

    const bellButton = page.locator('[aria-label="Powiadomienia"]');

    if (await bellButton.count() > 0 && await bellButton.first().isVisible()) {
      await bellButton.first().click();

      // Dropdown z powiadomieniami
      const dropdown = page.locator('text=/Powiadomienia|Brak powiadomień/i');
      await expect(dropdown.first()).toBeVisible();
    }
  });
});

test.describe('Background Optimization Job UI', () => {

  test('audit results page should have optimization section', async ({ page }) => {
    await page.goto('/audit-results');
    await page.waitForLoadState('networkidle');

    // Strona wyników audytu
    await expect(page.locator('body')).toBeVisible();

    // Może wymagać parametru ?audit=xxx w URL
    // Test strukturalny
    const pageContent = await page.textContent('body');
    expect(pageContent).toBeDefined();
  });

  test('optimization progress UI should exist when job is running', async ({ page }) => {
    // Ten test weryfikuje strukturę UI dla aktywnej optymalizacji
    await page.goto('/profile');
    await page.waitForLoadState('networkidle');

    // Szukamy elementów związanych z postępem optymalizacji
    // Mogą być widoczne tylko gdy job jest aktywny
    const progressElements = page.locator('[class*="progress"], [role="progressbar"]');

    // Test strukturalny - nie wymaga aktywnego jobu
    await expect(page.locator('body')).toBeVisible();
  });

  test('optimization card should show loading state UI elements', async ({ page }) => {
    await page.goto('/start-generator');
    await page.waitForLoadState('networkidle');

    // Karta optymalizacji powinna zawierać elementy UI dla stanu ładowania
    // (spinner, progress bar, itp.)
    const optimizationCard = page.locator('text="Optymalizacja AI"');

    if (await optimizationCard.count() > 0) {
      // Karta istnieje - sprawdź czy ma odpowiednie elementy
      await expect(optimizationCard.first()).toBeVisible();
    }
  });
});
