/**
 * Booksy Credentials Extractor
 *
 * This script uses Playwright to:
 * 1. Open Booksy website
 * 2. Navigate to a salon page
 * 3. Intercept API requests and extract authentication headers
 * 4. Automatically solve CAPTCHA using 2captcha service
 * 5. Output credentials in JSON format
 *
 * Usage:
 *   npx tsx scripts/extract-booksy-credentials.ts
 *
 * With login credentials:
 *   BOOKSY_EMAIL=... BOOKSY_PASSWORD=... npx tsx scripts/extract-booksy-credentials.ts
 *
 * With 2captcha API key (for automatic CAPTCHA solving):
 *   TWOCAPTCHA_API_KEY=... BOOKSY_EMAIL=... BOOKSY_PASSWORD=... npx tsx scripts/extract-booksy-credentials.ts
 *
 * Output: JSON with extracted credentials printed to stdout
 */

import { chromium, type Page, type Request } from '@playwright/test';
import { Solver } from '2captcha-ts';

interface BooksyCredentials {
  accessToken: string;
  apiKey: string;
  fingerprint: string;
  extractedAt: string;
  expiresAt: string | null;
}

const SAMPLE_SALON_URL = 'https://booksy.com/pl-pl/98814_beauty4ever-ul-woloska-16_medycyna-estetyczna_3_warszawa';
const API_PATTERN = /booksy\.com\/core\/v2/;

// Initialize 2captcha solver if API key is provided
const TWOCAPTCHA_API_KEY = process.env.TWOCAPTCHA_API_KEY;
const solver = TWOCAPTCHA_API_KEY ? new Solver(TWOCAPTCHA_API_KEY) : null;

/**
 * Attempt to solve CAPTCHA on the page using 2captcha service.
 * Supports hCaptcha and FunCaptcha (shape puzzle).
 */
async function solveCaptcha(page: Page): Promise<boolean> {
  if (!solver) {
    console.error('[CAPTCHA] No 2captcha API key provided. Set TWOCAPTCHA_API_KEY env var.');
    return false;
  }

  try {
    // Check for hCaptcha
    const hcaptchaFrame = await page.$('iframe[src*="hcaptcha"]');
    if (hcaptchaFrame) {
      console.error('[CAPTCHA] Detected hCaptcha, solving...');
      const sitekey = await page.evaluate(() => {
        const el = document.querySelector('[data-sitekey]');
        return el?.getAttribute('data-sitekey') || '';
      });

      if (sitekey) {
        const result = await solver.hcaptcha({
          sitekey,
          pageurl: page.url(),
        });
        console.error('[CAPTCHA] Got solution, injecting...');

        // Inject the solution
        await page.evaluate((token: string) => {
          const textarea = document.querySelector('textarea[name="h-captcha-response"]');
          if (textarea) {
            (textarea as HTMLTextAreaElement).value = token;
          }
          // Trigger callback if exists
          if ((window as unknown as Record<string, unknown>).hcaptchaCallback) {
            ((window as unknown as Record<string, (token: string) => void>).hcaptchaCallback)(token);
          }
        }, result.data);

        return true;
      }
    }

    // Check for FunCaptcha / Arkose Labs (shape puzzle)
    const funcaptchaFrame = await page.$('iframe[src*="funcaptcha"], iframe[src*="arkoselabs"]');
    if (funcaptchaFrame) {
      console.error('[CAPTCHA] Detected FunCaptcha, solving...');
      const publicKey = await page.evaluate(() => {
        const el = document.querySelector('[data-pkey]');
        return el?.getAttribute('data-pkey') || '';
      });

      if (publicKey) {
        const result = await solver.funCaptcha({
          publickey: publicKey,
          pageurl: page.url(),
        });
        console.error('[CAPTCHA] Got FunCaptcha solution');

        await page.evaluate((token: string) => {
          const input = document.querySelector('input[name="fc-token"]');
          if (input) {
            (input as HTMLInputElement).value = token;
          }
        }, result.data);

        return true;
      }
    }

    // Check for custom shape puzzle (Booksy specific)
    const shapePuzzle = await page.$('text="Proszę przeciągnąć kształt"');
    if (shapePuzzle) {
      console.error('[CAPTCHA] Detected custom shape puzzle');
      console.error('[CAPTCHA] Taking screenshot for 2captcha image solving...');

      // Take screenshot of the captcha area
      const captchaElement = await page.$('.captcha-container, [class*="captcha"], [data-testid*="captcha"]');
      if (captchaElement) {
        const screenshot = await captchaElement.screenshot({ type: 'png' });
        const base64 = screenshot.toString('base64');

        // Send to 2captcha as coordinates task
        console.error('[CAPTCHA] Sending to 2captcha for coordinate solving...');
        const result = await solver.coordinates({
          body: base64,
          textinstructions: 'Drag the shape from the right side to where it fits. Click on the target position.',
        });

        if (result.data) {
          // Parse coordinates and click
          const coords = result.data.split(':');
          if (coords.length >= 2) {
            const x = parseInt(coords[0], 10);
            const y = parseInt(coords[1], 10);
            console.error(`[CAPTCHA] Clicking at coordinates: ${x}, ${y}`);

            const box = await captchaElement.boundingBox();
            if (box) {
              await page.mouse.click(box.x + x, box.y + y);
              await page.waitForTimeout(1000);
              return true;
            }
          }
        }
      }
    }

    console.error('[CAPTCHA] No supported CAPTCHA detected');
    return false;
  } catch (error) {
    console.error('[CAPTCHA] Error solving:', error);
    return false;
  }
}

async function extractCredentials(): Promise<BooksyCredentials | null> {
  console.error('[Booksy Extractor] Starting browser...');

  const browser = await chromium.launch({
    headless: false, // Set to true for production
    slowMo: 50,
  });

  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    viewport: { width: 1280, height: 720 },
    locale: 'pl-PL',
  });

  const page = await context.newPage();

  let credentials: BooksyCredentials | null = null;

  // Intercept API requests to extract headers
  page.on('request', (request: Request) => {
    const url = request.url();

    // Log all requests to booksy.com for debugging
    if (url.includes('booksy.com')) {
      console.error(`[Request] ${request.method()} ${url.substring(0, 100)}`);
    }

    if (API_PATTERN.test(url)) {
      const headers = request.headers();
      console.error(`[Booksy Extractor] API request detected: ${url}`);
      console.error(`[Booksy Extractor] Headers: ${JSON.stringify(Object.keys(headers))}`);

      const accessToken = headers['x-access-token'];
      const apiKey = headers['x-api-key'];
      const fingerprint = headers['x-fingerprint'];

      // Capture whatever we can - even partial credentials are useful
      if (apiKey) {
        console.error(`[Booksy Extractor] Captured credentials from: ${url}`);
        console.error(`[Booksy Extractor] x-access-token: ${accessToken ? 'YES' : 'NO'}, x-api-key: ${apiKey ? 'YES' : 'NO'}, x-fingerprint: ${fingerprint ? 'YES' : 'NO'}`);

        // Only update if we have more complete credentials than before
        const hasAccessToken = !!accessToken;
        const prevHasAccessToken = credentials?.accessToken && credentials.accessToken !== '';

        if (hasAccessToken || !prevHasAccessToken) {
          credentials = {
            accessToken: accessToken || '',
            apiKey,
            fingerprint: fingerprint || '',
            extractedAt: new Date().toISOString(),
            expiresAt: null,
          };
        }
      }
    }
  });

  try {
    // Navigate to a salon page to trigger API calls
    console.error('[Booksy Extractor] Navigating to salon page...');
    await page.goto(SAMPLE_SALON_URL, {
      waitUntil: 'domcontentloaded',
      timeout: 60000,
    });

    // Wait for API calls to complete
    console.error('[Booksy Extractor] Page loaded, waiting for API calls...');
    await page.waitForTimeout(5000);

    // If no credentials yet, try scrolling to trigger more API calls
    if (!credentials) {
      console.error('[Booksy Extractor] No credentials yet, scrolling page...');
      await page.evaluate(() => window.scrollTo(0, 500));
      await page.waitForTimeout(2000);
    }

    // Try clicking on services tab if available
    if (!credentials) {
      console.error('[Booksy Extractor] Trying to click services tab...');
      try {
        await page.click('text=Usługi', { timeout: 3000 });
        await page.waitForTimeout(2000);
      } catch {
        console.error('[Booksy Extractor] Services tab not found');
      }
    }

    if (credentials) {
      if (credentials.accessToken) {
        console.error('[Booksy Extractor] Full credentials extracted successfully!');
      } else {
        console.error('[Booksy Extractor] Partial credentials extracted (no access token)');
        console.error('[Booksy Extractor] Public endpoints work but authenticated endpoints may fail');
        console.error('[Booksy Extractor] Try running with BOOKSY_EMAIL and BOOKSY_PASSWORD for full credentials');
      }
      // Output to stdout (for programmatic consumption)
      console.log(JSON.stringify(credentials, null, 2));
    } else {
      console.error('[Booksy Extractor] Failed to extract credentials');
      console.error('[Booksy Extractor] This may happen if Booksy changed their API');
    }

  } catch (error) {
    console.error('[Booksy Extractor] Error:', error);
  } finally {
    await browser.close();
  }

  return credentials;
}

// Check if running with login credentials
async function extractWithLogin(): Promise<BooksyCredentials | null> {
  const email = process.env.BOOKSY_EMAIL;
  const password = process.env.BOOKSY_PASSWORD;

  if (!email || !password) {
    console.error('[Booksy Extractor] No login credentials provided, trying without login...');
    return extractCredentials();
  }

  console.error('[Booksy Extractor] Login credentials provided, authenticating...');

  const browser = await chromium.launch({
    headless: false,
    slowMo: 50,
  });

  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    viewport: { width: 1280, height: 720 },
    locale: 'pl-PL',
  });

  const page = await context.newPage();

  let credentials: BooksyCredentials | null = null;

  // Intercept API requests
  page.on('request', (request: Request) => {
    const url = request.url();

    // Log booksy requests for debugging
    if (url.includes('booksy.com')) {
      console.error(`[Request] ${request.method()} ${url.substring(0, 80)}`);
    }

    if (API_PATTERN.test(url)) {
      const headers = request.headers();
      console.error(`[Booksy Extractor] API call: ${url.substring(0, 80)}`);
      console.error(`[Booksy Extractor] Has x-access-token: ${!!headers['x-access-token']}`);

      const accessToken = headers['x-access-token'];
      const apiKey = headers['x-api-key'];
      const fingerprint = headers['x-fingerprint'];

      if (apiKey) {
        console.error(`[Booksy Extractor] Captured credentials! accessToken: ${accessToken ? 'YES' : 'NO'}`);

        // Only update if we get better credentials (with access token)
        if (accessToken || !credentials?.accessToken) {
          credentials = {
            accessToken: accessToken || '',
            apiKey,
            fingerprint: fingerprint || '',
            extractedAt: new Date().toISOString(),
            expiresAt: null,
          };
        }
      }
    }
  });

  try {
    // Go to main page first and look for login button
    console.error('[Booksy Extractor] Navigating to main page to find login...');
    await page.goto('https://booksy.com/pl-pl/', {
      waitUntil: 'domcontentloaded',
      timeout: 60000,
    });

    // Wait for page to fully load
    await page.waitForTimeout(3000);

    // Accept cookies if present
    try {
      const cookieButton = await page.waitForSelector('button:has-text("Zezwól"), button:has-text("Akceptuj"), [id*="accept"]', { timeout: 3000 });
      if (cookieButton) {
        await cookieButton.click();
        await page.waitForTimeout(1000);
      }
    } catch {
      // No cookie banner
    }

    // Look for login/sign in button
    console.error('[Booksy Extractor] Looking for login button...');
    const loginButtonSelectors = [
      'a:has-text("Zaloguj")',
      'button:has-text("Zaloguj")',
      'a:has-text("Sign in")',
      'a:has-text("Log in")',
      '[href*="login"]',
      '[href*="signin"]',
      '[data-testid*="login"]',
    ];

    let loginClicked = false;
    for (const selector of loginButtonSelectors) {
      try {
        const btn = await page.waitForSelector(selector, { timeout: 2000 });
        if (btn) {
          console.error(`[Booksy Extractor] Found login button with: ${selector}`);
          await btn.click();
          loginClicked = true;
          await page.waitForTimeout(2000);
          break;
        }
      } catch {
        // Try next
      }
    }

    if (!loginClicked) {
      await page.screenshot({ path: '/tmp/booksy-main-page.png' });
      console.error('[Booksy Extractor] Could not find login button. Screenshot saved.');
    }

    // Try different selectors for email input
    console.error('[Booksy Extractor] Looking for login form...');
    const emailSelectors = [
      'input[type="email"]',
      'input[name="email"]',
      'input[placeholder*="email" i]',
      'input[placeholder*="e-mail" i]',
      'input[id*="email" i]',
      '#email',
    ];

    let emailInput = null;
    for (const selector of emailSelectors) {
      try {
        emailInput = await page.waitForSelector(selector, { timeout: 2000 });
        if (emailInput) {
          console.error(`[Booksy Extractor] Found email input with selector: ${selector}`);
          break;
        }
      } catch {
        // Try next selector
      }
    }

    if (!emailInput) {
      // Take screenshot for debugging
      await page.screenshot({ path: '/tmp/booksy-login-page.png' });
      console.error('[Booksy Extractor] Could not find email input. Screenshot saved to /tmp/booksy-login-page.png');
      console.error('[Booksy Extractor] Page URL:', page.url());
      throw new Error('Email input not found');
    }

    // Fill login form - Booksy uses two-step: email first, then password
    console.error('[Booksy Extractor] Filling email...');
    await emailInput.fill(email);

    // Click continue/next button after email
    try {
      const continueBtn = await page.waitForSelector('button[type="submit"], button:has-text("Dalej"), button:has-text("Kontynuuj"), button:has-text("Continue")', { timeout: 3000 });
      if (continueBtn) {
        await continueBtn.click();
        await page.waitForTimeout(2000);
      }
    } catch {
      // Maybe single-step form, continue
    }

    // Find password input (now should be visible)
    console.error('[Booksy Extractor] Looking for password field...');
    const passwordInput = await page.waitForSelector('input[type="password"]:visible', { timeout: 10000 });
    if (passwordInput) {
      console.error('[Booksy Extractor] Filling password...');
      await passwordInput.fill(password);
      await page.waitForTimeout(500);
    }

    // Click the login/submit button (Dalej = Continue)
    console.error('[Booksy Extractor] Clicking login button...');
    await page.waitForTimeout(1000); // Wait for any animations

    // Try to click the Dalej button directly
    try {
      await page.click('button:has-text("Dalej")', { force: true });
      console.error('[Booksy Extractor] Clicked Dalej button');
    } catch (e) {
      console.error('[Booksy Extractor] Could not click Dalej:', e);
      // Try pressing Enter as fallback
      await page.keyboard.press('Enter');
      console.error('[Booksy Extractor] Pressed Enter instead');
    }

    // Wait for login to complete - may show CAPTCHA
    console.error('[Booksy Extractor] Waiting for login (checking for CAPTCHA)...');

    // Wait up to 90 seconds for captcha solving and login to complete
    const maxWaitTime = 90000;
    const checkInterval = 2000;
    let waited = 0;
    let captchaAttempted = false;

    while (waited < maxWaitTime) {
      await page.waitForTimeout(checkInterval);
      waited += checkInterval;

      // Check if we got credentials with access token
      if (credentials?.accessToken) {
        console.error('[Booksy Extractor] Got access token! Login successful.');
        break;
      }

      // Check if login modal closed (successful login)
      const loginModal = await page.$('input[type="password"]:visible');
      if (!loginModal) {
        console.error('[Booksy Extractor] Login modal closed, checking for credentials...');
        await page.waitForTimeout(2000);
        break;
      }

      // Check for CAPTCHA and try to solve it automatically
      const captchaVisible = await page.$('text="Proszę przeciągnąć kształt"');
      if (captchaVisible && !captchaAttempted) {
        console.error('[Booksy Extractor] CAPTCHA detected!');
        captchaAttempted = true;

        if (solver) {
          console.error('[Booksy Extractor] Attempting automatic CAPTCHA solve with 2captcha...');
          const solved = await solveCaptcha(page);
          if (solved) {
            console.error('[Booksy Extractor] CAPTCHA solved! Waiting for response...');
            await page.waitForTimeout(3000);
          }
        } else {
          console.error('[Booksy Extractor] No 2captcha API key - solve CAPTCHA manually in browser');
          console.error('[Booksy Extractor] Set TWOCAPTCHA_API_KEY env var for automatic solving');
        }
      }

      console.error(`[Booksy Extractor] Still waiting... (${waited/1000}s/${maxWaitTime/1000}s)`);
    }

    // Check if still on login page (login failed)
    const currentUrl = page.url();
    console.error(`[Booksy Extractor] Current URL after login attempt: ${currentUrl}`);

    // Take screenshot to verify login
    await page.screenshot({ path: '/tmp/booksy-after-login.png' });
    console.error('[Booksy Extractor] After login screenshot saved. URL:', page.url());

    // Navigate to salon page
    console.error('[Booksy Extractor] Navigating to salon page...');
    await page.goto(SAMPLE_SALON_URL, {
      waitUntil: 'domcontentloaded',
      timeout: 60000,
    });

    console.error('[Booksy Extractor] Page loaded, waiting for API calls...');
    await page.waitForTimeout(5000);

    // Try scrolling to trigger more API calls
    await page.evaluate(() => window.scrollTo(0, 500));
    await page.waitForTimeout(2000);

    if (credentials) {
      if (credentials.accessToken) {
        console.error('[Booksy Extractor] Full credentials extracted with access token!');
      } else {
        console.error('[Booksy Extractor] Partial credentials (no access token)');
      }
      console.log(JSON.stringify(credentials, null, 2));
    } else {
      console.error('[Booksy Extractor] Failed to extract any credentials after login');
      await page.screenshot({ path: '/tmp/booksy-salon-page.png' });
    }

  } catch (error) {
    console.error('[Booksy Extractor] Error during login:', error);
  } finally {
    await browser.close();
  }

  return credentials;
}

// Main execution
(async () => {
  const useLogin = process.env.BOOKSY_EMAIL && process.env.BOOKSY_PASSWORD;

  if (useLogin) {
    await extractWithLogin();
  } else {
    await extractCredentials();
  }
})();
