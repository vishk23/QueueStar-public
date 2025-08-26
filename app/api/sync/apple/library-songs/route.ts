import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { appleLibrarySongs, users } from '@/db/schema';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { songs } = await request.json();
    
    if (!songs || !Array.isArray(songs)) {
      return NextResponse.json(
        { error: 'Invalid songs data' },
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

    console.log(`APPLE SERVER: Received ${songs.length} songs for user ${user.id}`);
    console.log(`APPLE SERVER: Sample song data:`, songs.slice(0, 2).map(s => ({ 
      name: s.trackName, 
      artist: s.artistName, 
      userId: s.userId,
      appleTrackId: s.appleTrackId
    })));

    // Validate all songs belong to this user
    const validSongs = songs.filter(song => song.userId === user.id);
    if (validSongs.length !== songs.length) {
      console.error(`APPLE SERVER: User ID mismatch - expected ${user.id}, got songs for various users`);
      return NextResponse.json(
        { error: 'Invalid user data in songs' },
        { status: 403 }
      );
    }

    // Insert songs in batches (append-only, no conflicts)
    const BATCH_SIZE = 50;
    let totalInserted = 0;

    for (let i = 0; i < validSongs.length; i += BATCH_SIZE) {
      const batch = validSongs.slice(i, i + BATCH_SIZE);
      
      console.log(`APPLE SERVER: Processing batch ${i / BATCH_SIZE + 1} with ${batch.length} songs`);
      
      const songRecords = batch.map(song => ({
        userId: user.id,
        appleTrackId: song.appleTrackId,
        trackType: song.trackType,
        trackName: song.trackName,
        artistName: song.artistName,
        albumName: song.albumName,
        composerName: song.composerName,
        genreNames: song.genreNames,
        releaseDate: song.releaseDate,
        trackNumber: song.trackNumber,
        discNumber: song.discNumber,
        durationMs: song.durationMs,
        isExplicit: song.isExplicit,
        hasLyrics: song.hasLyrics,
        isrc: song.isrc,
        artworkUrl: song.artworkUrl ? song.artworkUrl.replace('{w}', '640').replace('{h}', '640') : null,
        artworkWidth: song.artworkWidth || 640,
        artworkHeight: song.artworkHeight || 640,
        catalogId: song.catalogId,
        playParamsId: song.playParamsId,
        isLibrary: song.isLibrary,
        playParamsKind: song.playParamsKind,
        albumData: song.albumData,
        artistData: song.artistData,
        genreData: song.genreData,
        rawDataRecord: song.rawDataRecord,
        fetchedAt: new Date(song.fetchedAt),
        syncVersion: song.syncVersion,
      }));

      const insertResult = await db.insert(appleLibrarySongs).values(songRecords);
      totalInserted += songRecords.length;
      console.log(`APPLE SERVER: Successfully inserted ${songRecords.length} songs into database (batch ${i / BATCH_SIZE + 1})`);
      console.log(`APPLE SERVER: Sample inserted record:`, {
        userId: songRecords[0].userId,
        trackName: songRecords[0].trackName,
        artistName: songRecords[0].artistName,
        appleTrackId: songRecords[0].appleTrackId
      });
    }

    console.log(`APPLE: Saved ${totalInserted} library songs for user ${user.id}`);

    // Verify data was actually saved by querying the database
    try {
      const verificationQuery = await db
        .select()
        .from(appleLibrarySongs)
        .where(eq(appleLibrarySongs.userId, user.id));
      
      console.log(`APPLE SERVER: Database verification - found ${verificationQuery.length} total songs for user ${user.id}`);
      console.log(`APPLE SERVER: Verification sample:`, verificationQuery.slice(0, 2).map(s => ({ 
        trackName: s.trackName, 
        artistName: s.artistName,
        fetchedAt: s.fetchedAt 
      })));
    } catch (verifyError) {
      console.error(`APPLE SERVER: Database verification failed:`, verifyError);
    }

    return NextResponse.json({
      success: true,
      message: `Saved ${totalInserted} library songs`,
      count: totalInserted
    });

  } catch (error) {
    console.error('Apple Music library songs sync error:', error);
    return NextResponse.json(
      { error: 'Failed to save library songs' },
      { status: 500 }
    );
  }
}