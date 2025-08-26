import { db } from '@/db';
import { 
  users, 
  providerConnections,
  spotifyTopTracks,
  appleLibrarySongs,
  appleHeavyRotation
} from '@/db/schema';
import { eq, and } from 'drizzle-orm';

// Apple Music canonical track format for blend generation
export interface AppleTrack {
  id: string;
  title: string;
  artist: string;
  album: string;
  artworkUrl: string;
  durationMs?: number;
  isrc?: string;
  sourceProvider: 'apple' | 'spotify';
  
  // Audio features (0-100 scale)
  energy?: number;
  valence?: number;
  danceability?: number;
  tempo?: number;
  genre?: string;
}

/**
 * Get blend candidate tracks for a user (Apple Music canonical format)
 * Prioritizes Apple Music tracks, falls back to Spotify with conversion
 */
export const getBlendCandidateTracksForUser = async (
  userId: string, 
  targetCount: number = 30
): Promise<AppleTrack[]> => {
  console.log(`Getting blend candidates for user: ${userId.slice(0, 8)}`);
  const candidateTracks: AppleTrack[] = [];
  
  // Check user's connected providers
  const connections = await db
    .select()
    .from(providerConnections)
    .where(eq(providerConnections.userId, userId));
    
  const hasAppleMusic = connections.some(c => c.provider === 'apple');
  const hasSpotify = connections.some(c => c.provider === 'spotify');
  
  console.log(`User ${userId.slice(0, 8)} has: Apple=${hasAppleMusic}, Spotify=${hasSpotify}`);
  
  // Priority 1: Apple Music native tracks
  if (hasAppleMusic && candidateTracks.length < targetCount) {
    const appleTracks = await getAppleMusicTracks(userId, targetCount - candidateTracks.length);
    candidateTracks.push(...appleTracks);
  }
  
  // Priority 2: Convert Spotify tracks to Apple format
  if (hasSpotify && candidateTracks.length < targetCount) {
    const spotifyTracks = await getSpotifyTracksAsApple(userId, targetCount - candidateTracks.length);
    console.log(`User ${userId.slice(0, 8)} got ${spotifyTracks.length} Spotify tracks`);
    candidateTracks.push(...spotifyTracks);
  }
  
  console.log(`User ${userId.slice(0, 8)} final candidate count: ${candidateTracks.length}`);
  return candidateTracks.slice(0, targetCount);
};

/**
 * Get Apple Music tracks directly from synced data
 */
const getAppleMusicTracks = async (userId: string, count: number): Promise<AppleTrack[]> => {
  const tracks: AppleTrack[] = [];
  
  // Get from heavy rotation (recent favorites)
  const heavyRotation = await db
    .select()
    .from(appleHeavyRotation)
    .where(eq(appleHeavyRotation.userId, userId))
    .limit(Math.min(count, 15));
    
  console.log(`Found ${heavyRotation.length} Apple heavy rotation tracks for user ${userId.slice(0, 8)}`);
  
  if (heavyRotation.length > 0) {
    console.log('Sample Apple track:', JSON.stringify(heavyRotation[0], null, 2));
  }
    
  for (const track of heavyRotation) {
    // Skip tracks with missing essential data
    if (!track.resourceName || !track.artistName || (!track.catalogId && !track.id)) {
      console.log(`Skipping Apple track: name=${track.resourceName}, artist=${track.artistName}, catalogId=${track.catalogId}, id=${track.id}`);
      continue;
    }
    
    tracks.push({
      id: track.catalogId || track.id,
      title: track.resourceName,
      artist: track.artistName,
      album: track.albumName || '',
      artworkUrl: track.albumArtUrl || '',
      sourceProvider: 'apple',
      genre: (track as any).genres?.[0] // Take first genre if available
    });
  }
  
  // Fill remaining from library songs
  if (tracks.length < count) {
    const librarySongs = await db
      .select()
      .from(appleLibrarySongs)
      .where(eq(appleLibrarySongs.userId, userId))
      .limit(count - tracks.length);
      
    for (const song of librarySongs) {
      // Skip songs with missing essential data
      if (!song.trackName || !song.artistName || (!song.catalogId && !song.id)) continue;
      
      tracks.push({
        id: song.catalogId || song.id,
        title: song.trackName,
        artist: song.artistName,
        album: song.albumName || '',
        artworkUrl: song.artworkUrl || '',
        durationMs: song.durationMs || undefined,
        sourceProvider: 'apple',
        genre: song.genreNames?.[0]
      });
    }
  }
  
  return tracks;
};

/**
 * Convert Spotify tracks to Apple Music canonical format
 */
const getSpotifyTracksAsApple = async (userId: string, count: number): Promise<AppleTrack[]> => {
  const spotifyTracks = await db
    .select()
    .from(spotifyTopTracks)
    .where(eq(spotifyTopTracks.userId, userId))
    .limit(count);
    
  console.log(`Found ${spotifyTracks.length} Spotify tracks for user ${userId.slice(0, 8)}`);
  
  if (spotifyTracks.length > 0) {
    console.log('Sample Spotify track:', JSON.stringify(spotifyTracks[0], null, 2));
  }
    
  const validTracks = spotifyTracks.filter(track => {
    const isValid = track.trackName && track.artistName && track.spotifyTrackId;
    if (!isValid) {
      console.log(`Skipping Spotify track: name=${track.trackName}, artist=${track.artistName}, id=${track.spotifyTrackId}`);
    }
    return isValid;
  });
  
  console.log(`Valid Spotify tracks after filtering: ${validTracks.length}`);
    
  return validTracks
    .map(track => ({
      id: track.spotifyTrackId, // Keep Spotify ID for now, could search Apple later
      title: track.trackName,
      artist: track.artistName,
      album: track.albumName || '',
      artworkUrl: track.albumArtUrl || '',
      durationMs: track.durationMs || undefined,
      sourceProvider: 'spotify' as const,
      
      // Convert Spotify audio features (0-1 scale) to 0-100 scale
      energy: (track as any).energy ? Math.round((track as any).energy * 100) : undefined,
      valence: (track as any).valence ? Math.round((track as any).valence * 100) : undefined,
      danceability: (track as any).danceability ? Math.round((track as any).danceability * 100) : undefined,
      tempo: (track as any).tempo || undefined,
      genre: (track as any).genres?.[0] // Take first genre
    }));
};

/**
 * Analyze user's music profile for LLM context
 */
export const getUserMusicProfile = async (userId: string) => {
  const tracks = await getBlendCandidateTracksForUser(userId, 50);
  
  // Extract genres
  const genres = tracks
    .map(t => t.genre)
    .filter(Boolean)
    .reduce((acc: Record<string, number>, genre) => {
      acc[genre!] = (acc[genre!] || 0) + 1;
      return acc;
    }, {});
    
  const topGenres = Object.entries(genres)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([genre]) => genre);
  
  // Calculate average audio features
  const validTracks = tracks.filter(t => t.energy && t.valence && t.danceability);
  const avgFeatures = validTracks.length > 0 ? {
    energy: Math.round(validTracks.reduce((sum, t) => sum + (t.energy || 0), 0) / validTracks.length),
    valence: Math.round(validTracks.reduce((sum, t) => sum + (t.valence || 0), 0) / validTracks.length),
    danceability: Math.round(validTracks.reduce((sum, t) => sum + (t.danceability || 0), 0) / validTracks.length),
    tempo: Math.round(validTracks.reduce((sum, t) => sum + (t.tempo || 0), 0) / validTracks.length)
  } : {
    energy: 50, valence: 50, danceability: 50, tempo: 120 // Default neutral values
  };
  
  return {
    userId,
    topGenres,
    audioSignature: avgFeatures,
    trackCount: tracks.length,
    candidateTracks: tracks.slice(0, 30) // Top 30 for LLM context
  };
};