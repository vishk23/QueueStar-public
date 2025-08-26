import { test, expect } from '@playwright/test';

test.describe('Spotify OAuth Flow', () => {
  test('should show authorization dialog consistently', async ({ page }) => {
    // Start with a fresh session (no cookies)
    await page.context().clearCookies();
    
    console.log('🧪 Testing Spotify OAuth flow...');
    
    // Navigate to the app
    await page.goto('http://127.0.0.1:3000');
    
    // Should redirect to login page since no session
    await page.waitForURL('**/login');
    
    // Create a test account
    await page.click('a[href="/signup"]');
    await page.waitForURL('**/signup');
    
    const testEmail = `test-${Date.now()}@test.com`;
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', 'testpassword123');
    await page.fill('input[name="displayName"]', 'Test User');
    await page.click('button[type="submit"]');
    
    // Should redirect to dashboard after signup
    await page.waitForURL('**/dashboard');
    console.log('✅ User created and logged in');
    
    // Navigate to settings to connect Spotify
    await page.goto('http://127.0.0.1:3000/settings');
    await page.waitForURL('**/settings');
    
    // Find and click the Connect Spotify button
    const connectButton = page.locator('text=Connect Spotify');
    await expect(connectButton).toBeVisible();
    
    console.log('🎵 Clicking Connect Spotify...');
    
    // Click connect and wait for Spotify redirect
    await connectButton.click();
    
    // Should redirect to Spotify authorization
    await page.waitForURL('**/accounts.spotify.com/**', { timeout: 10000 });
    
    const currentUrl = page.url();
    console.log('🔗 Redirected to:', currentUrl);
    
    // Check if we're on the authorization page (not status page)
    if (currentUrl.includes('/authorize')) {
      console.log('✅ SUCCESS: Redirected to authorization page');
      
      // Check for authorization dialog elements
      const authorizeText = page.locator('text=Allow Spotify to connect');
      await expect(authorizeText).toBeVisible({ timeout: 5000 });
      console.log('✅ Authorization dialog is visible');
      
    } else if (currentUrl.includes('/status')) {
      console.log('❌ ISSUE: Redirected to status page instead of authorization');
      throw new Error('OAuth flow went to status page instead of authorization dialog');
      
    } else {
      console.log('❓ UNEXPECTED: Redirected to unexpected page:', currentUrl);
    }
    
    // Don't complete the OAuth (to avoid creating real connections)
    console.log('🛑 Test complete - stopping before actual authorization');
  });
  
  test('should generate correct OAuth parameters', async ({ page }) => {
    console.log('🔍 Testing OAuth URL parameters...');
    
    // Clear cookies for fresh session
    await page.context().clearCookies();
    
    // Go to app and create session
    await page.goto('http://127.0.0.1:3000/login');
    
    const testEmail = `params-test-${Date.now()}@test.com`;
    await page.click('a[href="/signup"]');
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', 'testpassword123');
    await page.fill('input[name="displayName"]', 'Params Test User');
    await page.click('button[type="submit"]');
    
    await page.waitForURL('**/dashboard');
    await page.goto('http://127.0.0.1:3000/settings');
    
    // Listen for the OAuth request
    const [request] = await Promise.all([
      page.waitForRequest('**/api/auth/spotify'),
      page.click('text=Connect Spotify')
    ]);
    
    console.log('📡 OAuth initiation request URL:', request.url());
    
    // Wait for Spotify redirect and capture the URL
    await page.waitForURL('**/accounts.spotify.com/**', { timeout: 10000 });
    const spotifyUrl = page.url();
    console.log('🎯 Spotify OAuth URL:', spotifyUrl);
    
    // Parse and verify OAuth parameters
    const url = new URL(spotifyUrl);
    const params = url.searchParams;
    
    console.log('📋 OAuth Parameters:');
    console.log('  - client_id:', params.get('client_id'));
    console.log('  - response_type:', params.get('response_type'));
    console.log('  - redirect_uri:', params.get('redirect_uri'));
    console.log('  - state:', params.get('state') ? 'present' : 'missing');
    console.log('  - scope:', params.get('scope'));
    console.log('  - show_dialog:', params.get('show_dialog'));
    
    // Verify required parameters
    expect(params.get('client_id')).toBeTruthy();
    expect(params.get('response_type')).toBe('code');
    expect(params.get('redirect_uri')).toBe('http://127.0.0.1:3000/api/auth/spotify/callback');
    expect(params.get('state')).toBeTruthy();
    expect(params.get('show_dialog')).toBe('true'); // This should fix the status page issue
    expect(params.get('scope')).toContain('user-read-private');
    
    console.log('✅ All OAuth parameters are correct');
  });
});