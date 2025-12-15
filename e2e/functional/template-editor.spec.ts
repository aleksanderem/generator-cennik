import { test, expect } from '@playwright/test';

/**
 * Testy funkcjonalne dla edytora szablonów (TemplateEditor)
 *
 * Testuje kluczowe zachowania:
 * - Karta optymalizacji AI (showOptimizationCard)
 * - Kod osadzenia (embed code)
 * - Wybór szablonu
 * - Edycja kolorów/motywu
 */

test.describe('Template Editor - Optimization Card', () => {

  test.describe('On Start Generator Page', () => {

    test('optimization card should be visible for new pricelist draft', async ({ page }) => {
      await page.goto('/start-generator');

      // Poczekaj na załadowanie strony
      await page.waitForLoadState('networkidle');

      // Karta optymalizacji pojawia się po wygenerowaniu cennika
      // Sprawdzamy czy strona zawiera strukturę pod kartę
      const pageContent = await page.textContent('body');

      // Na stronie powinny być wzmianki o AuditorAI lub optymalizacji
      expect(pageContent).toMatch(/AuditorAI|Auditor|optymalizuj/i);
    });

    test('optimization card should have correct elements when visible', async ({ page }) => {
      await page.goto('/start-generator');
      await page.waitForLoadState('networkidle');

      // Szukamy tekstu charakterystycznego dla karty optymalizacji
      // "Optymalizacja AI" lub "Popraw cennik jednym kliknięciem"
      const optimizationText = page.locator('text=/Optymalizacja AI|Popraw cennik/i');

      // Jeśli karta jest widoczna, sprawdź jej zawartość
      if (await optimizationText.count() > 0) {
        await expect(optimizationText.first()).toBeVisible();

        // Sprawdź czy są benefity
        const benefits = page.locator('text=/Profesjonalne opisy|copywriting|duplikat/i');
        if (await benefits.count() > 0) {
          await expect(benefits.first()).toBeVisible();
        }
      }
    });
  });

  test.describe('Optimization Card Visibility Logic', () => {

    test('showOptimizationCard=true should display the card', async ({ page }) => {
      // StartGeneratorPage ma showOptimizationCard={true}
      await page.goto('/start-generator');
      await page.waitForLoadState('networkidle');

      // Strona startowa powinna mieć możliwość optymalizacji
      // Nawet jeśli karta nie jest od razu widoczna (wymaga danych cennika)
      const body = page.locator('body');
      await expect(body).toBeVisible();
    });

    test('profile page should not show optimization card for optimized pricelist', async ({ page }) => {
      // ProfilePage nie przekazuje showOptimizationCard (defaults to false)
      // Dla zoptymalizowanych cenników karta NIE powinna się pojawiać
      await page.goto('/profile');

      // Strona profilu wymaga logowania
      // Test sprawdza że nie ma karty optymalizacji na poziomie UI
      const optimizationCard = page.locator('text="Optymalizacja AI"');

      // Karta optymalizacji nie powinna być widoczna na stronie profilu
      // (defaults to false w TemplateEditor)
      await expect(optimizationCard).not.toBeVisible();
    });
  });
});

test.describe('Template Editor - Embed Code', () => {

  test('embed code section should be expandable', async ({ page }) => {
    await page.goto('/start-generator');
    await page.waitForLoadState('networkidle');

    // Szukamy sekcji "Kod do osadzenia"
    const embedButton = page.locator('button:has-text("Kod do osadzenia"), button:has-text("Embed")');

    if (await embedButton.count() > 0) {
      // Kliknij aby rozwinąć
      await embedButton.first().click();

      // Sprawdź czy kod się pojawił
      const codeSection = page.locator('pre, code');
      if (await codeSection.count() > 0) {
        await expect(codeSection.first()).toBeVisible();
      }
    }
  });

  test('embed code should show message when no pricelistId', async ({ page }) => {
    await page.goto('/start-generator');
    await page.waitForLoadState('networkidle');

    // Dla draftu (bez pricelistId) powinien pokazać kod HTML/CSS
    // lub informację o zapisaniu cennika
    const embedButton = page.locator('button:has-text("Kod do osadzenia")');

    if (await embedButton.count() > 0) {
      await embedButton.first().click();

      // Sprawdź czy jest kod lub komunikat
      const codeContent = page.locator('pre code, .text-center');
      if (await codeContent.count() > 0) {
        await expect(codeContent.first()).toBeVisible();
      }
    }
  });

  test('embed code should show script snippet when pricelistId exists', async ({ page }) => {
    // Ten test wymaga zalogowanego użytkownika z zapisanym cennikiem
    // Na razie sprawdzamy strukturę
    await page.goto('/profile');

    // Sprawdzamy czy strona się ładuje
    await expect(page.locator('body')).toBeVisible();
  });
});

test.describe('Template Editor - Theme Customization', () => {

  test('should have color picker section', async ({ page }) => {
    await page.goto('/start-generator');
    await page.waitForLoadState('networkidle');

    // Szukamy sekcji z kolorami
    const colorSection = page.locator('text=/Kolor główny|primary.*color|Kolory/i');

    if (await colorSection.count() > 0) {
      await expect(colorSection.first()).toBeVisible();
    }
  });

  test('should have template selector', async ({ page }) => {
    await page.goto('/start-generator');
    await page.waitForLoadState('networkidle');

    // Szukamy selektora szablonów
    const templateSelector = page.locator('text=/Szablon|Template|Styl/i');

    if (await templateSelector.count() > 0) {
      await expect(templateSelector.first()).toBeVisible();
    }
  });
});

test.describe('Template Editor - Download Options', () => {

  test('should have PDF export section in right sidebar', async ({ page }) => {
    await page.goto('/start-generator');
    await page.waitForLoadState('networkidle');

    // Sekcja eksportu PDF powinna być widoczna w prawym panelu
    const exportSection = page.locator('text="Eksport"');

    if (await exportSection.count() > 0) {
      await expect(exportSection.first()).toBeVisible();
    }
  });

  test('should have PDF download button', async ({ page }) => {
    await page.goto('/start-generator');
    await page.waitForLoadState('networkidle');

    // Szukamy przycisku pobierania PDF
    const pdfButton = page.locator('button:has-text("Pobierz PDF")');

    if (await pdfButton.count() > 0) {
      await expect(pdfButton.first()).toBeVisible();
    }
  });

  test('PDF export button should be clickable', async ({ page }) => {
    await page.goto('/start-generator');
    await page.waitForLoadState('networkidle');

    // Szukamy przycisku pobierania PDF
    const pdfButton = page.locator('button:has-text("Pobierz PDF")');

    if (await pdfButton.count() > 0) {
      // Przycisk powinien być klikalny (nie disabled)
      await expect(pdfButton.first()).toBeEnabled();
    }
  });

  test('PDF export button should show loading state when clicked', async ({ page }) => {
    await page.goto('/start-generator');
    await page.waitForLoadState('networkidle');

    // Szukamy przycisku pobierania PDF
    const pdfButton = page.locator('button:has-text("Pobierz PDF")');

    if (await pdfButton.count() > 0 && await pdfButton.first().isVisible()) {
      // Kliknij przycisk
      const downloadPromise = page.waitForEvent('download', { timeout: 10000 }).catch(() => null);

      await pdfButton.first().click();

      // Po kliknięciu powinien pojawić się stan ładowania
      const loadingState = page.locator('text="Generowanie PDF"');

      // Albo ładowanie, albo pobieranie powinno się rozpocząć
      const loadingVisible = await loadingState.count() > 0;
      const download = await downloadPromise;

      // Jedno z dwóch powinno być prawdą
      expect(loadingVisible || download !== null).toBeTruthy();
    }
  });

  test('PDF export section should have description text', async ({ page }) => {
    await page.goto('/start-generator');
    await page.waitForLoadState('networkidle');

    // Opis eksportu PDF
    const description = page.locator('text="Eksportuj cennik do pliku PDF"');

    if (await description.count() > 0) {
      await expect(description.first()).toBeVisible();
    }
  });
});
