import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'tests/',
        '.next/',
        'db/migrations/',
        '**/*.d.ts',
        '**/*.config.*',
      ],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80,
        },
      },
    },
    // Mock environment variables for tests
    env: {
      DATABASE_URL: 'postgresql://postgres:postgres@localhost:5432/blendify_dev',
      ENCRYPTION_KEY: '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
      SPOTIFY_CLIENT_ID: 'test_spotify_client_id',
      SPOTIFY_CLIENT_SECRET: 'test_spotify_client_secret',
      APPLE_TEAM_ID: 'test_team_id',
      APPLE_KEY_ID: 'test_key_id',
      APPLE_PRIVATE_KEY: `-----BEGIN PRIVATE KEY-----
MIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQg4f4yI2iJE8kVYY4W
-----END PRIVATE KEY-----`,
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
});