import { NextRequest, NextResponse } from 'next/server';
// import { db } from '@/db';
// import { users } from '@/db/schema';
// import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function POST(_request: NextRequest) {
  // TODO: Implement apple-recent-activity schema and uncomment
  return NextResponse.json(
    { error: 'Apple recent activity sync not yet implemented' },
    { status: 501 }
  );
  
  /*
  try {
    const { activity } = await request.json();
    
    if (!activity) {
      return NextResponse.json(
        { error: 'Invalid activity data' },
        { status: 400 }
      );
    }

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

    // Validate activity belongs to this user
    if (activity.userId !== user.id) {
      return NextResponse.json(
        { error: 'Invalid user data' },
        { status: 403 }
      );
    }

    // For now, we'll store this as a simple JSON blob
    // In a real implementation, you might want a dedicated table structure
    const activityRecord = {
      userId: user.id,
      recentlyAddedTracks: activity.recentlyAddedTracks || [],
      recentlyPlayedTracks: activity.recentlyPlayedTracks || [],
      fetchedAt: new Date(activity.fetchedAt),
      syncVersion: activity.syncVersion,
    };

    // Note: This would require the table to exist in your schema
    // For now, we'll just log it and return success
    console.log(`APPLE: Recent activity data for user ${user.id}:`, {
      recentlyAddedCount: activity.recentlyAddedTracks?.length || 0,
      recentlyPlayedCount: activity.recentlyPlayedTracks?.length || 0,
    });

    return NextResponse.json({
      success: true,
      message: 'Recent activity data received',
      recentlyAddedCount: activity.recentlyAddedTracks?.length || 0,
      recentlyPlayedCount: activity.recentlyPlayedTracks?.length || 0,
    });

  } catch (error) {
    console.error('Apple Music recent activity sync error:', error);
    return NextResponse.json(
      { error: 'Failed to save recent activity' },
      { status: 500 }
    );
  }
  */
}