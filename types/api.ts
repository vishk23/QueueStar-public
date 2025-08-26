// API types
export interface ApiResponse<T = any> {
  success?: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface ApiError {
  error: string;
  status?: number;
  details?: any;
}

// User API responses
export interface UserResponse {
  user: {
    id: string;
    email: string;
    displayName: string;
    avatarUrl?: string;
    createdAt: string;
    updatedAt?: string;
  };
  providerConnections: Array<{
    id: string;
    provider: 'spotify' | 'apple';
    providerUserId: string;
    tokenExpiresAt: string | null;
    isExpired: boolean;
    createdAt: string;
    updatedAt: string;
  }>;
}

// Blend API responses
export interface BlendListResponse {
  blends: Array<{
    id: string;
    name: string;
    shareCode: string;
    algorithm: string;
    trackCount: number;
    timeRange: string;
    status: string;
    createdAt: string;
    participants: Array<{
      id: string;
      displayName: string;
      avatarUrl?: string;
      joinedAt: string;
    }>;
  }>;
}

export interface BlendCreateResponse {
  blend: {
    id: string;
    name: string;
    shareCode: string;
    algorithm: string;
    trackCount: number;
    timeRange: string;
    status: string;
    createdAt: string;
  };
}

// Tracks API responses
export interface TracksResponse {
  tracks: Record<string, Array<{
    id: string;
    name: string;
    artist: string;
    album: string;
    albumArt?: string;
    durationMs: number;
    isrc?: string;
    rank: number;
    provider: string;
    fetchedAt: string;
  }>>;
  timeRange: string;
  totalConnections: number;
}