import { NextRequest, NextResponse } from 'next/server';

// Force dynamic rendering due to request-specific data
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // Clear the user session cookie
    const response = NextResponse.json({ success: true });
    
    response.cookies.delete('user_session');

    return response;
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'Failed to logout' },
      { status: 500 }
    );
  }
}