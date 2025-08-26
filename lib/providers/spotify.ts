import { BaseProvider, Track, Playlist, UserProfile } from './base';
import { ProviderError, TokenExpiredError, RateLimitError, AuthenticationError } from './errors';

interface SpotifyTrack {
  id: string;
  name: string;
  artists: { name: string }[];
  album: {
    name: string;
    images: { url: string }[];
  };
  duration_ms: number;
  external_ids?: {
    isrc?: string;
  };
}

interface SpotifyUser {
  id: string;
  display_name: string;
  email?: string;
  images: { url: string }[];
  product?: string;
}

interface SpotifyPlaylist {
  id: string;
  name: string;
  description?: string;
  tracks: {
    total: number;
  };
  external_urls: {
    spotify: string;
  };
}

export class SpotifyProvider extends BaseProvider {
  readonly providerName = 'spotify' as const;
  private readonly baseUrl = 'https://api.spotify.com/v1';
  
  protected async handleError(response: Response): Promise<never> {
    const errorData = await response.json().catch(() => ({}));
    
    switch (response.status) {
      case 401:
        throw new TokenExpiredError('spotify');
      case 429:
        const retryAfter = parseInt(response.headers.get('Retry-After') || '60');
        throw new RateLimitError('spotify', retryAfter);
      case 403:
        throw new AuthenticationError('spotify', 'Insufficient scope or forbidden');
      default:
        throw new ProviderError(
          errorData.error?.message || `HTTP ${response.status}`,
          'spotify',
          'API_ERROR',
          response.status >= 500
        );
    }
  }
  
  async getUserProfile(): Promise<UserProfile> {
    const data = await this.makeRequest<SpotifyUser>(`${this.baseUrl}/me`);
    
    return {
      id: data.id,
      displayName: data.display_name || data.id,
      email: data.email,
      avatarUrl: data.images?.[0]?.url,
      subscriptionType: data.product,
    };
  }
  
  async getTopTracks(
    timeRange: 'short' | 'medium' | 'long' = 'medium',
    limit: number = 50
  ): Promise<Track[]> {
    const spotifyTimeRange = `${timeRange}_term`;
    const data = await this.makeRequest<{ items: SpotifyTrack[] }>(
      `${this.baseUrl}/me/top/tracks?time_range=${spotifyTimeRange}&limit=${limit}`
    );
    
    return data.items.map(this.normalizeTrack);
  }
  
  async createPlaylist(
    name: string,
    description?: string,
    isPublic: boolean = false
  ): Promise<Playlist> {
    // First get current user ID
    const user = await this.getUserProfile();
    
    const data = await this.makeRequest<SpotifyPlaylist>(
      `${this.baseUrl}/users/${user.id}/playlists`,
      {
        method: 'POST',
        body: JSON.stringify({
          name,
          description: description || '',
          public: isPublic,
        }),
      }
    );
    
    return {
      id: data.id,
      name: data.name,
      description: data.description || undefined,
      trackCount: data.tracks.total,
      url: data.external_urls.spotify,
    };
  }
  
  async addTracksToPlaylist(playlistId: string, trackIds: string[]): Promise<void> {
    const uris = trackIds.map(id => `spotify:track:${id}`);
    
    // Spotify API allows max 100 tracks per request
    const chunks = [];
    for (let i = 0; i < uris.length; i += 100) {
      chunks.push(uris.slice(i, i + 100));
    }
    
    for (const chunk of chunks) {
      await this.makeRequest(
        `${this.baseUrl}/playlists/${playlistId}/tracks`,
        {
          method: 'POST',
          body: JSON.stringify({ uris: chunk }),
        }
      );
    }
  }
  
  async searchTrack(query: string): Promise<Track | null> {
    const encodedQuery = encodeURIComponent(query);
    const data = await this.makeRequest<{ tracks: { items: SpotifyTrack[] } }>(
      `${this.baseUrl}/search?q=${encodedQuery}&type=track&limit=1`
    );
    
    const track = data.tracks.items[0];
    return track ? this.normalizeTrack(track) : null;
  }
  
  async searchTrackByISRC(isrc: string): Promise<Track | null> {
    const data = await this.makeRequest<{ tracks: { items: SpotifyTrack[] } }>(
      `${this.baseUrl}/search?q=isrc:${isrc}&type=track&limit=1`
    );
    
    const track = data.tracks.items[0];
    return track ? this.normalizeTrack(track) : null;
  }

  async getTopArtists(
    timeRange: 'short' | 'medium' | 'long' = 'medium',
    limit: number = 50
  ): Promise<any[]> {
    const spotifyTimeRange = `${timeRange}_term`;
    const data = await this.makeRequest<{ items: any[] }>(
      `${this.baseUrl}/me/top/artists?time_range=${spotifyTimeRange}&limit=${limit}`
    );
    return data.items;
  }

  async getRecentlyPlayed(limit: number = 50): Promise<any[]> {
    const data = await this.makeRequest<{ items: any[] }>(
      `${this.baseUrl}/me/player/recently-played?limit=${limit}`
    );
    return data.items;
  }

  async getUserPlaylists(limit: number = 50, offset: number = 0): Promise<any> {
    const data = await this.makeRequest<{ items: any[], total: number }>(
      `${this.baseUrl}/me/playlists?limit=${limit}&offset=${offset}`
    );
    return data;
  }

  async getPlaylistTracks(playlistId: string, limit: number = 100, offset: number = 0): Promise<any> {
    const data = await this.makeRequest<{ items: any[], total: number }>(
      `${this.baseUrl}/playlists/${playlistId}/tracks?limit=${limit}&offset=${offset}`
    );
    return data;
  }

  async getSavedTracks(limit: number = 50, offset: number = 0): Promise<any> {
    const data = await this.makeRequest<{ items: any[], total: number }>(
      `${this.baseUrl}/me/tracks?limit=${limit}&offset=${offset}`
    );
    return data;
  }

  async getSavedAlbums(limit: number = 50, offset: number = 0): Promise<any> {
    const data = await this.makeRequest<{ items: any[], total: number }>(
      `${this.baseUrl}/me/albums?limit=${limit}&offset=${offset}`
    );
    return data;
  }

  async getFollowedArtists(limit: number = 50): Promise<any> {
    const data = await this.makeRequest<{ artists: { items: any[], total: number } }>(
      `${this.baseUrl}/me/following?type=artist&limit=${limit}`
    );
    return data.artists;
  }
  
  private normalizeTrack = (spotifyTrack: SpotifyTrack): Track => {
    return {
      id: spotifyTrack.id,
      name: spotifyTrack.name,
      artist: spotifyTrack.artists[0]?.name || 'Unknown Artist',
      album: spotifyTrack.album.name,
      albumArt: spotifyTrack.album.images[0]?.url || '',
      durationMs: spotifyTrack.duration_ms,
      isrc: spotifyTrack.external_ids?.isrc,
      provider: 'spotify',
    };
  };
}