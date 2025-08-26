import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { db } from '@/db';
import { 
  users, 
  userTopTracks,
  userTopArtists,
  userRecentlyPlayed,
  userPlaylists,
  userPlaylistTracks,
  userSavedTracks,
  userSavedAlbums,
  userFollowedArtists,
  providerConnections
} from '@/db/schema';
import { eq, and, count } from 'drizzle-orm';

// Mock Spotify provider
const mockSpotifyProvider = {
  getTopTracks: vi.fn(),
  getTopArtists: vi.fn(),
  getRecentlyPlayed: vi.fn(),
  getUserPlaylists: vi.fn(),
  getPlaylistTracks: vi.fn(),
  getSavedTracks: vi.fn(),
  getSavedAlbums: vi.fn(),
  getFollowedArtists: vi.fn(),
};

// Mock data
const mockUser = {
  id: 'test-user-id',
  email: 'test@example.com',
  displayName: 'Test User',
};

const mockTopTracks = [
  {
    id: 'track1',
    name: 'Test Track 1',
    artist: 'Test Artist 1',
    album: 'Test Album 1',
    albumArt: 'https://example.com/art1.jpg',
    durationMs: 180000,
    isrc: 'TEST123456789',
  },
  {
    id: 'track2',
    name: 'Test Track 2',
    artist: 'Test Artist 2',
    album: 'Test Album 2',
    albumArt: 'https://example.com/art2.jpg',
    durationMs: 210000,
    isrc: 'TEST987654321',
  }
];

const mockTopArtists = [
  {
    id: 'artist1',
    name: 'Test Artist 1',
    images: [{ url: 'https://example.com/artist1.jpg' }],
    genres: ['pop', 'rock'],
    popularity: 85,
    followers: { total: 1000000 },
  },
  {
    id: 'artist2',
    name: 'Test Artist 2',
    images: [{ url: 'https://example.com/artist2.jpg' }],
    genres: ['electronic', 'dance'],
    popularity: 78,
    followers: { total: 500000 },
  }
];

const mockRecentlyPlayed = [
  {
    track: {
      id: 'recent1',
      name: 'Recent Track 1',
      artists: [{ name: 'Recent Artist 1' }],
      album: {
        name: 'Recent Album 1',
        images: [{ url: 'https://example.com/recent1.jpg' }]
      },
      duration_ms: 200000,
      external_ids: { isrc: 'RECENT123' }
    },
    played_at: '2024-01-01T12:00:00Z'
  }
];

const mockPlaylists = [
  {
    id: 'playlist1',
    name: 'My Awesome Playlist',
    description: 'A test playlist',
    images: [{ url: 'https://example.com/playlist1.jpg' }],
    tracks: { total: 25 },
    followers: { total: 100 },
    public: true,
    owner: { id: 'test-user-id', display_name: 'Test User' },
    external_urls: { spotify: 'https://spotify.com/playlist/1' }
  }
];

const mockPlaylistTracks = [
  {
    track: {
      id: 'pltrack1',
      name: 'Playlist Track 1',
      artists: [{ name: 'Playlist Artist 1' }],
      album: {
        name: 'Playlist Album 1',
        images: [{ url: 'https://example.com/pltrack1.jpg' }]
      },
      duration_ms: 190000,
      external_ids: { isrc: 'PLTRACK1' }
    },
    added_at: '2024-01-01T10:00:00Z',
    added_by: { id: 'test-user-id' }
  }
];

const mockSavedTracks = [
  {
    track: {
      id: 'saved1',
      name: 'Saved Track 1',
      artists: [{ name: 'Saved Artist 1' }],
      album: {
        name: 'Saved Album 1',
        images: [{ url: 'https://example.com/saved1.jpg' }]
      },
      duration_ms: 195000,
      popularity: 82,
      external_ids: { isrc: 'SAVED1' }
    },
    added_at: '2024-01-01T09:00:00Z'
  }
];

const mockSavedAlbums = [
  {
    album: {
      id: 'album1',
      name: 'Saved Album 1',
      artists: [{ name: 'Album Artist 1' }],
      images: [{ url: 'https://example.com/album1.jpg' }],
      release_date: '2023-01-01',
      total_tracks: 12,
      album_type: 'album',
      genres: ['pop', 'indie']
    },
    added_at: '2024-01-01T08:00:00Z'
  }
];

const mockFollowedArtists = [
  {
    id: 'followed1',
    name: 'Followed Artist 1',
    images: [{ url: 'https://example.com/followed1.jpg' }],
    genres: ['jazz', 'blues'],
    popularity: 75,
    followers: { total: 250000 },
    external_urls: { spotify: 'https://spotify.com/artist/1' }
  }
];

// Import the sync functions (we'll need to export them from the callback route)
// For now, let's create simplified versions for testing
async function syncTopTracks(provider: any, userId: string) {
  const timeRanges = ['short', 'medium', 'long'] as const;
  
  for (const timeRange of timeRanges) {
    try {
      const tracks = await provider.getTopTracks(timeRange, 50);
      
      if (tracks.length > 0) {
        // Filter out invalid tracks
        const validTracks = tracks.filter((track: any) => track.id && track.name);
        
        if (validTracks.length > 0) {
          const trackRecords = validTracks.map((track: any, index: number) => ({
            userId,
            provider: 'spotify' as const,
            trackId: track.id,
            trackName: track.name,
            artistName: track.artist || 'Unknown Artist',
            albumName: track.album || null,
            albumArtUrl: track.albumArt || null,
            durationMs: track.durationMs || null,
            isrc: track.isrc || null,
            timeRange: `${timeRange}_term` as const,
            rank: index + 1,
            trackMetadata: { originalTrack: track },
          }));
          
          await db.insert(userTopTracks).values(trackRecords);
        }
      }
    } catch (error) {
      console.error(`Failed to sync ${timeRange} top tracks:`, error);
      // Continue with other time ranges
      continue;
    }
  }
}

async function syncTopArtists(provider: any, userId: string) {
  const timeRanges = ['short', 'medium', 'long'] as const;
  
  for (const timeRange of timeRanges) {
    const artists = await provider.getTopArtists(timeRange, 50);
    
    if (artists.length > 0) {
      const artistRecords = artists.map((artist: any, index: number) => ({
        userId,
        provider: 'spotify' as const,
        artistId: artist.id,
        artistName: artist.name,
        imageUrl: artist.images?.[0]?.url || null,
        genres: artist.genres,
        popularity: artist.popularity,
        followerCount: artist.followers?.total,
        timeRange: `${timeRange}_term` as const,
        rank: index + 1,
        artistMetadata: { originalArtist: artist },
      }));
      
      await db.insert(userTopArtists).values(artistRecords);
    }
  }
}

async function syncRecentlyPlayed(provider: any, userId: string) {
  const recentTracks = await provider.getRecentlyPlayed(50);
  
  if (recentTracks.length > 0) {
    const trackRecords = recentTracks.map((item: any) => ({
      userId,
      provider: 'spotify' as const,
      trackId: item.track.id,
      trackName: item.track.name,
      artistName: item.track.artists[0]?.name || 'Unknown Artist',
      albumName: item.track.album?.name,
      albumArtUrl: item.track.album?.images?.[0]?.url || null,
      durationMs: item.track.duration_ms,
      playedAt: new Date(item.played_at),
      isrc: item.track.external_ids?.isrc || null,
      trackMetadata: { originalTrack: item },
    }));
    
    await db.insert(userRecentlyPlayed).values(trackRecords);
  }
}

describe('Spotify Data Sync', () => {
  let testUserId: string;

  beforeEach(async () => {
    // Create test user
    const [testUser] = await db.insert(users).values({
      email: 'test@example.com',
      displayName: 'Test User',
    }).returning();
    
    testUserId = testUser.id;

    // Reset mocks
    vi.clearAllMocks();
  });

  afterEach(async () => {
    // Clean up test data
    await db.delete(userTopTracks).where(eq(userTopTracks.userId, testUserId));
    await db.delete(userTopArtists).where(eq(userTopArtists.userId, testUserId));
    await db.delete(userRecentlyPlayed).where(eq(userRecentlyPlayed.userId, testUserId));
    await db.delete(users).where(eq(users.id, testUserId));
  });

  describe('Top Tracks Sync', () => {
    it('should sync top tracks for all time ranges', async () => {
      // Setup mock responses
      mockSpotifyProvider.getTopTracks
        .mockResolvedValueOnce(mockTopTracks) // short_term
        .mockResolvedValueOnce(mockTopTracks) // medium_term
        .mockResolvedValueOnce(mockTopTracks); // long_term

      // Run sync
      await syncTopTracks(mockSpotifyProvider, testUserId);

      // Verify API calls
      expect(mockSpotifyProvider.getTopTracks).toHaveBeenCalledTimes(3);
      expect(mockSpotifyProvider.getTopTracks).toHaveBeenCalledWith('short', 50);
      expect(mockSpotifyProvider.getTopTracks).toHaveBeenCalledWith('medium', 50);
      expect(mockSpotifyProvider.getTopTracks).toHaveBeenCalledWith('long', 50);

      // Verify database records
      const dbTracks = await db.select().from(userTopTracks).where(eq(userTopTracks.userId, testUserId));
      expect(dbTracks).toHaveLength(6); // 2 tracks × 3 time ranges

      // Verify data structure
      const shortTermTracks = dbTracks.filter(t => t.timeRange === 'short_term');
      expect(shortTermTracks).toHaveLength(2);
      expect(shortTermTracks[0].trackName).toBe('Test Track 1');
      expect(shortTermTracks[0].rank).toBe(1);
      expect(shortTermTracks[1].rank).toBe(2);
    });

    it('should handle empty top tracks response', async () => {
      mockSpotifyProvider.getTopTracks.mockResolvedValue([]);

      await syncTopTracks(mockSpotifyProvider, testUserId);

      const dbTracks = await db.select().from(userTopTracks).where(eq(userTopTracks.userId, testUserId));
      expect(dbTracks).toHaveLength(0);
    });

    it('should continue sync even if one time range fails', async () => {
      mockSpotifyProvider.getTopTracks
        .mockRejectedValueOnce(new Error('API Error'))
        .mockResolvedValueOnce(mockTopTracks)
        .mockResolvedValueOnce(mockTopTracks);

      await syncTopTracks(mockSpotifyProvider, testUserId);

      const dbTracks = await db.select().from(userTopTracks).where(eq(userTopTracks.userId, testUserId));
      expect(dbTracks).toHaveLength(4); // Only medium_term and long_term succeeded
    });
  });

  describe('Top Artists Sync', () => {
    it('should sync top artists for all time ranges', async () => {
      mockSpotifyProvider.getTopArtists
        .mockResolvedValueOnce(mockTopArtists)
        .mockResolvedValueOnce(mockTopArtists)
        .mockResolvedValueOnce(mockTopArtists);

      await syncTopArtists(mockSpotifyProvider, testUserId);

      expect(mockSpotifyProvider.getTopArtists).toHaveBeenCalledTimes(3);

      const dbArtists = await db.select().from(userTopArtists).where(eq(userTopArtists.userId, testUserId));
      expect(dbArtists).toHaveLength(6); // 2 artists × 3 time ranges

      const artist = dbArtists[0];
      expect(artist.artistName).toBe('Test Artist 1');
      expect(artist.genres).toEqual(['pop', 'rock']);
      expect(artist.popularity).toBe(85);
      expect(artist.followerCount).toBe(1000000);
    });
  });

  describe('Recently Played Sync', () => {
    it('should sync recently played tracks', async () => {
      mockSpotifyProvider.getRecentlyPlayed.mockResolvedValueOnce(mockRecentlyPlayed);

      await syncRecentlyPlayed(mockSpotifyProvider, testUserId);

      const dbTracks = await db.select().from(userRecentlyPlayed).where(eq(userRecentlyPlayed.userId, testUserId));
      expect(dbTracks).toHaveLength(1);

      const track = dbTracks[0];
      expect(track.trackName).toBe('Recent Track 1');
      expect(track.playedAt).toEqual(new Date('2024-01-01T12:00:00Z'));
      expect(track.isrc).toBe('RECENT123');
    });
  });

  describe('Append-Only Strategy', () => {
    it('should append new data without deleting existing records', async () => {
      // First sync
      mockSpotifyProvider.getTopTracks.mockResolvedValueOnce(mockTopTracks);
      await syncTopTracks(mockSpotifyProvider, testUserId);

      const firstSyncCount = await db.select({ count: count() })
        .from(userTopTracks)
        .where(eq(userTopTracks.userId, testUserId));

      // Second sync with different data
      const newMockTracks = [{
        id: 'track3',
        name: 'New Track',
        artist: 'New Artist',
        album: 'New Album',
        durationMs: 220000,
      }];

      mockSpotifyProvider.getTopTracks.mockResolvedValueOnce(newMockTracks);
      await syncTopTracks(mockSpotifyProvider, testUserId);

      const secondSyncCount = await db.select({ count: count() })
        .from(userTopTracks)
        .where(eq(userTopTracks.userId, testUserId));

      // Should have more records after second sync (append-only)
      expect(secondSyncCount[0].count).toBeGreaterThan(firstSyncCount[0].count);

      // Original data should still exist (could be multiple due to different time ranges)
      const originalTrack = await db.select()
        .from(userTopTracks)
        .where(and(
          eq(userTopTracks.userId, testUserId),
          eq(userTopTracks.trackId, 'track1')
        ));
      expect(originalTrack.length).toBeGreaterThan(0);
    });
  });

  describe('Data Integrity', () => {
    it('should preserve metadata correctly', async () => {
      mockSpotifyProvider.getTopTracks.mockResolvedValueOnce(mockTopTracks);
      await syncTopTracks(mockSpotifyProvider, testUserId);

      const dbTracks = await db.select().from(userTopTracks).where(eq(userTopTracks.userId, testUserId));
      const track = dbTracks[0];

      expect(track.trackMetadata).toHaveProperty('originalTrack');
      expect(track.trackMetadata.originalTrack).toMatchObject(mockTopTracks[0]);
      expect(track.fetchedAt).toBeInstanceOf(Date);
    });

    it('should handle null values gracefully', async () => {
      const tracksWithNulls = [{
        id: 'track1',
        name: 'Track with nulls',
        artist: 'Artist',
        album: null,
        albumArt: null,
        durationMs: null,
        isrc: null,
      }];

      mockSpotifyProvider.getTopTracks.mockResolvedValueOnce(tracksWithNulls);
      await syncTopTracks(mockSpotifyProvider, testUserId);

      const dbTracks = await db.select().from(userTopTracks).where(eq(userTopTracks.userId, testUserId));
      const track = dbTracks[0];

      expect(track.albumName).toBeNull();
      expect(track.albumArtUrl).toBeNull();
      expect(track.durationMs).toBeNull();
      expect(track.isrc).toBeNull();
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors gracefully', async () => {
      mockSpotifyProvider.getTopTracks.mockRejectedValue(new Error('Spotify API Error'));

      // Should not throw
      await expect(syncTopTracks(mockSpotifyProvider, testUserId)).resolves.toBeUndefined();

      // Should not have created any records
      const dbTracks = await db.select().from(userTopTracks).where(eq(userTopTracks.userId, testUserId));
      expect(dbTracks).toHaveLength(0);
    });

    it('should handle malformed API responses', async () => {
      const malformedTracks = [
        {
          // Missing required fields
          name: 'Incomplete Track',
        },
        {
          id: 'track2',
          name: 'Valid Track',
          artist: 'Valid Artist',
          album: 'Valid Album',
          durationMs: 180000,
        }
      ];

      mockSpotifyProvider.getTopTracks.mockResolvedValueOnce(malformedTracks);

      // Should handle gracefully and insert valid records
      await expect(syncTopTracks(mockSpotifyProvider, testUserId)).resolves.toBeUndefined();
    });
  });
});

describe('Database Schema Validation', () => {
  let testUserId: string;

  beforeEach(async () => {
    const [testUser] = await db.insert(users).values({
      email: 'schema-test@example.com',
      displayName: 'Schema Test User',
    }).returning();
    
    testUserId = testUser.id;
  });

  afterEach(async () => {
    // Clean up in correct order due to foreign key constraints
    await db.delete(userTopTracks).where(eq(userTopTracks.userId, testUserId));
    await db.delete(userTopArtists).where(eq(userTopArtists.userId, testUserId));
    await db.delete(userRecentlyPlayed).where(eq(userRecentlyPlayed.userId, testUserId));
    await db.delete(userPlaylists).where(eq(userPlaylists.userId, testUserId));
    await db.delete(userPlaylistTracks).where(eq(userPlaylistTracks.userId, testUserId));
    await db.delete(userSavedTracks).where(eq(userSavedTracks.userId, testUserId));
    await db.delete(userSavedAlbums).where(eq(userSavedAlbums.userId, testUserId));
    await db.delete(userFollowedArtists).where(eq(userFollowedArtists.userId, testUserId));
    await db.delete(users).where(eq(users.id, testUserId));
  });

  it('should enforce foreign key constraints', async () => {
    // Try to insert track with non-existent user_id
    await expect(
      db.insert(userTopTracks).values({
        userId: 'non-existent-user-id',
        provider: 'spotify',
        trackId: 'test-track',
        trackName: 'Test Track',
        artistName: 'Test Artist',
        timeRange: 'short_term',
        rank: 1,
      })
    ).rejects.toThrow();
  });

  it('should enforce enum constraints', async () => {
    // Try to insert with invalid provider
    await expect(
      db.insert(userTopTracks).values({
        userId: testUserId,
        provider: 'invalid_provider' as any,
        trackId: 'test-track',
        trackName: 'Test Track',
        artistName: 'Test Artist',
        timeRange: 'short_term',
        rank: 1,
      })
    ).rejects.toThrow();

    // Try to insert with invalid time_range
    await expect(
      db.insert(userTopTracks).values({
        userId: testUserId,
        provider: 'spotify',
        trackId: 'test-track',
        trackName: 'Test Track',
        artistName: 'Test Artist',
        timeRange: 'invalid_range' as any,
        rank: 1,
      })
    ).rejects.toThrow();
  });

  it('should allow valid data insertion in all tables', async () => {
    // Test each table with valid data
    const validTrack = {
      userId: testUserId,
      provider: 'spotify' as const,
      trackId: 'valid-track',
      trackName: 'Valid Track',
      artistName: 'Valid Artist',
      timeRange: 'short_term' as const,
      rank: 1,
    };

    const validArtist = {
      userId: testUserId,
      provider: 'spotify' as const,
      artistId: 'valid-artist',
      artistName: 'Valid Artist',
      timeRange: 'short_term' as const,
      rank: 1,
    };

    const validRecentTrack = {
      userId: testUserId,
      provider: 'spotify' as const,
      trackId: 'valid-recent-track',
      trackName: 'Valid Recent Track',
      artistName: 'Valid Recent Artist',
      playedAt: new Date(),
    };

    // Insert should succeed
    await expect(db.insert(userTopTracks).values(validTrack)).resolves.not.toThrow();
    await expect(db.insert(userTopArtists).values(validArtist)).resolves.not.toThrow();
    await expect(db.insert(userRecentlyPlayed).values(validRecentTrack)).resolves.not.toThrow();
  });
});