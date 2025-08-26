import React from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { vi } from 'vitest';

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

// Simple render function without context providers
const simpleRender = (
  ui: React.ReactElement,
  options?: RenderOptions
) => {
  return render(ui, options);
};

// Export everything from testing-library/react
export * from '@testing-library/react';
export { simpleRender as render };