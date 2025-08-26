import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { appleLibraryPlaylists, users } from '@/db/schema';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { playlists } = await request.json();
    
    if (!playlists || !Array.isArray(playlists)) {
      return NextResponse.json(
        { error: 'Invalid playlists data' },
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

    // Validate all playlists belong to this user
    const validPlaylists = playlists.filter(playlist => playlist.userId === user.id);
    if (validPlaylists.length !== playlists.length) {
      return NextResponse.json(
        { error: 'Invalid user data in playlists' },
        { status: 403 }
      );
    }

    // Insert playlists in batches
    const BATCH_SIZE = 25;
    let totalInserted = 0;

    for (let i = 0; i < validPlaylists.length; i += BATCH_SIZE) {
      const batch = validPlaylists.slice(i, i + BATCH_SIZE);
      
      const playlistRecords = batch.map(playlist => ({
        userId: user.id,
        applePlaylistId: playlist.applePlaylistId,
        playlistType: playlist.playlistType,
        playlistName: playlist.playlistName,
        description: playlist.description,
        trackCount: playlist.trackCount,
        canEdit: playlist.canEdit,
        isPublic: playlist.isPublic,
        lastModifiedDate: playlist.lastModifiedDate,
        curatorName: playlist.curatorName,
        artworkUrl: playlist.artworkUrl ? playlist.artworkUrl.replace('{w}', '640').replace('{h}', '640') : null,
        artworkWidth: playlist.artworkWidth || 640,
        artworkHeight: playlist.artworkHeight || 640,
        catalogId: playlist.catalogId,
        playParamsId: playlist.playParamsId,
        isLibrary: playlist.isLibrary,
        globalId: playlist.globalId,
        trackData: playlist.trackData,
        curatorData: playlist.curatorData,
        rawDataRecord: playlist.rawDataRecord,
        fetchedAt: new Date(playlist.fetchedAt),
        syncVersion: playlist.syncVersion,
      }));

      await db.insert(appleLibraryPlaylists).values(playlistRecords);
      totalInserted += playlistRecords.length;
    }

    console.log(`APPLE: Saved ${totalInserted} library playlists for user ${user.id}`);

    return NextResponse.json({
      success: true,
      message: `Saved ${totalInserted} library playlists`,
      count: totalInserted
    });

  } catch (error) {
    console.error('Apple Music library playlists sync error:', error);
    return NextResponse.json(
      { error: 'Failed to save library playlists' },
      { status: 500 }
    );
  }
}