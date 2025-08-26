import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { blends, blendParticipants, blendTracks, users } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { generateBlendWithLLM } from '@/lib/blend/llm-generation';

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
        { error: 'Not authorized to generate this blend' },
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

    // Check if blend already has tracks
    const existingTracks = await db
      .select()
      .from(blendTracks)
      .where(eq(blendTracks.blendId, blendId));

    if (existingTracks.length > 0) {
      return NextResponse.json(
        { error: 'Blend already has tracks. Delete existing tracks first to regenerate.' },
        { status: 400 }
      );
    }

    // Get all participants
    const participants = await db
      .select({
        userId: blendParticipants.userId,
        userName: users.displayName,
        userEmail: users.email
      })
      .from(blendParticipants)
      .innerJoin(users, eq(blendParticipants.userId, users.id))
      .where(eq(blendParticipants.blendId, blendId));

    console.log(`Starting blend generation for ${participants.length} participants...`);

    // Generate blend using LLM
    const generationResult = await generateBlendWithLLM(
      participants.map(p => p.userId),
      blend.name,
      55 // Target 55 tracks
    );

    console.log(`Generated ${generationResult.tracks.length} tracks, using ~${generationResult.totalTokens} tokens`);

    if (generationResult.tracks.length === 0) {
      return NextResponse.json(
        { error: 'No valid tracks found for blend generation. Users need more synced music data.' },
        { status: 400 }
      );
    }

    // Store tracks in database
    const tracksToInsert = generationResult.tracks.map((track, index) => ({
      blendId: blendId,
      contributedBy: participants[index % participants.length].userId, // Round-robin assignment
      trackId: track.id,
      trackName: track.title,
      artistName: track.artist,
      albumName: track.album,
      albumArtUrl: track.artworkUrl,
      durationMs: track.durationMs,
      isrc: track.isrc,
      position: index + 1,
      sourceProvider: track.sourceProvider,
      energy: track.energy,
      valence: track.valence,
      danceability: track.danceability,
      tempo: track.tempo,
      genre: track.genre
    }));

    await db.insert(blendTracks).values(tracksToInsert);

    // Update blend status to completed
    await db
      .update(blends)
      .set({ 
        status: 'completed',
        completedAt: new Date()
      })
      .where(eq(blends.id, blendId));

    return NextResponse.json({
      success: true,
      blend: {
        id: blend.id,
        name: blend.name,
        status: 'completed',
        trackCount: generationResult.tracks.length,
        participants: participants.map(p => ({ name: p.userName, email: p.userEmail })),
        reasoning: generationResult.reasoning,
        estimatedCost: (generationResult.totalTokens / 1000) * 0.06 // GPT-4o pricing
      }
    });

  } catch (error) {
    console.error('Blend generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate blend' },
      { status: 500 }
    );
  }
}