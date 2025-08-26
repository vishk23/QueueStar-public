'use client';

import React, { createContext, useContext, useReducer, useCallback, ReactNode } from 'react';
import { ProviderConnection, ProvidersState, ProvidersAction, ProvidersContextType, ProviderType } from '@/types/providers';
import { useAuth } from './AuthContext';

const initialState: ProvidersState = {
  connections: [],
  loading: false,
  syncingProviders: new Set(),
  error: null,
};

const providersReducer = (state: ProvidersState, action: ProvidersAction): ProvidersState => {
  switch (action.type) {
    case 'FETCH_START':
      return { ...state, loading: true, error: null };
    case 'FETCH_SUCCESS':
      return { ...state, connections: action.payload, loading: false };
    case 'FETCH_ERROR':
      return { ...state, error: action.payload, loading: false };
    case 'SYNC_START':
      return {
        ...state,
        syncingProviders: new Set([...state.syncingProviders, action.payload]),
      };
    case 'SYNC_END':
      const newSyncing = new Set(state.syncingProviders);
      newSyncing.delete(action.payload);
      return { ...state, syncingProviders: newSyncing };
    case 'CONNECTION_UPDATED':
      return {
        ...state,
        connections: state.connections.map(conn =>
          conn.id === action.payload.id ? action.payload : conn
        ),
      };
    case 'CONNECTION_REMOVED':
      return {
        ...state,
        connections: state.connections.filter(conn => conn.id !== action.payload),
      };
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    default:
      return state;
  }
};

const ProvidersContext = createContext<ProvidersContextType | undefined>(undefined);

export const ProvidersProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(providersReducer, initialState);
  const { isAuthenticated } = useAuth();

  const fetchConnections = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      dispatch({ type: 'FETCH_START' });
      const response = await fetch('/api/user');
      if (response.ok) {
        const data = await response.json();
        dispatch({ type: 'FETCH_SUCCESS', payload: data.providerConnections });
      } else {
        throw new Error('Failed to fetch connections');
      }
    } catch (error) {
      dispatch({ 
        type: 'FETCH_ERROR', 
        payload: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  }, [isAuthenticated]);

  const syncTracks = useCallback(async (
    provider: ProviderType, 
    timeRange: string = 'medium_term'
  ) => {
    try {
      dispatch({ type: 'SYNC_START', payload: provider });
      
      const response = await fetch('/api/tracks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, timeRange }),
      });

      if (!response.ok) {
        throw new Error('Failed to sync tracks');
      }

      // Optionally refresh connections to show updated sync status
      await fetchConnections();
    } catch (error) {
      dispatch({ 
        type: 'FETCH_ERROR', 
        payload: error instanceof Error ? error.message : 'Sync failed' 
      });
    } finally {
      dispatch({ type: 'SYNC_END', payload: provider });
    }
  }, [fetchConnections]);

  const disconnectProvider = useCallback(async (connectionId: string) => {
    try {
      const response = await fetch(`/api/providers/${connectionId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        dispatch({ type: 'CONNECTION_REMOVED', payload: connectionId });
      } else {
        throw new Error('Failed to disconnect provider');
      }
    } catch (error) {
      dispatch({ 
        type: 'FETCH_ERROR', 
        payload: error instanceof Error ? error.message : 'Disconnect failed' 
      });
    }
  }, []);

  const clearError = useCallback(() => {
    dispatch({ type: 'CLEAR_ERROR' });
  }, []);

  // Auto-fetch connections when authenticated
  React.useEffect(() => {
    if (isAuthenticated) {
      fetchConnections();
    }
  }, [isAuthenticated, fetchConnections]);

  const value: ProvidersContextType = {
    ...state,
    fetchConnections,
    syncTracks,
    disconnectProvider,
    clearError,
  };

  return (
    <ProvidersContext.Provider value={value}>
      {children}
    </ProvidersContext.Provider>
  );
};

export const useProviders = (): ProvidersContextType => {
  const context = useContext(ProvidersContext);
  if (context === undefined) {
    throw new Error('useProviders must be used within a ProvidersProvider');
  }
  return context;
};