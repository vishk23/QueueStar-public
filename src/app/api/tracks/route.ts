import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users, providerConnections } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { decryptToken } from '@/lib/crypto';
import { createSpotifyProvider, createAppleProvider } from '@/lib/providers';
// TODO: import { userTopTracks } from '@/db/schema'; when schema exists

// Force dynamic rendering due to request-specific data
export const dynamic = 'force-dynamic';

export async function GET(_request: NextRequest) {
  // TODO: Implement userTopTracks schema and uncomment
  return NextResponse.json(
    { error: 'User top tracks API not yet implemented' },
    { status: 501 }
  );
  
  /*
  try {
    // Get user session from cookie
    const userSessionId = request.cookies.get('user_session')?.value;
    
    if (!userSessionId) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const provider = searchParams.get('provider') as 'spotify' | 'apple' | null;
    const timeRange = searchParams.get('timeRange') as 'short_term' | 'medium_term' | 'long_term' || 'medium_term';
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 50);

    // Validate provider parameter
    if (provider && !['spotify', 'apple'].includes(provider)) {
      return NextResponse.json(
        { error: 'Invalid provider. Must be spotify or apple' },
        { status: 400 }
      );
    }

    // Get user's provider connections
    let connectionsQuery = db.query.providerConnections.findMany({
      where: eq(providerConnections.userId, userSessionId),
      with: {
        topTracks: {
          where: eq(userTopTracks.timeRange, timeRange),
          limit,
          orderBy: (tracks, { asc }) => [asc(tracks.rank)],
        },
      },
    });

    // Filter by provider if specified
    if (provider) {
      connectionsQuery = db.query.providerConnections.findMany({
        where: and(
          eq(providerConnections.userId, userSessionId),
          eq(providerConnections.provider, provider)
        ),
        with: {
          topTracks: {
            where: eq(userTopTracks.timeRange, timeRange),
            limit,
            orderBy: (tracks, { asc }) => [asc(tracks.rank)],
          },
        },
      });
    }

    const connections = await connectionsQuery;

    if (connections.length === 0) {
      return NextResponse.json({
        tracks: [],
        message: provider 
          ? `No ${provider} connection found`
          : 'No provider connections found'
      });
    }

    // Format response
    const tracksByProvider: Record<string, any[]> = {};

    for (const connection of connections) {
      tracksByProvider[connection.provider] = connection.topTracks.map(track => ({
        id: track.trackId,
        name: track.trackName,
        artist: track.artistName,
        album: track.albumName,
        albumArt: track.albumArtUrl,
        durationMs: track.durationMs,
        isrc: track.isrc,
        rank: track.rank,
        provider: connection.provider,
        fetchedAt: track.fetchedAt,
      }));
    }

    return NextResponse.json({
      tracks: tracksByProvider,
      timeRange,
      totalConnections: connections.length,
    });

  } catch (error) {
    console.error('Track fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tracks' },
      { status: 500 }
    );
  }
}

  */
}

export async function POST(_request: NextRequest) {
  // TODO: Implement userTopTracks schema and uncomment
  return NextResponse.json(
    { error: 'User top tracks sync not yet implemented' },
    { status: 501 }
  );
  
  /*
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
    const { provider, timeRange = 'medium_term', force = false } = body;

    // Validate input
    if (!provider || !['spotify', 'apple'].includes(provider)) {
      return NextResponse.json(
        { error: 'Provider is required and must be spotify or apple' },
        { status: 400 }
      );
    }

    if (!['short_term', 'medium_term', 'long_term'].includes(timeRange)) {
      return NextResponse.json(
        { error: 'Invalid time range' },
        { status: 400 }
      );
    }

    // Get user's provider connection
    const connection = await db.query.providerConnections.findFirst({
      where: and(
        eq(providerConnections.userId, userSessionId),
        eq(providerConnections.provider, provider)
      ),
    });

    if (!connection) {
      return NextResponse.json(
        { error: `No ${provider} connection found. Please connect your ${provider} account first.` },
        { status: 404 }
      );
    }

    // Check if we need to refresh (unless forced)
    if (!force) {
      const existingTracks = await db.query.userTopTracks.findMany({
        where: and(
          eq(userTopTracks.connectionId, connection.id),
          eq(userTopTracks.timeRange, timeRange)
        ),
        limit: 1,
      });

      if (existingTracks.length > 0) {
        const lastFetch = existingTracks[0].fetchedAt;
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        
        if (lastFetch > oneHourAgo) {
          return NextResponse.json({
            message: 'Tracks were recently fetched. Use force=true to refresh.',
            lastFetch,
          });
        }
      }
    }

    // Decrypt access token
    const accessToken = decryptToken(connection.accessTokenEncrypted);

    // Create provider instance and fetch tracks
    let tracks: any[] = [];
    
    if (provider === 'spotify') {
      const spotifyProvider = createSpotifyProvider(accessToken);
      tracks = await spotifyProvider.getTopTracks(timeRange, 50);
    } else if (provider === 'apple') {
      const appleProvider = createAppleProvider(
        accessToken,
        process.env.APPLE_TEAM_ID!,
        process.env.APPLE_KEY_ID!,
        process.env.APPLE_PRIVATE_KEY!
      );
      tracks = await appleProvider.getTopTracks(timeRange, 50);
    }

    // Store tracks in database
    await db.transaction(async (tx) => {
      // Clear existing tracks for this time range
      await tx.delete(userTopTracks).where(
        and(
          eq(userTopTracks.connectionId, connection.id),
          eq(userTopTracks.timeRange, timeRange)
        )
      );

      // Insert new tracks
      if (tracks.length > 0) {
        await tx.insert(userTopTracks).values(
          tracks.map((track, index) => ({
            connectionId: connection.id,
            trackId: track.id,
            trackName: track.name,
            artistName: track.artist,
            albumName: track.album,
            albumArtUrl: track.albumArt,
            durationMs: track.durationMs,
            isrc: track.isrc,
            trackMetadata: track,
            timeRange,
            rank: index + 1,
          }))
        );
      }
    });

    return NextResponse.json({
      success: true,
      provider,
      timeRange,
      tracksCount: tracks.length,
      tracks: tracks.map((track, index) => ({
        id: track.id,
        name: track.name,
        artist: track.artist,
        album: track.album,
        albumArt: track.albumArt,
        durationMs: track.durationMs,
        isrc: track.isrc,
        rank: index + 1,
        provider,
      })),
    });

  } catch (error) {
    console.error('Track sync error:', error);
    return NextResponse.json(
      { error: 'Failed to sync tracks' },
      { status: 500 }
    );
  }
  */
}