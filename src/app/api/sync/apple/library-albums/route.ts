import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { appleLibraryAlbums, users } from '@/db/schema';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // Handle potentially empty request body
    let body;
    try {
      body = await request.json();
    } catch (jsonError) {
      console.log('APPLE: Empty or invalid JSON in albums sync request');
      return NextResponse.json({
        success: true,
        message: 'No albums data to sync',
        count: 0
      });
    }

    const { albums } = body;
    
    if (!albums || !Array.isArray(albums)) {
      console.log('APPLE: No albums array in request body');
      return NextResponse.json({
        success: true,
        message: 'No albums data to sync',
        count: 0
      });
    }

    if (albums.length === 0) {
      console.log('APPLE: Empty albums array');
      return NextResponse.json({
        success: true,
        message: 'No albums to sync',
        count: 0
      });
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

    // Validate all albums belong to this user
    const validAlbums = albums.filter(album => album.userId === user.id);
    if (validAlbums.length !== albums.length) {
      return NextResponse.json(
        { error: 'Invalid user data in albums' },
        { status: 403 }
      );
    }

    // Insert albums in batches
    const BATCH_SIZE = 25;
    let totalInserted = 0;

    for (let i = 0; i < validAlbums.length; i += BATCH_SIZE) {
      const batch = validAlbums.slice(i, i + BATCH_SIZE);
      
      const albumRecords = batch.map(album => ({
        userId: user.id,
        appleAlbumId: album.appleAlbumId,
        albumType: album.albumType,
        albumName: album.albumName,
        artistName: album.artistName,
        copyright: album.copyright,
        editorialNotes: album.editorialNotes,
        genreNames: album.genreNames,
        releaseDate: album.releaseDate,
        trackCount: album.trackCount,
        isSingle: album.isSingle,
        isComplete: album.isComplete,
        recordLabel: album.recordLabel,
        upc: album.upc,
        artworkUrl: album.artworkUrl ? album.artworkUrl.replace('{w}', '640').replace('{h}', '640') : null,
        artworkWidth: album.artworkWidth || 640,
        artworkHeight: album.artworkHeight || 640,
        catalogId: album.catalogId,
        playParamsId: album.playParamsId,
        isLibrary: album.isLibrary,
        trackData: album.trackData,
        artistData: album.artistData,
        genreData: album.genreData,
        rawDataRecord: album.rawDataRecord,
        fetchedAt: new Date(album.fetchedAt),
        syncVersion: album.syncVersion,
      }));

      await db.insert(appleLibraryAlbums).values(albumRecords);
      totalInserted += albumRecords.length;
    }

    console.log(`APPLE: Saved ${totalInserted} library albums for user ${user.id}`);

    return NextResponse.json({
      success: true,
      message: `Saved ${totalInserted} library albums`,
      count: totalInserted
    });

  } catch (error) {
    console.error('Apple Music library albums sync error:', error);
    return NextResponse.json(
      { error: 'Failed to save library albums' },
      { status: 500 }
    );
  }
}