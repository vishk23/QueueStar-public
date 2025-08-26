'use client';

import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { User, AuthState, AuthAction, AuthContextType } from '@/types/auth';

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
      console.log('AuthContext: Checking existing session...');
      const response = await fetch('/api/user');
      console.log('AuthContext: Response status:', response.status);
      if (response.ok) {
        const data = await response.json();
        console.log('AuthContext: User data received:', data);
        dispatch({ type: 'AUTH_SUCCESS', payload: data.user });
      } else {
        console.log('AuthContext: No valid session, logging out');
        dispatch({ type: 'LOGOUT' });
      }
    } catch (error) {
      console.log('AuthContext: Session check error:', error);
      dispatch({ type: 'LOGOUT' });
    }
  };

  const login = async (email: string, password: string) => {
    try {
      dispatch({ type: 'AUTH_START' });
      
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        const data = await response.json();
        dispatch({ type: 'AUTH_SUCCESS', payload: data.user });
        return; // Success case, no error thrown
      } else {
        const errorData = await response.json();
        const errorMessage = errorData.error || 'Login failed';
        dispatch({ 
          type: 'AUTH_ERROR', 
          payload: errorMessage 
        });
        throw new Error(errorMessage); // Throw error for catch block in component
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      dispatch({ 
        type: 'AUTH_ERROR', 
        payload: errorMessage 
      });
      throw error; // Re-throw for component to handle
    }
  };

  const signup = async (email: string, displayName: string, password: string) => {
    try {
      dispatch({ type: 'AUTH_START' });
      
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, displayName, password }),
      });

      if (response.ok) {
        const data = await response.json();
        dispatch({ type: 'AUTH_SUCCESS', payload: data.user });
        return; // Success case, no error thrown
      } else {
        const errorData = await response.json();
        const errorMessage = errorData.error || 'Signup failed';
        dispatch({ 
          type: 'AUTH_ERROR', 
          payload: errorMessage 
        });
        throw new Error(errorMessage); // Throw error for catch block in component
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Signup failed';
      dispatch({ 
        type: 'AUTH_ERROR', 
        payload: errorMessage 
      });
      throw error; // Re-throw for component to handle
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
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
    signup,
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