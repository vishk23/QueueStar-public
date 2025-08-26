'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Blend {
  id: string;
  name: string;
  description: string;
  code: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  creatorId: string;
  creatorName: string;
  creatorEmail: string;
  userRole: 'creator' | 'participant';
  joinedAt: string;
}

export default function BlendsPage() {
  const router = useRouter();
  const [blends, setBlends] = useState<Blend[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Check authentication
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
    if (isAuthenticated === null) return; // Wait for auth check
    loadBlends();
  }, [isAuthenticated]);

  const loadBlends = async () => {
    try {
      const response = await fetch('/api/blends/list');
      const data = await response.json();
      
      if (data.success) {
        setBlends(data.blends);
      } else {
        setError('Failed to load blends');
      }
    } catch (err) {
      setError('Failed to load blends');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  // Show loading while checking authentication
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base-100">
        <div className="loading loading-spinner loading-lg text-primary"></div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="flex justify-center items-center py-12">
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">My Blends</h1>
          <p className="text-gray-600">Music blends created with your friends</p>
        </div>
        <button 
          className="btn btn-primary"
          onClick={() => router.push('/blends/create')}
        >
          Create New Blend
        </button>
      </div>

      {error && (
        <div className="alert alert-error mb-4">
          <span>{error}</span>
        </div>
      )}

      {blends.length === 0 ? (
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body text-center py-12">
            <div className="mb-4">
              <svg className="w-16 h-16 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
              </svg>
            </div>
            <h2 className="text-xl font-bold mb-2">No blends yet!</h2>
            <p className="text-gray-600 mb-6">
              Create your first blend by selecting friends to combine your music tastes.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button 
                className="btn btn-primary"
                onClick={() => router.push('/blends/create')}
              >
                Create Your First Blend
              </button>
              <button 
                className="btn btn-outline"
                onClick={() => router.push('/friends')}
              >
                Add Friends First
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid gap-4">
          {blends.map(blend => (
            <div key={blend.id} className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h2 className="card-title text-xl mb-2">{blend.name}</h2>
                    {blend.description && (
                      <p className="text-gray-600 mb-3">{blend.description}</p>
                    )}
                    <div className="flex flex-wrap gap-2 mb-3">
                      <span className={`badge ${blend.userRole === 'creator' ? 'badge-primary' : 'badge-secondary'}`}>
                        {blend.userRole === 'creator' ? 'Creator' : 'Participant'}
                      </span>
                      <span className="badge badge-ghost">
                        Code: {blend.code}
                      </span>
                      <span className={`badge ${blend.status === 'active' ? 'badge-success' : 'badge-warning'}`}>
                        {blend.status}
                      </span>
                    </div>
                    <div className="text-sm text-gray-500">
                      <p>Created by {blend.creatorName} • {formatDate(blend.createdAt)}</p>
                      <p>You joined {formatDate(blend.joinedAt)}</p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Link 
                      href={`/blends/${blend.id}`}
                      className="btn btn-sm btn-outline"
                    >
                      {blend.status === 'pending' ? '✨ Generate' : '🎵 View'}
                    </Link>
                    {blend.userRole === 'creator' && (
                      <button 
                        className="btn btn-sm btn-ghost"
                        onClick={() => {
                          // Future: Edit blend
                          console.log('Edit blend:', blend.id);
                        }}
                      >
                        Edit
                      </button>
                    )}
                  </div>
                </div>

                <div className="bg-base-200 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Status</p>
                      {blend.status === 'pending' && (
                        <>
                          <p className="text-lg font-bold text-orange-600">Ready to generate</p>
                          <p className="text-xs text-gray-500">Use AI to create 55-track playlist</p>
                        </>
                      )}
                      {blend.status === 'completed' && (
                        <>
                          <p className="text-lg font-bold text-green-600">Generated</p>
                          <p className="text-xs text-gray-500">55 tracks ready</p>
                        </>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Last updated</p>
                      <p className="font-medium">{formatDate(blend.updatedAt)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}