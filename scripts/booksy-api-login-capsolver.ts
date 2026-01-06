/**
 * Booksy API Login - Using Capsolver for hCaptcha
 *
 * Uses Capsolver to solve hCaptcha and authenticate via Booksy API.
 *
 * Usage:
 *   CAPSOLVER_API_KEY=xxx BOOKSY_EMAIL=xxx BOOKSY_PASSWORD=xxx npx tsx scripts/booksy-api-login-capsolver.ts
 */

const CAPSOLVER_API_KEY = process.env.CAPSOLVER_API_KEY;
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

interface CapsolverTask {
  taskId: string;
}

interface CapsolverResult {
  status: 'processing' | 'ready' | 'failed';
  solution?: {
    token?: string;
    gRecaptchaResponse?: string;
  };
  errorId?: number;
  errorDescription?: string;
}

async function createCapsolverTask(): Promise<string> {
  console.error('[Capsolver] Creating hCaptcha task...');

  const response = await fetch('https://api.capsolver.com/createTask', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      clientKey: CAPSOLVER_API_KEY,
      task: {
        type: 'HCaptchaTaskProxyless',
        websiteURL: BOOKSY_PAGE_URL,
        websiteKey: BOOKSY_SITEKEY,
      },
    }),
  });

  const data = await response.json() as { taskId?: string; errorId?: number; errorDescription?: string };

  if (data.errorId && data.errorId !== 0) {
    throw new Error(`Capsolver task creation failed: ${data.errorDescription}`);
  }

  if (!data.taskId) {
    throw new Error('No taskId in Capsolver response');
  }

  console.error('[Capsolver] Task created:', data.taskId);
  return data.taskId;
}

async function getCapsolverResult(taskId: string): Promise<string> {
  console.error('[Capsolver] Waiting for solution (this may take 10-60 seconds)...');

  for (let i = 0; i < 60; i++) {
    await new Promise(r => setTimeout(r, 3000)); // Wait 3 seconds between polls

    const response = await fetch('https://api.capsolver.com/getTaskResult', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clientKey: CAPSOLVER_API_KEY,
        taskId,
      }),
    });

    const data = await response.json() as CapsolverResult;

    if (data.status === 'ready' && data.solution?.token) {
      console.error('[Capsolver] hCaptcha solved!');
      return data.solution.token;
    }

    if (data.status === 'failed') {
      throw new Error(`Capsolver task failed: ${data.errorDescription}`);
    }

    console.error(`[Capsolver] Still processing... (${i + 1}/60)`);
  }

  throw new Error('Capsolver timeout - task took too long');
}

async function solveHCaptcha(): Promise<string> {
  const taskId = await createCapsolverTask();
  return await getCapsolverResult(taskId);
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

  const data = await response.json() as { account_exists?: boolean; exists?: boolean };
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

  const data = await response.json() as LoginResponse;

  if (!response.ok) {
    throw new Error(`Login failed: ${data.message || data.error || response.statusText}`);
  }

  return data;
}

async function main(): Promise<BooksyCredentials | null> {
  // Validate environment
  if (!CAPSOLVER_API_KEY) {
    console.error('Error: CAPSOLVER_API_KEY is required');
    console.error('Get one at https://www.capsolver.com/ (min $6)');
    process.exit(1);
  }

  if (!BOOKSY_EMAIL || !BOOKSY_PASSWORD) {
    console.error('Error: BOOKSY_EMAIL and BOOKSY_PASSWORD are required');
    process.exit(1);
  }

  const fingerprint = generateFingerprint();

  console.error('[Booksy API] Starting API-based login with Capsolver...');
  console.error(`[Booksy API] Email: ${BOOKSY_EMAIL}`);
  console.error(`[Booksy API] Fingerprint: ${fingerprint}`);

  try {
    // Step 1: Check if account exists
    const exists = await checkAccountExists(BOOKSY_EMAIL, fingerprint);
    if (!exists) {
      throw new Error(`Account does not exist: ${BOOKSY_EMAIL}`);
    }

    // Step 2: Solve hCaptcha using Capsolver
    const hcaptchaToken = await solveHCaptcha();

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
