import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { ilike, ne, eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    
    if (!query || query.length < 2) {
      return NextResponse.json(
        { error: 'Search query must be at least 2 characters' },
        { status: 400 }
      );
    }

    // Get current user from session
    const userSessionId = request.cookies.get('user_session')?.value;
    if (!userSessionId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Search for users by email or name, excluding current user
    const searchResults = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.displayName,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(
        ne(users.id, userSessionId) // Exclude current user
      )
      .limit(10);

    // Filter results based on email or name containing query
    const filteredResults = searchResults.filter(user => 
      user.email?.toLowerCase().includes(query.toLowerCase()) ||
      user.name?.toLowerCase().includes(query.toLowerCase())
    );

    return NextResponse.json({
      success: true,
      users: filteredResults,
      query,
    });

  } catch (error) {
    console.error('Friend search error:', error);
    return NextResponse.json(
      { error: 'Failed to search users' },
      { status: 500 }
    );
  }
}