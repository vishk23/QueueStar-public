import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { blends, blendParticipants, blendTracks } from '@/db/schema';
import { eq, and, asc } from 'drizzle-orm';

// Force dynamic rendering due to request-specific data
export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const blendId = params.id;

    // Get user session from cookie (optional for public blends)
    const userSessionId = request.cookies.get('user_session')?.value;

    // Fetch blend with participants and tracks
    const blend = await db.query.blends.findFirst({
      where: eq(blends.id, blendId),
      with: {
        participants: {
          with: {
            user: {
              columns: {
                id: true,
                displayName: true,
                avatarUrl: true,
              },
            },
          },
        },
        tracks: {
          orderBy: [asc(blendTracks.position)],
        },
      },
    });

    if (!blend) {
      return NextResponse.json(
        { error: 'Blend not found' },
        { status: 404 }
      );
    }

    // Check if user has access to this blend
    const isParticipant = userSessionId && blend.participants.some(p => p.userId === userSessionId);
    const isPublic = blend.status === 'completed'; // Only completed blends can be viewed publicly

    if (!isPublic && !isParticipant) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    const settings = blend.blendSettings as any || {};
    
    return NextResponse.json({
      blend: {
        id: blend.id,
        name: blend.name,
        shareCode: blend.shareCode,
        algorithm: settings.algorithm,
        trackCount: settings.trackCount,
        timeRange: settings.timeRange,
        status: blend.status,
        createdAt: blend.createdAt,
        participants: blend.participants.map(p => ({
          id: p.user.id,
          displayName: p.user.displayName,
          avatarUrl: p.user.avatarUrl,
          joinedAt: p.joinedAt,
        })),
        tracks: blend.tracks,
      },
      userAccess: {
        isParticipant,
        canEdit: isParticipant,
        canView: isPublic || isParticipant,
      },
    });

  } catch (error) {
    console.error('Blend fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch blend' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const blendId = params.id;

    // Get user session from cookie
    const userSessionId = request.cookies.get('user_session')?.value;
    
    if (!userSessionId) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Check if user is a participant
    const isParticipant = await db.query.blendParticipants.findFirst({
      where: and(
        eq(blendParticipants.blendId, blendId),
        eq(blendParticipants.userId, userSessionId)
      ),
    });

    if (!isParticipant) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, algorithm, trackCount } = body;

    // Get current blend to merge settings
    const currentBlend = await db.query.blends.findFirst({
      where: eq(blends.id, blendId),
    });

    if (!currentBlend) {
      return NextResponse.json(
        { error: 'Blend not found' },
        { status: 404 }
      );
    }

    const currentSettings = currentBlend.blendSettings as any || {};
    const newSettings = { ...currentSettings };

    // Validate and update settings
    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length === 0) {
        return NextResponse.json(
          { error: 'Name must be a non-empty string' },
          { status: 400 }
        );
      }
    }

    if (algorithm !== undefined) {
      if (!['interleave', 'weighted', 'discovery'].includes(algorithm)) {
        return NextResponse.json(
          { error: 'Invalid algorithm' },
          { status: 400 }
        );
      }
      newSettings.algorithm = algorithm;
    }

    if (trackCount !== undefined) {
      if (typeof trackCount !== 'number' || trackCount < 20 || trackCount > 100) {
        return NextResponse.json(
          { error: 'Track count must be between 20 and 100' },
          { status: 400 }
        );
      }
      newSettings.trackCount = trackCount;
    }

    // Build update object
    const updateData: any = { 
      blendSettings: newSettings,
    };
    
    if (name !== undefined) {
      updateData.name = name.trim();
    }

    // Update blend
    const [updatedBlend] = await db
      .update(blends)
      .set(updateData)
      .where(eq(blends.id, blendId))
      .returning();

    if (!updatedBlend) {
      return NextResponse.json(
        { error: 'Blend not found' },
        { status: 404 }
      );
    }

    const updatedSettings = updatedBlend.blendSettings as any || {};
    
    return NextResponse.json({
      blend: {
        id: updatedBlend.id,
        name: updatedBlend.name,
        shareCode: updatedBlend.shareCode,
        algorithm: updatedSettings.algorithm,
        trackCount: updatedSettings.trackCount,
        timeRange: updatedSettings.timeRange,
        status: updatedBlend.status,
        createdAt: updatedBlend.createdAt,
      },
    });

  } catch (error) {
    console.error('Blend update error:', error);
    return NextResponse.json(
      { error: 'Failed to update blend' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const blendId = params.id;

    // Get user session from cookie
    const userSessionId = request.cookies.get('user_session')?.value;
    
    if (!userSessionId) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Check if user created this blend
    const blend = await db.query.blends.findFirst({
      where: eq(blends.id, blendId),
    });

    if (!blend) {
      return NextResponse.json(
        { error: 'Blend not found' },
        { status: 404 }
      );
    }

    if (blend.createdBy !== userSessionId) {
      return NextResponse.json(
        { error: 'Only the creator can delete this blend' },
        { status: 403 }
      );
    }

    // Delete blend (cascading will handle related records)
    await db.delete(blends).where(eq(blends.id, blendId));

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Blend deletion error:', error);
    return NextResponse.json(
      { error: 'Failed to delete blend' },
      { status: 500 }
    );
  }
}