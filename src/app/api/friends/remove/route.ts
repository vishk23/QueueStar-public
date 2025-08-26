import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { friends } from '@/db/schema';
import { eq, and, or } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { friendId } = await request.json();
    
    if (!friendId) {
      return NextResponse.json(
        { error: 'Friend ID is required' },
        { status: 400 }
      );
    }

    // Get current user from session
    const userSessionId = request.cookies.get('user_session')?.value;
    if (!userSessionId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Remove friendship records (bidirectional)
    await db.transaction(async (tx) => {
      // Remove both directions of the friendship
      await tx.delete(friends).where(
        or(
          and(eq(friends.userId, userSessionId), eq(friends.friendId, friendId)),
          and(eq(friends.userId, friendId), eq(friends.friendId, userSessionId))
        )
      );
    });

    return NextResponse.json({
      success: true,
      message: 'Friend removed successfully',
    });

  } catch (error) {
    console.error('Remove friend error:', error);
    return NextResponse.json(
      { error: 'Failed to remove friend' },
      { status: 500 }
    );
  }
}