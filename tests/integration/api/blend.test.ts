/**
 * @vitest-environment node
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { db } from '@/db';
import { users, blends, blendParticipants } from '@/db/schema';

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
    url: options.url || 'http://localhost:3000/api/blend',
  };
};

describe('/api/blend', () => {
  let testUser1Id: string;
  let testUser2Id: string;

  beforeEach(async () => {
    // Clean up any existing test data
    await db.delete(blendParticipants);
    await db.delete(blends);
    await db.delete(users);

    // Create test users
    const [user1, user2] = await db.insert(users).values([
      {
        email: 'user1@example.com',
        displayName: 'User 1',
      },
      {
        email: 'user2@example.com',
        displayName: 'User 2',
      },
    ]).returning();

    testUser1Id = user1.id;
    testUser2Id = user2.id;
  });

  afterEach(async () => {
    // Clean up test data
    await db.delete(blendParticipants);
    await db.delete(blends);
    await db.delete(users);
  });

  it('should return 401 when not authenticated', async () => {
    const { POST } = await import('@/app/api/blend/route');
    
    const req = mockRequest({
      method: 'POST',
      body: { name: 'Test Blend', friendId: testUser2Id },
    });
    
    const result = await POST(req as any);
    expect(result.status).toBe(401);
  });

  it('should create a new blend', async () => {
    const { POST } = await import('@/app/api/blend/route');
    
    const req = mockRequest({
      method: 'POST',
      cookies: { user_session: testUser1Id },
      body: {
        name: 'Test Blend',
        friendId: testUser2Id,
        algorithm: 'interleave',
        trackCount: 30,
        timeRange: 'medium_term',
      },
    });
    
    const result = await POST(req as any);
    expect(result.status).toBe(201);
    
    const data = await result.json();
    expect(data.blend.name).toBe('Test Blend');
    expect(data.blend.algorithm).toBe('interleave');
    expect(data.blend.trackCount).toBe(30);
    expect(data.blend.shareCode).toBeDefined();
    expect(data.blend.status).toBe('pending');
  });

  it('should validate required fields', async () => {
    const { POST } = await import('@/app/api/blend/route');
    
    const req = mockRequest({
      method: 'POST',
      cookies: { user_session: testUser1Id },
      body: {
        friendId: testUser2Id,
        // Missing name
      },
    });
    
    const result = await POST(req as any);
    expect(result.status).toBe(400);
  });

  it('should validate friend exists', async () => {
    const { POST } = await import('@/app/api/blend/route');
    
    const req = mockRequest({
      method: 'POST',
      cookies: { user_session: testUser1Id },
      body: {
        name: 'Test Blend',
        friendId: 'non-existent-id',
      },
    });
    
    const result = await POST(req as any);
    expect(result.status).toBe(404);
  });

  it('should get user blends', async () => {
    // First create a blend
    const [blend] = await db.insert(blends).values({
      name: 'Test Blend',
      createdBy: testUser1Id,
      shareCode: 'TEST123',
      status: 'pending',
      blendSettings: {
        algorithm: 'interleave',
        trackCount: 50,
        timeRange: 'medium_term',
      },
    }).returning();

    // Add participants
    await db.insert(blendParticipants).values([
      { blendId: blend.id, userId: testUser1Id, joinedAt: new Date() },
      { blendId: blend.id, userId: testUser2Id, joinedAt: new Date() },
    ]);

    const { GET } = await import('@/app/api/blend/route');
    
    const req = mockRequest({
      method: 'GET',
      cookies: { user_session: testUser1Id },
    });
    
    const result = await GET(req as any);
    expect(result.status).toBe(200);
    
    const data = await result.json();
    expect(data.blends).toHaveLength(1);
    expect(data.blends[0].name).toBe('Test Blend');
    expect(data.blends[0].participants).toHaveLength(2);
  });
});