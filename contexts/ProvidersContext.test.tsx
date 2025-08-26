/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@/utils/simple-test-utils';
import { ProvidersProvider, useProviders } from './ProvidersContext';
import { useAuth } from './AuthContext';

// Mock the auth context
vi.mock('./AuthContext', () => ({
  useAuth: vi.fn(),
}));

// Test component that uses the providers context
const TestComponent = () => {
  const { 
    connections, 
    loading, 
    syncTracks,
    disconnectProvider 
  } = useProviders();
  
  return (
    <div>
      <div data-testid="connected-count">{connections.length}</div>
      <div data-testid="loading">{loading ? 'loading' : 'idle'}</div>
      {connections.map((connection) => (
        <div key={connection.id} data-testid={`connection-${connection.provider}`}>
          {connection.provider} - {connection.providerUserId}
        </div>
      ))}
      <button 
        onClick={() => syncTracks('spotify')}
        data-testid="sync-spotify"
      >
        Sync Spotify
      </button>
      <button 
        onClick={() => disconnectProvider('conn-123')}
        data-testid="disconnect-connection"
      >
        Disconnect
      </button>
    </div>
  );
};

describe('ProvidersContext', () => {
  const mockUser = {
    id: 'user123',
    email: 'test@example.com',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useAuth as any).mockReturnValue({
      user: mockUser,
      isAuthenticated: true
    });
    
    // Mock fetch
    global.fetch = vi.fn();
  });

  it('provides initial empty state', () => {
    (useAuth as any).mockReturnValue({
      user: null,
      isAuthenticated: false
    });

    render(
      <ProvidersProvider>
        <TestComponent />
      </ProvidersProvider>
    );

    expect(screen.getByTestId('connected-count')).toHaveTextContent('0');
    expect(screen.getByTestId('loading')).toHaveTextContent('idle');
  });

  it('fetches connections when authenticated', async () => {
    const mockConnections = [
      {
        id: 'conn-123',
        provider: 'spotify' as const,
        providerUserId: 'spotify-user-123',
        tokenExpiresAt: null,
        isExpired: false,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z'
      }
    ];

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ providerConnections: mockConnections })
    });

    render(
      <ProvidersProvider>
        <TestComponent />
      </ProvidersProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('connected-count')).toHaveTextContent('1');
      expect(screen.getByTestId('connection-spotify')).toBeInTheDocument();
    });
  });

  it('handles sync tracks', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ providerConnections: [] })
    }).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true })
    });

    render(
      <ProvidersProvider>
        <TestComponent />
      </ProvidersProvider>
    );

    fireEvent.click(screen.getByTestId('sync-spotify'));
    
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/tracks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: 'spotify', timeRange: 'medium_term' })
      });
    });
  });

  it('handles disconnect provider', async () => {
    // Mock initial fetch with connections
    const mockConnections = [
      {
        id: 'conn-123',
        provider: 'spotify' as const,
        providerUserId: 'spotify-user-123',
        tokenExpiresAt: null,
        isExpired: false,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z'
      }
    ];

    (global.fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ providerConnections: mockConnections })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true })
      });

    render(
      <ProvidersProvider>
        <TestComponent />
      </ProvidersProvider>
    );

    // Wait for initial fetch
    await waitFor(() => {
      expect(screen.getByTestId('connected-count')).toHaveTextContent('1');
    });

    fireEvent.click(screen.getByTestId('disconnect-connection'));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/providers/conn-123', {
        method: 'DELETE'
      });
    });
  });

  it('handles fetch error', async () => {
    (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

    render(
      <ProvidersProvider>
        <TestComponent />
      </ProvidersProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('idle');
    });
  });

  it('handles unauthenticated user', () => {
    (useAuth as any).mockReturnValue({
      user: null,
      isAuthenticated: false
    });

    render(
      <ProvidersProvider>
        <TestComponent />
      </ProvidersProvider>
    );

    expect(screen.getByTestId('connected-count')).toHaveTextContent('0');
    expect(screen.getByTestId('loading')).toHaveTextContent('idle');
  });
});