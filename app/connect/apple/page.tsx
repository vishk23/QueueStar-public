'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

export default function ConnectAppleMusicPage() {
  const [status, setStatus] = useState<'loading' | 'ready' | 'authorizing' | 'connected' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);
  const [musicKit, setMusicKit] = useState<any>(null);
  const [developerToken, setDeveloperToken] = useState<string | null>(null);
  const [syncProgress, setSyncProgress] = useState<string[]>([]);
  const router = useRouter();
  const musicKitRef = useRef<any>(null);

  useEffect(() => {
    initializeMusicKit();
    
    // Cleanup on unmount
    return () => {
      if (musicKitRef.current) {
        try {
          musicKitRef.current.unauthorize();
        } catch (e) {
          console.log('Cleanup: MusicKit instance already cleaned up');
        }
      }
    };
  }, []);

  const initializeMusicKit = async () => {
    try {
      setStatus('loading');
      console.log('Initializing MusicKit, current origin:', window.location.origin);
      
      // Get developer token from our server
      const tokenResponse = await fetch('/api/auth/apple/token', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Cache-Control': 'no-cache',
        },
      });

      if (!tokenResponse.ok) {
        if (tokenResponse.status === 401) {
          // Session issue - redirect back to login
          window.location.href = '/login?message=Session expired. Please sign in again to connect Apple Music.';
          return;
        }
        const errorData = await tokenResponse.json();
        throw new Error(errorData.error || 'Failed to get developer token');
      }

      const tokenData = await tokenResponse.json();
      setDeveloperToken(tokenData.token);

      // Load MusicKit JS if not already loaded
      if (!window.MusicKit) {
        await loadMusicKitJS();
      }

      // Configure MusicKit
      await window.MusicKit.configure({
        developerToken: tokenData.token,
        app: {
          name: 'Blendify',
          build: '1.0.0',
        },
      });

      // Create MusicKit instance
      const musicKitInstance = window.MusicKit.getInstance();
      setMusicKit(musicKitInstance);
      musicKitRef.current = musicKitInstance;

      console.log('MusicKit initialized successfully');
      setStatus('ready');

    } catch (error) {
      console.error('Failed to initialize MusicKit:', error);
      setError(error instanceof Error ? error.message : 'Failed to initialize Apple Music');
      setStatus('error');
    }
  };

  const loadMusicKitJS = (): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (window.MusicKit) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://js-cdn.music.apple.com/musickit/v1/musickit.js';
      script.async = true;
      script.onload = () => {
        console.log('MusicKit JS loaded');
        resolve();
      };
      script.onerror = () => {
        reject(new Error('Failed to load MusicKit JS'));
      };
      document.head.appendChild(script);
    });
  };

  const connectToAppleMusic = async () => {
    if (!musicKit || !developerToken) {
      setError('MusicKit not ready');
      return;
    }

    try {
      setStatus('authorizing');
      setError(null);

      // Request user authorization
      const musicUserToken = await musicKit.authorize();
      console.log('Apple Music authorization successful');
      console.log('Authorization status:', musicKit.authorizationStatus);
      console.log('Music user token length:', musicUserToken?.length);

      // Check if we have a valid music user token
      if (!musicUserToken || musicUserToken.length === 0) {
        throw new Error('No music user token received from Apple Music');
      }

      console.log('Apple Music authorization validated successfully');
      console.log('Music user token (first 20 chars):', musicUserToken.substring(0, 20) + '...');

      // Send tokens to our callback endpoint
      const callbackResponse = await fetch('/api/auth/apple/callback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
        },
        credentials: 'include',
        body: JSON.stringify({
          musicUserToken,
          developerToken,
        }),
      });

      if (!callbackResponse.ok) {
        const errorData = await callbackResponse.json();
        console.error('Callback error:', callbackResponse.status, errorData);
        if (callbackResponse.status === 401) {
          throw new Error('Session expired. Please refresh the page and try again.');
        }
        throw new Error(errorData.error || `Connection failed (${callbackResponse.status}): ${errorData.details || 'Unknown error'}`);
      }

      const result = await callbackResponse.json();
      console.log('Apple Music connection successful:', result);

      setStatus('connected');
      
      // Check if we should start background sync
      if (result.shouldStartSync) {
        console.log('APPLE: Starting background data sync...');
        // Start background sync in a separate promise (don't await)
        startBackgroundSync(musicKit).catch(error => {
          console.error('APPLE: Background sync failed:', error);
        });
      }
      
      // Wait longer to see sync logs before redirecting
      setTimeout(() => {
        console.log('APPLE: About to redirect to dashboard - check logs above for sync results');
        if (error) {
          console.log('APPLE: Error detected, not redirecting to preserve error display');
          return;
        }
        window.location.href = '/dashboard?connected=apple&sync=starting';
      }, 10000); // 10 seconds to see logs

    } catch (error) {
      console.error('Apple Music connection failed:', error);
      setError(error instanceof Error ? error.message : 'Connection failed');
      setStatus('error');
    }
  };

  const startBackgroundSync = async (musicKitInstance: any) => {
    if (!musicKitInstance) {
      console.error('APPLE: No MusicKit instance for background sync');
      return;
    }

    try {
      console.log('APPLE: Starting comprehensive background data sync');
      
      // Get user session to pass to sync functions
      const response = await fetch('/api/user', { credentials: 'include' });
      if (!response.ok) {
        throw new Error('Failed to get user info for sync');
      }
      
      const userData = await response.json();
      const userId = userData.user.id;

      // Start comprehensive sync
      await syncAppleMusicDataInBackground(musicKitInstance, userId);
      
      console.log('APPLE: Background sync completed successfully');
    } catch (error) {
      console.error('APPLE: Background sync error:', error);
      // Don't throw - this is background and shouldn't interrupt user flow
    }
  };

  const syncAppleMusicDataInBackground = async (musicKit: any, userId: string) => {
    console.log('APPLE: Starting comprehensive MusicKit v3 background sync');
    setSyncProgress(prev => [...prev, '🎵 Starting comprehensive sync...']);
    
    const results = { songs: false, albums: false, playlists: false, activity: false, heavyRotation: false, recommendations: false };
    
    // 1. Sync Library Songs
    try {
      console.log('APPLE: Phase 1 - Starting library songs sync');
      setSyncProgress(prev => [...prev, '🎵 Phase 1: Syncing library songs...']);
      await syncLibrarySongs(musicKit, userId);
      results.songs = true;
      console.log('APPLE: Phase 1 - Library songs sync completed');
      setSyncProgress(prev => [...prev, '✅ Phase 1: Library songs completed']);
    } catch (error) {
      console.error('APPLE: Phase 1 - Library songs sync failed:', error);
      setSyncProgress(prev => [...prev, '❌ Phase 1: Library songs failed']);
    }
    
    // 2. Sync Library Albums  
    try {
      console.log('APPLE: Phase 2 - Starting library albums sync');
      setSyncProgress(prev => [...prev, '💿 Phase 2: Syncing library albums...']);
      await syncLibraryAlbums(musicKit, userId);
      results.albums = true;
      console.log('APPLE: Phase 2 - Library albums sync completed');
      setSyncProgress(prev => [...prev, '✅ Phase 2: Library albums completed']);
    } catch (error) {
      console.error('APPLE: Phase 2 - Library albums sync failed:', error);
      setSyncProgress(prev => [...prev, '❌ Phase 2: Library albums failed']);
    }
    
    // 3. Sync Library Playlists
    try {
      console.log('APPLE: Phase 3 - Starting library playlists sync');
      setSyncProgress(prev => [...prev, '📋 Phase 3: Syncing library playlists...']);
      await syncLibraryPlaylists(musicKit, userId);
      results.playlists = true;
      console.log('APPLE: Phase 3 - Library playlists sync completed');
      setSyncProgress(prev => [...prev, '✅ Phase 3: Library playlists completed']);
    } catch (error) {
      console.error('APPLE: Phase 3 - Library playlists sync failed:', error);
      setSyncProgress(prev => [...prev, '❌ Phase 3: Library playlists failed']);
    }
    
    // 4. Sync Recent Activity
    try {
      console.log('APPLE: Phase 4 - Starting recent activity sync');
      setSyncProgress(prev => [...prev, '⏰ Phase 4: Syncing recent activity...']);
      await syncRecentActivity(musicKit, userId);
      results.activity = true;
      console.log('APPLE: Phase 4 - Recent activity sync completed');
      setSyncProgress(prev => [...prev, '✅ Phase 4: Recent activity completed']);
    } catch (error) {
      console.error('APPLE: Phase 4 - Recent activity sync failed:', error);
      setSyncProgress(prev => [...prev, '❌ Phase 4: Recent activity failed']);
    }
    
    // 5. Sync Heavy Rotation
    try {
      console.log('APPLE: Phase 5 - Starting heavy rotation sync');
      setSyncProgress(prev => [...prev, '🔥 Phase 5: Syncing heavy rotation...']);
      await syncHeavyRotation(musicKit, userId);
      results.heavyRotation = true;
      console.log('APPLE: Phase 5 - Heavy rotation sync completed');
      setSyncProgress(prev => [...prev, '✅ Phase 5: Heavy rotation completed']);
    } catch (error) {
      console.error('APPLE: Phase 5 - Heavy rotation sync failed:', error);
      setSyncProgress(prev => [...prev, '❌ Phase 5: Heavy rotation failed']);
    }
    
    // 6. Sync Personal Recommendations
    try {
      console.log('APPLE: Phase 6 - Starting personal recommendations sync');
      setSyncProgress(prev => [...prev, '💡 Phase 6: Syncing personal recommendations...']);
      await syncRecommendations(musicKit, userId);
      results.recommendations = true;
      console.log('APPLE: Phase 6 - Personal recommendations sync completed');
      setSyncProgress(prev => [...prev, '✅ Phase 6: Personal recommendations completed']);
    } catch (error) {
      console.error('APPLE: Phase 6 - Personal recommendations sync failed:', error);
      setSyncProgress(prev => [...prev, '❌ Phase 6: Personal recommendations failed']);
    }
    
    console.log('APPLE: Background sync phases completed with results:', results);
    setSyncProgress(prev => [...prev, `🎉 Sync completed! Results: ${JSON.stringify(results)}`]);
    
    const successCount = Object.values(results).filter(Boolean).length;
    if (successCount === 0) {
      throw new Error('All sync phases failed');
    }
  };

  const syncLibrarySongs = async (musicKit: any, userId: string) => {
    console.log('APPLE: Background syncing library songs...');
    
    const BATCH_SIZE = 100;
    let offset = 0;
    let totalProcessed = 0;
    
    while (true) {
      try {
        const response = await musicKit.api.library.songs({ 
          limit: BATCH_SIZE, 
          offset,
          include: ['albums', 'artists', 'genres']
        });

        if (!response || response.length === 0) break;

        const songs = response.map((song: any) => ({
          userId,
          appleTrackId: song.id,
          trackType: song.type,
          trackName: song.attributes?.name || 'Unknown Track',
          artistName: song.attributes?.artistName || 'Unknown Artist',
          albumName: song.attributes?.albumName || '',
          composerName: song.attributes?.composerName,
          genreNames: song.attributes?.genreNames || [],
          releaseDate: song.attributes?.releaseDate,
          trackNumber: song.attributes?.trackNumber,
          discNumber: song.attributes?.discNumber,
          durationMs: song.attributes?.durationInMillis,
          isExplicit: song.attributes?.contentRating === 'explicit',
          hasLyrics: song.attributes?.hasLyrics,
          isrc: song.attributes?.isrc,
          artworkUrl: song.attributes?.artwork?.url,
          artworkWidth: song.attributes?.artwork?.width,
          artworkHeight: song.attributes?.artwork?.height,
          catalogId: song.attributes?.playParams?.catalogId,
          playParamsId: song.attributes?.playParams?.id,
          isLibrary: song.attributes?.playParams?.isLibrary,
          playParamsKind: song.attributes?.playParams?.kind,
          albumData: song.relationships?.albums?.data?.[0],
          artistData: song.relationships?.artists?.data,
          genreData: song.relationships?.genres?.data,
          rawDataRecord: song,
          fetchedAt: new Date().toISOString(),
          syncVersion: Date.now()
        }));

        console.log(`APPLE CLIENT: About to send ${songs.length} songs to server:`, songs.slice(0, 2).map((s: any) => ({ name: s.trackName, artist: s.artistName })));
        
        const saveResponse = await fetch('/api/sync/apple/library-songs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ songs }),
        });

        if (!saveResponse.ok) {
          const errorText = await saveResponse.text();
          console.error(`APPLE CLIENT: Server responded with ${saveResponse.status}: ${errorText}`);
          throw new Error(`Failed to save songs batch: ${saveResponse.status}`);
        }
        
        const responseData = await saveResponse.json();
        console.log(`APPLE CLIENT: Server response:`, responseData);

        totalProcessed += songs.length;
        offset += BATCH_SIZE;
        
        console.log(`APPLE: Processed ${totalProcessed} library songs so far`);
        
        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.error('APPLE: Error syncing library songs batch:', error);
        break; // Stop on error but don't fail entire sync
      }
    }
    
    console.log(`APPLE: Library songs sync completed - ${totalProcessed} songs`);
  };

  const syncLibraryAlbums = async (musicKit: any, userId: string) => {
    console.log('APPLE: Background syncing library albums...');
    
    const BATCH_SIZE = 50;
    let offset = 0;
    let totalProcessed = 0;
    
    while (true) {
      try {
        console.log(`APPLE: Fetching albums batch at offset ${offset}`);
        const response = await musicKit.api.library.albums({ 
          limit: BATCH_SIZE, 
          offset,
          include: ['tracks', 'artists', 'genres']
        });

        console.log(`APPLE: MusicKit returned ${response ? response.length : 'null'} albums`);
        
        if (!response || response.length === 0) {
          console.log('APPLE: No more albums to process');
          break;
        }

        const albums = response.map((album: any) => ({
          userId,
          appleAlbumId: album.id,
          albumType: album.type,
          albumName: album.attributes?.name || 'Unknown Album',
          artistName: album.attributes?.artistName || 'Unknown Artist',
          copyright: album.attributes?.copyright,
          editorialNotes: album.attributes?.editorialNotes,
          genreNames: album.attributes?.genreNames || [],
          releaseDate: album.attributes?.releaseDate,
          trackCount: album.attributes?.trackCount,
          isSingle: album.attributes?.isSingle,
          isComplete: album.attributes?.isComplete,
          recordLabel: album.attributes?.recordLabel,
          upc: album.attributes?.upc,
          artworkUrl: album.attributes?.artwork?.url,
          artworkWidth: album.attributes?.artwork?.width,
          artworkHeight: album.attributes?.artwork?.height,
          catalogId: album.attributes?.playParams?.catalogId,
          playParamsId: album.attributes?.playParams?.id,
          isLibrary: album.attributes?.playParams?.isLibrary,
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
        
        console.log(`APPLE: Processed ${totalProcessed} library albums so far`);
        await new Promise(resolve => setTimeout(resolve, 150));
        
      } catch (error) {
        console.error('APPLE: Error syncing library albums batch:', error);
        break;
      }
    }
    
    console.log(`APPLE: Library albums sync completed - ${totalProcessed} albums`);
  };

  const syncLibraryPlaylists = async (musicKit: any, userId: string) => {
    console.log('APPLE: Background syncing library playlists...');
    
    const BATCH_SIZE = 25;
    let offset = 0;
    let totalProcessed = 0;
    
    while (true) {
      try {
        const response = await musicKit.api.library.playlists({ 
          limit: BATCH_SIZE, 
          offset,
          include: ['tracks', 'curator']
        });

        if (!response || response.length === 0) break;

        const playlists = response.map((playlist: any) => ({
          userId,
          applePlaylistId: playlist.id,
          playlistType: playlist.type,
          playlistName: playlist.attributes?.name || 'Untitled Playlist',
          description: playlist.attributes?.description?.standard,
          trackCount: playlist.attributes?.trackCount,
          canEdit: playlist.attributes?.canEdit,
          isPublic: playlist.attributes?.isPublic,
          lastModifiedDate: playlist.attributes?.lastModifiedDate,
          curatorName: playlist.attributes?.curatorName,
          artworkUrl: playlist.attributes?.artwork?.url,
          artworkWidth: playlist.attributes?.artwork?.width,
          artworkHeight: playlist.attributes?.artwork?.height,
          catalogId: playlist.attributes?.playParams?.catalogId,
          playParamsId: playlist.attributes?.playParams?.id,
          isLibrary: playlist.attributes?.playParams?.isLibrary,
          globalId: playlist.attributes?.playParams?.globalId,
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

        // Sync individual playlist tracks
        for (const playlist of response) {
          try {
            const tracks = await musicKit.api.library.playlistRelationship(
              playlist.id, 
              'tracks',
              { limit: 1000 }
            );

            if (tracks && tracks.length > 0) {
              const playlistTracks = tracks.map((track: any, index: number) => ({
                userId,
                applePlaylistId: playlist.id,
                appleTrackId: track.id,
                trackType: track.type,
                trackPosition: index + 1,
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
                artworkUrl: track.attributes?.artwork?.url,
                artworkWidth: track.attributes?.artwork?.width,
                artworkHeight: track.attributes?.artwork?.height,
                catalogId: track.attributes?.playParams?.catalogId,
                playParamsId: track.attributes?.playParams?.id,
                isLibrary: track.attributes?.playParams?.isLibrary,
                playParamsKind: track.attributes?.playParams?.kind,
                rawDataRecord: track,
                fetchedAt: new Date().toISOString(),
                syncVersion: Date.now()
              }));

              await fetch('/api/sync/apple/playlist-tracks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ tracks: playlistTracks }),
              });
            }
          } catch (error: any) {
            if (error.message?.includes('400') || error.message?.includes('REQUEST_ERROR')) {
              console.log(`APPLE: Playlist ${playlist.id} tracks not accessible (likely curated/shared playlist)`);
            } else {
              console.error(`APPLE: Error syncing tracks for playlist ${playlist.id}:`, error);
            }
          }
        }

        totalProcessed += playlists.length;
        offset += BATCH_SIZE;
        
        console.log(`APPLE: Processed ${totalProcessed} library playlists so far`);
        await new Promise(resolve => setTimeout(resolve, 200));
        
      } catch (error) {
        console.error('APPLE: Error syncing library playlists batch:', error);
        break;
      }
    }
    
    console.log(`APPLE: Library playlists sync completed - ${totalProcessed} playlists`);
  };

  const syncRecentActivity = async (musicKit: any, userId: string) => {
    console.log('APPLE: Background syncing recent activity...');
    
    try {
      const recentlyAdded = await musicKit.api.library.recentlyAdded({ limit: 200 });
      
      let recentlyPlayed = [];
      try {
        recentlyPlayed = await musicKit.api.recentlyPlayed({ limit: 100 });
      } catch (e) {
        console.log('APPLE: Recently played not available');
      }

      const activityData = {
        userId,
        recentlyAddedTracks: recentlyAdded || [],
        recentlyPlayedTracks: recentlyPlayed || [],
        fetchedAt: new Date().toISOString(),
        syncVersion: Date.now()
      };

      const saveResponse = await fetch('/api/sync/apple/recent-activity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ activity: activityData }),
      });

      if (saveResponse.ok) {
        console.log('APPLE: Recent activity sync completed');
      }

    } catch (error) {
      console.error('APPLE: Error syncing recent activity:', error);
    }
  };

  const syncHeavyRotation = async (musicKit: any, userId: string) => {
    console.log('APPLE: Background syncing heavy rotation...');
    
    try {
      // Fetch ONLY heavy rotation tracks using MusicKit v3 API
      let heavyRotationTracks = [];
      try {
        console.log('APPLE: Trying musicKit.api.historyHeavyRotation...');
        const heavyRotationResponse = await musicKit.api.historyHeavyRotation({ limit: 100 });
        console.log('APPLE: Heavy rotation API response:', heavyRotationResponse);
        heavyRotationTracks = heavyRotationResponse || [];
        console.log(`APPLE: Fetched ${heavyRotationTracks.length} heavy rotation tracks`);
        if (heavyRotationTracks.length > 0) {
          console.log(`APPLE: First heavy rotation sample:`, heavyRotationTracks[0]);
        }
      } catch (e) {
        console.log('APPLE: Heavy rotation not available via historyHeavyRotation:', e);
      }

      const rotationData = {
        userId,
        heavyRotationTracks,
        fetchedAt: new Date().toISOString(),
        syncVersion: Date.now()
      };

      const saveResponse = await fetch('/api/sync/apple/heavy-rotation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ rotation: rotationData }),
      });

      if (saveResponse.ok) {
        const result = await saveResponse.json();
        console.log('APPLE: Heavy rotation sync completed:', result);
      }

    } catch (error) {
      console.error('APPLE: Error syncing heavy rotation:', error);
    }
  };

  const syncRecommendations = async (musicKit: any, userId: string) => {
    console.log('APPLE: Background syncing personal recommendations...');
    
    try {
      // Fetch personal recommendations using MusicKit v3 API methods
      let recommendedItems = [];
      
      // Try different MusicKit v3 methods for recommendations
      try {
        console.log('APPLE: Trying musicKit.api.recommendations...');
        const recommendedResponse = await musicKit.api.recommendations({ limit: 30 });
        recommendedItems = recommendedResponse || [];
        console.log(`APPLE: Fetched ${recommendedItems.length} personal recommendations via recommendations()`);
        if (recommendedItems.length > 0) {
          console.log(`APPLE: First recommendation:`, recommendedItems[0]?.attributes?.title?.stringForDisplay);
        }
      } catch (e) {
        console.log('APPLE: musicKit.api.recommendations not available:', e);
        
        // Try alternative method
        try {
          console.log('APPLE: Trying musicKit.recommendations...');
          const altRecommendations = await musicKit.recommendations({ limit: 30 });
          recommendedItems = altRecommendations || [];
          console.log(`APPLE: Fetched ${recommendedItems.length} recommendations via alternative method`);
        } catch (e2) {
          console.log('APPLE: Alternative recommendations method not available:', e2);
        }
      }

      const recommendationData = {
        userId,
        recommendedItems,
        fetchedAt: new Date().toISOString(),
        syncVersion: Date.now()
      };

      const saveResponse = await fetch('/api/sync/apple/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ recommendations: recommendationData }),
      });

      if (saveResponse.ok) {
        const result = await saveResponse.json();
        console.log('APPLE: Personal recommendations sync completed:', result);
      }

    } catch (error) {
      console.error('APPLE: Error syncing personal recommendations:', error);
    }
  };

  const renderContent = () => {
    switch (status) {
      case 'loading':
        return (
          <div className="text-center">
            <div className="loading loading-spinner loading-lg mb-4"></div>
            <h2 className="text-2xl font-bold mb-2">Setting up Apple Music</h2>
            <p className="text-gray-600">Initializing MusicKit JS...</p>
          </div>
        );

      case 'ready':
        return (
          <div className="text-center">
            <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-pink-500 to-red-500 rounded-full flex items-center justify-center">
              <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 3a1 1 0 00-1.447-.894L8.763 6H5a3 3 0 000 6h.28l1.771 5.316A1 1 0 008 18h1a1 1 0 001-1v-4.382l6.553 3.276A1 1 0 0018 15V3z" clipRule="evenodd" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold mb-4">Connect Your Apple Music</h2>
            <p className="text-gray-600 mb-6">
              Connect your Apple Music account to sync your library and create amazing blends with friends.
            </p>
            <button 
              className="btn btn-primary btn-lg"
              onClick={connectToAppleMusic}
            >
              Connect Apple Music
            </button>
          </div>
        );

      case 'authorizing':
        return (
          <div className="text-center">
            <div className="loading loading-spinner loading-lg mb-4"></div>
            <h2 className="text-2xl font-bold mb-2">Connecting to Apple Music</h2>
            <p className="text-gray-600">Please authorize Blendify in the popup window...</p>
          </div>
        );

      case 'connected':
        return (
          <div className="text-center">
            <div className="w-20 h-20 mx-auto mb-6 bg-green-500 rounded-full flex items-center justify-center">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold mb-2 text-green-600">Apple Music Connected!</h2>
            <p className="text-gray-600 mb-4">
              Connection successful! Syncing your music library...
            </p>
            <div className="progress progress-primary w-full max-w-md mx-auto mb-4"></div>
            
            {syncProgress.length > 0 && (
              <div className="bg-gray-100 rounded-lg p-4 text-left max-w-md mx-auto max-h-48 overflow-y-auto">
                <div className="text-sm font-medium mb-2">Sync Progress:</div>
                {syncProgress.map((progress, index) => (
                  <div key={index} className="text-xs text-gray-700 mb-1">
                    {progress}
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case 'error':
        return (
          <div className="text-center">
            <div className="w-20 h-20 mx-auto mb-6 bg-red-500 rounded-full flex items-center justify-center">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold mb-2 text-red-600">Connection Failed</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <div className="space-x-4">
              <button 
                className="btn btn-primary"
                onClick={initializeMusicKit}
              >
                Try Again
              </button>
              <button 
                className="btn btn-ghost"
                onClick={() => router.push('/dashboard')}
              >
                Go Back
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        {renderContent()}
      </div>
    </div>
  );
}