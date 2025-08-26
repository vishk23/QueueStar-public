import { chromium, FullConfig } from '@playwright/test';

// Fix for Node.js crypto polyfill issue in Playwright
async function globalSetup(config: FullConfig) {
  // Set up crypto polyfill for Node.js
  if (typeof globalThis.crypto === 'undefined') {
    const { webcrypto } = await import('crypto');
    globalThis.crypto = webcrypto as any;
  }

  return async () => {
    // Global teardown
  };
}

export default globalSetup;