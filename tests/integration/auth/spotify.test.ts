import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { GET as SpotifyAuthGET } from '@/app/api/auth/spotify/route';
import { GET as SpotifyCallbackGET } from '@/app/api/auth/spotify/callback/route';

// Mock database
vi.mock('@/db', () => ({
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    returning: vi.fn(),
  },
}));

describe('Spotify OAuth Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Set required environment variables
    process.env.SPOTIFY_CLIENT_ID = 'test_client_id';
    process.env.SPOTIFY_REDIRECT_URI = 'http://localhost:3000/api/auth/spotify/callback';
    (process.env as any).NODE_ENV = 'test';
  });

  describe('GET /api/auth/spotify', () => {
    it('should redirect to Spotify authorization URL with PKCE', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/spotify');
      const response = await SpotifyAuthGET(request);

      expect(response.status).toBe(307); // Next.js uses 307 for redirects
      
      const location = response.headers.get('location');
      expect(location).toContain('accounts.spotify.com/authorize');
      expect(location).toContain('code_challenge');
      expect(location).toContain('code_challenge_method=S256');
      expect(location).toContain('response_type=code');
      expect(location).toContain('client_id=test_client_id');
    });

    it('should set PKCE code_verifier in session', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/spotify');
      const response = await SpotifyAuthGET(request);
      
      // Should set secure cookies
      const cookies = response.headers.getSetCookie();
      const codeVerifierCookie = cookies.find(c => c.includes('spotify_code_verifier'));
      
      expect(codeVerifierCookie).toBeTruthy();
      expect(codeVerifierCookie).toContain('HttpOnly');
      expect(codeVerifierCookie).toContain('SameSite=lax'); // Lowercase in actual implementation
    });

    it('should include required scopes', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/spotify');
      const response = await SpotifyAuthGET(request);
      
      const location = response.headers.get('location');
      const requiredScopes = [
        'user-read-private',
        'user-read-email', 
        'user-top-read',
        'playlist-modify-public',
        'playlist-modify-private'
      ];
      
      requiredScopes.forEach(scope => {
        expect(location).toContain(scope);
      });
    });
  });

  describe('GET /api/auth/spotify/callback', () => {
    it('should validate state parameter', async () => {
      const url = 'http://localhost:3000/api/auth/spotify/callback?code=test_code&state=invalid_state';
      const request = new NextRequest(url, {
        headers: {
          Cookie: 'spotify_state=different_state',
        },
      });

      const response = await SpotifyCallbackGET(request);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('Invalid state');
    });

    it('should handle missing authorization code', async () => {
      const url = 'http://localhost:3000/api/auth/spotify/callback?error=access_denied';
      const request = new NextRequest(url);

      const response = await SpotifyCallbackGET(request);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('access_denied');
    });

    it('should handle missing code verifier', async () => {
      const url = 'http://localhost:3000/api/auth/spotify/callback?code=test_code&state=test_state';
      const request = new NextRequest(url, {
        headers: {
          Cookie: 'spotify_state=test_state', // Missing code_verifier
        },
      });

      const response = await SpotifyCallbackGET(request);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('Missing code verifier');
    });

    it('should handle token exchange errors', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: () => Promise.resolve({
          error: 'invalid_grant',
          error_description: 'Invalid authorization code',
        }),
      });

      const url = 'http://localhost:3000/api/auth/spotify/callback?code=invalid_code&state=test_state';
      const request = new NextRequest(url, {
        headers: {
          Cookie: 'spotify_code_verifier=test_verifier; spotify_state=test_state',
        },
      });

      const response = await SpotifyCallbackGET(request);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('invalid_grant');
    });
  });
});