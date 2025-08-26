import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Start from the landing page
    await page.goto('/');
  });

  test('should redirect to login page', async ({ page }) => {
    // The root page should redirect to /login
    await expect(page).toHaveURL('/login');
  });

  test('should initiate Spotify OAuth flow', async ({ page }) => {
    // Navigate to login page (if not already there)
    await page.goto('/login');
    
    // Look for Spotify connect button (we'll need to create the login page)
    const spotifyButton = page.locator('text=Connect with Spotify').or(
      page.locator('[data-testid="spotify-connect"]')
    ).or(
      page.locator('button:text("Spotify")')
    );
    
    // Click the Spotify connect button
    await spotifyButton.click();
    
    // Should redirect to Spotify OAuth
    await page.waitForURL(/accounts\.spotify\.com\/authorize/);
    
    // Check that the URL contains required parameters
    const url = page.url();
    expect(url).toContain('client_id=');
    expect(url).toContain('response_type=code');
    expect(url).toContain('code_challenge=');
    expect(url).toContain('code_challenge_method=S256');
    expect(url).toContain('scope=');
    
    // Check for required scopes
    expect(url).toContain('user-read-private');
    expect(url).toContain('user-top-read');
    expect(url).toContain('playlist-modify');
  });

  test('should handle OAuth callback and redirect to dashboard', async ({ page }) => {
    // Mock a successful OAuth callback
    const mockCode = 'test_auth_code_12345';
    const mockState = 'test_state_12345';
    
    // Set the required cookies that would be set by the auth initiation
    await page.context().addCookies([
      {
        name: 'spotify_code_verifier',
        value: 'test_code_verifier_12345',
        domain: 'localhost',
        path: '/',
      },
      {
        name: 'spotify_state',
        value: mockState,
        domain: 'localhost',
        path: '/',
      }
    ]);
    
    // Navigate directly to the callback URL with mock parameters
    await page.goto(`/api/auth/spotify/callback?code=${mockCode}&state=${mockState}`);
    
    // Should redirect to dashboard
    await expect(page).toHaveURL('/dashboard');
    
    // Should have user session cookie
    const cookies = await page.context().cookies();
    const sessionCookie = cookies.find(c => c.name === 'user_session');
    expect(sessionCookie).toBeTruthy();
  });

  test('should handle OAuth errors gracefully', async ({ page }) => {
    // Test error handling - user denies access
    await page.goto('/api/auth/spotify/callback?error=access_denied&error_description=User%20denied%20access');
    
    // Should return error response
    const content = await page.textContent('body');
    expect(content).toContain('access_denied');
  });

  test('should validate state parameter in callback', async ({ page }) => {
    // Set mismatched state in cookie
    await page.context().addCookies([
      {
        name: 'spotify_state',
        value: 'correct_state',
        domain: 'localhost',
        path: '/',
      }
    ]);
    
    // Call callback with different state
    await page.goto('/api/auth/spotify/callback?code=test_code&state=wrong_state');
    
    // Should return error
    const content = await page.textContent('body');
    expect(content).toContain('Invalid state');
  });

  test('should protect dashboard route when not authenticated', async ({ page }) => {
    // Try to access dashboard without authentication
    await page.goto('/dashboard');
    
    // Should redirect to login
    await expect(page).toHaveURL('/login');
  });

  test('should allow access to dashboard when authenticated', async ({ page }) => {
    // Set a mock user session cookie
    await page.context().addCookies([
      {
        name: 'user_session',
        value: 'mock_user_id_12345',
        domain: 'localhost',
        path: '/',
      }
    ]);
    
    // Try to access dashboard
    await page.goto('/dashboard');
    
    // Should stay on dashboard (not redirect)
    await expect(page).toHaveURL('/dashboard');
  });

  test('should redirect authenticated users away from login', async ({ page }) => {
    // Set authenticated session
    await page.context().addCookies([
      {
        name: 'user_session',
        value: 'mock_user_id_12345',
        domain: 'localhost',
        path: '/',
      }
    ]);
    
    // Try to access login page
    await page.goto('/login');
    
    // Should redirect to dashboard
    await expect(page).toHaveURL('/dashboard');
  });
});