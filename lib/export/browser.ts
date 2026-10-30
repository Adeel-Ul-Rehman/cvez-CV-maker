import fs from 'fs';
import path from 'path';
import puppeteer, { type Browser } from 'puppeteer-core';
import { env } from '@/lib/env';

let cachedBrowser: Browser | null = null;

/**
 * Detect local Chrome/Edge executable path on development machines.
 */
function findLocalBrowserExecutable(): string {
  if (env.PUPPETEER_EXECUTABLE_PATH && fs.existsSync(env.PUPPETEER_EXECUTABLE_PATH)) {
    return env.PUPPETEER_EXECUTABLE_PATH;
  }

  const platform = process.platform;

  if (platform === 'win32') {
    const candidates = [
      'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
      'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
      process.env.LOCALAPPDATA
        ? path.join(process.env.LOCALAPPDATA, 'Google\\Chrome\\Application\\chrome.exe')
        : '',
      process.env.PROGRAMFILES
        ? path.join(process.env.PROGRAMFILES, 'Google\\Chrome\\Application\\chrome.exe')
        : '',
      process.env['PROGRAMFILES(X86)']
        ? path.join(process.env['PROGRAMFILES(X86)'], 'Google\\Chrome\\Application\\chrome.exe')
        : '',
    ].filter(Boolean);

    for (const candidate of candidates) {
      if (fs.existsSync(candidate)) {
        return candidate;
      }
    }
  } else if (platform === 'darwin') {
    const macCandidate = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
    if (fs.existsSync(macCandidate)) return macCandidate;
  } else {
    // Linux
    const linuxCandidates = [
      '/usr/bin/google-chrome',
      '/usr/bin/google-chrome-stable',
      '/usr/bin/chromium-browser',
      '/usr/bin/chromium',
    ];
    for (const candidate of linuxCandidates) {
      if (fs.existsSync(candidate)) {
        return candidate;
      }
    }
  }

  throw new Error(
    'No local Chrome or Chromium executable found. Please install Google Chrome or set PUPPETEER_EXECUTABLE_PATH.'
  );
}

/**
 * Returns a cached Browser instance or launches a new one.
 * Uses @sparticuz/chromium on Vercel/serverless Linux, or local Chrome in development.
 */
export async function getBrowser(): Promise<Browser> {
  if (cachedBrowser && cachedBrowser.connected) {
    return cachedBrowser;
  }

  const isVercel = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_VERSION);
  const isLinuxProd = process.env.NODE_ENV === 'production' && process.platform === 'linux';

  let executablePath: string;
  let defaultArgs: string[] = [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--font-render-hinting=none',
  ];

  if ((isVercel || isLinuxProd) && !env.PUPPETEER_EXECUTABLE_PATH) {
    // Production on Vercel / AWS Lambda
    try {
      const chromium = require('@sparticuz/chromium');
      executablePath = await chromium.executablePath();
      defaultArgs = [
        ...chromium.args,
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--font-render-hinting=none',
      ];
    } catch {
      // Fallback if @sparticuz/chromium is unavailable
      executablePath = findLocalBrowserExecutable();
    }
  } else {
    // Local development or custom path
    executablePath = findLocalBrowserExecutable();
  }

  cachedBrowser = await puppeteer.launch({
    args: defaultArgs,
    executablePath,
    headless: true,
  });

  return cachedBrowser;
}

/**
 * Closes the cached browser instance if open.
 */
export async function closeBrowser(): Promise<void> {
  if (cachedBrowser) {
    try {
      if (cachedBrowser.connected) {
        await cachedBrowser.close();
      }
    } catch {
      // Ignore close error
    } finally {
      cachedBrowser = null;
    }
  }
}
