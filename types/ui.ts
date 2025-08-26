// UI types
export type Theme = 'light' | 'dark' | 'auto';
export type ToastType = 'success' | 'error' | 'warning' | 'info';
export type ButtonVariant = 'primary' | 'secondary' | 'accent' | 'ghost' | 'outline';
export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

export interface UIState {
  theme: Theme;
  toasts: Toast[];
  sidebarOpen: boolean;
  loading: boolean;
}

export type UIAction =
  | { type: 'SET_THEME'; payload: Theme }
  | { type: 'ADD_TOAST'; payload: Omit<Toast, 'id'> }
  | { type: 'REMOVE_TOAST'; payload: string }
  | { type: 'TOGGLE_SIDEBAR' }
  | { type: 'SET_LOADING'; payload: boolean };

export interface UIContextType extends UIState {
  setTheme: (theme: Theme) => void;
  showToast: (toast: Omit<Toast, 'id'>) => void;
  hideToast: (id: string) => void;
  toggleSidebar: () => void;
  setLoading: (loading: boolean) => void;
}