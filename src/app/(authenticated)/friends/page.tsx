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

interface SearchUser {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

interface Invite {
  id: string;
  code: string;
  url: string;
  expiresAt: string;
  maxUses: number;
  usedCount: number;
}

export default function FriendsPage() {
  const router = useRouter();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [invite, setInvite] = useState<Invite | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Load friends on mount
  useEffect(() => {
    loadFriends();
  }, []);

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

  const searchUsers = async () => {
    if (searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/friends/search?q=${encodeURIComponent(searchQuery)}`);
      const data = await response.json();
      
      if (data.success) {
        setSearchResults(data.users);
      } else {
        setError(data.error || 'Search failed');
      }
    } catch (err) {
      setError('Search failed');
    } finally {
      setLoading(false);
    }
  };

  const addFriend = async (friendId: string) => {
    setLoading(true);
    try {
      const response = await fetch('/api/friends/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ friendId }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        await loadFriends();
        setSearchResults(prev => prev.filter(user => user.id !== friendId));
      } else {
        setError(data.error || 'Failed to add friend');
      }
    } catch (err) {
      setError('Failed to add friend');
    } finally {
      setLoading(false);
    }
  };

  const removeFriend = async (friendId: string) => {
    setLoading(true);
    try {
      const response = await fetch('/api/friends/remove', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ friendId }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        await loadFriends();
      } else {
        setError(data.error || 'Failed to remove friend');
      }
    } catch (err) {
      setError('Failed to remove friend');
    } finally {
      setLoading(false);
    }
  };

  const createInvite = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/invites/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      
      const data = await response.json();
      
      if (data.success) {
        setInvite(data.invite);
      } else {
        setError(data.error || 'Failed to create invite');
      }
    } catch (err) {
      setError('Failed to create invite');
    } finally {
      setLoading(false);
    }
  };

  const copyInviteLink = () => {
    if (invite) {
      navigator.clipboard.writeText(invite.url);
      // Could add toast notification here
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Friends</h1>
        <p className="text-gray-600">Manage your friends and invite new users to join Queue Star</p>
      </div>

      {error && (
        <div className="alert alert-error mb-4">
          <span>{error}</span>
        </div>
      )}

      {/* Invite Friends Section */}
      <div className="card bg-base-100 shadow-xl mb-6">
        <div className="card-body">
          <h2 className="card-title">Invite Friends</h2>
          <p className="text-gray-600 mb-4">
            Generate an invite link to share with friends. They'll automatically become your friend when they sign up.
          </p>
          
          {!invite ? (
            <button 
              className={`btn btn-primary ${loading ? 'loading' : ''}`}
              onClick={createInvite}
              disabled={loading}
            >
              Create Invite Link
            </button>
          ) : (
            <div className="bg-base-200 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">Share this link with your friends:</p>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={invite.url}
                  readOnly
                  className="input input-bordered flex-1"
                />
                <button 
                  className="btn btn-outline"
                  onClick={copyInviteLink}
                >
                  Copy
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Expires: {new Date(invite.expiresAt).toLocaleDateString()} • 
                Uses remaining: {invite.maxUses - invite.usedCount}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Search Users Section */}
      <div className="card bg-base-100 shadow-xl mb-6">
        <div className="card-body">
          <h2 className="card-title">Find Friends</h2>
          <div className="flex gap-2 mb-4">
            <input 
              type="text"
              placeholder="Search by email or name..."
              className="input input-bordered flex-1"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && searchUsers()}
            />
            <button 
              className={`btn btn-outline ${loading ? 'loading' : ''}`}
              onClick={searchUsers}
              disabled={loading || searchQuery.length < 2}
            >
              Search
            </button>
          </div>

          {searchResults.length > 0 && (
            <div className="space-y-2">
              {searchResults.map(user => (
                <div key={user.id} className="flex items-center justify-between p-3 bg-base-200 rounded-lg">
                  <div>
                    <p className="font-medium">{user.name}</p>
                    <p className="text-sm text-gray-600">{user.email}</p>
                  </div>
                  <button 
                    className={`btn btn-sm btn-primary ${loading ? 'loading' : ''}`}
                    onClick={() => addFriend(user.id)}
                    disabled={loading}
                  >
                    Add Friend
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Friends List */}
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <div className="flex items-center justify-between mb-4">
            <h2 className="card-title">My Friends ({friends.length})</h2>
            <button 
              className="btn btn-outline btn-sm"
              onClick={() => router.push('/blends/create')}
              disabled={friends.length === 0}
            >
              Create Blend
            </button>
          </div>

          {friends.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600 mb-4">No friends yet!</p>
              <p className="text-sm text-gray-500">
                Search for users above or invite friends to get started.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {friends.map(friend => (
                <div key={friend.id} className="flex items-center justify-between p-3 bg-base-200 rounded-lg">
                  <div>
                    <p className="font-medium">{friend.name}</p>
                    <p className="text-sm text-gray-600">{friend.email}</p>
                    <p className="text-xs text-gray-500">
                      Friends since {new Date(friend.friendedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <button 
                    className={`btn btn-sm btn-error btn-outline ${loading ? 'loading' : ''}`}
                    onClick={() => removeFriend(friend.id)}
                    disabled={loading}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}