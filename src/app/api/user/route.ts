import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users, providerConnections } from '@/db/schema';
import { eq } from 'drizzle-orm';

// Force dynamic rendering due to request-specific data
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Get user session from cookie
    const userSessionId = request.cookies.get('user_session')?.value;
    console.log('DEBUG /api/user: Session ID:', userSessionId);
    console.log('DEBUG /api/user: All cookies:', request.cookies.getAll());
    
    if (!userSessionId) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Fetch user with provider connections
    const user = await db.query.users.findFirst({
      where: eq(users.id, userSessionId),
      with: {
        providerConnections: {
          columns: {
            id: true,
            provider: true,
            providerUserId: true,
            tokenExpiresAt: true,
            createdAt: true,
            updatedAt: true,
            // Exclude encrypted tokens from response
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      providerConnections: user.providerConnections.map(conn => ({
        id: conn.id,
        provider: conn.provider,
        providerUserId: conn.providerUserId,
        tokenExpiresAt: conn.tokenExpiresAt,
        isExpired: conn.tokenExpiresAt ? new Date() > conn.tokenExpiresAt : false,
        createdAt: conn.createdAt,
        updatedAt: conn.updatedAt,
      })),
    });
  } catch (error) {
    console.error('User fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user data' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
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
    const { displayName, avatarUrl } = body;

    // Validate input
    if (!displayName || typeof displayName !== 'string' || displayName.trim().length === 0) {
      return NextResponse.json(
        { error: 'Display name is required' },
        { status: 400 }
      );
    }

    if (avatarUrl && typeof avatarUrl !== 'string') {
      return NextResponse.json(
        { error: 'Avatar URL must be a string' },
        { status: 400 }
      );
    }

    // Update user
    const [updatedUser] = await db
      .update(users)
      .set({
        displayName: displayName.trim(),
        avatarUrl: avatarUrl || null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userSessionId))
      .returning();

    if (!updatedUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        displayName: updatedUser.displayName,
        avatarUrl: updatedUser.avatarUrl,
        createdAt: updatedUser.createdAt,
        updatedAt: updatedUser.updatedAt,
      },
    });
  } catch (error) {
    console.error('User update error:', error);
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Get user session from cookie
    const userSessionId = request.cookies.get('user_session')?.value;
    
    if (!userSessionId) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Delete user (cascading will handle related records)
    await db.delete(users).where(eq(users.id, userSessionId));

    // Clear session cookie
    const response = NextResponse.json({ success: true });
    response.cookies.delete('user_session');

    return response;
  } catch (error) {
    console.error('User deletion error:', error);
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    );
  }
}