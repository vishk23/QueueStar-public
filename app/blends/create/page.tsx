'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Friend {
  id: string;
  email: string;
  name: string;
  friendedAt: string;
  status: string;
}

export default function CreateBlendPage() {
  const router = useRouter();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
  const [blendName, setBlendName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

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

  // Load friends on mount
  useEffect(() => {
    if (isAuthenticated === null) return; // Wait for auth check
    loadFriends();
  }, [isAuthenticated]);

  const loadFriends = async () => {
    try {
      const response = await fetch('/api/friends/list');
      const data = await response.json();
      
      if (data.success) {
        setFriends(data.friends);
      } else {
        setError('Failed to load friends');
      }
    } catch (err) {
      setError('Failed to load friends');
    }
  };

  const toggleFriend = (friendId: string) => {
    setSelectedFriends(prev => 
      prev.includes(friendId) 
        ? prev.filter(id => id !== friendId)
        : [...prev, friendId]
    );
  };

  const createBlend = async () => {
    if (!blendName.trim()) {
      setError('Please enter a blend name');
      return;
    }

    if (selectedFriends.length === 0) {
      setError('Please select at least one friend');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/blends/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: blendName,
          description,
          friendIds: selectedFriends,
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Redirect to the new blend or blends list
        router.push('/blends');
      } else {
        setError(data.error || 'Failed to create blend');
      }
    } catch (err) {
      setError('Failed to create blend');
    } finally {
      setLoading(false);
    }
  };

  const selectedFriendsData = friends.filter(friend => selectedFriends.includes(friend.id));

  // Show loading while checking authentication
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base-100">
        <div className="loading loading-spinner loading-lg text-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Create New Blend</h1>
        <p className="text-gray-600">Choose friends to create a music blend with</p>
      </div>

      {error && (
        <div className="alert alert-error mb-4">
          <span>{error}</span>
        </div>
      )}

      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          {/* Blend Details */}
          <div className="form-control mb-6">
            <label className="label">
              <span className="label-text">Blend Name *</span>
            </label>
            <input 
              type="text"
              placeholder="Enter blend name..."
              className="input input-bordered"
              value={blendName}
              onChange={(e) => setBlendName(e.target.value)}
            />
          </div>

          <div className="form-control mb-6">
            <label className="label">
              <span className="label-text">Description (optional)</span>
            </label>
            <textarea 
              placeholder="Describe your blend..."
              className="textarea textarea-bordered"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* Friend Selection */}
          <div className="mb-6">
            <label className="label">
              <span className="label-text">Select Friends *</span>
              <span className="label-text-alt">{selectedFriends.length} selected</span>
            </label>

            {friends.length === 0 ? (
              <div className="bg-base-200 p-6 rounded-lg text-center">
                <p className="text-gray-600 mb-4">No friends found!</p>
                <p className="text-sm text-gray-500 mb-4">
                  You need friends to create a blend.
                </p>
                <button 
                  className="btn btn-primary btn-sm"
                  onClick={() => router.push('/friends')}
                >
                  Add Friends
                </button>
              </div>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {friends.map(friend => (
                  <div 
                    key={friend.id}
                    className={`flex items-center justify-between p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                      selectedFriends.includes(friend.id)
                        ? 'border-primary bg-primary/10'
                        : 'border-base-300 hover:border-base-400'
                    }`}
                    onClick={() => toggleFriend(friend.id)}
                  >
                    <div>
                      <p className="font-medium">{friend.name}</p>
                      <p className="text-sm text-gray-600">{friend.email}</p>
                    </div>
                    <input 
                      type="checkbox"
                      className="checkbox checkbox-primary"
                      checked={selectedFriends.includes(friend.id)}
                      onChange={() => toggleFriend(friend.id)}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Selected Friends Summary */}
          {selectedFriendsData.length > 0 && (
            <div className="bg-base-200 p-4 rounded-lg mb-6">
              <h3 className="font-medium mb-2">Selected Friends:</h3>
              <div className="flex flex-wrap gap-2">
                {selectedFriendsData.map(friend => (
                  <span 
                    key={friend.id}
                    className="badge badge-primary badge-lg"
                  >
                    {friend.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Create Button */}
          <div className="flex gap-2 justify-end">
            <button 
              className="btn btn-ghost"
              onClick={() => router.back()}
            >
              Cancel
            </button>
            <button 
              className={`btn btn-primary ${loading ? 'loading' : ''}`}
              onClick={createBlend}
              disabled={loading || !blendName.trim() || selectedFriends.length === 0}
            >
              Create Blend
            </button>
          </div>

          {/* Info */}
          <div className="bg-info/10 p-4 rounded-lg mt-4">
            <div className="flex items-start gap-2">
              <svg className="w-5 h-5 text-info mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <div>
                <p className="font-medium text-info">About Blends</p>
                <p className="text-sm text-info/80 mt-1">
                  Blends use AI to create personalized 55-track playlists by intelligently mixing music from you and your selected friends. 
                  After creating the blend, you can generate tracks using our advanced music curation algorithm.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}