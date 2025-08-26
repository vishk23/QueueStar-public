import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users, blends, blendParticipants } from '@/db/schema';
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

    // Get all blends the user participates in
    const userBlends = await db
      .select({
        id: blends.id,
        name: blends.name,
        code: blends.shareCode,
        status: blends.status,
        createdAt: blends.createdAt,
        creatorId: blends.createdBy,
        creatorName: users.displayName,
        creatorEmail: users.email,
        userStatus: blendParticipants.status,
        joinedAt: blendParticipants.joinedAt,
      })
      .from(blendParticipants)
      .innerJoin(blends, eq(blendParticipants.blendId, blends.id))
      .innerJoin(users, eq(blends.createdBy, users.id))
      .where(eq(blendParticipants.userId, userSessionId))
      .orderBy(blends.createdAt);

    return NextResponse.json({
      success: true,
      blends: userBlends,
      count: userBlends.length,
    });

  } catch (error) {
    console.error('List blends error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch blends' },
      { status: 500 }
    );
  }
}