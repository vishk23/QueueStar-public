'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { exportBlendToAppleMusic } from '@/lib/apple-music-export';

interface Track {
  id: string;
  position: number;
  title: string;
  artist: string;
  album: string;
  artworkUrl: string;
  duration?: number;
  sourceProvider: 'apple' | 'spotify';
  audioFeatures: {
    energy?: number;
    valence?: number;
    danceability?: number;
    tempo?: number;
    genre?: string;
  };
  contributedBy: {
    name: string;
    email: string;
  };
  addedAt: string;
}

interface Blend {
  id: string;
  name: string;
  status: 'pending' | 'processing' | 'completed';
  createdAt: string;
  completedAt?: string;
  shareCode: string;
  trackCount: number;
  participants: Array<{
    userId: string;
    name: string;
    email: string;
    joinedAt: string;
  }>;
}

export default function BlendDetailPage() {
  const params = useParams();
  const router = useRouter();
  const blendId = params.id as string;
  
  const [blend, setBlend] = useState<Blend | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportMessage, setExportMessage] = useState('');

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/user');
        if (response.ok) {
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
          router.push('/login');
          return;
        }
      } catch (error) {
        setIsAuthenticated(false);
        router.push('/login');
        return;
      }
    };
    
    checkAuth();
  }, [router]);

  useEffect(() => {
    if (isAuthenticated === null) return;
    loadBlendData();
  }, [blendId, isAuthenticated]);

  const loadBlendData = async () => {
    try {
      const response = await fetch(`/api/blends/${blendId}/tracks`);
      const data = await response.json();
      
      if (data.success) {
        setBlend(data.blend);
        setTracks(data.tracks);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to load blend');
    } finally {
      setLoading(false);
    }
  };

  const generateBlend = async () => {
    setGenerating(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/blends/${blendId}/generate`, {
        method: 'POST',
      });
      
      const data = await response.json();
      
      if (data.success) {
        await loadBlendData();
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to generate blend');
    } finally {
      setGenerating(false);
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

  const exportToAppleMusic = async () => {
    setExporting(true);
    setError(null);
    setExportProgress(0);
    setExportMessage('Loading Apple Music...');

    try {
      if (!window.MusicKit) {
        setExportMessage('Loading MusicKit JS...');
        await loadMusicKitJS();
      }

      setExportMessage('Configuring Apple Music...');
      const tokenResponse = await fetch('/api/auth/apple/token');
      if (!tokenResponse.ok) {
        throw new Error('Failed to get Apple Music token. Please connect your Apple Music account first.');
      }

      const { token } = await tokenResponse.json();

      await window.MusicKit.configure({
        developerToken: token,
        app: {
          name: 'Blendify',
          build: '1.0.0',
        },
      });

      setExportMessage('Starting export...');
      const result = await exportBlendToAppleMusic(
        blendId,
        (message, progress) => {
          setExportMessage(message);
          setExportProgress(progress);
        }
      );

      if (result.success) {
        setExportMessage(
          `Successfully exported! Added ${result.tracksAdded} tracks to Apple Music.${
            result.tracksNotFound > 0 ? ` ${result.tracksNotFound} tracks could not be found.` : ''
          }`
        );
        
        setTimeout(() => {
          setExporting(false);
          setExportMessage('');
          setExportProgress(0);
        }, 4000);

        if (result.playlistUrl) {
          window.open(result.playlistUrl, '_blank');
        }
      } else {
        setError(`Export failed: ${result.errors?.join(', ') || 'Unknown error'}`);
        setExporting(false);
      }
    } catch (err) {
      setError('Failed to export to Apple Music');
      setExporting(false);
    }
  };

  const formatDuration = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getEnergyBadge = (energy?: number) => {
    if (!energy) return '';
    if (energy > 80) return '🔥';
    if (energy > 60) return '⚡';
    if (energy > 40) return '🎵';
    return '😴';
  };

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base-100">
        <div className="loading loading-spinner loading-lg text-primary"></div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-900 via-blue-900 to-black text-white p-6">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-white/20 rounded w-64 mb-4"></div>
            <div className="h-64 bg-white/10 rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-900 via-blue-900 to-black text-white p-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-2xl font-bold mb-4">Error</h1>
          <p className="text-red-300 mb-6">{error}</p>
          <Link href="/blends" className="btn btn-primary">
            Back to Blends
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-900 via-blue-900 to-black text-white">
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/60"></div>
        <div className="relative p-6">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-4 mb-6">
              <Link href="/blends" className="btn btn-ghost btn-sm">
                ← Back
              </Link>
              <div className="breadcrumbs text-sm">
                <ul>
                  <li><Link href="/blends">Blends</Link></li>
                  <li>{blend?.name}</li>
                </ul>
              </div>
            </div>

            <div className="flex items-end gap-6">
              <div className="relative">
                <div className="w-64 h-64 bg-gradient-to-br from-pink-500 via-purple-500 to-indigo-500 rounded-lg shadow-2xl">
                  {tracks.length > 0 && (
                    <div className="grid grid-cols-2 gap-1 w-full h-full p-2">
                      {tracks.slice(0, 4).map((track, i) => (
                        <img
                          key={i}
                          src={track.artworkUrl || '/placeholder-album.png'}
                          alt={track.album}
                          className="w-full h-full object-cover rounded"
                        />
                      ))}
                    </div>
                  )}
                  {tracks.length === 0 && (
                    <div className="flex items-center justify-center w-full h-full text-6xl">
                      🎵
                    </div>
                  )}
                </div>
              </div>

              <div className="flex-1">
                <p className="text-sm font-medium mb-2">BLEND PLAYLIST</p>
                <h1 className="text-4xl font-bold mb-4">{blend?.name}</h1>
                <div className="flex items-center gap-4 text-sm text-white/70 mb-4">
                  <span>{blend?.participants.map(p => p.name).join(' & ')}</span>
                  <span>•</span>
                  <span>{tracks.length} songs</span>
                  {tracks.length > 0 && (
                    <>
                      <span>•</span>
                      <span>{Math.round(tracks.reduce((sum, t) => sum + (t.duration || 0), 0) / 60000)} min</span>
                    </>
                  )}
                </div>
                
                {blend?.status === 'pending' && (
                  <button
                    onClick={generateBlend}
                    disabled={generating}
                    className="btn btn-primary btn-lg"
                  >
                    {generating ? (
                      <>
                        <span className="loading loading-spinner loading-sm"></span>
                        Generating Blend...
                      </>
                    ) : (
                      '✨ Generate Blend'
                    )}
                  </button>
                )}

                {blend?.status === 'completed' && (
                  <div className="flex gap-3">
                    <button 
                      onClick={exportToAppleMusic}
                      disabled={exporting}
                      className="btn btn-success btn-lg"
                    >
                      {exporting ? (
                        <>
                          <span className="loading loading-spinner loading-sm"></span>
                          {exportMessage}
                        </>
                      ) : (
                        '+ Add to Apple Music'
                      )}
                    </button>
                    <button className="btn btn-outline btn-lg">
                      Share
                    </button>
                  </div>
                )}
                
                {exporting && exportProgress > 0 && (
                  <div className="mt-4">
                    <div className="flex justify-between text-sm text-white/70 mb-1">
                      <span>{exportMessage}</span>
                      <span>{Math.round(exportProgress)}%</span>
                    </div>
                    <progress 
                      className="progress progress-success w-full" 
                      value={exportProgress} 
                      max="100"
                    ></progress>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {tracks.length > 0 && (
        <div className="p-6">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white/5 rounded-lg overflow-hidden">
              <div className="px-6 py-3 border-b border-white/10 text-xs text-white/60 uppercase tracking-wider">
                <div className="grid grid-cols-12 gap-4 items-center">
                  <div className="col-span-1">#</div>
                  <div className="col-span-6">Title</div>
                  <div className="col-span-2">Album</div>
                  <div className="col-span-2">Added by</div>
                  <div className="col-span-1 text-center">Vibe</div>
                </div>
              </div>

              {tracks.map((track, index) => (
                <div
                  key={track.id}
                  className="px-6 py-3 border-b border-white/5 hover:bg-white/5 transition-colors group"
                >
                  <div className="grid grid-cols-12 gap-4 items-center">
                    <div className="col-span-1 text-white/60 group-hover:text-white">
                      {track.position}
                    </div>

                    <div className="col-span-6 flex items-center gap-3">
                      <img
                        src={track.artworkUrl || '/placeholder-album.png'}
                        alt={track.album}
                        className="w-10 h-10 rounded object-cover"
                      />
                      <div>
                        <p className="font-medium group-hover:text-white">
                          {track.title}
                        </p>
                        <p className="text-sm text-white/60 group-hover:text-white/80">
                          {track.artist}
                        </p>
                      </div>
                      <span className={`badge badge-xs ${
                        track.sourceProvider === 'apple' ? 'badge-primary' : 'badge-secondary'
                      }`}>
                        {track.sourceProvider}
                      </span>
                    </div>

                    <div className="col-span-2 text-white/60 group-hover:text-white/80 text-sm truncate">
                      {track.album}
                    </div>

                    <div className="col-span-2 text-white/60 group-hover:text-white/80 text-sm">
                      {track.contributedBy.name}
                    </div>

                    <div className="col-span-1 text-center">
                      <span className="text-lg" title={`${track.audioFeatures.energy || 0}% energy`}>
                        {getEnergyBadge(track.audioFeatures.energy)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 grid grid-cols-3 gap-6">
              <div className="bg-white/5 rounded-lg p-4">
                <h3 className="font-medium mb-2">Energy Distribution</h3>
                <div className="text-2xl">
                  {tracks.filter(t => (t.audioFeatures.energy || 0) > 70).length} 🔥{' '}
                  {tracks.filter(t => (t.audioFeatures.energy || 0) <= 70 && (t.audioFeatures.energy || 0) > 40).length} ⚡{' '}
                  {tracks.filter(t => (t.audioFeatures.energy || 0) <= 40).length} 😴
                </div>
              </div>
              <div className="bg-white/5 rounded-lg p-4">
                <h3 className="font-medium mb-2">Genre Mix</h3>
                <div className="text-sm text-white/80">
                  {Array.from(new Set(tracks.map(t => t.audioFeatures.genre).filter(Boolean))).slice(0, 3).join(', ')}
                </div>
              </div>
              <div className="bg-white/5 rounded-lg p-4">
                <h3 className="font-medium mb-2">Contributions</h3>
                <div className="text-sm text-white/80">
                  {blend?.participants.map(p => 
                    `${p.name}: ${tracks.filter(t => t.contributedBy.name === p.name).length}`
                  ).join(' • ')}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {blend?.status === 'pending' && tracks.length === 0 && (
        <div className="p-6">
          <div className="max-w-4xl mx-auto text-center">
            <div className="text-6xl mb-4">🎵</div>
            <h2 className="text-xl font-medium mb-2">Ready to blend!</h2>
            <p className="text-white/70 mb-6">
              Generate your personalized playlist using AI to mix everyone's music taste.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export const dynamicParams = true;