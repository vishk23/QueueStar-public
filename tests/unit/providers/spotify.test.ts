import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SpotifyProvider } from '@/lib/providers/spotify';
import { TokenExpiredError, RateLimitError, AuthenticationError } from '@/lib/providers/errors';

const mockSpotifyTrack = {
  id: 'spotify123',
  name: 'Test Song',
  artists: [{ name: 'Test Artist' }],
  album: {
    name: 'Test Album',
    images: [{ url: 'https://example.com/image.jpg' }]
  },
  duration_ms: 180000,
  external_ids: { isrc: 'USRC12345' },
};

const mockSpotifyUser = {
  id: 'spotify_user_123',
  display_name: 'Test User',
  email: 'test@example.com',
  images: [{ url: 'https://example.com/avatar.jpg' }],
  product: 'premium',
};

describe('SpotifyProvider', () => {
  let provider: SpotifyProvider;
  let mockFetch: any;

  beforeEach(() => {
    mockFetch = vi.fn();
    global.fetch = mockFetch;
    provider = new SpotifyProvider('test_access_token');
  });

  describe('constructor', () => {
    it('should initialize with access token', () => {
      expect(provider.providerName).toBe('spotify');
      expect(provider.isAuthenticated()).toBe(true);
    });

    it('should not be authenticated without token', () => {
      const emptyProvider = new SpotifyProvider('');
      expect(emptyProvider.isAuthenticated()).toBe(false);
    });
  });

  describe('getUserProfile', () => {
    it('should fetch and normalize user profile', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockSpotifyUser),
      });

      const profile = await provider.getUserProfile();

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.spotify.com/v1/me',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer test_access_token',
          }),
        })
      );

      expect(profile).toEqual({
        id: 'spotify_user_123',
        displayName: 'Test User',
        email: 'test@example.com',
        avatarUrl: 'https://example.com/avatar.jpg',
        subscriptionType: 'premium',
      });
    });

    it('should handle user without display name', async () => {
      const userWithoutName = { ...mockSpotifyUser, display_name: null };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(userWithoutName),
      });

      const profile = await provider.getUserProfile();
      expect(profile.displayName).toBe('spotify_user_123'); // Falls back to ID
    });
  });

  describe('getTopTracks', () => {
    it('should fetch and normalize top tracks', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ items: [mockSpotifyTrack] }),
      });

      const tracks = await provider.getTopTracks('medium', 1);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.spotify.com/v1/me/top/tracks?time_range=medium_term&limit=1',
        expect.any(Object)
      );

      expect(tracks).toHaveLength(1);
      expect(tracks[0]).toEqual({
        id: 'spotify123',
        name: 'Test Song',
        artist: 'Test Artist',
        album: 'Test Album',
        albumArt: 'https://example.com/image.jpg',
        durationMs: 180000,
        isrc: 'USRC12345',
        provider: 'spotify',
      });
    });

    it('should use default parameters', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ items: [] }),
      });

      await provider.getTopTracks();

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.spotify.com/v1/me/top/tracks?time_range=medium_term&limit=50',
        expect.any(Object)
      );
    });

    it('should convert time ranges correctly', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ items: [] }),
      });

      await provider.getTopTracks('short');
      expect(mockFetch).toHaveBeenLastCalledWith(
        expect.stringContaining('time_range=short_term'),
        expect.any(Object)
      );

      await provider.getTopTracks('long');
      expect(mockFetch).toHaveBeenLastCalledWith(
        expect.stringContaining('time_range=long_term'),
        expect.any(Object)
      );
    });
  });

  describe('createPlaylist', () => {
    it('should create playlist after getting user profile', async () => {
      // Mock user profile call
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockSpotifyUser),
      });

      // Mock playlist creation
      const mockPlaylist = {
        id: 'playlist123',
        name: 'Test Playlist',
        description: 'Test Description',
        tracks: { total: 0 },
        external_urls: { spotify: 'https://open.spotify.com/playlist/123' },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockPlaylist),
      });

      const playlist = await provider.createPlaylist('Test Playlist', 'Test Description', true);

      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(mockFetch).toHaveBeenLastCalledWith(
        'https://api.spotify.com/v1/users/spotify_user_123/playlists',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            name: 'Test Playlist',
            description: 'Test Description',
            public: true,
          }),
        })
      );

      expect(playlist).toEqual({
        id: 'playlist123',
        name: 'Test Playlist',
        description: 'Test Description',
        trackCount: 0,
        url: 'https://open.spotify.com/playlist/123',
      });
    });
  });

  describe('addTracksToPlaylist', () => {
    it('should add tracks to playlist', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({}),
      });

      await provider.addTracksToPlaylist('playlist123', ['track1', 'track2']);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.spotify.com/v1/playlists/playlist123/tracks',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            uris: ['spotify:track:track1', 'spotify:track:track2'],
          }),
        })
      );
    });

    it('should handle large track lists by chunking', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({}),
      });

      const manyTracks = Array.from({ length: 150 }, (_, i) => `track${i}`);
      await provider.addTracksToPlaylist('playlist123', manyTracks);

      // Should make 2 calls (100 + 50)
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });

  describe('searchTrack', () => {
    it('should search for tracks', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          tracks: { items: [mockSpotifyTrack] }
        }),
      });

      const track = await provider.searchTrack('test query');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.spotify.com/v1/search?q=test%20query&type=track&limit=1',
        expect.any(Object)
      );

      expect(track).not.toBeNull();
      expect(track!.name).toBe('Test Song');
    });

    it('should return null when no tracks found', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          tracks: { items: [] }
        }),
      });

      const track = await provider.searchTrack('nonexistent');
      expect(track).toBeNull();
    });
  });

  describe('searchTrackByISRC', () => {
    it('should search by ISRC', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          tracks: { items: [mockSpotifyTrack] }
        }),
      });

      const track = await provider.searchTrackByISRC('USRC12345');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.spotify.com/v1/search?q=isrc:USRC12345&type=track&limit=1',
        expect.any(Object)
      );

      expect(track).not.toBeNull();
    });
  });

  describe('error handling', () => {
    it('should throw TokenExpiredError for 401', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ error: { message: 'Token expired' } }),
      });

      await expect(provider.getUserProfile()).rejects.toThrow(TokenExpiredError);
    });

    it('should throw RateLimitError for 429', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        headers: new Map([['Retry-After', '60']]),
        json: () => Promise.resolve({}),
      });

      await expect(provider.getUserProfile()).rejects.toThrow(RateLimitError);
    });

    it('should throw AuthenticationError for 403', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: () => Promise.resolve({}),
      });

      await expect(provider.getUserProfile()).rejects.toThrow(AuthenticationError);
    });

    it('should handle missing album images gracefully', async () => {
      const trackWithoutImage = {
        ...mockSpotifyTrack,
        album: { ...mockSpotifyTrack.album, images: [] }
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ items: [trackWithoutImage] }),
      });

      const tracks = await provider.getTopTracks();
      expect(tracks[0].albumArt).toBe('');
    });

    it('should handle missing artist gracefully', async () => {
      const trackWithoutArtist = {
        ...mockSpotifyTrack,
        artists: []
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ items: [trackWithoutArtist] }),
      });

      const tracks = await provider.getTopTracks();
      expect(tracks[0].artist).toBe('Unknown Artist');
    });
  });
});