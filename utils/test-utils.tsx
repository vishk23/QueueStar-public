import React, { ReactNode } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { vi } from 'vitest';
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

// Mock next/navigation for testing
export const mockRouter = {
  push: vi.fn(),
  replace: vi.fn(),
  prefetch: vi.fn(),
  back: vi.fn(),
  forward: vi.fn(),
  refresh: vi.fn(),
};

export const mockUseRouter = () => mockRouter;

export const mockUsePathname = () => '/test-path';
export const mockUseSearchParams = () => new URLSearchParams();

// Export everything from testing-library/react
export * from '@testing-library/react';
export { customRender as render };