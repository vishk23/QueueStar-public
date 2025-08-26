'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

// Disable static generation
export const dynamic = 'force-dynamic';

function DashboardContent() {
  const [connections, setConnections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const searchParams = useSearchParams();
  const spotifyConnected = searchParams.get('spotify') === 'connected';
  const appleConnected = searchParams.get('connected') === 'apple';

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/user');
        if (response.ok) {
          const data = await response.json();
          setConnections(data.providerConnections || []);
        }
      } catch (error) {
        console.error('Failed to fetch user data:', error);
      }
      setLoading(false);
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="loading loading-spinner loading-lg text-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {spotifyConnected && (
        <div className="alert alert-success">
          <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>Spotify connected successfully! Your music data is syncing in the background.</span>
        </div>
      )}
      
      {appleConnected && (
        <div className="alert alert-success">
          <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>Apple Music connected successfully! Your library is syncing in the background.</span>
        </div>
      )}
      
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">Welcome back!</h1>
        <p className="text-base-content/60">Ready to blend some music?</p>
        
        {/* Quick Navigation */}
        <div className="flex flex-wrap justify-center gap-3 mt-6">
          <Link href="/friends" className="btn btn-outline btn-sm">
            👥 Friends
          </Link>
          <Link href="/blends" className="btn btn-outline btn-sm">
            🎵 My Blends
          </Link>
          <Link href="/settings" className="btn btn-outline btn-sm">
            ⚙️ Settings
          </Link>
        </div>
      </div>

      {connections.length === 0 ? (
        <Card className="p-8 text-center">
          <h2 className="text-xl font-semibold mb-4">Connect Your Music</h2>
          <p className="text-base-content/60 mb-6">
            You need to connect at least one music streaming service to start blending playlists.
          </p>
          <Button
            variant="primary"
            onClick={() => window.location.href = '/settings'}
            className="w-full"
          >
            Go to Settings
          </Button>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Your Connections</h2>
            <div className="space-y-3">
              {connections.map((connection) => (
                <div 
                  key={connection.id} 
                  className="flex items-center justify-between p-3 bg-base-200 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                      {connection.provider === 'spotify' ? '🎵' : '🍎'}
                    </div>
                    <span className="capitalize font-medium">{connection.provider}</span>
                  </div>
                  <div className="text-sm text-base-content/60">
                    {connection.isExpired ? 'Expired' : 'Connected'}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
            <div className="space-y-3">
              <Button variant="primary" className="w-full">
                Create New Blend
              </Button>
              <Button variant="outline" className="w-full">
                View My Blends
              </Button>
              <Button 
                variant="ghost" 
                className="w-full"
                onClick={() => window.location.href = '/settings'}
              >
                Settings
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-12"><div className="loading loading-spinner loading-lg text-primary"></div></div>}>
      <DashboardContent />
    </Suspense>
  );
}