import { NextRequest, NextResponse } from 'next/server';
import { generateCodeVerifier, generateCodeChallenge, generateState } from '@/lib/auth/pkce';

// Using Node.js runtime for crypto operations

export async function GET(request: NextRequest) {
  try {
    // Check if user is signed in
    const userSessionId = request.cookies.get('user_session')?.value;
    
    if (!userSessionId) {
      console.log('DEBUG: User not signed in, redirecting to login');
      return NextResponse.redirect(new URL('/login?message=Please sign in before connecting Spotify', request.url));
    }
    
    const state = generateState();

    const scopes = [
      'user-read-private',
      'user-read-email',
      'user-top-read',
      'user-read-recently-played',
      'playlist-read-private',
      'playlist-read-collaborative',
      'playlist-modify-public',
      'playlist-modify-private',
      'user-library-read',
      'user-follow-read',
    ].join(' ');

    // Use SPOTIFY_REDIRECT_URI from environment
    const redirectUri = process.env.SPOTIFY_REDIRECT_URI || 'https://queuestar.vercel.app/api/auth/spotify/callback';
    
    console.log('DEBUG: Environment SPOTIFY_REDIRECT_URI:', process.env.SPOTIFY_REDIRECT_URI);
    console.log('DEBUG: Using redirect URI:', redirectUri);

    // Use simpler OAuth flow without PKCE since cookies aren't working
    const params = new URLSearchParams({
      client_id: process.env.SPOTIFY_CLIENT_ID!,
      response_type: 'code',
      redirect_uri: redirectUri,
      state,
      scope: scopes,
      show_dialog: 'true', // Force Spotify to show authorization dialog every time
    });

    const authUrl = `https://accounts.spotify.com/authorize?${params}`;

    const response = NextResponse.redirect(authUrl);
    
    // Store state parameter for validation in callback
    response.cookies.set('spotify_state', state, {
      httpOnly: true,
      secure: false, // Allow HTTP for local development
      sameSite: 'lax',
      maxAge: 10 * 60, // 10 minutes
      path: '/',
    });
    
    console.log('DEBUG: Using redirect URI:', redirectUri);
    console.log('DEBUG: State:', state);
    
    return response;
  } catch (error) {
    console.error('Spotify OAuth initiation error:', error);
    return NextResponse.json(
      { error: 'Failed to initiate Spotify authorization' },
      { status: 500 }
    );
  }
}