import { NextRequest, NextResponse } from 'next/server';
// import { db } from '@/db';
// import { appleTopTracks, users } from '@/db/schema';
// import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function POST(_request: NextRequest) {
  // TODO: Implement apple-top-tracks schema and uncomment
  return NextResponse.json(
    { error: 'Apple top tracks sync not yet implemented' },
    { status: 501 }
  );
  
  /*
  try {
    const { topTracks } = await request.json();
    
    if (!topTracks || !Array.isArray(topTracks)) {
      return NextResponse.json(
        { error: 'Invalid top tracks data' },
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

    console.log(`APPLE SERVER: Received ${topTracks.length} top tracks for user ${user.id}`);

    // Validate all tracks belong to this user
    const validTracks = topTracks.filter(track => track.userId === user.id);
    if (validTracks.length !== topTracks.length) {
      return NextResponse.json(
        { error: 'Invalid user data in top tracks' },
        { status: 403 }
      );
    }

    // Insert top tracks in batches
    const BATCH_SIZE = 25;
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
        rotationType: track.rotationType || 'heavy_rotation',
        rank: track.rank,
        trackMetadata: track.trackMetadata,
        fetchedAt: new Date(track.fetchedAt),
      }));

      await db.insert(appleTopTracks).values(trackRecords);
      totalInserted += trackRecords.length;
    }

    console.log(`APPLE: Saved ${totalInserted} top tracks for user ${user.id}`);

    return NextResponse.json({
      success: true,
      message: `Saved ${totalInserted} top tracks`,
      count: totalInserted
    });

  } catch (error) {
    console.error('Apple Music top tracks sync error:', error);
    return NextResponse.json(
      { error: 'Failed to save top tracks' },
      { status: 500 }
    );
  }
  */
}