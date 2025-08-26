// Provider types
export type ProviderType = 'spotify' | 'apple';

export interface ProviderConnection {
  id: string;
  provider: ProviderType;
  providerUserId: string;
  tokenExpiresAt: string | null;
  isExpired: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProvidersState {
  connections: ProviderConnection[];
  loading: boolean;
  syncingProviders: Set<string>;
  error: string | null;
}

export type ProvidersAction =
  | { type: 'FETCH_START' }
  | { type: 'FETCH_SUCCESS'; payload: ProviderConnection[] }
  | { type: 'FETCH_ERROR'; payload: string }
  | { type: 'SYNC_START'; payload: string }
  | { type: 'SYNC_END'; payload: string }
  | { type: 'CONNECTION_UPDATED'; payload: ProviderConnection }
  | { type: 'CONNECTION_REMOVED'; payload: string }
  | { type: 'CLEAR_ERROR' };

export interface ProvidersContextType extends ProvidersState {
  fetchConnections: () => Promise<void>;
  syncTracks: (provider: ProviderType, timeRange?: string) => Promise<void>;
  disconnectProvider: (connectionId: string) => Promise<void>;
  clearError: () => void;
}