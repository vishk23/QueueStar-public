import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { 
  users, 
  providerConnections,
  appleLibrarySongs,
  appleLibraryAlbums,
  appleLibraryPlaylists,
  appleLibraryPlaylistTracks,
  appleUserProfiles
} from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { encryptToken } from '@/lib/crypto';
import { AppleMusicProvider } from '@/lib/providers/apple';

// Force dynamic rendering due to request-specific data
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { musicUserToken, developerToken } = body;

    if (!musicUserToken || !developerToken) {
      return NextResponse.json(
        { error: 'Missing Apple Music tokens' },
        { status: 400 }
      );
    }

    // Get the currently signed-in user from session cookie
    const userSessionId = request.cookies.get('user_session')?.value;
    
    let user;
    if (userSessionId) {
      // If user is signed in, link Apple Music to their account
      console.log('DEBUG: Found user session, linking Apple Music to user:', userSessionId);
      [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, userSessionId));
        
      if (!user) {
        console.log('DEBUG: Session user not found, returning error');
        return NextResponse.json(
          { error: 'Invalid session' },
          { status: 401 }
        );
      }
    } else {
      console.log('DEBUG: No user session found');
      return NextResponse.json(
        { error: 'Please sign in before connecting Apple Music' },
        { status: 401 }
      );
    }

    // Apple Music user tokens don't expire for 6 months
    const expiresAt = new Date(Date.now() + 6 * 30 * 24 * 60 * 60 * 1000); // 6 months

    // Create Apple Music provider instance (note: constructor changed)
    const appleProvider = new AppleMusicProvider(developerToken, musicUserToken);
    
    // Get user profile from Apple Music (via MusicKit JS)
    const userProfile = await appleProvider.getUserProfile();

    // Extract storefront ID from user profile (this acts as provider user ID)
    const storefrontId = userProfile.id.replace('apple_', '').replace('_user', '');

    // Check if provider connection already exists
    const existingConnection = await db
      .select()
      .from(providerConnections)
      .where(
        and(
          eq(providerConnections.userId, user.id),
          eq(providerConnections.provider, 'apple')
        )
      );

    if (existingConnection.length > 0) {
      // Update existing connection
      await db
        .update(providerConnections)
        .set({
          providerUserId: storefrontId,
          accessTokenEncrypted: encryptToken(musicUserToken),
          refreshTokenEncrypted: encryptToken(developerToken), // Store developer token
          tokenExpiresAt: expiresAt,
          providerMetadata: {
            storefront_id: storefrontId,
            subscription_type: userProfile.subscriptionType,
            connected_via: 'musickit_js',
          },
          lastSyncAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(providerConnections.id, existingConnection[0].id));
    } else {
      // Create new connection
      await db.insert(providerConnections).values({
        userId: user.id,
        provider: 'apple',
        providerUserId: storefrontId,
        accessTokenEncrypted: encryptToken(musicUserToken),
        refreshTokenEncrypted: encryptToken(developerToken), // Store developer token
        tokenExpiresAt: expiresAt,
        providerMetadata: {
          storefront_id: storefrontId,
          subscription_type: userProfile.subscriptionType,
          connected_via: 'musickit_js',
        },
        lastSyncAt: new Date(),
      });
    }

    // Store user profile in Apple-specific table
    // First check if profile already exists
    const existingProfile = await db
      .select()
      .from(appleUserProfiles)
      .where(eq(appleUserProfiles.userId, user.id));

    if (existingProfile.length > 0) {
      // Update existing profile
      await db
        .update(appleUserProfiles)
        .set({
          storefrontId,
          subscriptionStatus: userProfile.subscriptionType,
          lastSyncedAt: new Date(),
        })
        .where(eq(appleUserProfiles.userId, user.id));
    } else {
      // Create new profile
      await db.insert(appleUserProfiles).values({
        userId: user.id,
        storefrontId,
        subscriptionStatus: userProfile.subscriptionType,
      });
    }

    console.log('DEBUG: Apple Music connection successful for user:', user.id);

    // Return success with connection details and sync initiation flag
    const response = NextResponse.json({
      success: true,
      message: 'Apple Music connected successfully',
      provider: 'apple',
      shouldStartSync: true, // Signal client to start background sync
      userProfile: {
        id: storefrontId,
        displayName: userProfile.displayName,
        subscriptionType: userProfile.subscriptionType,
      },
    });

    return response;
  } catch (error) {
    console.error('Apple Music OAuth callback error:', error);
    return NextResponse.json(
      { error: 'OAuth callback failed' },
      { status: 500 }
    );
  }
}

