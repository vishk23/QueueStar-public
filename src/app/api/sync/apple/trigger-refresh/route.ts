import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users, providerConnections } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // Get user from session
    const userSessionId = request.cookies.get('user_session')?.value;
    if (!userSessionId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userSessionId));

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid session' },
        { status: 401 }
      );
    }

    // Check Apple Music connection
    const [appleConnection] = await db
      .select()
      .from(providerConnections)
      .where(
        and(
          eq(providerConnections.userId, user.id),
          eq(providerConnections.provider, 'apple')
        )
      );

    if (!appleConnection) {
      return NextResponse.json(
        { error: 'No Apple Music connection found' },
        { status: 404 }
      );
    }

    // Update lastSyncAt to indicate refresh is starting
    await db
      .update(providerConnections)
      .set({
        lastSyncAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(providerConnections.id, appleConnection.id));

    console.log(`APPLE: Manual refresh sync triggered for user ${user.id}`);

    return NextResponse.json({
      success: true,
      message: 'Refresh sync triggered successfully',
      userId: user.id,
      connectionId: appleConnection.id,
      refreshStartedAt: new Date().toISOString(),
      instruction: 'Client should now start MusicKit JS sync with current timestamp as syncVersion'
    });

  } catch (error) {
    console.error('Apple Music refresh trigger error:', error);
    return NextResponse.json(
      { error: 'Failed to trigger refresh sync' },
      { status: 500 }
    );
  }
}