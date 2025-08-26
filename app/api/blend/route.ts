import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users, blends, blendParticipants } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';

// Force dynamic rendering due to request-specific data
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // Get user session from cookie
    const userSessionId = request.cookies.get('user_session')?.value;
    
    if (!userSessionId) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { 
      name, 
      friendId, 
      algorithm = 'interleave',
      trackCount = 50,
      timeRange = 'medium_term' 
    } = body;

    // Validate input
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Blend name is required' },
        { status: 400 }
      );
    }

    if (!friendId || typeof friendId !== 'string') {
      return NextResponse.json(
        { error: 'Friend ID is required' },
        { status: 400 }
      );
    }

    if (!['interleave', 'weighted', 'discovery'].includes(algorithm)) {
      return NextResponse.json(
        { error: 'Invalid algorithm. Must be interleave, weighted, or discovery' },
        { status: 400 }
      );
    }

    if (typeof trackCount !== 'number' || trackCount < 20 || trackCount > 100) {
      return NextResponse.json(
        { error: 'Track count must be between 20 and 100' },
        { status: 400 }
      );
    }

    if (!['short_term', 'medium_term', 'long_term'].includes(timeRange)) {
      return NextResponse.json(
        { error: 'Invalid time range. Must be short_term, medium_term, or long_term' },
        { status: 400 }
      );
    }

    // Verify friend exists
    const friend = await db.query.users.findFirst({
      where: eq(users.id, friendId),
    });

    if (!friend) {
      return NextResponse.json(
        { error: 'Friend not found' },
        { status: 404 }
      );
    }

    // Generate unique share code
    const shareCode = nanoid(10);

    // Create blend in database transaction
    const result = await db.transaction(async (tx) => {
      // Create the blend
      const [newBlend] = await tx
        .insert(blends)
        .values({
          name: name.trim(),
          createdBy: userSessionId,
          shareCode,
          status: 'pending',
          blendSettings: {
            algorithm,
            trackCount,
            timeRange,
          },
        })
        .returning();

      // Add participants
      await tx.insert(blendParticipants).values([
        {
          blendId: newBlend.id,
          userId: userSessionId,
          joinedAt: new Date(),
        },
        {
          blendId: newBlend.id,
          userId: friendId,
          joinedAt: new Date(),
        },
      ]);

      return newBlend;
    });

    const settings = result.blendSettings as any || {};
    
    return NextResponse.json({
      blend: {
        id: result.id,
        name: result.name,
        shareCode: result.shareCode,
        algorithm: settings.algorithm,
        trackCount: settings.trackCount,
        timeRange: settings.timeRange,
        status: result.status,
        createdAt: result.createdAt,
      },
    }, { status: 201 });

  } catch (error) {
    console.error('Blend creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create blend' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get user session from cookie
    const userSessionId = request.cookies.get('user_session')?.value;
    
    if (!userSessionId) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Fetch user's blends (both created and participated in)
    const userBlends = await db.query.blendParticipants.findMany({
      where: eq(blendParticipants.userId, userSessionId),
      with: {
        blend: {
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
          },
        },
      },
    });

    const blends = userBlends.map(participant => {
      const settings = participant.blend.blendSettings as any || {};
      return {
        id: participant.blend.id,
        name: participant.blend.name,
        shareCode: participant.blend.shareCode,
        algorithm: settings.algorithm,
        trackCount: settings.trackCount,
        timeRange: settings.timeRange,
        status: participant.blend.status,
        createdAt: participant.blend.createdAt,
        participants: participant.blend.participants.map(p => ({
          id: p.user.id,
          displayName: p.user.displayName,
          avatarUrl: p.user.avatarUrl,
          joinedAt: p.joinedAt,
        })),
      };
    });

    return NextResponse.json({ blends });

  } catch (error) {
    console.error('Blend fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch blends' },
      { status: 500 }
    );
  }
}