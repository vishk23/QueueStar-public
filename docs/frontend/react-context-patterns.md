# React Context Patterns for Blendify

## Context Architecture Overview

Our app will use multiple contexts for different concerns:
- **AuthContext**: User authentication and session management
- **ProvidersContext**: Music provider connections (Spotify/Apple)
- **BlendContext**: Blend creation and management
- **UIContext**: Global UI state (theme, notifications)

## Authentication Context Pattern

### AuthContext Definition

```typescript
// contexts/AuthContext.tsx
import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';

// Types
interface User {
  id: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  createdAt: string;
}

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
}

type AuthAction = 
  | { type: 'AUTH_START' }
  | { type: 'AUTH_SUCCESS'; payload: User }
  | { type: 'AUTH_ERROR'; payload: string }
  | { type: 'LOGOUT' }
  | { type: 'CLEAR_ERROR' };

interface AuthContextType extends AuthState {
  login: (provider: 'spotify' | 'apple') => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  clearError: () => void;
}

// Initial state
const initialState: AuthState = {
  user: null,
  loading: true, // Start with loading true to check existing session
  error: null,
  isAuthenticated: false,
};

// Reducer
const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'AUTH_START':
      return {
        ...state,
        loading: true,
        error: null,
      };
    case 'AUTH_SUCCESS':
      return {
        ...state,
        user: action.payload,
        loading: false,
        error: null,
        isAuthenticated: true,
      };
    case 'AUTH_ERROR':
      return {
        ...state,
        user: null,
        loading: false,
        error: action.payload,
        isAuthenticated: false,
      };
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        loading: false,
        error: null,
        isAuthenticated: false,
      };
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
      };
    default:
      return state;
  }
};

// Context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider Component
interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Check for existing session on mount
  useEffect(() => {
    checkExistingSession();
  }, []);

  const checkExistingSession = async () => {
    try {
      const response = await fetch('/api/user');
      if (response.ok) {
        const data = await response.json();
        dispatch({ type: 'AUTH_SUCCESS', payload: data.user });
      } else {
        dispatch({ type: 'LOGOUT' });
      }
    } catch (error) {
      dispatch({ type: 'LOGOUT' });
    }
  };

  const login = async (provider: 'spotify' | 'apple') => {
    try {
      dispatch({ type: 'AUTH_START' });
      
      // Redirect to OAuth
      window.location.href = `/api/auth/${provider}`;
    } catch (error) {
      dispatch({ 
        type: 'AUTH_ERROR', 
        payload: error instanceof Error ? error.message : 'Login failed' 
      });
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/user/logout', { method: 'POST' });
      dispatch({ type: 'LOGOUT' });
    } catch (error) {
      // Even if logout fails, clear local state
      dispatch({ type: 'LOGOUT' });
    }
  };

  const refreshUser = async () => {
    try {
      const response = await fetch('/api/user');
      if (response.ok) {
        const data = await response.json();
        dispatch({ type: 'AUTH_SUCCESS', payload: data.user });
      }
    } catch (error) {
      dispatch({ 
        type: 'AUTH_ERROR', 
        payload: 'Failed to refresh user data' 
      });
    }
  };

  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  const value: AuthContextType = {
    ...state,
    login,
    logout,
    refreshUser,
    clearError,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
```

## Provider Connections Context

```typescript
// contexts/ProvidersContext.tsx
import React, { createContext, useContext, useReducer, useCallback, ReactNode } from 'react';
import { useAuth } from './AuthContext';

// Types
interface ProviderConnection {
  id: string;
  provider: 'spotify' | 'apple';
  providerUserId: string;
  tokenExpiresAt: string | null;
  isExpired: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ProvidersState {
  connections: ProviderConnection[];
  loading: boolean;
  syncingProviders: Set<string>;
  error: string | null;
}

type ProvidersAction =
  | { type: 'FETCH_START' }
  | { type: 'FETCH_SUCCESS'; payload: ProviderConnection[] }
  | { type: 'FETCH_ERROR'; payload: string }
  | { type: 'SYNC_START'; payload: string }
  | { type: 'SYNC_END'; payload: string }
  | { type: 'CONNECTION_UPDATED'; payload: ProviderConnection }
  | { type: 'CONNECTION_REMOVED'; payload: string }
  | { type: 'CLEAR_ERROR' };

interface ProvidersContextType extends ProvidersState {
  fetchConnections: () => Promise<void>;
  syncTracks: (provider: 'spotify' | 'apple', timeRange?: string) => Promise<void>;
  disconnectProvider: (connectionId: string) => Promise<void>;
  clearError: () => void;
}

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
    provider: 'spotify' | 'apple', 
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
```

## Blend Context for Form State

```typescript
// contexts/BlendContext.tsx
import React, { createContext, useContext, useReducer, ReactNode } from 'react';

interface BlendFormData {
  name: string;
  friendId: string | null;
  algorithm: 'interleave' | 'weighted' | 'discovery';
  trackCount: number;
  timeRange: 'short_term' | 'medium_term' | 'long_term';
}

interface BlendState extends BlendFormData {
  errors: Record<string, string>;
  loading: boolean;
  currentStep: number;
  totalSteps: number;
}

type BlendAction =
  | { type: 'UPDATE_FIELD'; field: keyof BlendFormData; value: any }
  | { type: 'SET_ERROR'; field: string; message: string }
  | { type: 'CLEAR_ERROR'; field: string }
  | { type: 'SET_LOADING'; loading: boolean }
  | { type: 'NEXT_STEP' }
  | { type: 'PREV_STEP' }
  | { type: 'RESET_FORM' };

interface BlendContextType extends BlendState {
  updateField: (field: keyof BlendFormData, value: any) => void;
  setError: (field: string, message: string) => void;
  clearError: (field: string) => void;
  nextStep: () => void;
  prevStep: () => void;
  resetForm: () => void;
  createBlend: () => Promise<boolean>;
  isValid: boolean;
}

const initialState: BlendState = {
  name: '',
  friendId: null,
  algorithm: 'interleave',
  trackCount: 50,
  timeRange: 'medium_term',
  errors: {},
  loading: false,
  currentStep: 1,
  totalSteps: 3,
};

const blendReducer = (state: BlendState, action: BlendAction): BlendState => {
  switch (action.type) {
    case 'UPDATE_FIELD':
      return {
        ...state,
        [action.field]: action.value,
        errors: { ...state.errors, [action.field]: '' }, // Clear error when field updated
      };
    case 'SET_ERROR':
      return {
        ...state,
        errors: { ...state.errors, [action.field]: action.message },
      };
    case 'CLEAR_ERROR':
      const { [action.field]: _, ...restErrors } = state.errors;
      return { ...state, errors: restErrors };
    case 'SET_LOADING':
      return { ...state, loading: action.loading };
    case 'NEXT_STEP':
      return {
        ...state,
        currentStep: Math.min(state.currentStep + 1, state.totalSteps),
      };
    case 'PREV_STEP':
      return {
        ...state,
        currentStep: Math.max(state.currentStep - 1, 1),
      };
    case 'RESET_FORM':
      return { ...initialState };
    default:
      return state;
  }
};

const BlendContext = createContext<BlendContextType | undefined>(undefined);

export const BlendProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(blendReducer, initialState);

  const updateField = (field: keyof BlendFormData, value: any) => {
    dispatch({ type: 'UPDATE_FIELD', field, value });
  };

  const setError = (field: string, message: string) => {
    dispatch({ type: 'SET_ERROR', field, message });
  };

  const clearError = (field: string) => {
    dispatch({ type: 'CLEAR_ERROR', field });
  };

  const nextStep = () => dispatch({ type: 'NEXT_STEP' });
  const prevStep = () => dispatch({ type: 'PREV_STEP' });
  const resetForm = () => dispatch({ type: 'RESET_FORM' });

  const createBlend = async (): Promise<boolean> => {
    try {
      dispatch({ type: 'SET_LOADING', loading: true });

      // Validate form
      const validationErrors: Record<string, string> = {};
      
      if (!state.name.trim()) {
        validationErrors.name = 'Blend name is required';
      }
      if (!state.friendId) {
        validationErrors.friendId = 'Please select a friend';
      }

      if (Object.keys(validationErrors).length > 0) {
        Object.entries(validationErrors).forEach(([field, message]) => {
          dispatch({ type: 'SET_ERROR', field, message });
        });
        return false;
      }

      // Create blend
      const response = await fetch('/api/blend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: state.name,
          friendId: state.friendId,
          algorithm: state.algorithm,
          trackCount: state.trackCount,
          timeRange: state.timeRange,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create blend');
      }

      const data = await response.json();
      resetForm();
      return true;
    } catch (error) {
      setError('general', error instanceof Error ? error.message : 'Failed to create blend');
      return false;
    } finally {
      dispatch({ type: 'SET_LOADING', loading: false });
    }
  };

  // Computed property for form validation
  const isValid = state.name.trim() !== '' && 
                  state.friendId !== null && 
                  Object.keys(state.errors).length === 0;

  const value: BlendContextType = {
    ...state,
    updateField,
    setError,
    clearError,
    nextStep,
    prevStep,
    resetForm,
    createBlend,
    isValid,
  };

  return (
    <BlendContext.Provider value={value}>
      {children}
    </BlendContext.Provider>
  );
};

export const useBlend = (): BlendContextType => {
  const context = useContext(BlendContext);
  if (context === undefined) {
    throw new Error('useBlend must be used within a BlendProvider');
  }
  return context;
};
```

## UI Context for Global State

```typescript
// contexts/UIContext.tsx
import React, { createContext, useContext, useReducer, ReactNode } from 'react';

interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
}

interface UIState {
  theme: 'light' | 'dark' | 'auto';
  toasts: Toast[];
  sidebarOpen: boolean;
  loading: boolean;
}

type UIAction =
  | { type: 'SET_THEME'; payload: UIState['theme'] }
  | { type: 'ADD_TOAST'; payload: Omit<Toast, 'id'> }
  | { type: 'REMOVE_TOAST'; payload: string }
  | { type: 'TOGGLE_SIDEBAR' }
  | { type: 'SET_LOADING'; payload: boolean };

interface UIContextType extends UIState {
  setTheme: (theme: UIState['theme']) => void;
  showToast: (toast: Omit<Toast, 'id'>) => void;
  hideToast: (id: string) => void;
  toggleSidebar: () => void;
  setLoading: (loading: boolean) => void;
}

const initialState: UIState = {
  theme: 'light',
  toasts: [],
  sidebarOpen: false,
  loading: false,
};

const uiReducer = (state: UIState, action: UIAction): UIState => {
  switch (action.type) {
    case 'SET_THEME':
      return { ...state, theme: action.payload };
    case 'ADD_TOAST':
      const newToast: Toast = {
        ...action.payload,
        id: Date.now().toString(),
        duration: action.payload.duration || 5000,
      };
      return { ...state, toasts: [...state.toasts, newToast] };
    case 'REMOVE_TOAST':
      return {
        ...state,
        toasts: state.toasts.filter(toast => toast.id !== action.payload),
      };
    case 'TOGGLE_SIDEBAR':
      return { ...state, sidebarOpen: !state.sidebarOpen };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    default:
      return state;
  }
};

const UIContext = createContext<UIContextType | undefined>(undefined);

export const UIProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(uiReducer, initialState);

  // Apply theme to document
  React.useEffect(() => {
    if (state.theme === 'auto') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const actualTheme = mediaQuery.matches ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', actualTheme);
    } else {
      document.documentElement.setAttribute('data-theme', state.theme);
    }
  }, [state.theme]);

  // Auto-remove toasts
  React.useEffect(() => {
    state.toasts.forEach(toast => {
      if (toast.duration && toast.duration > 0) {
        const timer = setTimeout(() => {
          dispatch({ type: 'REMOVE_TOAST', payload: toast.id });
        }, toast.duration);

        return () => clearTimeout(timer);
      }
    });
  }, [state.toasts]);

  const setTheme = (theme: UIState['theme']) => {
    dispatch({ type: 'SET_THEME', payload: theme });
    localStorage.setItem('blendify-theme', theme);
  };

  const showToast = (toast: Omit<Toast, 'id'>) => {
    dispatch({ type: 'ADD_TOAST', payload: toast });
  };

  const hideToast = (id: string) => {
    dispatch({ type: 'REMOVE_TOAST', payload: id });
  };

  const toggleSidebar = () => {
    dispatch({ type: 'TOGGLE_SIDEBAR' });
  };

  const setLoading = (loading: boolean) => {
    dispatch({ type: 'SET_LOADING', payload: loading });
  };

  const value: UIContextType = {
    ...state,
    setTheme,
    showToast,
    hideToast,
    toggleSidebar,
    setLoading,
  };

  return (
    <UIContext.Provider value={value}>
      {children}
    </UIContext.Provider>
  );
};

export const useUI = (): UIContextType => {
  const context = useContext(UIContext);
  if (context === undefined) {
    throw new Error('useUI must be used within a UIProvider');
  }
  return context;
};
```

## Context Composition Pattern

```typescript
// contexts/index.tsx - Compose all providers
import React, { ReactNode } from 'react';
import { AuthProvider } from './AuthContext';
import { ProvidersProvider } from './ProvidersContext';
import { UIProvider } from './UIContext';

interface AppProvidersProps {
  children: ReactNode;
}

export const AppProviders: React.FC<AppProvidersProps> = ({ children }) => {
  return (
    <UIProvider>
      <AuthProvider>
        <ProvidersProvider>
          {children}
        </ProvidersProvider>
      </AuthProvider>
    </UIProvider>
  );
};

// Usage in app/layout.tsx
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AppProviders>
          {children}
        </AppProviders>
      </body>
    </html>
  );
}
```

## Context Testing Patterns

```typescript
// utils/test-utils.tsx
import React, { ReactNode } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { AppProviders } from '@/contexts';

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  initialState?: any;
}

const customRender = (
  ui: React.ReactElement,
  options?: CustomRenderOptions
) => {
  const Wrapper: React.FC<{ children: ReactNode }> = ({ children }) => (
    <AppProviders>{children}</AppProviders>
  );

  return render(ui, { wrapper: Wrapper, ...options });
};

export * from '@testing-library/react';
export { customRender as render };

// Test example
import { render, screen } from '@/utils/test-utils';
import { useAuth } from '@/contexts/AuthContext';

const TestComponent = () => {
  const { user, isAuthenticated } = useAuth();
  return <div>{isAuthenticated ? 'Logged in' : 'Not logged in'}</div>;
};

test('renders login state correctly', () => {
  render(<TestComponent />);
  expect(screen.getByText('Not logged in')).toBeInTheDocument();
});
```

## Performance Optimization

### Context Splitting
```typescript
// Split contexts by update frequency to prevent unnecessary re-renders
// Fast-changing: UI state, form state
// Slow-changing: Auth state, provider connections

// Use React.memo to prevent unnecessary re-renders
const ExpensiveComponent = React.memo(() => {
  const { user } = useAuth(); // Only re-renders when user changes
  return <div>{user?.displayName}</div>;
});

// Use multiple contexts instead of one large context
const AuthProvider = ({ children }) => {
  // Auth-specific state
};

const UIProvider = ({ children }) => {
  // UI-specific state (updated frequently)
};
```

### Selective Context Updates
```typescript
// Use multiple providers for different update patterns
const UserProvider = ({ children }) => {
  // User data that rarely changes
};

const UserStatusProvider = ({ children }) => {
  // User status that changes frequently
};
```