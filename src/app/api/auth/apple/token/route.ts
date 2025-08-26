import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

export async function GET(request: NextRequest) {
  try {
    // Check if user is signed in
    const userSessionId = request.cookies.get('user_session')?.value;
    
    if (!userSessionId) {
      return NextResponse.json(
        { error: 'User not authenticated' },
        { status: 401 }
      );
    }

    // Get Apple Music configuration from environment
    const teamId = process.env.APPLE_TEAM_ID;
    const keyId = process.env.APPLE_KEY_ID;
    const privateKey = process.env.APPLE_PRIVATE_KEY;

    if (!teamId || !keyId || !privateKey) {
      console.error('Missing Apple Music configuration:', {
        teamId: !!teamId,
        keyId: !!keyId,
        privateKey: !!privateKey,
      });
      return NextResponse.json(
        { error: 'Apple Music service not configured' },
        { status: 500 }
      );
    }

    // Generate JWT token for Apple Music MusicKit JS
    const now = Math.floor(Date.now() / 1000);
    const expiration = now + (180 * 24 * 60 * 60); // 180 days (max allowed)

    const token = jwt.sign(
      {
        iss: teamId,
        iat: now,
        exp: expiration,
      },
      privateKey,
      {
        algorithm: 'ES256',
        keyid: keyId,
      }
    );

    return NextResponse.json({
      token,
      expiresAt: expiration * 1000, // Convert to milliseconds for JavaScript Date
      issuedAt: now * 1000,
    });

  } catch (error) {
    console.error('Apple Music token generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate Apple Music token' },
      { status: 500 }
    );
  }
}