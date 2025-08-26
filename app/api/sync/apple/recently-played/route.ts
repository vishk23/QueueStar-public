import { NextRequest, NextResponse } from 'next/server';
// import { db } from '@/db';
// import { appleRecentlyPlayed, users } from '@/db/schema';
// import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function POST(_request: NextRequest) {
  // TODO: Implement apple-recently-played schema and uncomment
  return NextResponse.json(
    { error: 'Apple recently played sync not yet implemented' },
    { status: 501 }
  );
  
  /* 
  try {
    const { recentlyPlayedTracks } = await request.json();
    
    if (!recentlyPlayedTracks || !Array.isArray(recentlyPlayedTracks)) {
      return NextResponse.json(
        { error: 'Invalid recently played tracks data' },
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

    console.log(`APPLE SERVER: Received ${recentlyPlayedTracks.length} recently played tracks for user ${user.id}`);

    // Validate all tracks belong to this user
    const validTracks = recentlyPlayedTracks.filter(track => track.userId === user.id);
    if (validTracks.length !== recentlyPlayedTracks.length) {
      return NextResponse.json(
        { error: 'Invalid user data in recently played tracks' },
        { status: 403 }
      );
    }

    // Insert recently played tracks in batches
    const BATCH_SIZE = 50;
    let totalInserted = 0;

    for (let i = 0; i < validTracks.length; i += BATCH_SIZE) {
      const batch = validTracks.slice(i, i + BATCH_SIZE);
      
      const trackRecords = batch.map(track => ({
        userId: user.id,
        appleTrackId: track.appleTrackId,
        trackName: track.trackName,
        artistName: track.artistName,
        albumName: track.albumName,
        durationMs: track.durationMs,
        albumArtUrl: track.albumArtUrl,
        previewUrl: track.previewUrl,
        isrc: track.isrc,
        contentRating: track.contentRating,
        genres: track.genres,
        playedAt: new Date(track.playedAt),
        contextType: track.contextType,
        contextName: track.contextName,
        contextAppleId: track.contextAppleId,
        trackMetadata: track.trackMetadata,
        fetchedAt: new Date(track.fetchedAt),
      }));

      await db.insert(appleRecentlyPlayed).values(trackRecords);
      totalInserted += trackRecords.length;
    }

    console.log(`APPLE: Saved ${totalInserted} recently played tracks for user ${user.id}`);

    return NextResponse.json({
      success: true,
      message: `Saved ${totalInserted} recently played tracks`,
      count: totalInserted
    });

  } catch (error) {
    console.error('Apple Music recently played sync error:', error);
    return NextResponse.json(
      { error: 'Failed to save recently played tracks' },
      { status: 500 }
    );
  }
  */
}