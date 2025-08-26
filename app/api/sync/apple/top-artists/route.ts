import { NextRequest, NextResponse } from 'next/server';
// import { db } from '@/db';
// import { appleTopArtists, users } from '@/db/schema';
// import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function POST(_request: NextRequest) {
  // TODO: Implement apple-top-artists schema and uncomment
  return NextResponse.json(
    { error: 'Apple top artists sync not yet implemented' },
    { status: 501 }
  );
  
  /*
  try {
    const { topArtists } = await request.json();
    
    if (!topArtists || !Array.isArray(topArtists)) {
      return NextResponse.json(
        { error: 'Invalid top artists data' },
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

    console.log(`APPLE SERVER: Received ${topArtists.length} top artists for user ${user.id}`);

    // Validate all artists belong to this user
    const validArtists = topArtists.filter(artist => artist.userId === user.id);
    if (validArtists.length !== topArtists.length) {
      return NextResponse.json(
        { error: 'Invalid user data in top artists' },
        { status: 403 }
      );
    }

    // Insert top artists in batches
    const BATCH_SIZE = 25;
    let totalInserted = 0;

    for (let i = 0; i < validArtists.length; i += BATCH_SIZE) {
      const batch = validArtists.slice(i, i + BATCH_SIZE);
      
      const artistRecords = batch.map(artist => ({
        userId: user.id,
        appleArtistId: artist.appleArtistId,
        artistName: artist.artistName,
        genres: artist.genres,
        imageUrl: artist.imageUrl,
        editorialNotes: artist.editorialNotes,
        rotationType: artist.rotationType || 'heavy_rotation',
        rank: artist.rank,
        artistMetadata: artist.artistMetadata,
        fetchedAt: new Date(artist.fetchedAt),
      }));

      await db.insert(appleTopArtists).values(artistRecords);
      totalInserted += artistRecords.length;
    }

    console.log(`APPLE: Saved ${totalInserted} top artists for user ${user.id}`);

    return NextResponse.json({
      success: true,
      message: `Saved ${totalInserted} top artists`,
      count: totalInserted
    });

  } catch (error) {
    console.error('Apple Music top artists sync error:', error);
    return NextResponse.json(
      { error: 'Failed to save top artists' },
      { status: 500 }
    );
  }
  */
}