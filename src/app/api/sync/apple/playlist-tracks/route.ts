import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { appleLibraryPlaylistTracks, users } from '@/db/schema';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { tracks } = await request.json();
    
    if (!tracks || !Array.isArray(tracks)) {
      return NextResponse.json(
        { error: 'Invalid tracks data' },
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

    // Validate all tracks belong to this user
    const validTracks = tracks.filter(track => track.userId === user.id);
    if (validTracks.length !== tracks.length) {
      return NextResponse.json(
        { error: 'Invalid user data in tracks' },
        { status: 403 }
      );
    }

    // Insert tracks in batches
    const BATCH_SIZE = 100;
    let totalInserted = 0;

    for (let i = 0; i < validTracks.length; i += BATCH_SIZE) {
      const batch = validTracks.slice(i, i + BATCH_SIZE);
      
      const trackRecords = batch.map(track => ({
        userId: user.id,
        applePlaylistId: track.applePlaylistId,
        appleTrackId: track.appleTrackId,
        trackType: track.trackType,
        trackPosition: track.trackPosition,
        trackName: track.trackName,
        artistName: track.artistName,
        albumName: track.albumName,
        durationMs: track.durationMs,
        trackNumber: track.trackNumber,
        discNumber: track.discNumber,
        releaseDate: track.releaseDate,
        hasLyrics: track.hasLyrics,
        contentRating: track.contentRating,
        genreNames: track.genreNames,
        artworkUrl: track.artworkUrl ? track.artworkUrl.replace('{w}', '640').replace('{h}', '640') : null,
        artworkWidth: track.artworkWidth || 640,
        artworkHeight: track.artworkHeight || 640,
        catalogId: track.catalogId,
        playParamsId: track.playParamsId,
        isLibrary: track.isLibrary,
        playParamsKind: track.playParamsKind,
        rawDataRecord: track.rawDataRecord,
        fetchedAt: new Date(track.fetchedAt),
        syncVersion: track.syncVersion,
      }));

      await db.insert(appleLibraryPlaylistTracks).values(trackRecords);
      totalInserted += trackRecords.length;
    }

    console.log(`APPLE: Saved ${totalInserted} playlist tracks for user ${user.id}`);

    return NextResponse.json({
      success: true,
      message: `Saved ${totalInserted} playlist tracks`,
      count: totalInserted
    });

  } catch (error) {
    console.error('Apple Music playlist tracks sync error:', error);
    return NextResponse.json(
      { error: 'Failed to save playlist tracks' },
      { status: 500 }
    );
  }
}