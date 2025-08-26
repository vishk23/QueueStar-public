import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users, providerConnections } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
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
      )
      .orderBy(desc(providerConnections.updatedAt));

    if (!appleConnection) {
      return NextResponse.json({
        needsRefresh: false,
        reason: 'No Apple Music connection found'
      });
    }

    // Check if last sync was more than 24 hours ago
    const lastSync = appleConnection.lastSyncAt;
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const needsRefresh = !lastSync || lastSync < oneDayAgo;

    // Calculate time since last sync
    const timeSinceSync = lastSync ? now.getTime() - lastSync.getTime() : null;
    const hoursSinceSync = timeSinceSync ? Math.floor(timeSinceSync / (1000 * 60 * 60)) : null;

    return NextResponse.json({
      needsRefresh,
      lastSyncAt: lastSync,
      hoursSinceLastSync: hoursSinceSync,
      reason: needsRefresh ? 
        (lastSync ? `Last sync was ${hoursSinceSync} hours ago` : 'No previous sync found') :
        `Last sync was ${hoursSinceSync} hours ago (within 24h window)`,
      connectionStatus: {
        id: appleConnection.id,
        provider: appleConnection.provider,
        isExpired: appleConnection.tokenExpiresAt ? appleConnection.tokenExpiresAt < now : false,
        connectedAt: appleConnection.createdAt,
        lastUpdated: appleConnection.updatedAt
      }
    });

  } catch (error) {
    console.error('Apple Music refresh check error:', error);
    return NextResponse.json(
      { error: 'Failed to check refresh status' },
      { status: 500 }
    );
  }
}