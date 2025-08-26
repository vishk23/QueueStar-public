import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { blends, blendParticipants, blendTracks, users } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: blendId } = await params;
    
    // Get current user from session
    const userSessionId = request.cookies.get('user_session')?.value;
    if (!userSessionId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Verify user is part of this blend
    const [userParticipation] = await db
      .select()
      .from(blendParticipants)
      .where(
        and(
          eq(blendParticipants.blendId, blendId),
          eq(blendParticipants.userId, userSessionId)
        )
      );

    if (!userParticipation) {
      return NextResponse.json(
        { error: 'Not authorized to export this blend' },
        { status: 403 }
      );
    }

    // Get blend details
    const [blend] = await db
      .select()
      .from(blends)
      .where(eq(blends.id, blendId));

    if (!blend || blend.status !== 'completed') {
      return NextResponse.json(
        { error: 'Blend not found or not completed' },
        { status: 404 }
      );
    }

    // Get blend tracks with contributor info
    const tracks = await db
      .select({
        id: blendTracks.id,
        position: blendTracks.position,
        trackId: blendTracks.trackId,
        trackName: blendTracks.trackName,
        artistName: blendTracks.artistName,
        albumName: blendTracks.albumName,
        sourceProvider: blendTracks.sourceProvider,
        contributorName: users.displayName,
      })
      .from(blendTracks)
      .innerJoin(users, eq(blendTracks.contributedBy, users.id))
      .where(eq(blendTracks.blendId, blendId))
      .orderBy(blendTracks.position);

    if (tracks.length === 0) {
      return NextResponse.json(
        { error: 'No tracks found in blend' },
        { status: 400 }
      );
    }

    // Get all participants for playlist description
    const participants = await db
      .select({
        name: users.displayName,
      })
      .from(blendParticipants)
      .innerJoin(users, eq(blendParticipants.userId, users.id))
      .where(eq(blendParticipants.blendId, blendId));

    // Prepare tracks for Apple Music
    const appleTracks = tracks.filter(t => t.sourceProvider === 'apple').map(t => t.trackId);
    const spotifyTracks = tracks.filter(t => t.sourceProvider === 'spotify');

    // For Spotify tracks, we'll need to search Apple Music
    // This will be handled on the client side with MusicKit JS

    const playlistData = {
      name: blend.name,
      description: `Blended playlist by ${participants.map(p => p.name).join(' & ')} • Generated with Blendify`,
      tracks: {
        apple: appleTracks,
        spotify: spotifyTracks.map(t => ({
          id: t.trackId,
          name: t.trackName,
          artist: t.artistName,
          album: t.albumName,
          searchQuery: `${t.artistName} ${t.trackName}`,
        }))
      },
      totalTracks: tracks.length,
      appleTracks: appleTracks.length,
      spotifyTracks: spotifyTracks.length
    };

    return NextResponse.json({
      success: true,
      playlist: playlistData
    });

  } catch (error) {
    console.error('Export to Apple Music error:', error);
    return NextResponse.json(
      { error: 'Failed to prepare export' },
      { status: 500 }
    );
  }
}