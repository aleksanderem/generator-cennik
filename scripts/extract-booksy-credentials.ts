/**
 * Booksy Credentials Extractor
 *
 * This script uses Playwright to:
 * 1. Open Booksy website
 * 2. Navigate to a salon page
 * 3. Intercept API requests and extract authentication headers
 * 4. Output credentials in JSON format
 *
 * Usage:
 *   npx ts-node scripts/extract-booksy-credentials.ts
 *
 * Or with environment variables for login:
 *   BOOKSY_EMAIL=... BOOKSY_PASSWORD=... npx ts-node scripts/extract-booksy-credentials.ts
 *
 * Output: JSON with extracted credentials printed to stdout
 */

import { chromium, type Page, type Request } from '@playwright/test';

interface BooksyCredentials {
  accessToken: string;
  apiKey: string;
  fingerprint: string;
  extractedAt: string;
  expiresAt: string | null;
}

const SAMPLE_SALON_URL = 'https://booksy.com/pl-pl/98814_beauty4ever-ul-woloska-16_medycyna-estetyczna_3_warszawa';
const API_PATTERN = /booksy\.com\/core\/v2/;

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

    if (API_PATTERN.test(url)) {
      const headers = request.headers();

      const accessToken = headers['x-access-token'];
      const apiKey = headers['x-api-key'];
      const fingerprint = headers['x-fingerprint'];

      if (accessToken && apiKey) {
        console.error(`[Booksy Extractor] Captured credentials from: ${url}`);

        credentials = {
          accessToken,
          apiKey,
          fingerprint: fingerprint || '',
          extractedAt: new Date().toISOString(),
          expiresAt: null,
        };
      }
    }
  });

  try {
    // Go to login page
    console.error('[Booksy Extractor] Navigating to login page...');
    await page.goto('https://booksy.com/pl-pl/login', {
      waitUntil: 'domcontentloaded',
      timeout: 60000,
    });

    // Wait for login form
    await page.waitForSelector('input[type="email"], input[name="email"]', { timeout: 15000 });

    // Fill login form
    console.error('[Booksy Extractor] Filling login form...');
    await page.fill('input[type="email"], input[name="email"]', email);
    await page.fill('input[type="password"], input[name="password"]', password);

    // Submit
    await page.click('button[type="submit"]');

    // Wait for login to complete
    await page.waitForTimeout(5000);

    // Navigate to salon page
    console.error('[Booksy Extractor] Navigating to salon page...');
    await page.goto(SAMPLE_SALON_URL, {
      waitUntil: 'domcontentloaded',
      timeout: 60000,
    });

    console.error('[Booksy Extractor] Page loaded, waiting for API calls...');
    await page.waitForTimeout(5000);

    if (credentials) {
      console.error('[Booksy Extractor] Credentials extracted successfully after login!');
      console.log(JSON.stringify(credentials, null, 2));
    } else {
      console.error('[Booksy Extractor] Failed to extract credentials after login');
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
