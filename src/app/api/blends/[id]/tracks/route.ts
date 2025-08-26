import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { blends, blendParticipants, blendTracks, users } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(
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
        { error: 'Not authorized to view this blend' },
        { status: 403 }
      );
    }

    // Get blend details
    const [blend] = await db
      .select()
      .from(blends)
      .where(eq(blends.id, blendId));

    if (!blend) {
      return NextResponse.json(
        { error: 'Blend not found' },
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
        albumArtUrl: blendTracks.albumArtUrl,
        durationMs: blendTracks.durationMs,
        sourceProvider: blendTracks.sourceProvider,
        energy: blendTracks.energy,
        valence: blendTracks.valence,
        danceability: blendTracks.danceability,
        tempo: blendTracks.tempo,
        genre: blendTracks.genre,
        contributorName: users.displayName,
        contributorEmail: users.email,
        addedAt: blendTracks.addedAt
      })
      .from(blendTracks)
      .innerJoin(users, eq(blendTracks.contributedBy, users.id))
      .where(eq(blendTracks.blendId, blendId))
      .orderBy(blendTracks.position);

    // Get all participants for context
    const participants = await db
      .select({
        userId: users.id,
        name: users.displayName,
        email: users.email,
        joinedAt: blendParticipants.joinedAt
      })
      .from(blendParticipants)
      .innerJoin(users, eq(blendParticipants.userId, users.id))
      .where(eq(blendParticipants.blendId, blendId));

    return NextResponse.json({
      success: true,
      blend: {
        id: blend.id,
        name: blend.name,
        status: blend.status,
        createdAt: blend.createdAt,
        completedAt: blend.completedAt,
        shareCode: blend.shareCode,
        trackCount: tracks.length,
        participants
      },
      tracks: tracks.map(track => ({
        id: track.id,
        position: track.position,
        title: track.trackName,
        artist: track.artistName,
        album: track.albumName,
        artworkUrl: track.albumArtUrl,
        duration: track.durationMs,
        sourceProvider: track.sourceProvider,
        audioFeatures: {
          energy: track.energy,
          valence: track.valence,
          danceability: track.danceability,
          tempo: track.tempo,
          genre: track.genre
        },
        contributedBy: {
          name: track.contributorName,
          email: track.contributorEmail
        },
        addedAt: track.addedAt
      }))
    });

  } catch (error) {
    console.error('Get blend tracks error:', error);
    return NextResponse.json(
      { error: 'Failed to get blend tracks' },
      { status: 500 }
    );
  }
}