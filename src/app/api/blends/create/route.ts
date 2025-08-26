import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users, friends, blends, blendParticipants } from '@/db/schema';
import { eq, and, inArray } from 'drizzle-orm';
import { nanoid } from 'nanoid';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { name, description, friendIds } = await request.json();
    
    if (!name || !friendIds || !Array.isArray(friendIds)) {
      return NextResponse.json(
        { error: 'Name and friend IDs are required' },
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

    // Verify all selected friends are actually friends with the user
    if (friendIds.length > 0) {
      const userFriends = await db
        .select({ friendId: friends.friendId })
        .from(friends)
        .where(
          and(
            eq(friends.userId, userSessionId),
            eq(friends.status, 'accepted'),
            inArray(friends.friendId, friendIds)
          )
        );

      if (userFriends.length !== friendIds.length) {
        return NextResponse.json(
          { error: 'One or more selected users are not your friends' },
          { status: 400 }
        );
      }
    }

    // Generate unique blend code for sharing
    const blendCode = nanoid(8);

    // Create blend
    const [newBlend] = await db.transaction(async (tx) => {
      // Create the blend
      const [blend] = await tx
        .insert(blends)
        .values({
          name: name.trim(),
          createdBy: userSessionId,
          shareCode: blendCode,
          status: 'pending',
        })
        .returning();

      // Add creator as participant
      await tx.insert(blendParticipants).values({
        blendId: blend.id,
        userId: userSessionId,
        status: 'accepted',
        joinedAt: new Date(),
      });

      // Add friends as participants
      if (friendIds.length > 0) {
        const participantValues = friendIds.map((friendId: string) => ({
          blendId: blend.id,
          userId: friendId,
          status: 'pending' as const,
        }));

        await tx.insert(blendParticipants).values(participantValues);
      }

      return [blend];
    });

    // Get creator info for response
    const [creator] = await db
      .select({
        id: users.id,
        email: users.email,
        displayName: users.displayName,
      })
      .from(users)
      .where(eq(users.id, userSessionId));

    return NextResponse.json({
      success: true,
      blend: {
        id: newBlend.id,
        name: newBlend.name,
        code: newBlend.shareCode,
        status: newBlend.status,
        createdAt: newBlend.createdAt,
        creator: creator,
        participantCount: 1 + friendIds.length,
        trackCount: 0, // Empty blend for now
      },
    });

  } catch (error) {
    console.error('Create blend error:', error);
    return NextResponse.json(
      { error: 'Failed to create blend' },
      { status: 500 }
    );
  }
}