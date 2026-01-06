import { chromium } from 'playwright';

const USER_DATA_DIR = '/tmp/playwright-opt-test';
const AUDIT_ID = 'j571vadqvpzpwftetzsw74e9v57yqv9g'; // Beauty Concept
const BASE_URL = 'https://localhost:3004';

(async () => {
    console.log('='.repeat(60));
    console.log('OPTIMIZATION TEST - Beauty Concept (Score: 57)');
    console.log('='.repeat(60));

    const context = await chromium.launchPersistentContext(USER_DATA_DIR, {
        headless: false,
        ignoreHTTPSErrors: true,
        viewport: { width: 1400, height: 900 }
    });

    const page = context.pages()[0] || await context.newPage();

    try {
        // 1. Load audit with dev mode
        console.log('\n📋 1. Loading audit...');
        await page.goto(`${BASE_URL}/audit-results?audit=${AUDIT_ID}&dev=true`, {
            waitUntil: 'networkidle'
        });
        await page.waitForTimeout(3000);
        await page.screenshot({ path: '/tmp/opt_test_01_loaded.png', fullPage: true });

        // Check if audit loaded
        const notFound = await page.locator('text=Audyt nie znaleziony').first().isVisible();
        if (notFound) {
            console.log('  ❌ Audit not found!');
            throw new Error('Audit not found');
        }
        console.log('  ✅ Audit loaded');

        // 2. Go to optimization step
        console.log('\n📋 2. Going to optimization step...');
        const optTab = page.locator('button:has-text("2. Optymalizacja")').first();
        if (await optTab.isVisible()) {
            await optTab.click();
            await page.waitForTimeout(2000);
        }
        await page.screenshot({ path: '/tmp/opt_test_02_optimization.png', fullPage: true });

        // 3. Count checkboxes before
        const checkboxesBefore = await page.locator('input[type="checkbox"]').count();
        console.log(`  Found ${checkboxesBefore} checkboxes`);

        // 4. Select all options
        console.log('\n📋 3. Selecting ALL optimization options...');
        const selectAllBtn = page.locator('button:has-text("Zaznacz wszystkie")').first();
        if (await selectAllBtn.isVisible()) {
            await selectAllBtn.click();
            await page.waitForTimeout(1000);
            console.log('  ✅ Selected all');
        }

        // 5. Start optimization
        console.log('\n📋 4. Starting AI optimization...');
        const optimizeBtn = page.locator('button:has-text("Rozpocznij optymalizację")').first();

        if (await optimizeBtn.isVisible()) {
            const isEnabled = await optimizeBtn.isEnabled();
            console.log(`  Optimize button enabled: ${isEnabled}`);

            if (isEnabled) {
                await optimizeBtn.click();
                console.log('  ⏳ Optimization started, waiting (max 3 min)...');

                // Wait for optimization to complete
                for (let i = 0; i < 36; i++) {
                    await page.waitForTimeout(5000);

                    // Check for completion
                    const progressBar = await page.locator('[role="progressbar"], .progress').isVisible().catch(() => false);
                    const isDone = await page.locator('text=/100%|zakończona|Optymalizacja zakończona/i').first().isVisible().catch(() => false);

                    if (isDone) {
                        console.log(`  ✅ Optimization completed after ${(i+1)*5}s`);
                        break;
                    }

                    if (i % 6 === 5) {
                        await page.screenshot({ path: `/tmp/opt_test_progress_${i}.png`, fullPage: true });
                        console.log(`  ⏳ Still running... (${(i+1)*5}s)`);
                    }
                }
            }
        } else {
            console.log('  ⚠️ Optimize button not found');
        }

        await page.screenshot({ path: '/tmp/opt_test_03_after_optimization.png', fullPage: true });

        // 6. Check summary for changes
        console.log('\n📋 5. Checking summary for changes...');
        const summaryTab = page.locator('button:has-text("3. Podsumowanie")').first();
        if (await summaryTab.isVisible()) {
            await summaryTab.click();
            await page.waitForTimeout(2000);
        }

        await page.screenshot({ path: '/tmp/opt_test_04_summary.png', fullPage: true });

        // Extract change count
        const stats = await page.evaluate(() => {
            const text = document.body.innerText;
            const kategorii = text.match(/(\d+)\s*kategorii/i);
            const zmian = text.match(/(\d+)\s*zmian/i);
            const uslug = text.match(/(\d+)\s*usług/i);
            return {
                kategorii: kategorii ? kategorii[1] : 'N/A',
                zmian: zmian ? zmian[1] : 'N/A',
                uslug: uslug ? uslug[1] : 'N/A'
            };
        });

        console.log(`\n📊 STATISTICS:`);
        console.log(`  Kategorii: ${stats.kategorii}`);
        console.log(`  Zmian: ${stats.zmian}`);
        console.log(`  Usług: ${stats.uslug}`);

        if (stats.zmian !== '0' && stats.zmian !== 'N/A') {
            console.log(`\n✅ SUCCESS: Optimization made ${stats.zmian} changes!`);
        } else {
            console.log(`\n⚠️ WARNING: 0 changes - optimization may not have worked`);
        }

        // 7. Check optimized pricelist tab
        console.log('\n📋 6. Checking optimized pricelist tab...');
        const optPricelistTab = page.locator('button:has-text("Zoptymalizowany cennik")').first();

        if (await optPricelistTab.isVisible()) {
            const isDisabled = await optPricelistTab.isDisabled();
            console.log(`  Tab disabled: ${isDisabled}`);

            if (!isDisabled) {
                await optPricelistTab.click();
                await page.waitForTimeout(2000);
                await page.screenshot({ path: '/tmp/opt_test_05_optimized_pricelist.png', fullPage: true });
                console.log('  ✅ Optimized pricelist tab works!');
            } else {
                console.log('  ⚠️ Tab is disabled - no optimization result');
            }
        }

        console.log('\n' + '='.repeat(60));
        console.log('TEST COMPLETE');
        console.log('='.repeat(60));
        console.log('\nScreenshots: /tmp/opt_test_*.png');

    } catch (error) {
        console.log(`\n❌ ERROR: ${error.message}`);
        await page.screenshot({ path: '/tmp/opt_test_error.png', fullPage: true });
    } finally {
        await context.close();
    }
})();
