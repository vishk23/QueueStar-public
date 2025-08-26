# Testing Strategy

## Overview
Minimal but effective testing focused on critical paths and integration points.

## Testing Matrix

| Component | Unit Tests | Integration Tests | E2E Tests | Priority |
|-----------|------------|------------------|-----------|----------|
| OAuth Flow | ✓ | ✓ | ✓ | Critical |
| Token Encryption | ✓ | - | - | Critical |
| Token Refresh | ✓ | ✓ | - | Critical |
| Provider Abstraction | ✓ | ✓ | - | High |
| Blend Algorithm | ✓ | - | - | High |
| API Routes | - | ✓ | - | High |
| Database Operations | ✓ | ✓ | - | Medium |
| UI Components | ✓ | - | - | Low |
| Share Flow | - | - | ✓ | Medium |
| Export to Provider | - | ✓ | ✓ | High |

## Unit Tests (Vitest)

### Critical Unit Tests

```typescript
// tests/unit/crypto.test.ts
describe('Token Encryption', () => {
  it('should encrypt and decrypt tokens correctly', () => {
    const token = 'test_token_12345';
    const encrypted = encryptToken(token);
    const decrypted = decryptToken(encrypted);
    expect(decrypted).toBe(token);
  });

  it('should fail with tampered tokens', () => {
    const token = 'test_token';
    const encrypted = encryptToken(token);
    const tampered = encrypted.slice(0, -2) + 'XX';
    expect(() => decryptToken(tampered)).toThrow();
  });
});

// tests/unit/blend-algorithm.test.ts
describe('Blend Algorithm', () => {
  it('should interleave tracks from two users equally', () => {
    const user1Tracks = [
      { id: '1', name: 'Track 1' },
      { id: '2', name: 'Track 2' },
    ];
    const user2Tracks = [
      { id: '3', name: 'Track 3' },
      { id: '4', name: 'Track 4' },
    ];
    
    const blended = blendTracks(user1Tracks, user2Tracks);
    expect(blended).toHaveLength(4);
    expect(blended[0].id).toBe('1');
    expect(blended[1].id).toBe('3');
  });

  it('should handle uneven track counts', () => {
    const user1Tracks = [{ id: '1' }, { id: '2' }, { id: '3' }];
    const user2Tracks = [{ id: '4' }];
    
    const blended = blendTracks(user1Tracks, user2Tracks);
    expect(blended).toHaveLength(4);
    expect(blended[blended.length - 1].id).toBe('3');
  });
});

// tests/unit/providers/spotify.test.ts
describe('Spotify Provider', () => {
  it('should normalize Spotify track format', () => {
    const spotifyTrack = {
      id: 'spotify123',
      name: 'Test Song',
      artists: [{ name: 'Test Artist' }],
      album: { name: 'Test Album', images: [{ url: 'image.jpg' }] },
      duration_ms: 180000,
      external_ids: { isrc: 'USRC12345' },
    };
    
    const provider = new SpotifyProvider('token');
    const normalized = provider.normalizeTrack(spotifyTrack);
    
    expect(normalized).toEqual({
      id: 'spotify123',
      name: 'Test Song',
      artist: 'Test Artist',
      album: 'Test Album',
      albumArt: 'image.jpg',
      durationMs: 180000,
      isrc: 'USRC12345',
      provider: 'spotify',
    });
  });
});
```

## Integration Tests

### API Route Tests

```typescript
// tests/integration/api/auth.test.ts
describe('OAuth API Routes', () => {
  it('should initiate Spotify OAuth flow', async () => {
    const response = await fetch('/api/auth/spotify');
    expect(response.status).toBe(302);
    
    const location = response.headers.get('location');
    expect(location).toContain('accounts.spotify.com');
    expect(location).toContain('code_challenge');
  });

  it('should handle OAuth callback', async () => {
    const mockCode = 'test_auth_code';
    const response = await fetch(`/api/auth/spotify/callback?code=${mockCode}`);
    
    // Should redirect to dashboard on success
    expect(response.status).toBe(302);
    expect(response.headers.get('location')).toBe('/dashboard');
  });

  it('should reject invalid OAuth state', async () => {
    const response = await fetch('/api/auth/spotify/callback?code=test&state=invalid');
    expect(response.status).toBe(400);
  });
});

// tests/integration/api/blend.test.ts
describe('Blend API', () => {
  it('should create a new blend', async () => {
    const response = await fetch('/api/blend', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test Blend',
        friendId: 'user123',
      }),
    });
    
    expect(response.status).toBe(201);
    const blend = await response.json();
    expect(blend.shareCode).toBeDefined();
  });

  it('should fetch blend details', async () => {
    const blendId = 'test-blend-id';
    const response = await fetch(`/api/blend/${blendId}`);
    
    expect(response.status).toBe(200);
    const blend = await response.json();
    expect(blend.tracks).toBeDefined();
  });
});
```

### Database Integration Tests

```typescript
// tests/integration/db/user-operations.test.ts
describe('User Database Operations', () => {
  beforeEach(async () => {
    await db.delete(users);
  });

  it('should create user with provider connection', async () => {
    const userId = await db.transaction(async (tx) => {
      const [user] = await tx.insert(users).values({
        email: 'test@example.com',
        displayName: 'Test User',
      }).returning();
      
      await tx.insert(providerConnections).values({
        userId: user.id,
        provider: 'spotify',
        providerUserId: 'spotify123',
        accessTokenEncrypted: encryptToken('access_token'),
        refreshTokenEncrypted: encryptToken('refresh_token'),
      });
      
      return user.id;
    });
    
    const userWithConnection = await db.query.users.findFirst({
      where: eq(users.id, userId),
      with: { providerConnections: true },
    });
    
    expect(userWithConnection?.providerConnections).toHaveLength(1);
  });
});
```

## E2E Tests (Playwright)

### Critical User Flows

```typescript
// tests/e2e/auth-flow.spec.ts
test.describe('Authentication Flow', () => {
  test('should complete Spotify login', async ({ page }) => {
    await page.goto('/');
    await page.click('text=Connect Spotify');
    
    // Handle Spotify login page
    await page.waitForURL(/accounts.spotify.com/);
    await page.fill('input[name="username"]', process.env.TEST_SPOTIFY_EMAIL);
    await page.fill('input[name="password"]', process.env.TEST_SPOTIFY_PASSWORD);
    await page.click('button[type="submit"]');
    
    // Handle consent if needed
    if (await page.isVisible('text=Agree')) {
      await page.click('text=Agree');
    }
    
    // Should redirect back to app
    await page.waitForURL('/dashboard');
    await expect(page.locator('text=Connected to Spotify')).toBeVisible();
  });
});

// tests/e2e/blend-creation.spec.ts
test.describe('Blend Creation', () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await loginTestUser(page);
  });

  test('should create blend with friend', async ({ page }) => {
    await page.goto('/dashboard');
    await page.click('text=Create Blend');
    
    // Select friend
    await page.fill('input[placeholder="Search friends"]', 'Test Friend');
    await page.click('text=Test Friend');
    
    // Configure blend
    await page.fill('input[name="blendName"]', 'E2E Test Blend');
    await page.click('text=Create Blend');
    
    // Should show results
    await page.waitForURL(/\/blend\//);
    await expect(page.locator('h1:has-text("E2E Test Blend")')).toBeVisible();
    await expect(page.locator('.track-list')).toBeVisible();
  });
});

// tests/e2e/share-flow.spec.ts
test.describe('Share Flow', () => {
  test('should access public blend via share link', async ({ page }) => {
    const shareCode = 'TEST123';
    await page.goto(`/share/${shareCode}`);
    
    // Should show blend without auth
    await expect(page.locator('text=Shared Blend')).toBeVisible();
    await expect(page.locator('.track-list')).toBeVisible();
    
    // Should show CTA for non-authenticated users
    await expect(page.locator('text=Create Your Own Blend')).toBeVisible();
  });
});
```

## Test Configuration

### Vitest Config

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './tests/setup.ts',
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'tests/', '.next/'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
});
```

### Playwright Config

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

## CI/CD Integration

```yaml
# .github/workflows/test.yml
name: Tests

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  unit-integration:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'npm'
      
      - run: npm ci
      - run: npm run test:unit
      - run: npm run test:integration
      
      - uses: codecov/codecov-action@v3
        with:
          files: ./coverage/coverage-final.json

  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'npm'
      
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run test:e2e
      
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 30
```

## Test Data Management

```typescript
// tests/fixtures/test-data.ts
export const testUsers = {
  primary: {
    email: 'test1@example.com',
    displayName: 'Test User 1',
    spotifyId: 'spotify_test_1',
  },
  secondary: {
    email: 'test2@example.com',
    displayName: 'Test User 2',
    appleId: 'apple_test_1',
  },
};

export const testTracks = [
  {
    id: 'track1',
    name: 'Test Track 1',
    artist: 'Test Artist 1',
    album: 'Test Album 1',
    durationMs: 180000,
    isrc: 'TEST0000001',
  },
  // ... more test tracks
];

// tests/helpers/db-seed.ts
export async function seedTestDatabase() {
  await db.transaction(async (tx) => {
    // Clear existing data
    await tx.delete(blendTracks);
    await tx.delete(blendParticipants);
    await tx.delete(blends);
    await tx.delete(userTopTracks);
    await tx.delete(providerConnections);
    await tx.delete(users);
    
    // Insert test data
    const [user1] = await tx.insert(users).values(testUsers.primary).returning();
    const [user2] = await tx.insert(users).values(testUsers.secondary).returning();
    
    // Add provider connections
    await tx.insert(providerConnections).values([
      {
        userId: user1.id,
        provider: 'spotify',
        providerUserId: testUsers.primary.spotifyId,
        accessTokenEncrypted: encryptToken('test_access_token'),
        refreshTokenEncrypted: encryptToken('test_refresh_token'),
      },
      {
        userId: user2.id,
        provider: 'apple',
        providerUserId: testUsers.secondary.appleId,
        accessTokenEncrypted: encryptToken('test_apple_token'),
      },
    ]);
  });
}
```

## Monitoring & Metrics

- **Coverage Goal**: 80% for critical paths
- **Performance Budget**: E2E tests < 30s per flow
- **Flaky Test Policy**: Fix or remove within 2 sprints
- **Test Execution**: All tests on PR, E2E on merge to main