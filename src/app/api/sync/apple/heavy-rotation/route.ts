import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users, appleHeavyRotation } from '@/db/schema';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { rotation } = await request.json();
    
    if (!rotation) {
      return NextResponse.json(
        { error: 'Invalid rotation data' },
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

    // Validate rotation belongs to this user
    if (rotation.userId !== user.id) {
      return NextResponse.json(
        { error: 'Invalid user data' },
        { status: 403 }
      );
    }

    // Process and save ONLY heavy rotation tracks (not recommendations)
    const heavyRotationData = [];
    
    // Process heavy rotation tracks
    if (rotation.heavyRotationTracks && rotation.heavyRotationTracks.length > 0) {
      for (const track of rotation.heavyRotationTracks) {
        heavyRotationData.push({
          userId: user.id,
          appleResourceId: track.id || track.attributes?.playParams?.id || `unknown_${Date.now()}`,
          resourceType: track.type || 'song',
          resourceName: track.attributes?.name || 'Unknown Track',
          artistName: track.attributes?.artistName || 'Unknown Artist',
          albumName: track.attributes?.albumName || '',
          playCount: track.attributes?.playCount,
          rotationScore: track.attributes?.rotationScore,
          lastPlayedAt: track.attributes?.lastPlayedDate ? new Date(track.attributes.lastPlayedDate) : null,
          firstPlayedAt: track.attributes?.firstPlayedDate ? new Date(track.attributes.firstPlayedDate) : null,
          durationMs: track.attributes?.durationInMillis,
          albumArtUrl: track.attributes?.artwork?.url,
          previewUrl: track.attributes?.previews?.[0]?.url,
          isrc: track.attributes?.isrc,
          contentRating: track.attributes?.contentRating,
          genres: track.attributes?.genreNames || [],
          catalogId: track.attributes?.playParams?.catalogId,
          resourceMetadata: track,
          syncVersion: String(rotation.syncVersion || Date.now()),
        });
      }
    }
    
    // Save to database
    if (heavyRotationData.length > 0) {
      // Clear existing heavy rotation data for this user
      await db.delete(appleHeavyRotation).where(eq(appleHeavyRotation.userId, user.id));
      
      // Insert new data
      await db.insert(appleHeavyRotation).values(heavyRotationData);
    }
    
    console.log(`APPLE: Heavy rotation data for user ${user.id}:`, {
      heavyRotationCount: rotation.heavyRotationTracks?.length || 0,
      totalSaved: heavyRotationData.length,
    });

    return NextResponse.json({
      success: true,
      message: 'Heavy rotation data saved',
      heavyRotationCount: rotation.heavyRotationTracks?.length || 0,
      totalSaved: heavyRotationData.length,
    });

  } catch (error) {
    console.error('Apple Music heavy rotation sync error:', error);
    return NextResponse.json(
      { error: 'Failed to save heavy rotation data' },
      { status: 500 }
    );
  }
}