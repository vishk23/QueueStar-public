import { BaseProvider, Track, Playlist, UserProfile } from './base';
import { ProviderError, TokenExpiredError, RateLimitError, AuthenticationError } from './errors';

// Apple Music interfaces matching MusicKit JS DataRecord structure
interface AppleMusicTrack {
  id: string;
  type: 'library-songs';
  name: string;
  artistName: string;
  albumName: string;
  artwork?: {
    url: string;
    width: number;
    height: number;
  };
  durationInMillis: number;
  genreNames?: string[];
  hasLyrics?: boolean;
  releaseDate?: string;
  trackNumber?: number;
  discNumber?: number;
  playParams?: {
    catalogId: string;
    id: string;
    isLibrary: boolean;
    kind: string;
  };
}

interface AppleMusicPlaylist {
  id: string;
  type: 'library-playlists';
  name: string;
  description?: string;
  artwork?: {
    url: string;
    width: number;
    height: number;
  };
  trackCount?: number;
}

interface AppleMusicAlbum {
  id: string;
  type: 'library-albums';
  albumName: string;
  artistName: string;
  artwork?: {
    url: string;
    width: number;
    height: number;
  };
  releaseDate?: string;
  genreNames?: string[];
  trackCount?: number;
}

export class AppleMusicProvider extends BaseProvider {
  readonly providerName = 'apple' as const;
  private musicKitInstance: any = null;
  private musicUserToken?: string;
  
  constructor(developerToken: string, musicUserToken?: string) {
    super(developerToken);
    if (musicUserToken) {
      this.musicUserToken = musicUserToken;
    }
  }
  
  protected async handleError(response: Response): Promise<never> {
    const errorData = await response.json().catch(() => ({}));
    
    switch (response.status) {
      case 401:
        throw new TokenExpiredError('apple');
      case 429:
        const retryAfter = parseInt(response.headers.get('Retry-After') || '60');
        throw new RateLimitError('apple', retryAfter);
      case 403:
        throw new AuthenticationError('apple', 'Insufficient permissions or forbidden');
      default:
        throw new ProviderError(
          errorData.error?.message || `HTTP ${response.status}`,
          'apple',
          'API_ERROR',
          response.status >= 500
        );
    }
  }
  
  async getUserProfile(): Promise<UserProfile> {
    // For server-side use (like callback), create a basic profile
    // since we don't have access to MusicKit instance on the server
    if (!this.musicKitInstance) {
      // Generate a basic profile for server-side callback processing
      // We'll use a timestamp-based ID since Apple Music doesn't provide user IDs
      const profileId = `apple_user_${Date.now()}`;
      
      return {
        id: profileId,
        displayName: 'Apple Music User',
        subscriptionType: 'premium', // Assume premium since they're using Apple Music
      };
    }

    try {
      const isAuthorized = this.musicKitInstance.isAuthorized;
      if (!isAuthorized) {
        throw new AuthenticationError('apple', 'User not authorized');
      }

      const storefront = this.musicKitInstance.storefrontId;
      const subscriptionType = this.musicKitInstance.isAuthorized ? 'premium' : 'free';

      return {
        id: `apple_${storefront}_user`, // Apple Music doesn't provide user ID directly
        displayName: 'Apple Music User',
        subscriptionType,
      };
    } catch (error) {
      throw new ProviderError(
        error instanceof Error ? error.message : 'Failed to get user profile',
        'apple',
        'API_ERROR'
      );
    }
  }

  async getTopTracks(
    timeRange: 'short' | 'medium' | 'long' = 'medium',
    limit: number = 50
  ): Promise<Track[]> {
    if (!this.musicKitInstance) {
      throw new AuthenticationError('apple', 'MusicKit instance not initialized');
    }

    try {
      // Apple Music doesn't have time ranges like Spotify
      // Use heavy rotation content as the closest equivalent to "top tracks"
      const response = await this.musicKitInstance.api.v1.me.history.heavyRotation({ 
        limit, 
        types: ['library-songs', 'songs'] 
      });
      
      // Filter to just songs and normalize
      const songs = response.filter((item: any) => 
        item.type === 'library-songs' || item.type === 'songs'
      );
      
      return songs.map(this.normalizeTrack).slice(0, limit);
    } catch (error) {
      // Fallback to recently played tracks if heavy rotation fails
      try {
        return await this.getRecentlyPlayedTracks(limit);
      } catch (fallbackError) {
        throw new ProviderError(
          error instanceof Error ? error.message : 'Failed to get top tracks',
          'apple',
          'API_ERROR'
        );
      }
    }
  }

  async getRecentlyAddedTracks(limit: number = 50): Promise<Track[]> {
    if (!this.musicKitInstance) {
      throw new AuthenticationError('apple', 'MusicKit instance not initialized');
    }

    try {
      const response = await this.musicKitInstance.api.library.recentlyAdded({ 
        limit,
        types: ['library-songs'] 
      });
      return response.map(this.normalizeTrack);
    } catch (error) {
      throw new ProviderError(
        error instanceof Error ? error.message : 'Failed to get recently added tracks',
        'apple',
        'API_ERROR'
      );
    }
  }

  async getRecentlyPlayedTracks(limit: number = 50): Promise<Track[]> {
    if (!this.musicKitInstance) {
      throw new AuthenticationError('apple', 'MusicKit instance not initialized');
    }

    try {
      const response = await this.musicKitInstance.api.v1.me.recent.played.tracks({ 
        limit,
        types: ['library-songs', 'songs']
      });
      return response.map(this.normalizeTrack);
    } catch (error) {
      throw new ProviderError(
        error instanceof Error ? error.message : 'Failed to get recently played tracks',
        'apple',
        'API_ERROR'
      );
    }
  }

  async getTopArtists(
    timeRange: 'short' | 'medium' | 'long' = 'medium',
    limit: number = 50
  ): Promise<any[]> {
    if (!this.musicKitInstance) {
      throw new AuthenticationError('apple', 'MusicKit instance not initialized');
    }

    try {
      // Use heavy rotation content filtered to artists
      const response = await this.musicKitInstance.api.v1.me.history.heavyRotation({ 
        limit, 
        types: ['artists'] 
      });
      
      return response.slice(0, limit);
    } catch (error) {
      throw new ProviderError(
        error instanceof Error ? error.message : 'Failed to get top artists',
        'apple',
        'API_ERROR'
      );
    }
  }

  async getRecentlyPlayed(limit: number = 50): Promise<any[]> {
    if (!this.musicKitInstance) {
      throw new AuthenticationError('apple', 'MusicKit instance not initialized');
    }

    try {
      // Get recently played resources (albums, playlists, etc.)
      const response = await this.musicKitInstance.api.v1.me.recent.played({ 
        limit,
        types: ['albums', 'playlists', 'library-albums', 'library-playlists', 'stations']
      });
      
      return response;
    } catch (error) {
      throw new ProviderError(
        error instanceof Error ? error.message : 'Failed to get recently played resources',
        'apple',
        'API_ERROR'
      );
    }
  }

  async getHeavyRotationContent(limit: number = 50): Promise<any[]> {
    if (!this.musicKitInstance) {
      throw new AuthenticationError('apple', 'MusicKit instance not initialized');
    }

    try {
      const response = await this.musicKitInstance.api.v1.me.history.heavyRotation({ 
        limit,
        types: ['songs', 'albums', 'artists', 'playlists', 'library-songs', 'library-albums', 'library-playlists']
      });
      
      return response;
    } catch (error) {
      throw new ProviderError(
        error instanceof Error ? error.message : 'Failed to get heavy rotation content',
        'apple',
        'API_ERROR'
      );
    }
  }

  async getLibrarySongs(limit: number = 1000, offset: number = 0): Promise<Track[]> {
    if (!this.musicKitInstance) {
      throw new AuthenticationError('apple', 'MusicKit instance not initialized');
    }

    try {
      const response = await this.musicKitInstance.api.library.songs({ limit, offset });
      return response.map(this.normalizeTrack);
    } catch (error) {
      throw new ProviderError(
        error instanceof Error ? error.message : 'Failed to get library songs',
        'apple',
        'API_ERROR'
      );
    }
  }

  async getLibraryAlbums(limit: number = 1000, offset: number = 0): Promise<any[]> {
    if (!this.musicKitInstance) {
      throw new AuthenticationError('apple', 'MusicKit instance not initialized');
    }

    try {
      const response = await this.musicKitInstance.api.library.albums({ limit, offset });
      return response;
    } catch (error) {
      throw new ProviderError(
        error instanceof Error ? error.message : 'Failed to get library albums',
        'apple',
        'API_ERROR'
      );
    }
  }

  async getLibraryPlaylists(limit: number = 1000, offset: number = 0): Promise<any[]> {
    if (!this.musicKitInstance) {
      throw new AuthenticationError('apple', 'MusicKit instance not initialized');
    }

    try {
      const response = await this.musicKitInstance.api.library.playlists({ limit, offset });
      return response;
    } catch (error) {
      throw new ProviderError(
        error instanceof Error ? error.message : 'Failed to get library playlists',
        'apple',
        'API_ERROR'
      );
    }
  }

  async getPlaylistTracks(playlistId: string, limit: number = 1000, offset: number = 0): Promise<any[]> {
    if (!this.musicKitInstance) {
      throw new AuthenticationError('apple', 'MusicKit instance not initialized');
    }

    try {
      const response = await this.musicKitInstance.api.library.playlistRelationship(
        playlistId, 
        'tracks',
        { limit, offset }
      );
      return response;
    } catch (error) {
      throw new ProviderError(
        error instanceof Error ? error.message : 'Failed to get playlist tracks',
        'apple',
        'API_ERROR'
      );
    }
  }
  
  // Apple Music doesn't support playlist creation via MusicKit JS (read-only)
  async createPlaylist(
    name: string,
    description?: string,
    isPublic: boolean = false
  ): Promise<Playlist> {
    throw new ProviderError(
      'Playlist creation not supported by Apple Music API',
      'apple',
      'UNSUPPORTED_OPERATION'
    );
  }

  async addTracksToPlaylist(playlistId: string, trackIds: string[]): Promise<void> {
    throw new ProviderError(
      'Playlist modification not supported by Apple Music API',
      'apple',
      'UNSUPPORTED_OPERATION'
    );
  }

  async searchTrack(query: string): Promise<Track | null> {
    if (!this.musicKitInstance) {
      throw new AuthenticationError('apple', 'MusicKit instance not initialized');
    }

    try {
      const response = await this.musicKitInstance.api.library.search(query, {
        types: 'library-songs',
        limit: 1
      });
      
      const track = response['library-songs']?.[0];
      return track ? this.normalizeTrack(track) : null;
    } catch (error) {
      throw new ProviderError(
        error instanceof Error ? error.message : 'Failed to search track',
        'apple',
        'API_ERROR'
      );
    }
  }

  async searchTrackByISRC(isrc: string): Promise<Track | null> {
    // Apple Music doesn't support ISRC search in library
    // Would need to use catalog search instead
    throw new ProviderError(
      'ISRC search not supported by Apple Music Library API',
      'apple',
      'UNSUPPORTED_OPERATION'
    );
  }

  // Helper methods for MusicKit JS integration
  setMusicKitInstance(musicKit: any): void {
    this.musicKitInstance = musicKit;
  }

  setMusicUserToken(token: string): void {
    this.musicUserToken = token;
  }

  private normalizeTrack = (appleTrack: AppleMusicTrack): Track => {
    return {
      id: appleTrack.id,
      name: appleTrack.name,
      artist: appleTrack.artistName || 'Unknown Artist',
      album: appleTrack.albumName || '',
      albumArt: appleTrack.artwork?.url?.replace('{w}', '640').replace('{h}', '640') || '',
      durationMs: appleTrack.durationInMillis || 0,
      provider: 'apple',
    };
  };
}