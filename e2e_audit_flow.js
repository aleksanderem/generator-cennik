import { chromium } from 'playwright';

const USER_DATA_DIR = '/tmp/playwright-audit-flow';
const BASE_URL = 'https://localhost:3004';
const BOOKSY_URL = 'https://booksy.com/pl-pl/99399_beauty-concept_salon-kosmetyczny_3_warszawa';

(async () => {
    console.log('='.repeat(60));
    console.log('FULL AUDIT FLOW TEST - Beauty Concept');
    console.log('='.repeat(60));

    const context = await chromium.launchPersistentContext(USER_DATA_DIR, {
        headless: false,
        ignoreHTTPSErrors: true,
        viewport: { width: 1400, height: 900 }
    });

    const page = context.pages()[0] || await context.newPage();

    try {
        // 1. Go to audit page
        console.log('\n📋 1. Going to audit start page...');
        await page.goto(`${BASE_URL}/start-audit`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(2000);
        await page.screenshot({ path: '/tmp/audit_flow_01_start.png', fullPage: true });

        // 2. Find and fill URL input
        console.log('\n📋 2. Finding URL input...');

        // Try multiple selectors for the input
        let urlInput = page.locator('#booksyUrl, input[name="booksyUrl"], input[placeholder*="booksy" i]').first();

        if (!await urlInput.isVisible()) {
            // Try any text input in the hero/form area
            urlInput = page.locator('form input[type="text"], .hero input, section input[type="text"]').first();
        }

        if (!await urlInput.isVisible()) {
            // Last resort - any visible input
            urlInput = page.locator('input:visible').first();
        }

        if (await urlInput.isVisible()) {
            await urlInput.click();
            await urlInput.fill(BOOKSY_URL);
            console.log('  ✅ URL entered');
        } else {
            console.log('  ⚠️ URL input not found, trying "Sprawdź profil" button...');
            const checkBtn = page.locator('button:has-text("Sprawdź profil"), a:has-text("Sprawdź profil")').first();
            if (await checkBtn.isVisible()) {
                await checkBtn.click();
                await page.waitForTimeout(2000);
            }
        }

        await page.waitForTimeout(1000);
        await page.screenshot({ path: '/tmp/audit_flow_02_url_entered.png', fullPage: true });

        // 3. Click start audit button
        console.log('\n📋 3. Starting audit...');
        const startBtn = page.locator('button:has-text("Sprawdź"), button:has-text("Rozpocznij"), button:has-text("Analizuj"), button[type="submit"]').first();

        if (await startBtn.isVisible()) {
            await startBtn.click();
            console.log('  ✅ Clicked start button');
        } else {
            console.log('  ⚠️ Start button not found');
            const allBtns = await page.locator('button').allTextContents();
            console.log('  Available buttons:', allBtns.slice(0, 10).filter(b => b.trim()).join(', '));
        }

        // 4. Wait for audit to complete (up to 3 minutes)
        console.log('\n📋 4. Waiting for audit to complete (max 3 min)...');

        let auditCompleted = false;
        for (let i = 0; i < 36; i++) { // 36 * 5s = 180s = 3 min
            await page.waitForTimeout(5000);

            // Check for completion indicators
            const hasResults = await page.locator('text=/Wynik.*\\d+|Score|Raport|Podsumowanie/i').first().isVisible().catch(() => false);
            const hasError = await page.locator('text=/błąd|error|failed/i').first().isVisible().catch(() => false);
            const hasProgress = await page.locator('text=/\\d+%|Analizuję|Przetwarzam|Scrapuję/i').first().isVisible().catch(() => false);

            if (hasResults) {
                console.log(`  ✅ Audit completed after ${(i+1)*5}s`);
                auditCompleted = true;
                break;
            }

            if (hasError) {
                console.log(`  ❌ Audit failed after ${(i+1)*5}s`);
                await page.screenshot({ path: '/tmp/audit_flow_error.png', fullPage: true });
                break;
            }

            if (hasProgress) {
                const progressText = await page.locator('text=/\\d+%|Analizuję|Przetwarzam|Scrapuję/i').first().textContent().catch(() => '');
                console.log(`  ⏳ Progress: ${progressText} (${(i+1)*5}s)`);
            }

            if (i % 6 === 5) { // Every 30s
                await page.screenshot({ path: `/tmp/audit_flow_progress_${i}.png`, fullPage: true });
            }
        }

        await page.screenshot({ path: '/tmp/audit_flow_03_completed.png', fullPage: true });

        if (!auditCompleted) {
            console.log('  ⚠️ Audit did not complete in time, continuing anyway...');
        }

        // 5. Go to optimization step
        console.log('\n📋 5. Going to optimization step...');
        const optTab = page.locator('button:has-text("2. Optymalizacja"), button:has-text("Optymalizacja")').first();

        if (await optTab.isVisible()) {
            await optTab.click();
            await page.waitForTimeout(2000);
            console.log('  ✅ Clicked optimization tab');
        }

        await page.screenshot({ path: '/tmp/audit_flow_04_optimization.png', fullPage: true });

        // 6. Select all optimization options
        console.log('\n📋 6. Selecting all optimization options...');
        const selectAllBtn = page.locator('button:has-text("Zaznacz wszystkie")').first();

        if (await selectAllBtn.isVisible()) {
            await selectAllBtn.click();
            await page.waitForTimeout(1000);
            console.log('  ✅ Selected all options');
        }

        // 7. Start optimization
        console.log('\n📋 7. Starting AI optimization...');
        const optimizeBtn = page.locator('button:has-text("Rozpocznij optymalizację"), button:has-text("Optymalizuj")').first();

        if (await optimizeBtn.isVisible() && await optimizeBtn.isEnabled()) {
            await optimizeBtn.click();
            console.log('  ✅ Clicked optimize button');

            // Wait for optimization (up to 2 minutes)
            console.log('  ⏳ Waiting for optimization (max 2 min)...');
            for (let i = 0; i < 24; i++) {
                await page.waitForTimeout(5000);

                const isDone = await page.locator('text=/zakończona|completed|gotowe/i').first().isVisible().catch(() => false);
                const hasChanges = await page.locator('text=/\\d+\\s*zmian/').first().isVisible().catch(() => false);

                if (isDone || hasChanges) {
                    console.log(`  ✅ Optimization completed after ${(i+1)*5}s`);
                    break;
                }
            }
        } else {
            console.log('  ⚠️ Optimize button not found or disabled');
        }

        await page.screenshot({ path: '/tmp/audit_flow_05_optimized.png', fullPage: true });

        // 8. Check summary for changes
        console.log('\n📋 8. Checking summary for changes...');
        const summaryTab = page.locator('button:has-text("3. Podsumowanie"), button:has-text("Podsumowanie")').first();

        if (await summaryTab.isVisible()) {
            await summaryTab.click();
            await page.waitForTimeout(2000);
        }

        await page.screenshot({ path: '/tmp/audit_flow_06_summary.png', fullPage: true });

        // Extract change count
        const changesText = await page.evaluate(() => {
            const text = document.body.innerText;
            const match = text.match(/(\d+)\s*zmian/i);
            return match ? match[1] : 'not found';
        });

        console.log(`\n📊 CHANGES COUNT: ${changesText}`);

        // 9. Check optimized pricelist tab
        console.log('\n📋 9. Checking optimized pricelist...');
        const optPricelistTab = page.locator('button:has-text("Zoptymalizowany cennik")').first();

        if (await optPricelistTab.isVisible()) {
            const isDisabled = await optPricelistTab.isDisabled();
            console.log(`  Tab visible: true, disabled: ${isDisabled}`);

            if (!isDisabled) {
                await optPricelistTab.click();
                await page.waitForTimeout(2000);
                await page.screenshot({ path: '/tmp/audit_flow_07_optimized_pricelist.png', fullPage: true });
                console.log('  ✅ Optimized pricelist tab accessible');
            }
        }

        console.log('\n' + '='.repeat(60));
        console.log('AUDIT FLOW TEST COMPLETE');
        console.log('='.repeat(60));
        console.log('\nScreenshots saved in /tmp/audit_flow_*.png');

    } catch (error) {
        console.log(`\n❌ ERROR: ${error.message}`);
        await page.screenshot({ path: '/tmp/audit_flow_error.png', fullPage: true });
    } finally {
        await context.close();
    }
})();
