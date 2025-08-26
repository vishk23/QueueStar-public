'use client';

import { useState, useRef } from 'react';

export interface AppleMusicSyncProgress {
  phase: 'library-songs' | 'library-albums' | 'library-playlists' | 'playlist-tracks' | 'recent-activity' | 'heavy-rotation' | 'completed';
  current: number;
  total: number;
  currentItem?: string;
}

interface AppleMusicDataSyncProps {
  musicKit: any;
  userId: string;
  onProgress?: (progress: AppleMusicSyncProgress) => void;
  onComplete?: () => void;
  onError?: (error: string) => void;
}

export default function AppleMusicDataSync({ 
  musicKit, 
  userId, 
  onProgress, 
  onComplete, 
  onError 
}: AppleMusicDataSyncProps) {
  const [isRunning, setIsRunning] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const syncAppleMusicData = async () => {
    if (!musicKit || isRunning) return;

    setIsRunning(true);
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    try {
      console.log('APPLE: Starting comprehensive MusicKit v3 data sync');
      
      // 1. Sync Library Songs (comprehensive data)
      await syncLibrarySongs(musicKit, userId, signal, onProgress);
      
      // 2. Sync Library Albums (with track relationships)
      await syncLibraryAlbums(musicKit, userId, signal, onProgress);
      
      // 3. Sync Library Playlists (with all metadata)
      await syncLibraryPlaylists(musicKit, userId, signal, onProgress);
      
      // 4. Sync Recent Activity (listening history)
      await syncRecentActivity(musicKit, userId, signal, onProgress);
      
      // 5. Sync Heavy Rotation (top tracks)
      await syncHeavyRotation(musicKit, userId, signal, onProgress);
      
      onProgress?.({ phase: 'completed', current: 100, total: 100 });
      onComplete?.();
      console.log('APPLE: Complete MusicKit v3 data sync finished successfully');
      
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('APPLE: Data sync was cancelled');
      } else {
        console.error('APPLE: Data sync failed:', error);
        onError?.(error.message || 'Data sync failed');
      }
    } finally {
      setIsRunning(false);
      abortControllerRef.current = null;
    }
  };

  const stopSync = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  return (
    <div className="apple-music-sync">
      {!isRunning ? (
        <button 
          onClick={syncAppleMusicData}
          className="btn btn-primary"
        >
          Start Data Sync
        </button>
      ) : (
        <button 
          onClick={stopSync}
          className="btn btn-warning"
        >
          Cancel Sync
        </button>
      )}
    </div>
  );
}

async function syncLibrarySongs(
  musicKit: any, 
  userId: string, 
  signal: AbortSignal,
  onProgress?: (progress: AppleMusicSyncProgress) => void
) {
  console.log('APPLE: Syncing library songs with full MusicKit v3 data...');
  
  const BATCH_SIZE = 100;
  let offset = 0;
  let totalProcessed = 0;
  let hasMore = true;

  while (hasMore && !signal.aborted) {
    try {
      // Use MusicKit v3's full native passthrough for comprehensive song data
      const response = await musicKit.api.library.songs({ 
        limit: BATCH_SIZE, 
        offset,
        include: ['albums', 'artists', 'genres'] // Full relationship data
      });

      if (!response || response.length === 0) {
        hasMore = false;
        break;
      }

      const songs = response.map((song: any) => ({
        // Core identification
        userId,
        appleTrackId: song.id,
        trackType: song.type,
        
        // Basic metadata
        trackName: song.attributes?.name || 'Unknown Track',
        artistName: song.attributes?.artistName || 'Unknown Artist',
        albumName: song.attributes?.albumName || '',
        
        // Extended metadata from MusicKit v3
        composerName: song.attributes?.composerName,
        genreNames: song.attributes?.genreNames || [],
        releaseDate: song.attributes?.releaseDate,
        trackNumber: song.attributes?.trackNumber,
        discNumber: song.attributes?.discNumber,
        durationMs: song.attributes?.durationInMillis,
        
        // Audio characteristics
        isExplicit: song.attributes?.contentRating === 'explicit',
        hasLyrics: song.attributes?.hasLyrics,
        isrc: song.attributes?.isrc,
        
        // Artwork
        artworkUrl: song.attributes?.artwork?.url,
        artworkWidth: song.attributes?.artwork?.width,
        artworkHeight: song.attributes?.artwork?.height,
        
        // Play parameters
        catalogId: song.attributes?.playParams?.catalogId,
        playParamsId: song.attributes?.playParams?.id,
        isLibrary: song.attributes?.playParams?.isLibrary,
        playParamsKind: song.attributes?.playParams?.kind,
        
        // Relationships (from include parameter)
        albumData: song.relationships?.albums?.data?.[0],
        artistData: song.relationships?.artists?.data,
        genreData: song.relationships?.genres?.data,
        
        // Store complete raw data for future use
        rawDataRecord: song,
        fetchedAt: new Date().toISOString(),
        syncVersion: Date.now()
      }));

      // Send batch to server
      const saveResponse = await fetch('/api/sync/apple/library-songs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ songs }),
      });

      if (!saveResponse.ok) {
        throw new Error(`Failed to save songs batch: ${saveResponse.status}`);
      }

      totalProcessed += songs.length;
      offset += BATCH_SIZE;

      onProgress?.({
        phase: 'library-songs',
        current: totalProcessed,
        total: totalProcessed + (response.length === BATCH_SIZE ? BATCH_SIZE : 0),
        currentItem: `${totalProcessed} songs processed`
      });

      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));

    } catch (error) {
      console.error('APPLE: Error syncing library songs batch:', error);
      throw error;
    }
  }

  console.log(`APPLE: Library songs sync completed - ${totalProcessed} songs processed`);
}

async function syncLibraryAlbums(
  musicKit: any, 
  userId: string, 
  signal: AbortSignal,
  onProgress?: (progress: AppleMusicSyncProgress) => void
) {
  console.log('APPLE: Syncing library albums with full relationship data...');
  
  const BATCH_SIZE = 50;
  let offset = 0;
  let totalProcessed = 0;
  let hasMore = true;

  while (hasMore && !signal.aborted) {
    try {
      const response = await musicKit.api.library.albums({ 
        limit: BATCH_SIZE, 
        offset,
        include: ['tracks', 'artists', 'genres'] // Full relationship data
      });

      if (!response || response.length === 0) {
        hasMore = false;
        break;
      }

      const albums = response.map((album: any) => ({
        userId,
        appleAlbumId: album.id,
        albumType: album.type,
        
        // Core album data
        albumName: album.attributes?.name || 'Unknown Album',
        artistName: album.attributes?.artistName || 'Unknown Artist',
        
        // Extended metadata
        copyright: album.attributes?.copyright,
        editorialNotes: album.attributes?.editorialNotes,
        genreNames: album.attributes?.genreNames || [],
        releaseDate: album.attributes?.releaseDate,
        trackCount: album.attributes?.trackCount,
        isSingle: album.attributes?.isSingle,
        isComplete: album.attributes?.isComplete,
        recordLabel: album.attributes?.recordLabel,
        upc: album.attributes?.upc,
        
        // Artwork
        artworkUrl: album.attributes?.artwork?.url,
        artworkWidth: album.attributes?.artwork?.width,
        artworkHeight: album.attributes?.artwork?.height,
        
        // Play parameters
        catalogId: album.attributes?.playParams?.catalogId,
        playParamsId: album.attributes?.playParams?.id,
        isLibrary: album.attributes?.playParams?.isLibrary,
        
        // Relationships
        trackData: album.relationships?.tracks?.data,
        artistData: album.relationships?.artists?.data,
        genreData: album.relationships?.genres?.data,
        
        rawDataRecord: album,
        fetchedAt: new Date().toISOString(),
        syncVersion: Date.now()
      }));

      const saveResponse = await fetch('/api/sync/apple/library-albums', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ albums }),
      });

      if (!saveResponse.ok) {
        throw new Error(`Failed to save albums batch: ${saveResponse.status}`);
      }

      totalProcessed += albums.length;
      offset += BATCH_SIZE;

      onProgress?.({
        phase: 'library-albums',
        current: totalProcessed,
        total: totalProcessed + (response.length === BATCH_SIZE ? BATCH_SIZE : 0),
        currentItem: `${totalProcessed} albums processed`
      });

      await new Promise(resolve => setTimeout(resolve, 150));

    } catch (error) {
      console.error('APPLE: Error syncing library albums batch:', error);
      throw error;
    }
  }

  console.log(`APPLE: Library albums sync completed - ${totalProcessed} albums processed`);
}

async function syncLibraryPlaylists(
  musicKit: any, 
  userId: string, 
  signal: AbortSignal,
  onProgress?: (progress: AppleMusicSyncProgress) => void
) {
  console.log('APPLE: Syncing library playlists with tracks...');
  
  const BATCH_SIZE = 25;
  let offset = 0;
  let totalProcessed = 0;
  let hasMore = true;

  while (hasMore && !signal.aborted) {
    try {
      const response = await musicKit.api.library.playlists({ 
        limit: BATCH_SIZE, 
        offset,
        include: ['tracks', 'curator'] // Include track relationships and curator info
      });

      if (!response || response.length === 0) {
        hasMore = false;
        break;
      }

      const playlists = response.map((playlist: any) => ({
        userId,
        applePlaylistId: playlist.id,
        playlistType: playlist.type,
        
        // Core playlist data
        playlistName: playlist.attributes?.name || 'Untitled Playlist',
        description: playlist.attributes?.description?.standard,
        
        // Extended metadata
        trackCount: playlist.attributes?.trackCount,
        canEdit: playlist.attributes?.canEdit,
        isPublic: playlist.attributes?.isPublic,
        lastModifiedDate: playlist.attributes?.lastModifiedDate,
        
        // Curator information (for curated playlists)
        curatorName: playlist.attributes?.curatorName,
        
        // Artwork
        artworkUrl: playlist.attributes?.artwork?.url,
        artworkWidth: playlist.attributes?.artwork?.width,
        artworkHeight: playlist.attributes?.artwork?.height,
        
        // Play parameters
        catalogId: playlist.attributes?.playParams?.catalogId,
        playParamsId: playlist.attributes?.playParams?.id,
        isLibrary: playlist.attributes?.playParams?.isLibrary,
        globalId: playlist.attributes?.playParams?.globalId,
        
        // Relationships
        trackData: playlist.relationships?.tracks?.data,
        curatorData: playlist.relationships?.curator?.data,
        
        rawDataRecord: playlist,
        fetchedAt: new Date().toISOString(),
        syncVersion: Date.now()
      }));

      const saveResponse = await fetch('/api/sync/apple/library-playlists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ playlists }),
      });

      if (!saveResponse.ok) {
        throw new Error(`Failed to save playlists batch: ${saveResponse.status}`);
      }

      // Sync individual playlist tracks for each playlist
      for (const playlist of response) {
        if (!signal.aborted) {
          await syncPlaylistTracks(musicKit, userId, playlist.id, signal);
        }
      }

      totalProcessed += playlists.length;
      offset += BATCH_SIZE;

      onProgress?.({
        phase: 'library-playlists',
        current: totalProcessed,
        total: totalProcessed + (response.length === BATCH_SIZE ? BATCH_SIZE : 0),
        currentItem: `${totalProcessed} playlists processed`
      });

      await new Promise(resolve => setTimeout(resolve, 200));

    } catch (error) {
      console.error('APPLE: Error syncing library playlists batch:', error);
      throw error;
    }
  }

  console.log(`APPLE: Library playlists sync completed - ${totalProcessed} playlists processed`);
}

async function syncPlaylistTracks(
  musicKit: any, 
  userId: string, 
  playlistId: string, 
  signal: AbortSignal
) {
  try {
    const tracks = await musicKit.api.library.playlistRelationship(
      playlistId, 
      'tracks',
      { limit: 1000 }
    );

    if (tracks && tracks.length > 0) {
      const playlistTracks = tracks.map((track: any, index: number) => ({
        userId,
        applePlaylistId: playlistId,
        appleTrackId: track.id,
        trackType: track.type,
        trackPosition: index + 1,
        
        // Full track metadata
        trackName: track.attributes?.name || 'Unknown Track',
        artistName: track.attributes?.artistName || 'Unknown Artist',
        albumName: track.attributes?.albumName || '',
        durationMs: track.attributes?.durationInMillis,
        trackNumber: track.attributes?.trackNumber,
        discNumber: track.attributes?.discNumber,
        releaseDate: track.attributes?.releaseDate,
        hasLyrics: track.attributes?.hasLyrics,
        contentRating: track.attributes?.contentRating,
        genreNames: track.attributes?.genreNames || [],
        
        // Artwork
        artworkUrl: track.attributes?.artwork?.url,
        artworkWidth: track.attributes?.artwork?.width,
        artworkHeight: track.attributes?.artwork?.height,
        
        // Play parameters
        catalogId: track.attributes?.playParams?.catalogId,
        playParamsId: track.attributes?.playParams?.id,
        isLibrary: track.attributes?.playParams?.isLibrary,
        playParamsKind: track.attributes?.playParams?.kind,
        
        rawDataRecord: track,
        fetchedAt: new Date().toISOString(),
        syncVersion: Date.now()
      }));

      const saveResponse = await fetch('/api/sync/apple/playlist-tracks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ tracks: playlistTracks }),
      });

      if (!saveResponse.ok) {
        console.error(`Failed to save playlist tracks for ${playlistId}: ${saveResponse.status}`);
      }
    }
  } catch (error) {
    console.error(`APPLE: Error syncing tracks for playlist ${playlistId}:`, error);
  }
}

async function syncRecentActivity(
  musicKit: any, 
  userId: string, 
  signal: AbortSignal,
  onProgress?: (progress: AppleMusicSyncProgress) => void
) {
  console.log('APPLE: Syncing recent activity and listening history...');
  
  try {
    // Get recently played tracks using proper MusicKit v3 API
    let recentlyPlayedTracks = [];
    try {
      const response = await musicKit.api.v1.me.recent.played.tracks({ 
        limit: 100,
        types: ['library-songs', 'songs']
      });
      
      recentlyPlayedTracks = response.map((track: any) => ({
        userId,
        appleTrackId: track.id,
        trackName: track.attributes?.name || 'Unknown Track',
        artistName: track.attributes?.artistName || 'Unknown Artist',
        albumName: track.attributes?.albumName || 'Unknown Album',
        durationMs: track.attributes?.durationInMillis,
        albumArtUrl: track.attributes?.artwork?.url?.replace('{w}', '640').replace('{h}', '640'),
        previewUrl: track.attributes?.previews?.[0]?.url,
        isrc: track.attributes?.isrc,
        contentRating: track.attributes?.contentRating,
        genres: track.attributes?.genreNames || [],
        playedAt: new Date().toISOString(), // Apple doesn't provide exact play time
        contextType: 'unknown',
        contextName: null,
        contextAppleId: null,
        trackMetadata: track,
        fetchedAt: new Date().toISOString()
      }));
      
      console.log(`APPLE: Found ${recentlyPlayedTracks.length} recently played tracks`);
    } catch (e) {
      console.log('APPLE: Recently played tracks not available via v3 API:', e);
    }

    if (recentlyPlayedTracks.length > 0) {
      const saveResponse = await fetch('/api/sync/apple/recently-played', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ recentlyPlayedTracks }),
      });

      if (!saveResponse.ok) {
        console.warn(`Failed to save recently played tracks: ${saveResponse.status}`);
      } else {
        console.log(`APPLE: Saved ${recentlyPlayedTracks.length} recently played tracks`);
      }
    }

    onProgress?.({
      phase: 'recent-activity',
      current: 1,
      total: 1,
      currentItem: `Recent activity synced (${recentlyPlayedTracks.length} tracks)`
    });

  } catch (error) {
    console.error('APPLE: Error syncing recent activity:', error);
    // Don't throw for optional data - this is listening history
  }
}

async function syncHeavyRotation(
  musicKit: any, 
  userId: string, 
  _signal: AbortSignal,
  onProgress?: (progress: AppleMusicSyncProgress) => void
) {
  console.log('APPLE: Syncing heavy rotation (top tracks/artists)...');
  
  try {
    // Get top tracks from heavy rotation
    let topTracks = [];
    try {
      const heavyRotationResponse = await musicKit.api.v1.me.history.heavyRotation({ 
        limit: 50,
        types: ['library-songs', 'songs']
      });
      
      topTracks = heavyRotationResponse.map((track: any, index: number) => ({
        userId,
        appleTrackId: track.id,
        trackName: track.attributes?.name || 'Unknown Track',
        artistName: track.attributes?.artistName || 'Unknown Artist',
        albumName: track.attributes?.albumName || 'Unknown Album',
        durationMs: track.attributes?.durationInMillis,
        albumArtUrl: track.attributes?.artwork?.url?.replace('{w}', '640').replace('{h}', '640'),
        previewUrl: track.attributes?.previews?.[0]?.url,
        isrc: track.attributes?.isrc,
        contentRating: track.attributes?.contentRating,
        genres: track.attributes?.genreNames || [],
        rotationType: 'heavy_rotation',
        rank: index + 1,
        trackMetadata: track,
        fetchedAt: new Date().toISOString()
      }));
      
      console.log(`APPLE: Found ${topTracks.length} top tracks from heavy rotation`);
    } catch (e) {
      console.log('APPLE: Heavy rotation tracks not available:', e);
    }

    // Get top artists from heavy rotation
    let topArtists = [];
    try {
      const artistsResponse = await musicKit.api.v1.me.history.heavyRotation({ 
        limit: 50,
        types: ['artists']
      });
      
      topArtists = artistsResponse.map((artist: any, index: number) => ({
        userId,
        appleArtistId: artist.id,
        artistName: artist.attributes?.name || 'Unknown Artist',
        genres: artist.attributes?.genreNames || [],
        imageUrl: artist.attributes?.artwork?.url?.replace('{w}', '640').replace('{h}', '640'),
        editorialNotes: artist.attributes?.editorialNotes,
        rotationType: 'heavy_rotation',
        rank: index + 1,
        artistMetadata: artist,
        fetchedAt: new Date().toISOString()
      }));
      
      console.log(`APPLE: Found ${topArtists.length} top artists from heavy rotation`);
    } catch (e) {
      console.log('APPLE: Heavy rotation artists not available:', e);
    }

    // Save top tracks
    if (topTracks.length > 0) {
      const tracksResponse = await fetch('/api/sync/apple/top-tracks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ topTracks }),
      });

      if (!tracksResponse.ok) {
        console.warn(`Failed to save top tracks: ${tracksResponse.status}`);
      } else {
        console.log(`APPLE: Saved ${topTracks.length} top tracks`);
      }
    }

    // Save top artists
    if (topArtists.length > 0) {
      const artistsResponse = await fetch('/api/sync/apple/top-artists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ topArtists }),
      });

      if (!artistsResponse.ok) {
        console.warn(`Failed to save top artists: ${artistsResponse.status}`);
      } else {
        console.log(`APPLE: Saved ${topArtists.length} top artists`);
      }
    }

    onProgress?.({
      phase: 'heavy-rotation',
      current: 1,
      total: 1,
      currentItem: `Top content synced (${topTracks.length} tracks, ${topArtists.length} artists)`
    });

  } catch (error) {
    console.error('APPLE: Error syncing heavy rotation:', error);
    // Don't throw for optional data - this is top tracks/artists
  }
}