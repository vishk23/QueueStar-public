import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { invites } from '@/db/schema';
import { nanoid } from 'nanoid';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // Get current user from session
    const userSessionId = request.cookies.get('user_session')?.value;
    if (!userSessionId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Generate unique invite code
    const inviteCode = nanoid(12); // 12 character code
    
    // Create invite with optional expiration (30 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    const [invite] = await db.insert(invites).values({
      code: inviteCode,
      createdBy: userSessionId,
      maxUses: 1,
      usedCount: 0,
      expiresAt: expiresAt,
    }).returning();

    // Generate shareable URL
    const inviteUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/signup?invite=${inviteCode}`;

    return NextResponse.json({
      success: true,
      invite: {
        id: invite.id,
        code: invite.code,
        url: inviteUrl,
        expiresAt: invite.expiresAt,
        maxUses: invite.maxUses,
        usedCount: invite.usedCount,
      },
    });

  } catch (error) {
    console.error('Create invite error:', error);
    return NextResponse.json(
      { error: 'Failed to create invite' },
      { status: 500 }
    );
  }
}