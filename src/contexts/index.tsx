'use client';

import React, { ReactNode } from 'react';
import { UIProvider } from './UIContext';

interface AppProvidersProps {
  children: ReactNode;
}

export const AppProviders: React.FC<AppProvidersProps> = ({ children }) => {
  return (
    <UIProvider>
      {children}
    </UIProvider>
  );
};

// Export individual contexts for testing
export { AuthProvider, useAuth } from './AuthContext';
export { ProvidersProvider, useProviders } from './ProvidersContext';
export { UIProvider, useUI } from './UIContext';