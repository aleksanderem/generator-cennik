/**
 * Booksy API Login - Pure API-based credential extraction
 *
 * Uses hCaptcha solving via 2captcha to authenticate and get x-access-token.
 * No browser automation needed.
 *
 * Usage:
 *   TWOCAPTCHA_API_KEY=xxx BOOKSY_EMAIL=xxx BOOKSY_PASSWORD=xxx npx tsx scripts/booksy-api-login.ts
 */

import { Solver } from '2captcha-ts';

const TWOCAPTCHA_API_KEY = process.env.TWOCAPTCHA_API_KEY;
const BOOKSY_EMAIL = process.env.BOOKSY_EMAIL;
const BOOKSY_PASSWORD = process.env.BOOKSY_PASSWORD;

// Booksy API constants
const API_BASE = 'https://pl.booksy.com/core/v2/customer_api';
const BOOKSY_SITEKEY = '6ad14483-0a2c-40c1-bc66-3510778e97f9'; // hCaptcha sitekey for Booksy web customer
const BOOKSY_PAGE_URL = 'https://booksy.com/pl-pl/';

// Default headers for Booksy API
const DEFAULT_HEADERS = {
  'accept': 'application/json, text/plain, */*',
  'accept-language': 'pl-PL, pl',
  'cache-control': 'no-cache',
  'content-type': 'application/json',
  'origin': 'https://booksy.com',
  'referer': 'https://booksy.com/',
  'sec-ch-ua': '"Google Chrome";v="143", "Chromium";v="143", "Not A(Brand";v="24"',
  'sec-ch-ua-mobile': '?0',
  'sec-ch-ua-platform': '"macOS"',
  'sec-fetch-dest': 'empty',
  'sec-fetch-mode': 'cors',
  'sec-fetch-site': 'same-site',
  'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36',
  'x-api-key': 'web-e3d812bf-d7a2-445d-ab38-55589ae6a121',
  'x-app-version': '3.0',
};

// Generate a random fingerprint (UUID v4 format)
function generateFingerprint(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

interface BooksyCredentials {
  accessToken: string;
  apiKey: string;
  fingerprint: string;
  extractedAt: string;
  expiresAt: string | null;
}

interface LoginResponse {
  access_token?: string;
  user?: {
    id: number;
    email: string;
  };
  error?: string;
  message?: string;
}

async function solveHCaptcha(solver: Solver): Promise<string> {
  console.error('[Booksy API] Solving hCaptcha via 2captcha...');
  console.error('[Booksy API] This may take 30-120 seconds...');

  const result = await solver.hcaptcha({
    sitekey: BOOKSY_SITEKEY,
    pageurl: BOOKSY_PAGE_URL,
  });

  console.error('[Booksy API] hCaptcha solved!');
  return result.data;
}

async function checkAccountExists(email: string, fingerprint: string): Promise<boolean> {
  console.error(`[Booksy API] Checking if account exists: ${email}`);

  const url = `${API_BASE}/account/exists/?email=${encodeURIComponent(email)}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      ...DEFAULT_HEADERS,
      'x-fingerprint': fingerprint,
    },
  });

  if (response.status === 429) {
    throw new Error('Rate limited by Booksy. Please wait a few minutes.');
  }

  if (!response.ok) {
    throw new Error(`Account check failed: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  const exists = data.account_exists === true || data.exists === true;
  console.error(`[Booksy API] Account exists: ${exists}`);
  return exists;
}

async function login(
  email: string,
  password: string,
  fingerprint: string,
  hcaptchaToken: string
): Promise<LoginResponse> {
  console.error('[Booksy API] Logging in...');

  const url = `${API_BASE}/account/login/`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      ...DEFAULT_HEADERS,
      'x-fingerprint': fingerprint,
      'x-hcaptcha-token': hcaptchaToken,
    },
    body: JSON.stringify({
      email,
      password,
    }),
  });

  if (response.status === 429) {
    throw new Error('Rate limited by Booksy. Please wait a few minutes.');
  }

  const data = await response.json();

  if (!response.ok) {
    throw new Error(`Login failed: ${data.message || data.error || response.statusText}`);
  }

  return data;
}

async function main(): Promise<BooksyCredentials | null> {
  // Validate environment
  if (!TWOCAPTCHA_API_KEY) {
    console.error('Error: TWOCAPTCHA_API_KEY is required');
    process.exit(1);
  }

  if (!BOOKSY_EMAIL || !BOOKSY_PASSWORD) {
    console.error('Error: BOOKSY_EMAIL and BOOKSY_PASSWORD are required');
    process.exit(1);
  }

  const solver = new Solver(TWOCAPTCHA_API_KEY);
  const fingerprint = generateFingerprint();

  console.error('[Booksy API] Starting API-based login...');
  console.error(`[Booksy API] Email: ${BOOKSY_EMAIL}`);
  console.error(`[Booksy API] Fingerprint: ${fingerprint}`);

  try {
    // Step 1: Check if account exists
    const exists = await checkAccountExists(BOOKSY_EMAIL, fingerprint);
    if (!exists) {
      throw new Error(`Account does not exist: ${BOOKSY_EMAIL}`);
    }

    // Step 2: Solve hCaptcha
    const hcaptchaToken = await solveHCaptcha(solver);

    // Step 3: Login
    const loginResponse = await login(BOOKSY_EMAIL, BOOKSY_PASSWORD, fingerprint, hcaptchaToken);

    if (!loginResponse.access_token) {
      console.error('[Booksy API] Login response:', JSON.stringify(loginResponse, null, 2));
      throw new Error('No access token in login response');
    }

    console.error('[Booksy API] Login successful!');

    const credentials: BooksyCredentials = {
      accessToken: loginResponse.access_token,
      apiKey: DEFAULT_HEADERS['x-api-key'],
      fingerprint,
      extractedAt: new Date().toISOString(),
      expiresAt: null, // Booksy tokens don't have explicit expiry in response
    };

    // Output credentials as JSON to stdout
    console.log(JSON.stringify(credentials, null, 2));

    return credentials;

  } catch (error) {
    console.error('[Booksy API] Error:', error instanceof Error ? error.message : error);
    return null;
  }
}

main();
