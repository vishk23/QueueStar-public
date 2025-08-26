import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import { db } from '@/db';
import { users, invites, friends } from '@/db/schema';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    console.log('SIGNUP: Request received');
    const body = await request.json();
    const { email, displayName, password, inviteCode } = body;
    console.log('SIGNUP: Data parsed - email:', email, 'displayName:', displayName, 'inviteCode:', inviteCode);

    if (!email || !displayName || !password) {
      return NextResponse.json(
        { error: 'Email, display name, and password are required' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long' },
        { status: 400 }
      );
    }

    // Check if user already exists
    console.log('SIGNUP: Checking if user exists');
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, email.toLowerCase()),
    });

    if (existingUser) {
      console.log('SIGNUP: User already exists');
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      );
    }

    // Hash password
    console.log('SIGNUP: Hashing password');
    const passwordHash = await bcrypt.hash(password, 12);

    // Validate invite code if provided
    let inviteCreatorId = null;
    if (inviteCode) {
      console.log('SIGNUP: Validating invite code:', inviteCode);
      const [invite] = await db
        .select()
        .from(invites)
        .where(eq(invites.code, inviteCode));

      if (!invite) {
        return NextResponse.json(
          { error: 'Invalid invite code' },
          { status: 400 }
        );
      }

      // Check if expired
      if (invite.expiresAt && new Date() > invite.expiresAt) {
        return NextResponse.json(
          { error: 'Invite code has expired' },
          { status: 400 }
        );
      }

      // Check if max uses reached
      if ((invite.usedCount || 0) >= (invite.maxUses || 1)) {
        return NextResponse.json(
          { error: 'Invite code has been used up' },
          { status: 400 }
        );
      }

      inviteCreatorId = invite.createdBy;
      console.log('SIGNUP: Valid invite from user:', inviteCreatorId);
    }

    // Create user
    console.log('SIGNUP: Creating new user');
    const [newUser] = await db
      .insert(users)
      .values({
        email: email.toLowerCase(),
        displayName: displayName.trim(),
        passwordHash,
      })
      .returning();
    
    console.log('SIGNUP: User created with ID:', newUser.id);

    // Handle invite code processing
    if (inviteCode && inviteCreatorId) {
      await db.transaction(async (tx) => {
        // Update invite usage
        await tx
          .update(invites)
          .set({
            usedBy: newUser.id,
            usedCount: 1,
            usedAt: new Date(),
          })
          .where(eq(invites.code, inviteCode));

        // Auto-friend the invite creator
        await tx.insert(friends).values([
          {
            userId: newUser.id,
            friendId: inviteCreatorId,
            requestedBy: inviteCreatorId,
            status: 'accepted',
          },
          {
            userId: inviteCreatorId,
            friendId: newUser.id,
            requestedBy: inviteCreatorId,
            status: 'accepted',
          }
        ]);
      });

      console.log('SIGNUP: Processed invite and created friendship with user:', inviteCreatorId);
    }

    // Create session cookie
    const response = NextResponse.json({
      success: true,
      user: {
        id: newUser.id,
        email: newUser.email,
        displayName: newUser.displayName,
        avatarUrl: newUser.avatarUrl,
        createdAt: newUser.createdAt,
        updatedAt: newUser.updatedAt,
      },
    });

    // Set session cookie
    console.log('SIGNUP: Setting session cookie for user:', newUser.id);
    response.cookies.set('user_session', newUser.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    console.log('SIGNUP: Success - returning response');
    return response;
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}