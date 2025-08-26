export interface Track {
  id: string;
  name: string;
  artist: string;
  album: string;
  albumArt: string;
  durationMs: number;
  isrc?: string;
  provider: 'spotify' | 'apple';
}

export interface Playlist {
  id: string;
  name: string;
  description?: string;
  trackCount: number;
  url: string;
}

export interface UserProfile {
  id: string;
  displayName: string;
  email?: string;
  avatarUrl?: string;
  subscriptionType?: string;
}

export interface MusicProvider {
  readonly providerName: 'spotify' | 'apple';
  
  // Authentication
  isAuthenticated(): boolean;
  refreshToken?(): Promise<void>;
  
  // User data
  getUserProfile(): Promise<UserProfile>;
  getTopTracks(timeRange: 'short' | 'medium' | 'long', limit?: number): Promise<Track[]>;
  
  // Playlist operations
  createPlaylist(name: string, description?: string, isPublic?: boolean): Promise<Playlist>;
  addTracksToPlaylist(playlistId: string, trackIds: string[]): Promise<void>;
  
  // Search
  searchTrack(query: string): Promise<Track | null>;
  searchTrackByISRC(isrc: string): Promise<Track | null>;
}

export abstract class BaseProvider implements MusicProvider {
  protected accessToken: string;
  abstract readonly providerName: 'spotify' | 'apple';
  
  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }
  
  isAuthenticated(): boolean {
    return !!this.accessToken;
  }
  
  protected async makeRequest<T>(
    url: string,
    options: RequestInit = {}
  ): Promise<T> {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
    
    if (!response.ok) {
      await this.handleError(response);
    }
    
    return response.json();
  }
  
  protected abstract handleError(response: Response): Promise<never>;
  
  // Abstract methods to be implemented by providers
  abstract getUserProfile(): Promise<UserProfile>;
  abstract getTopTracks(timeRange: 'short' | 'medium' | 'long', limit?: number): Promise<Track[]>;
  abstract createPlaylist(name: string, description?: string, isPublic?: boolean): Promise<Playlist>;
  abstract addTracksToPlaylist(playlistId: string, trackIds: string[]): Promise<void>;
  abstract searchTrack(query: string): Promise<Track | null>;
  abstract searchTrackByISRC(isrc: string): Promise<Track | null>;
}