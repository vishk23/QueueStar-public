import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users, friends } from '@/db/schema';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Get current user from session
    const userSessionId = request.cookies.get('user_session')?.value;
    if (!userSessionId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get user's friends
    const userFriends = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.displayName,
        createdAt: users.createdAt,
        friendedAt: friends.requestedAt,
        status: friends.status,
      })
      .from(friends)
      .innerJoin(users, eq(friends.friendId, users.id))
      .where(eq(friends.userId, userSessionId));

    return NextResponse.json({
      success: true,
      friends: userFriends,
      count: userFriends.length,
    });

  } catch (error) {
    console.error('List friends error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch friends' },
      { status: 500 }
    );
  }
}