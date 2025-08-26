'use client';

import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { UIState, UIAction, UIContextType, Toast, Theme } from '@/types/ui';

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
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('blendify-theme') as Theme;
      if (savedTheme) {
        dispatch({ type: 'SET_THEME', payload: savedTheme });
      }
    }
  }, []);

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      if (state.theme === 'auto') {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const actualTheme = mediaQuery.matches ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', actualTheme);
      } else {
        document.documentElement.setAttribute('data-theme', state.theme);
      }
    }
  }, [state.theme]);

  // Auto-remove toasts
  React.useEffect(() => {
    const timers: NodeJS.Timeout[] = [];
    
    state.toasts.forEach(toast => {
      if (toast.duration && toast.duration > 0) {
        const timer = setTimeout(() => {
          dispatch({ type: 'REMOVE_TOAST', payload: toast.id });
        }, toast.duration);
        timers.push(timer);
      }
    });

    return () => {
      timers.forEach(timer => clearTimeout(timer));
    };
  }, [state.toasts]);

  const setTheme = (theme: Theme) => {
    dispatch({ type: 'SET_THEME', payload: theme });
    if (typeof window !== 'undefined') {
      localStorage.setItem('blendify-theme', theme);
    }
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