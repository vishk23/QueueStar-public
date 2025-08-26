'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function SettingsPage() {
  const [user, setUser] = useState<any>(null);
  const [connections, setConnections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [profile, setProfile] = useState({
    displayName: '',
    avatarUrl: '',
  });
  const searchParams = useSearchParams();
  const error = searchParams.get('error');
  const errorMessage = searchParams.get('message');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/user');
        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
          setConnections(data.providerConnections || []);
          setProfile({
            displayName: data.user.displayName || '',
            avatarUrl: data.user.avatarUrl || '',
          });
        }
      } catch (error) {
        console.error('Failed to fetch user data:', error);
      }
      setLoading(false);
    };

    fetchData();
  }, []);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/login';
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);

    try {
      const response = await fetch('/api/user', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profile),
      });

      if (response.ok) {
        // Refresh user data
        window.location.reload();
      }
    } catch (error) {
      console.error('Profile update error:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleConnectSpotify = () => {
    window.location.assign('/api/auth/spotify');
  };

  const handleConnectApple = () => {
    window.location.assign('/connect/apple');
  };

  const handleRefreshAppleData = async () => {
    try {
      // Check if refresh is needed
      const checkResponse = await fetch('/api/sync/apple/check-refresh', { 
        credentials: 'include' 
      });
      
      if (checkResponse.ok) {
        const checkData = await checkResponse.json();
        
        if (checkData.needsRefresh) {
          // Trigger refresh
          const refreshResponse = await fetch('/api/sync/apple/trigger-refresh', {
            method: 'POST',
            credentials: 'include'
          });
          
          if (refreshResponse.ok) {
            alert('Apple Music data refresh started! This may take a few minutes.');
            // Refresh page to show updated sync status
            window.location.reload();
          } else {
            alert('Failed to start data refresh. Please try again.');
          }
        } else {
          alert(`Apple Music data was synced ${checkData.hoursSinceLastSync} hours ago. Refresh not needed yet.`);
        }
      }
    } catch (error) {
      console.error('Refresh error:', error);
      alert('Failed to refresh Apple Music data. Please try again.');
    }
  };

  const handleDisconnectProvider = async (provider: string) => {
    if (!confirm(`Are you sure you want to disconnect ${provider} and delete all synced data?`)) {
      return;
    }

    try {
      const response = await fetch('/api/auth/disconnect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ provider }),
      });

      if (response.ok) {
        alert(`${provider} has been disconnected and all data deleted.`);
        // Refresh the page to update the UI
        window.location.reload();
      } else {
        const error = await response.json();
        alert(`Failed to disconnect ${provider}: ${error.error}`);
      }
    } catch (error) {
      console.error('Disconnect error:', error);
      alert(`Error disconnecting ${provider}. Please try again.`);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Settings</h1>
        <p className="text-base-content/60">Manage your account and music connections</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Profile Settings */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Profile</h2>
          <form onSubmit={handleProfileUpdate} className="space-y-4">
            <div>
              <label className="label">
                <span className="label-text">Display Name</span>
              </label>
              <Input
                type="text"
                value={profile.displayName}
                onChange={(e) =>
                  setProfile({ ...profile, displayName: e.target.value })
                }
                required
                disabled={isUpdating}
              />
            </div>
            
            <div>
              <label className="label">
                <span className="label-text">Avatar URL (optional)</span>
              </label>
              <Input
                type="url"
                value={profile.avatarUrl}
                onChange={(e) =>
                  setProfile({ ...profile, avatarUrl: e.target.value })
                }
                disabled={isUpdating}
              />
            </div>

            <div>
              <label className="label">
                <span className="label-text">Email</span>
              </label>
              <Input
                type="email"
                value={user?.email || ''}
                disabled
                className="bg-base-200"
              />
              <div className="label">
                <span className="label-text-alt text-base-content/60">
                  Email cannot be changed
                </span>
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              disabled={isUpdating}
              className="w-full"
            >
              {isUpdating ? (
                <><span className="loading loading-spinner loading-sm mr-2"></span>Updating...</>
              ) : (
                'Update Profile'
              )}
            </Button>
          </form>
        </Card>

        {/* Music Services */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Music Services</h2>
          
          {loading ? (
            <div className="flex justify-center">
              <div className="loading loading-spinner loading-md text-primary"></div>
            </div>
          ) : (
            <div className="space-y-4">
              {connections.length > 0 && (
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
                        <div>
                          <span className="capitalize font-medium">{connection.provider}</span>
                          <div className="text-sm text-base-content/60">
                            {connection.isExpired ? 'Expired' : 'Connected'}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {connection.provider === 'apple' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleRefreshAppleData}
                            className="text-primary hover:bg-primary/10"
                          >
                            Refresh Data
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDisconnectProvider(connection.provider)}
                          className="text-error hover:bg-error/10"
                        >
                          Disconnect
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              <div className="space-y-2">
                <p className="text-sm text-base-content/60 mb-3">
                  Connect your music streaming services to start blending playlists
                </p>
                
                <Button
                  variant="outline"
                  onClick={handleConnectSpotify}
                  className="w-full justify-start border-green-600 text-green-600 hover:bg-green-50"
                  disabled={connections.some(c => c.provider === 'spotify' && !c.isExpired)}
                >
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.42 1.56-.301.421-1.02.599-1.559.3z"/>
                  </svg>
                  {connections.some(c => c.provider === 'spotify') ? 'Spotify Connected' : 'Connect Spotify'}
                </Button>
                
                <Button
                  variant="outline"
                  onClick={handleConnectApple}
                  className="w-full justify-start border-gray-800 text-gray-800 hover:bg-gray-50"
                  disabled={connections.some(c => c.provider === 'apple' && !c.isExpired)}
                >
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                  </svg>
                  {connections.some(c => c.provider === 'apple') ? 'Apple Music Connected' : 'Connect Apple Music'}
                </Button>
              </div>
            </div>
          )}
        </Card>

        {/* Account Actions */}
        <Card className="p-6 md:col-span-2">
          <h2 className="text-xl font-semibold mb-4">Account Actions</h2>
          <div className="flex flex-wrap gap-4">
            <Button
              variant="outline"
              onClick={handleLogout}
              className="text-warning border-warning hover:bg-warning/10"
            >
              Sign Out
            </Button>
            
            <Button
              variant="outline"
              className="text-error border-error hover:bg-error/10"
              onClick={() => {
                if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
                  // TODO: Implement account deletion
                  console.log('Delete account');
                }
              }}
            >
              Delete Account
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}