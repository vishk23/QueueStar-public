/**
 * @vitest-environment node
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { db } from '@/db';
import { users, providerConnections } from '@/db/schema';
import { encryptToken } from '@/lib/crypto';

// Mock Next.js request/response
const mockRequest = (options: {
  method?: string;
  cookies?: Record<string, string>;
  body?: any;
  url?: string;
}) => {
  const cookies = {
    get: (name: string) => ({ value: options.cookies?.[name] }),
  };
  
  return {
    method: options.method || 'GET',
    cookies,
    json: async () => options.body || {},
    url: options.url || 'http://localhost:3000/api/user',
  };
};

const mockResponse = () => {
  const cookies = {
    set: (name: string, value: string, options?: any) => ({}),
    delete: (name: string) => ({}),
  };
  
  return {
    cookies,
    json: (data: any) => ({ status: 200, json: data }),
    status: (code: number) => ({ json: (data: any) => ({ status: code, json: data }) }),
  };
};

describe('/api/user', () => {
  let testUserId: string;

  beforeEach(async () => {
    // Clean up any existing test data
    await db.delete(providerConnections);
    await db.delete(users);

    // Create test user
    const [user] = await db.insert(users).values({
      email: 'test@example.com',
      displayName: 'Test User',
      avatarUrl: 'https://example.com/avatar.jpg',
    }).returning();

    testUserId = user.id;
  });

  afterEach(async () => {
    // Clean up test data
    await db.delete(providerConnections);
    await db.delete(users);
  });

  it('should return 401 when not authenticated', async () => {
    const { GET } = await import('@/app/api/user/route');
    
    const req = mockRequest({});
    const res = mockResponse();
    
    const result = await GET(req as any);
    expect(result.status).toBe(401);
  });

  it('should return user data when authenticated', async () => {
    // Add provider connection
    await db.insert(providerConnections).values({
      userId: testUserId,
      provider: 'spotify',
      providerUserId: 'spotify123',
      accessTokenEncrypted: encryptToken('access_token'),
      refreshTokenEncrypted: encryptToken('refresh_token'),
      tokenExpiresAt: new Date(Date.now() + 3600000),
    });

    const { GET } = await import('@/app/api/user/route');
    
    const req = mockRequest({
      cookies: { user_session: testUserId },
    });
    
    const result = await GET(req as any);
    expect(result.status).toBe(200);
    
    const data = await result.json();
    expect(data.user.email).toBe('test@example.com');
    expect(data.user.displayName).toBe('Test User');
    expect(data.providerConnections).toHaveLength(1);
    expect(data.providerConnections[0].provider).toBe('spotify');
  });

  it('should update user profile', async () => {
    const { PUT } = await import('@/app/api/user/route');
    
    const req = mockRequest({
      cookies: { user_session: testUserId },
      body: {
        displayName: 'Updated Name',
        avatarUrl: 'https://example.com/new-avatar.jpg',
      },
    });
    
    const result = await PUT(req as any);
    expect(result.status).toBe(200);
    
    const data = await result.json();
    expect(data.user.displayName).toBe('Updated Name');
    expect(data.user.avatarUrl).toBe('https://example.com/new-avatar.jpg');
  });

  it('should delete user account', async () => {
    const { DELETE } = await import('@/app/api/user/route');
    
    const req = mockRequest({
      cookies: { user_session: testUserId },
    });
    
    const result = await DELETE(req as any);
    expect(result.status).toBe(200);
    
    // Verify user is deleted
    const deletedUser = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.id, testUserId),
    });
    expect(deletedUser).toBeUndefined();
  });
});