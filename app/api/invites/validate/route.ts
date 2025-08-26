import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { invites, users } from '@/db/schema';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    
    if (!code) {
      return NextResponse.json(
        { error: 'Invite code is required' },
        { status: 400 }
      );
    }

    // Find invite and join with creator info
    const [invite] = await db
      .select({
        id: invites.id,
        code: invites.code,
        maxUses: invites.maxUses,
        usedCount: invites.usedCount,
        expiresAt: invites.expiresAt,
        createdAt: invites.createdAt,
        creatorName: users.displayName,
        creatorEmail: users.email,
      })
      .from(invites)
      .innerJoin(users, eq(invites.createdBy, users.id))
      .where(eq(invites.code, code));

    if (!invite) {
      return NextResponse.json(
        { error: 'Invalid invite code' },
        { status: 404 }
      );
    }

    // Check if expired
    if (invite.expiresAt && new Date() > invite.expiresAt) {
      return NextResponse.json(
        { error: 'Invite code has expired' },
        { status: 410 }
      );
    }

    // Check if max uses reached
    if ((invite.usedCount || 0) >= (invite.maxUses || 1)) {
      return NextResponse.json(
        { error: 'Invite code has been used up' },
        { status: 410 }
      );
    }

    return NextResponse.json({
      success: true,
      invite: {
        id: invite.id,
        code: invite.code,
        createdAt: invite.createdAt,
        expiresAt: invite.expiresAt,
        creator: {
          name: invite.creatorName,
          email: invite.creatorEmail,
        },
        usesRemaining: (invite.maxUses || 1) - (invite.usedCount || 0),
      },
    });

  } catch (error) {
    console.error('Validate invite error:', error);
    return NextResponse.json(
      { error: 'Failed to validate invite' },
      { status: 500 }
    );
  }
}