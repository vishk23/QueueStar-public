import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Check if user is signed in
    const userSessionId = request.cookies.get('user_session')?.value;
    
    if (!userSessionId) {
      console.log('DEBUG: User not signed in, redirecting to login');
      const requestUrl = new URL(request.url);
      return NextResponse.redirect(
        new URL('/login?message=Please sign in before connecting Apple Music', `${requestUrl.protocol}//${requestUrl.host}`)
      );
    }
    
    // For Apple Music, we redirect to a page that handles MusicKit JS authorization
    // This is different from Spotify's server-to-server OAuth flow
    const requestUrl = new URL(request.url);
    const redirectUrl = new URL('/connect/apple', `${requestUrl.protocol}//${requestUrl.host}`);
    
    console.log('DEBUG: Redirecting to Apple Music connection page');
    console.log('DEBUG: Original host:', requestUrl.host);
    console.log('DEBUG: Redirect URL:', redirectUrl.toString());
    console.log('DEBUG: User session ID:', userSessionId);
    
    return NextResponse.redirect(redirectUrl);
    
  } catch (error) {
    console.error('Apple Music OAuth initiation error:', error);
    return NextResponse.json(
      { error: 'Failed to initiate Apple Music authorization' },
      { status: 500 }
    );
  }
}