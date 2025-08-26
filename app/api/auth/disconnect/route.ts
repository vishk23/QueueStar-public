import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { 
  users, 
  providerConnections,
  appleLibrarySongs,
  appleLibraryAlbums,
  appleLibraryPlaylists,
  appleLibraryPlaylistTracks,
  spotifyUserProfiles,
  spotifyPlaylists,
  spotifyPlaylistTracks,
  spotifyRecentlyPlayed,
  spotifyTopTracks,
  spotifyTopArtists,
  appleUserProfiles,
  appleHeavyRotation,
  appleRecommendations
} from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { provider } = await request.json();
    
    if (!provider || !['spotify', 'apple'].includes(provider)) {
      return NextResponse.json(
        { error: 'Invalid provider' },
        { status: 400 }
      );
    }

    // Get user from session
    const userSessionId = request.cookies.get('user_session')?.value;
    if (!userSessionId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userSessionId));

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid session' },
        { status: 401 }
      );
    }

    console.log(`DISCONNECT: Starting ${provider} disconnect for user ${user.id}`);

    // Start a transaction to delete all provider data
    await db.transaction(async (tx) => {
      if (provider === 'apple') {
        // Delete Apple Music data
        console.log('DISCONNECT: Deleting Apple Music library songs...');
        await tx.delete(appleLibrarySongs).where(eq(appleLibrarySongs.userId, user.id));
        
        console.log('DISCONNECT: Deleting Apple Music library albums...');
        await tx.delete(appleLibraryAlbums).where(eq(appleLibraryAlbums.userId, user.id));
        
        console.log('DISCONNECT: Deleting Apple Music library playlist tracks...');
        await tx.delete(appleLibraryPlaylistTracks).where(eq(appleLibraryPlaylistTracks.userId, user.id));
        
        console.log('DISCONNECT: Deleting Apple Music library playlists...');
        await tx.delete(appleLibraryPlaylists).where(eq(appleLibraryPlaylists.userId, user.id));
        
        // Delete Apple Music profile and additional data
        try {
          console.log('DISCONNECT: Deleting Apple Music user profiles...');
          await tx.delete(appleUserProfiles).where(eq(appleUserProfiles.userId, user.id));
        } catch (e) {
          console.log('DISCONNECT: Apple user profiles table may not exist');
        }
        
        try {
          console.log('DISCONNECT: Deleting Apple Music heavy rotation...');
          await tx.delete(appleHeavyRotation).where(eq(appleHeavyRotation.userId, user.id));
        } catch (e) {
          console.log('DISCONNECT: Apple heavy rotation table may not exist');
        }
        
        try {
          console.log('DISCONNECT: Deleting Apple Music recommendations...');
          await tx.delete(appleRecommendations).where(eq(appleRecommendations.userId, user.id));
        } catch (e) {
          console.log('DISCONNECT: Apple recommendations table may not exist');
        }
        
      } else if (provider === 'spotify') {
        // Delete Spotify data
        console.log('DISCONNECT: Deleting Spotify playlist tracks...');
        await tx.delete(spotifyPlaylistTracks).where(eq(spotifyPlaylistTracks.userId, user.id));
        
        console.log('DISCONNECT: Deleting Spotify playlists...');
        await tx.delete(spotifyPlaylists).where(eq(spotifyPlaylists.userId, user.id));
        
        console.log('DISCONNECT: Deleting Spotify recently played...');
        await tx.delete(spotifyRecentlyPlayed).where(eq(spotifyRecentlyPlayed.userId, user.id));
        
        console.log('DISCONNECT: Deleting Spotify top tracks...');
        await tx.delete(spotifyTopTracks).where(eq(spotifyTopTracks.userId, user.id));
        
        console.log('DISCONNECT: Deleting Spotify top artists...');
        await tx.delete(spotifyTopArtists).where(eq(spotifyTopArtists.userId, user.id));
        
        console.log('DISCONNECT: Deleting Spotify user profile...');
        await tx.delete(spotifyUserProfiles).where(eq(spotifyUserProfiles.userId, user.id));
      }
      
      // Delete provider connection
      console.log('DISCONNECT: Deleting provider connection...');
      await tx.delete(providerConnections).where(
        and(
          eq(providerConnections.userId, user.id),
          eq(providerConnections.provider, provider as 'spotify' | 'apple')
        )
      );
    });

    console.log(`DISCONNECT: Successfully disconnected ${provider} for user ${user.id}`);
    
    return NextResponse.json({
      success: true,
      message: `${provider} disconnected successfully`
    });

  } catch (error) {
    console.error('Disconnect error:', error);
    return NextResponse.json(
      { error: 'Failed to disconnect provider' },
      { status: 500 }
    );
  }
}