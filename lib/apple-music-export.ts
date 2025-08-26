// Apple Music export functionality using MusicKit JS
// This handles creating playlists and adding tracks to Apple Music

interface AppleMusicTrack {
  id: string;
  name: string;
  artist: string;
  album: string;
  searchQuery: string;
}

interface PlaylistData {
  name: string;
  description: string;
  tracks: {
    apple: string[]; // Apple Music track IDs
    spotify: AppleMusicTrack[]; // Spotify tracks that need to be searched
  };
  totalTracks: number;
  appleTracks: number;
  spotifyTracks: number;
}

interface ExportResult {
  success: boolean;
  playlistId?: string;
  playlistUrl?: string;
  tracksAdded: number;
  tracksNotFound: number;
  errors?: string[];
}

/**
 * Export blend to Apple Music using MusicKit JS
 */
export const exportBlendToAppleMusic = async (
  blendId: string,
  onProgress?: (message: string, progress: number) => void
): Promise<ExportResult> => {
  try {
    // Check if MusicKit is available and user is authorized
    if (!window.MusicKit) {
      throw new Error('Apple Music is not available');
    }

    const music = window.MusicKit.getInstance();
    
    if (!music.isAuthorized) {
      onProgress?.('Please authorize Apple Music access...', 10);
      await music.authorize();
    }

    onProgress?.('Preparing playlist data...', 20);

    // Debug: Log the available API methods
    console.log('MusicKit instance:', music);
    console.log('Available API methods:', music.api);
    console.log('Available library methods:', (music.api as any).library);

    // Get playlist data from our API
    const response = await fetch(`/api/blends/${blendId}/export-apple`, {
      method: 'POST',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to prepare export');
    }

    const { playlist }: { playlist: PlaylistData } = await response.json();
    
    onProgress?.('Creating Apple Music playlist...', 30);

    // Create playlist using direct HTTP request through MusicKit
    const playlistResponse = await fetch('https://api.music.apple.com/v1/me/library/playlists', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${(music as any).developerToken}`,
        'Music-User-Token': (music as any).musicUserToken,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        attributes: {
          name: playlist.name,
          description: playlist.description,
        },
      }),
    });

    if (!playlistResponse.ok) {
      const error = await playlistResponse.text();
      throw new Error(`Failed to create playlist: ${error}`);
    }

    const playlistData = await playlistResponse.json();
    if (!playlistData.data?.[0]?.id) {
      throw new Error('Failed to create playlist - no ID returned');
    }

    const playlistId = playlistData.data[0].id;
    let tracksAdded = 0;
    let tracksNotFound = 0;
    const errors: string[] = [];

    onProgress?.('Adding tracks to playlist...', 50);

    // Add Apple Music tracks directly
    if (playlist.tracks.apple.length > 0) {
      try {
        const addAppleTracksResponse = await fetch(`https://api.music.apple.com/v1/me/library/playlists/${playlistId}/tracks`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${(music as any).developerToken}`,
            'Music-User-Token': (music as any).musicUserToken,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            data: playlist.tracks.apple.map(trackId => ({
              id: trackId,
              type: 'songs',
            })),
          }),
        });

        if (addAppleTracksResponse.ok) {
          tracksAdded += playlist.tracks.apple.length;
          onProgress?.(`Added ${playlist.tracks.apple.length} Apple Music tracks...`, 60);
        } else {
          const error = await addAppleTracksResponse.text();
          console.error('Error adding Apple Music tracks:', error);
          errors.push(`Failed to add ${playlist.tracks.apple.length} Apple Music tracks: ${error}`);
        }
      } catch (error) {
        console.error('Error adding Apple Music tracks:', error);
        errors.push(`Failed to add ${playlist.tracks.apple.length} Apple Music tracks`);
      }
    }

    // Search and add Spotify tracks
    if (playlist.tracks.spotify.length > 0) {
      onProgress?.('Searching for Spotify tracks on Apple Music...', 70);
      
      const foundTracks: string[] = [];
      
      for (let i = 0; i < playlist.tracks.spotify.length; i++) {
        const spotifyTrack = playlist.tracks.spotify[i];
        
        try {
          // Search Apple Music for the track using direct HTTP request
          const searchUrl = new URL('https://api.music.apple.com/v1/catalog/us/search');
          searchUrl.searchParams.append('term', spotifyTrack.searchQuery);
          searchUrl.searchParams.append('types', 'songs');
          searchUrl.searchParams.append('limit', '5');

          const searchResponse = await fetch(searchUrl.toString(), {
            headers: {
              'Authorization': `Bearer ${(music as any).developerToken}`,
            },
          });

          if (!searchResponse.ok) {
            throw new Error(`Search failed: ${searchResponse.statusText}`);
          }

          const searchData = await searchResponse.json();

          if (searchData.results?.songs?.data?.length > 0) {
            // Find the best match (exact artist and track name match preferred)
            const bestMatch = searchData.results.songs.data.find((song: any) => 
              song.attributes.name.toLowerCase().includes(spotifyTrack.name.toLowerCase()) &&
              song.attributes.artistName.toLowerCase().includes(spotifyTrack.artist.toLowerCase())
            ) || searchData.results.songs.data[0];

            foundTracks.push(bestMatch.id);
          } else {
            tracksNotFound++;
            errors.push(`Could not find: ${spotifyTrack.artist} - ${spotifyTrack.name}`);
          }
        } catch (error) {
          console.error(`Error searching for track ${spotifyTrack.name}:`, error);
          tracksNotFound++;
          errors.push(`Search failed: ${spotifyTrack.artist} - ${spotifyTrack.name}`);
        }

        // Update progress
        const progress = 70 + (i / playlist.tracks.spotify.length) * 20;
        onProgress?.(`Searching... ${i + 1}/${playlist.tracks.spotify.length}`, progress);
      }

      // Add found Spotify tracks to playlist
      if (foundTracks.length > 0) {
        try {
          const addFoundTracksResponse = await fetch(`https://api.music.apple.com/v1/me/library/playlists/${playlistId}/tracks`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${(music as any).developerToken}`,
              'Music-User-Token': (music as any).musicUserToken,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              data: foundTracks.map(trackId => ({
                id: trackId,
                type: 'songs',
              })),
            }),
          });

          if (!addFoundTracksResponse.ok) {
            const error = await addFoundTracksResponse.text();
            throw new Error(`Failed to add tracks: ${error}`);
          }

          tracksAdded += foundTracks.length;
        } catch (error) {
          console.error('Error adding found Spotify tracks:', error);
          errors.push(`Failed to add ${foundTracks.length} found tracks to playlist`);
        }
      }
    }

    onProgress?.('Export completed!', 100);

    // Generate Apple Music playlist URL
    const playlistUrl = `https://music.apple.com/library/playlist/${playlistId}`;

    return {
      success: true,
      playlistId,
      playlistUrl,
      tracksAdded,
      tracksNotFound,
      errors: errors.length > 0 ? errors : undefined,
    };

  } catch (error) {
    console.error('Apple Music export error:', error);
    return {
      success: false,
      tracksAdded: 0,
      tracksNotFound: 0,
      errors: [error instanceof Error ? error.message : 'Unknown error occurred'],
    };
  }
};

/**
 * Check if Apple Music is available and user can export
 */
export const canExportToAppleMusic = (): boolean => {
  return typeof window !== 'undefined' && !!window.MusicKit;
};

/**
 * Get Apple Music authorization status
 */
export const getAppleMusicAuthStatus = (): string => {
  if (!window.MusicKit) return 'unavailable';
  
  const music = window.MusicKit.getInstance();
  return music.isAuthorized ? 'authorized' : 'unauthorized';
};