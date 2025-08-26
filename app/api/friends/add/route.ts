import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users, friends } from '@/db/schema';
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

    // Verify the friend user exists
    const [friendUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, friendId));

    if (!friendUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if friendship already exists (in either direction)
    const existingFriendship = await db
      .select()
      .from(friends)
      .where(
        or(
          and(eq(friends.userId, userSessionId), eq(friends.friendId, friendId)),
          and(eq(friends.userId, friendId), eq(friends.friendId, userSessionId))
        )
      );

    if (existingFriendship.length > 0) {
      return NextResponse.json(
        { error: 'Friendship already exists or pending' },
        { status: 409 }
      );
    }

    // Create friendship records (bidirectional)
    await db.transaction(async (tx) => {
      // Create friendship from user to friend
      await tx.insert(friends).values({
        userId: userSessionId,
        friendId: friendId,
        requestedBy: userSessionId,
        status: 'accepted', // For now, auto-accept friend requests
      });

      // Create reverse friendship
      await tx.insert(friends).values({
        userId: friendId,
        friendId: userSessionId,
        requestedBy: userSessionId,
        status: 'accepted',
      });
    });

    return NextResponse.json({
      success: true,
      message: 'Friend added successfully',
      friend: {
        id: friendUser.id,
        email: friendUser.email,
        name: friendUser.displayName,
      },
    });

  } catch (error) {
    console.error('Add friend error:', error);
    return NextResponse.json(
      { error: 'Failed to add friend' },
      { status: 500 }
    );
  }
}